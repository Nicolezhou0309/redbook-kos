-- ========================================
-- 第四部分：实用工具函数
-- ========================================

-- 1. 数据导出函数
CREATE OR REPLACE FUNCTION export_employee_data(
  export_format TEXT DEFAULT 'json', -- 'json', 'csv'
  filters JSONB DEFAULT '{}'::JSONB
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result TEXT;
  query_conditions TEXT := '';
  base_query TEXT;
BEGIN
  -- 构建查询条件
  IF filters ? 'region' THEN
    query_conditions := query_conditions || ' AND eld.region = ''' || (filters->>'region') || '''';
  END IF;
  
  IF filters ? 'status' THEN
    query_conditions := query_conditions || ' AND e.status = ''' || (filters->>'status') || '''';
  END IF;
  
  IF filters ? 'min_interactions' THEN
    query_conditions := query_conditions || ' AND eld.total_interactions >= ' || (filters->>'min_interactions');
  END IF;
  
  IF filters ? 'max_interactions' THEN
    query_conditions := query_conditions || ' AND eld.total_interactions <= ' || (filters->>'max_interactions');
  END IF;

  base_query := '
    SELECT 
      e.employee_name,
      e.employee_uid,
      e.status,
      eld.region,
      eld.xiaohongshu_nickname,
      eld.total_interactions,
      eld.total_form_leads,
      eld.total_private_message_leads,
      erd.avg_response_time,
      erd.user_rating_score,
      eld.tags,
      e.created_at
    FROM public.employee e
    LEFT JOIN public.employee_leads_data eld ON e.employee_uid = eld.account_id
    LEFT JOIN public.employee_response_data erd ON e.employee_uid = erd.employee_uid
    WHERE 1=1' || query_conditions || '
    ORDER BY e.employee_name
  ';

  IF export_format = 'csv' THEN
    -- 生成CSV格式
    SELECT string_agg(
      '"' || 
      COALESCE(employee_name, '') || '","' ||
      COALESCE(employee_uid, '') || '","' ||
      COALESCE(status, '') || '","' ||
      COALESCE(region, '') || '","' ||
      COALESCE(xiaohongshu_nickname, '') || '","' ||
      COALESCE(total_interactions::TEXT, '') || '","' ||
      COALESCE(total_form_leads::TEXT, '') || '","' ||
      COALESCE(total_private_message_leads::TEXT, '') || '","' ||
      COALESCE(avg_response_time::TEXT, '') || '","' ||
      COALESCE(user_rating_score::TEXT, '') || '","' ||
      COALESCE(tags, '') || '","' ||
      COALESCE(created_at::TEXT, '') || '"',
      E'\n'
    ) INTO result
    FROM (
      SELECT * FROM (
        EXECUTE base_query
      ) as data
    ) as formatted_data;
    
    -- 添加CSV头部
    result := '"员工姓名","员工UID","状态","地区","小红书昵称","互动数量","表单线索","私信线索","响应时间","用户评分","标签","创建时间"' || E'\n' || result;
  ELSE
    -- 生成JSON格式
    SELECT jsonb_pretty(
      jsonb_agg(
        jsonb_build_object(
          'employeeName', employee_name,
          'employeeUid', employee_uid,
          'status', status,
          'region', region,
          'xiaohongshuNickname', xiaohongshu_nickname,
          'totalInteractions', total_interactions,
          'totalFormLeads', total_form_leads,
          'totalPrivateMessageLeads', total_private_message_leads,
          'avgResponseTime', avg_response_time,
          'userRating', user_rating_score,
          'tags', tags,
          'createdAt', created_at
        )
      )
    ) INTO result
    FROM (
      EXECUTE base_query
    ) as data;
  END IF;

  RETURN result;
END;
$$;

-- 2. 数据清理和维护函数
CREATE OR REPLACE FUNCTION cleanup_employee_data(
  cleanup_type TEXT DEFAULT 'orphaned', -- 'orphaned', 'duplicates', 'invalid'
  dry_run BOOLEAN DEFAULT TRUE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  affected_count INTEGER := 0;
  cleanup_query TEXT;
BEGIN
  CASE cleanup_type
    WHEN 'orphaned' THEN
      -- 清理孤立的员工数据（没有关联的线索或回复数据）
      IF dry_run THEN
        SELECT COUNT(*) INTO affected_count
        FROM public.employee e
        WHERE NOT EXISTS (SELECT 1 FROM public.employee_leads_data eld WHERE e.employee_uid = eld.account_id)
          AND NOT EXISTS (SELECT 1 FROM public.employee_response_data erd WHERE e.employee_uid = erd.employee_uid);
      ELSE
        DELETE FROM public.employee e
        WHERE NOT EXISTS (SELECT 1 FROM public.employee_leads_data eld WHERE e.employee_uid = eld.account_id)
          AND NOT EXISTS (SELECT 1 FROM public.employee_response_data erd WHERE e.employee_uid = erd.employee_uid);
        GET DIAGNOSTICS affected_count = ROW_COUNT;
      END IF;
      
    WHEN 'duplicates' THEN
      -- 清理重复的员工数据
      IF dry_run THEN
        SELECT COUNT(*) INTO affected_count
        FROM (
          SELECT employee_uid, COUNT(*) as cnt
          FROM public.employee
          GROUP BY employee_uid
          HAVING COUNT(*) > 1
        ) duplicates;
      ELSE
        WITH duplicates AS (
          SELECT id, ROW_NUMBER() OVER (PARTITION BY employee_uid ORDER BY created_at) as rn
          FROM public.employee
        )
        DELETE FROM public.employee
        WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);
        GET DIAGNOSTICS affected_count = ROW_COUNT;
      END IF;
      
    WHEN 'invalid' THEN
      -- 清理无效数据（空值或格式错误）
      IF dry_run THEN
        SELECT COUNT(*) INTO affected_count
        FROM public.employee e
        WHERE e.employee_name IS NULL OR e.employee_name = ''
          OR e.employee_uid IS NULL OR e.employee_uid = '';
      ELSE
        DELETE FROM public.employee e
        WHERE e.employee_name IS NULL OR e.employee_name = ''
          OR e.employee_uid IS NULL OR e.employee_uid = '';
        GET DIAGNOSTICS affected_count = ROW_COUNT;
      END IF;
      
    ELSE
      RAISE EXCEPTION '未知的清理类型: %', cleanup_type;
  END CASE;

  result := jsonb_build_object(
    'cleanupType', cleanup_type,
    'dryRun', dry_run,
    'affectedCount', affected_count,
    'message', CASE 
      WHEN dry_run THEN '模拟清理完成，将影响 ' || affected_count || ' 条记录'
      ELSE '清理完成，已删除 ' || affected_count || ' 条记录'
    END
  );

  RETURN result;
END;
$$;

-- 3. 数据验证函数
CREATE OR REPLACE FUNCTION validate_employee_data()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  WITH validation_results AS (
    SELECT 
      'missing_employee_name' as issue_type,
      COUNT(*) as count
    FROM public.employee
    WHERE employee_name IS NULL OR employee_name = ''
    
    UNION ALL
    
    SELECT 
      'missing_employee_uid' as issue_type,
      COUNT(*) as count
    FROM public.employee
    WHERE employee_uid IS NULL OR employee_uid = ''
    
    UNION ALL
    
    SELECT 
      'invalid_status' as issue_type,
      COUNT(*) as count
    FROM public.employee
    WHERE status NOT IN ('active', 'inactive')
    
    UNION ALL
    
    SELECT 
      'orphaned_leads_data' as issue_type,
      COUNT(*) as count
    FROM public.employee_leads_data eld
    WHERE NOT EXISTS (SELECT 1 FROM public.employee e WHERE e.employee_uid = eld.account_id)
    
    UNION ALL
    
    SELECT 
      'orphaned_response_data' as issue_type,
      COUNT(*) as count
    FROM public.employee_response_data erd
    WHERE NOT EXISTS (SELECT 1 FROM public.employee e WHERE e.employee_uid = erd.employee_uid)
    
    UNION ALL
    
    SELECT 
      'negative_interactions' as issue_type,
      COUNT(*) as count
    FROM public.employee_leads_data
    WHERE total_interactions < 0
    
    UNION ALL
    
    SELECT 
      'invalid_response_time' as issue_type,
      COUNT(*) as count
    FROM public.employee_response_data
    WHERE avg_response_time < 0 OR avg_response_time > 3600
    
    UNION ALL
    
    SELECT 
      'invalid_user_rating' as issue_type,
      COUNT(*) as count
    FROM public.employee_response_data
    WHERE user_rating_score < 0 OR user_rating_score > 5
  )
  SELECT jsonb_build_object(
    'validationResults', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'issueType', issue_type,
          'count', count
        )
      ) FROM validation_results WHERE count > 0
    ),
    'summary', (
      SELECT jsonb_build_object(
        'totalIssues', COUNT(*),
        'totalIssuesCount', SUM(count)
      ) FROM validation_results WHERE count > 0
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- 4. 数据同步函数
CREATE OR REPLACE FUNCTION sync_employee_data()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  sync_count INTEGER := 0;
BEGIN
  -- 同步员工状态（基于最近活动）
  UPDATE public.employee e
  SET status = CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.employee_leads_data eld 
      WHERE eld.account_id = e.employee_uid 
        AND eld.updated_at >= NOW() - INTERVAL '30 days'
    ) THEN 'active'
    ELSE 'inactive'
  END
  WHERE status != CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.employee_leads_data eld 
      WHERE eld.account_id = e.employee_uid 
        AND eld.updated_at >= NOW() - INTERVAL '30 days'
    ) THEN 'active'
    ELSE 'inactive'
  END;
  
  GET DIAGNOSTICS sync_count = ROW_COUNT;

  -- 更新统计信息
  UPDATE public.employee_leads_data eld
  SET total_interactions = COALESCE(
    (SELECT SUM(interaction_count) FROM (
      SELECT 1 as interaction_count
      FROM public.employee_response_data erd
      WHERE erd.employee_uid = eld.account_id
    ) interactions
    ), 0
  )
  WHERE eld.total_interactions IS NULL;

  result := jsonb_build_object(
    'syncCount', sync_count,
    'message', '数据同步完成，更新了 ' || sync_count || ' 条记录'
  );

  RETURN result;
END;
$$;

-- 5. 性能监控函数
CREATE OR REPLACE FUNCTION get_database_performance()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  WITH table_stats AS (
    SELECT 
      schemaname,
      tablename,
      n_tup_ins as inserts,
      n_tup_upd as updates,
      n_tup_del as deletes,
      n_live_tup as live_rows,
      n_dead_tup as dead_rows,
      last_vacuum,
      last_autovacuum,
      last_analyze,
      last_autoanalyze
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
      AND tablename IN ('employee', 'employee_leads_data', 'employee_response_data')
  ),
  index_stats AS (
    SELECT 
      schemaname,
      tablename,
      indexname,
      idx_scan as scans,
      idx_tup_read as tuples_read,
      idx_tup_fetch as tuples_fetched
    FROM pg_stat_user_indexes
    WHERE schemaname = 'public'
      AND tablename IN ('employee', 'employee_leads_data', 'employee_response_data')
  ),
  query_stats AS (
    SELECT 
      query,
      calls,
      total_time,
      mean_time,
      rows
    FROM pg_stat_statements
    WHERE query LIKE '%employee%'
    ORDER BY total_time DESC
    LIMIT 10
  )
  SELECT jsonb_build_object(
    'tableStats', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'tableName', tablename,
          'inserts', inserts,
          'updates', updates,
          'deletes', deletes,
          'liveRows', live_rows,
          'deadRows', dead_rows,
          'lastVacuum', last_vacuum,
          'lastAnalyze', last_analyze
        )
      ) FROM table_stats
    ),
    'indexStats', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'tableName', tablename,
          'indexName', indexname,
          'scans', scans,
          'tuplesRead', tuples_read,
          'tuplesFetched', tuples_fetched
        )
      ) FROM index_stats
    ),
    'queryStats', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'query', query,
          'calls', calls,
          'totalTime', total_time,
          'meanTime', mean_time,
          'rows', rows
        )
      ) FROM query_stats
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- 6. 备份和恢复函数
CREATE OR REPLACE FUNCTION backup_employee_data(
  backup_name TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  backup_timestamp TEXT;
  backup_id TEXT;
BEGIN
  -- 生成备份时间戳
  backup_timestamp := TO_CHAR(NOW(), 'YYYYMMDD_HH24MISS');
  backup_id := COALESCE(backup_name, 'employee_backup_' || backup_timestamp);
  
  -- 创建备份表
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I AS SELECT * FROM public.employee', 'backup_' || backup_id);
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I AS SELECT * FROM public.employee_leads_data', 'backup_leads_' || backup_id);
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I AS SELECT * FROM public.employee_response_data', 'backup_response_' || backup_id);
  
  result := jsonb_build_object(
    'backupId', backup_id,
    'backupTimestamp', backup_timestamp,
    'message', '备份完成，备份ID: ' || backup_id,
    'tables', ARRAY['employee', 'employee_leads_data', 'employee_response_data']
  );
  
  RETURN result;
END;
$$;

-- 7. 创建使用说明视图
CREATE OR REPLACE VIEW v_function_usage AS
SELECT 
  'get_search_stats()' as function_name,
  '获取搜索统计信息' as description,
  'SELECT * FROM get_search_stats();' as usage_example
UNION ALL
SELECT 
  'search_employees_advanced(...)' as function_name,
  '高级员工搜索函数' as description,
  'SELECT * FROM search_employees_advanced(''张三'', ''fuzzy'', NULL, NULL, NULL, ''北京'', NULL, NULL, FALSE, 100, 500, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, ''employee_name'', ''asc'', 1, 10);' as usage_example
UNION ALL
SELECT 
  'get_employee_analytics(...)' as function_name,
  '员工数据分析' as description,
  'SELECT * FROM get_employee_analytics(''2024-01-01'', ''2024-12-31'', ''北京'', ''active'');' as usage_example
UNION ALL
SELECT 
  'export_employee_data(...)' as function_name,
  '数据导出功能' as description,
  'SELECT export_employee_data(''csv'', ''{"region": "北京", "status": "active"}''::jsonb);' as usage_example
UNION ALL
SELECT 
  'validate_employee_data()' as function_name,
  '数据验证' as description,
  'SELECT * FROM validate_employee_data();' as usage_example; 