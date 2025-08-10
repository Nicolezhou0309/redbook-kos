-- ========================================
-- 第二部分：高级搜索函数
-- ========================================


-- 1. 员工联合搜索函数（支持多种搜索类型）
CREATE OR REPLACE FUNCTION search_employees_advanced(
  search_query TEXT DEFAULT NULL,
  search_type TEXT DEFAULT 'fuzzy',
  employee_name TEXT DEFAULT NULL,
  employee_uid TEXT DEFAULT NULL,
  xiaohongshu_nickname TEXT DEFAULT NULL,
  region TEXT DEFAULT NULL,
  status TEXT DEFAULT NULL,
  tags TEXT[] DEFAULT NULL,
  match_all_tags BOOLEAN DEFAULT FALSE,
  min_interactions INTEGER DEFAULT NULL,
  max_interactions INTEGER DEFAULT NULL,
  min_form_leads INTEGER DEFAULT NULL,
  max_form_leads INTEGER DEFAULT NULL,
  min_response_time NUMERIC DEFAULT NULL,
  max_response_time NUMERIC DEFAULT NULL,
  min_user_rating NUMERIC DEFAULT NULL,
  max_user_rating NUMERIC DEFAULT NULL,
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL,
  time_range TEXT DEFAULT NULL,
  has_leads_data BOOLEAN DEFAULT NULL,
  has_response_data BOOLEAN DEFAULT NULL,
  is_active BOOLEAN DEFAULT NULL,
  include_inactive BOOLEAN DEFAULT TRUE,
  sort_by TEXT DEFAULT NULL,
  sort_direction TEXT DEFAULT 'asc',
  page_number INTEGER DEFAULT 1,
  page_size INTEGER DEFAULT 10
)
RETURNS TABLE(
  employee_id UUID,
  employee_name TEXT,
  employee_uid TEXT,
  employee_status TEXT,
  employee_created_at TIMESTAMPTZ,
  leads_id UUID,
  xiaohongshu_account_id TEXT,
  xiaohongshu_nickname TEXT,
  leads_account_id TEXT,
  region TEXT,
  tags TEXT,
  activation_time DATE,
  published_notes_count INTEGER,
  promoted_notes_count INTEGER,
  notes_promotion_cost NUMERIC,
  total_interactions INTEGER,
  total_form_leads INTEGER,
  total_private_message_leads INTEGER,
  total_private_message_openings INTEGER,
  total_private_message_leads_kept INTEGER,
  notes_exposure_count INTEGER,
  notes_click_count INTEGER,
  leads_time_range JSONB,
  leads_created_at TIMESTAMPTZ,
  leads_updated_at TIMESTAMPTZ,
  response_id UUID,
  response_employee_name TEXT,
  response_employee_uid TEXT,
  score_15s_response NUMERIC,
  score_30s_response NUMERIC,
  score_1min_response NUMERIC,
  score_1hour_timeout NUMERIC,
  score_avg_response_time NUMERIC,
  rate_15s_response TEXT,
  rate_30s_response TEXT,
  rate_1min_response TEXT,
  rate_1hour_timeout TEXT,
  avg_response_time NUMERIC,
  user_rating_score NUMERIC,
  response_time_range TEXT,
  response_created_at TIMESTAMPTZ,
  response_updated_at TIMESTAMPTZ,
  total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  base_query TEXT;
  where_conditions TEXT[] := ARRAY[]::TEXT[];
  param_count INTEGER := 0;
  final_query TEXT;
  count_query TEXT;
  result_count BIGINT;
BEGIN
  -- 构建基础查询
  base_query := '
    SELECT 
      e.id as employee_id,
      e.employee_name,
      e.employee_uid,
      e.status as employee_status,
      e.created_at as employee_created_at,
      
      eld.id as leads_id,
      eld.xiaohongshu_account_id,
      eld.xiaohongshu_nickname,
      eld.account_id as leads_account_id,
      eld.region,
      eld.tags,
      eld.activation_time,
      eld.published_notes_count,
      eld.promoted_notes_count,
      eld.notes_promotion_cost,
      eld.total_interactions,
      eld.total_form_leads,
      eld.total_private_message_leads,
      eld.total_private_message_openings,
      eld.total_private_message_leads_kept,
      eld.notes_exposure_count,
      eld.notes_click_count,
      eld.time_range as leads_time_range,
      eld.created_at as leads_created_at,
      eld.updated_at as leads_updated_at,
      
      erd.id as response_id,
      erd.employee_name as response_employee_name,
      erd.employee_uid as response_employee_uid,
      erd.score_15s_response,
      erd.score_30s_response,
      erd.score_1min_response,
      erd.score_1hour_timeout,
      erd.score_avg_response_time,
      erd.rate_15s_response,
      erd.rate_30s_response,
      erd.rate_1min_response,
      erd.rate_1hour_timeout,
      erd.avg_response_time,
      erd.user_rating_score,
      erd.time_range as response_time_range,
      erd.created_at as response_created_at,
      erd.updated_at as response_updated_at
    FROM public.employee e
    RIGHT JOIN public.employee_leads_data eld ON e.employee_uid = eld.account_id
    RIGHT JOIN public.employee_response_data erd ON COALESCE(e.employee_uid, eld.account_id) = erd.employee_uid
    WHERE 1=1
  ';

  -- 主搜索查询
  IF search_query IS NOT NULL AND search_query != '' THEN
    param_count := param_count + 1;
    IF search_type = 'exact' THEN
      where_conditions := array_append(where_conditions, 
        format('(e.employee_name = $%s OR e.employee_uid = $%s OR eld.xiaohongshu_nickname = $%s OR eld.region = $%s OR eld.tags = $%s)', 
        param_count, param_count, param_count, param_count, param_count));
    ELSIF search_type = 'semantic' THEN
      where_conditions := array_append(where_conditions, 
        format('(to_tsvector(''chinese'', e.employee_name) @@ plainto_tsquery(''chinese'', $%s) OR to_tsvector(''chinese'', eld.xiaohongshu_nickname) @@ plainto_tsquery(''chinese'', $%s) OR to_tsvector(''chinese'', eld.region) @@ plainto_tsquery(''chinese'', $%s))', 
        param_count, param_count, param_count));
    ELSE
      -- 模糊搜索
      where_conditions := array_append(where_conditions, 
        format('(e.employee_name ILIKE $%s OR e.employee_uid ILIKE $%s OR eld.xiaohongshu_nickname ILIKE $%s OR eld.region ILIKE $%s OR eld.tags ILIKE $%s)', 
        param_count, param_count, param_count, param_count, param_count));
    END IF;
  END IF;

  -- 字段精确搜索
  IF employee_name IS NOT NULL THEN
    param_count := param_count + 1;
    where_conditions := array_append(where_conditions, format('e.employee_name ILIKE $%s', param_count));
  END IF;

  IF employee_uid IS NOT NULL THEN
    param_count := param_count + 1;
    where_conditions := array_append(where_conditions, format('e.employee_uid ILIKE $%s', param_count));
  END IF;

  IF xiaohongshu_nickname IS NOT NULL THEN
    param_count := param_count + 1;
    where_conditions := array_append(where_conditions, format('eld.xiaohongshu_nickname ILIKE $%s', param_count));
  END IF;

  IF region IS NOT NULL THEN
    param_count := param_count + 1;
    where_conditions := array_append(where_conditions, format('eld.region = $%s', param_count));
  END IF;

  IF status IS NOT NULL THEN
    param_count := param_count + 1;
    where_conditions := array_append(where_conditions, format('e.status = $%s', param_count));
  END IF;

  -- 标签搜索
  IF tags IS NOT NULL AND array_length(tags, 1) > 0 THEN
    IF match_all_tags THEN
      -- 匹配所有标签
      FOR i IN 1..array_length(tags, 1) LOOP
        param_count := param_count + 1;
        where_conditions := array_append(where_conditions, format('eld.tags LIKE $%s', param_count));
      END LOOP;
    ELSE
      -- 匹配任一标签
      FOR i IN 1..array_length(tags, 1) LOOP
        param_count := param_count + 1;
        where_conditions := array_append(where_conditions, format('eld.tags LIKE $%s', param_count));
      END LOOP;
    END IF;
  END IF;

  -- 数值范围搜索
  IF min_interactions IS NOT NULL THEN
    param_count := param_count + 1;
    where_conditions := array_append(where_conditions, format('eld.total_interactions >= $%s', param_count));
  END IF;

  IF max_interactions IS NOT NULL THEN
    param_count := param_count + 1;
    where_conditions := array_append(where_conditions, format('eld.total_interactions <= $%s', param_count));
  END IF;

  IF min_form_leads IS NOT NULL THEN
    param_count := param_count + 1;
    where_conditions := array_append(where_conditions, format('eld.total_form_leads >= $%s', param_count));
  END IF;

  IF max_form_leads IS NOT NULL THEN
    param_count := param_count + 1;
    where_conditions := array_append(where_conditions, format('eld.total_form_leads <= $%s', param_count));
  END IF;

  IF min_response_time IS NOT NULL THEN
    param_count := param_count + 1;
    where_conditions := array_append(where_conditions, format('erd.avg_response_time >= $%s', param_count));
  END IF;

  IF max_response_time IS NOT NULL THEN
    param_count := param_count + 1;
    where_conditions := array_append(where_conditions, format('erd.avg_response_time <= $%s', param_count));
  END IF;

  IF min_user_rating IS NOT NULL THEN
    param_count := param_count + 1;
    where_conditions := array_append(where_conditions, format('erd.user_rating_score >= $%s', param_count));
  END IF;

  IF max_user_rating IS NOT NULL THEN
    param_count := param_count + 1;
    where_conditions := array_append(where_conditions, format('erd.user_rating_score <= $%s', param_count));
  END IF;

  -- 时间范围搜索
  IF start_date IS NOT NULL THEN
    param_count := param_count + 1;
    where_conditions := array_append(where_conditions, format('e.created_at >= $%s', param_count));
  END IF;

  IF end_date IS NOT NULL THEN
    param_count := param_count + 1;
    where_conditions := array_append(where_conditions, format('e.created_at <= $%s', param_count));
  END IF;

  IF time_range IS NOT NULL THEN
    param_count := param_count + 1;
    where_conditions := array_append(where_conditions, format('eld.time_range->>''remark'' = $%s', param_count));
  END IF;

  -- 布尔搜索
  IF has_leads_data IS NOT NULL THEN
    IF has_leads_data THEN
      where_conditions := array_append(where_conditions, 'eld.id IS NOT NULL');
    ELSE
      where_conditions := array_append(where_conditions, 'eld.id IS NULL');
    END IF;
  END IF;

  IF has_response_data IS NOT NULL THEN
    IF has_response_data THEN
      where_conditions := array_append(where_conditions, 'erd.id IS NOT NULL');
    ELSE
      where_conditions := array_append(where_conditions, 'erd.id IS NULL');
    END IF;
  END IF;

  IF is_active IS NOT NULL THEN
    IF is_active THEN
      where_conditions := array_append(where_conditions, 'e.status = ''active''');
    ELSE
      where_conditions := array_append(where_conditions, 'e.status != ''active''');
    END IF;
  END IF;

  -- 是否包含非活跃用户
  IF NOT include_inactive THEN
    where_conditions := array_append(where_conditions, 'e.status = ''active''');
  END IF;

  -- 组合WHERE条件
  IF array_length(where_conditions, 1) > 0 THEN
    base_query := base_query || ' AND ' || array_to_string(where_conditions, ' AND ');
  END IF;

  -- 排序
  IF sort_by IS NOT NULL THEN
    base_query := base_query || format(' ORDER BY %s %s NULLS LAST', sort_by, sort_direction);
  ELSE
    -- 默认按相关性排序
    IF search_query IS NOT NULL THEN
      param_count := param_count + 1;
      base_query := base_query || format(' ORDER BY 
        CASE 
          WHEN e.employee_name ILIKE $%s THEN 1
          WHEN eld.xiaohongshu_nickname ILIKE $%s THEN 2
          WHEN eld.region ILIKE $%s THEN 3
          ELSE 4
        END,
        e.employee_name', param_count, param_count, param_count);
    ELSE
      base_query := base_query || ' ORDER BY COALESCE(e.employee_name, eld.xiaohongshu_nickname, erd.employee_name)';
    END IF;
  END IF;

  -- 分页
  param_count := param_count + 1;
  param_count := param_count + 1;
  base_query := base_query || format(' LIMIT $%s OFFSET $%s', param_count, param_count + 1);

  -- 构建计数查询
  count_query := 'SELECT COUNT(*) FROM (' || 
                 REPLACE(REPLACE(base_query, 'LIMIT', '-- LIMIT'), 'OFFSET', '-- OFFSET') || 
                 ') as count_query';

  -- 执行查询
  EXECUTE count_query INTO result_count USING VARIADIC ARRAY[
    search_query, search_query, search_query, search_query, search_query,  -- 主搜索
    employee_name, employee_uid, xiaohongshu_nickname, region, status,    -- 字段搜索
    tags, tags, tags, tags, tags, tags, tags, tags, tags, tags,          -- 标签搜索
    min_interactions, max_interactions, min_form_leads, max_form_leads,    -- 数值范围
    min_response_time, max_response_time, min_user_rating, max_user_rating,
    start_date, end_date, time_range,                                     -- 时间范围
    page_size, (page_number - 1) * page_size                              -- 分页
  ];

  -- 返回结果
  RETURN QUERY EXECUTE base_query USING VARIADIC ARRAY[
    search_query, search_query, search_query, search_query, search_query,
    employee_name, employee_uid, xiaohongshu_nickname, region, status,
    tags, tags, tags, tags, tags, tags, tags, tags, tags, tags,
    min_interactions, max_interactions, min_form_leads, max_form_leads,
    min_response_time, max_response_time, min_user_rating, max_user_rating,
    start_date, end_date, time_range,
    page_size, (page_number - 1) * page_size
  ];

  -- 添加总计数到结果中
  RETURN QUERY SELECT 
    NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TIMESTAMPTZ,
    NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
    NULL::TEXT, NULL::DATE, NULL::INTEGER, NULL::INTEGER, NULL::NUMERIC,
    NULL::INTEGER, NULL::INTEGER, NULL::INTEGER, NULL::INTEGER, NULL::INTEGER,
    NULL::INTEGER, NULL::INTEGER, NULL::JSONB, NULL::TIMESTAMPTZ, NULL::TIMESTAMPTZ,
    NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::NUMERIC, NULL::NUMERIC,
    NULL::NUMERIC, NULL::NUMERIC, NULL::NUMERIC, NULL::TEXT, NULL::TEXT,
    NULL::TEXT, NULL::TEXT, NULL::NUMERIC, NULL::NUMERIC, NULL::TEXT,
    NULL::TIMESTAMPTZ, NULL::TIMESTAMPTZ, result_count;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION '搜索失败: %', SQLERRM;
END;
$$; 

-- ========================================
-- 第三部分：数据分析和统计函数
-- ========================================

-- 1. 获取员工绩效分析
CREATE OR REPLACE FUNCTION get_employee_performance_analysis(
  time_range TEXT DEFAULT NULL,
  region TEXT DEFAULT NULL,
  min_interactions INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  WITH performance_data AS (
    SELECT 
      e.employee_name,
      e.employee_uid,
      eld.region,
      eld.total_interactions,
      eld.total_form_leads,
      eld.total_private_message_leads,
      erd.avg_response_time,
      erd.user_rating_score,
      eld.published_notes_count,
      eld.promoted_notes_count,
      eld.notes_promotion_cost,
      CASE 
        WHEN eld.total_interactions > 200 THEN '优秀'
        WHEN eld.total_interactions > 100 THEN '良好'
        WHEN eld.total_interactions > 50 THEN '一般'
        ELSE '待提升'
      END as performance_level
    FROM public.employee e
    LEFT JOIN public.employee_leads_data eld ON e.employee_uid = eld.account_id
    LEFT JOIN public.employee_response_data erd ON e.employee_uid = erd.employee_uid
    WHERE e.status = 'active'
      AND (time_range IS NULL OR eld.time_range->>'remark' = time_range)
      AND (region IS NULL OR eld.region = region)
      AND (min_interactions IS NULL OR eld.total_interactions >= min_interactions)
  ),
  performance_stats AS (
    SELECT 
      performance_level,
      COUNT(*) as employee_count,
      AVG(total_interactions) as avg_interactions,
      AVG(total_form_leads) as avg_form_leads,
      AVG(avg_response_time) as avg_response_time,
      AVG(user_rating_score) as avg_user_rating,
      SUM(total_interactions) as total_interactions,
      SUM(total_form_leads) as total_form_leads
    FROM performance_data
    GROUP BY performance_level
  ),
  region_stats AS (
    SELECT 
      region,
      COUNT(*) as employee_count,
      AVG(total_interactions) as avg_interactions,
      AVG(total_form_leads) as avg_form_leads,
      AVG(avg_response_time) as avg_response_time,
      AVG(user_rating_score) as avg_user_rating
    FROM performance_data
    WHERE region IS NOT NULL
    GROUP BY region
    ORDER BY avg_interactions DESC
  ),
  top_performers AS (
    SELECT 
      employee_name,
      employee_uid,
      region,
      total_interactions,
      total_form_leads,
      avg_response_time,
      user_rating_score,
      performance_level
    FROM performance_data
    ORDER BY total_interactions DESC
    LIMIT 10
  )
  SELECT jsonb_build_object(
    'performanceStats', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'level', ps.performance_level,
          'employeeCount', ps.employee_count,
          'avgInteractions', ps.avg_interactions,
          'avgFormLeads', ps.avg_form_leads,
          'avgResponseTime', ps.avg_response_time,
          'avgUserRating', ps.avg_user_rating,
          'totalInteractions', ps.total_interactions,
          'totalFormLeads', ps.total_form_leads
        )
      )
      FROM performance_stats ps
    ),
    'regionStats', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'region', rs.region,
          'employeeCount', rs.employee_count,
          'avgInteractions', rs.avg_interactions,
          'avgFormLeads', rs.avg_form_leads,
          'avgResponseTime', rs.avg_response_time,
          'avgUserRating', rs.avg_user_rating
        )
      )
      FROM region_stats rs
    ),
    'topPerformers', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'employeeName', tp.employee_name,
          'employeeUid', tp.employee_uid,
          'region', tp.region,
          'totalInteractions', tp.total_interactions,
          'totalFormLeads', tp.total_form_leads,
          'avgResponseTime', tp.avg_response_time,
          'userRatingScore', tp.user_rating_score,
          'performanceLevel', tp.performance_level
        )
      )
      FROM top_performers tp
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- 2. 获取响应时间分析
CREATE OR REPLACE FUNCTION get_response_time_analysis(
  time_range TEXT DEFAULT NULL,
  region TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  WITH response_data AS (
    SELECT 
      e.employee_name,
      e.employee_uid,
      eld.region,
      erd.avg_response_time,
      erd.score_15s_response,
      erd.score_30s_response,
      erd.score_1min_response,
      erd.score_1hour_timeout,
      erd.rate_15s_response,
      erd.rate_30s_response,
      erd.rate_1min_response,
      erd.rate_1hour_timeout,
      CASE 
        WHEN erd.avg_response_time <= 15 THEN '优秀'
        WHEN erd.avg_response_time <= 30 THEN '良好'
        WHEN erd.avg_response_time <= 60 THEN '一般'
        ELSE '待提升'
      END as response_level
    FROM public.employee e
    LEFT JOIN public.employee_leads_data eld ON e.employee_uid = eld.account_id
    LEFT JOIN public.employee_response_data erd ON e.employee_uid = erd.employee_uid
    WHERE e.status = 'active'
      AND erd.avg_response_time IS NOT NULL
      AND (time_range IS NULL OR eld.time_range->>'remark' = time_range)
      AND (region IS NULL OR eld.region = region)
  ),
  response_stats AS (
    SELECT 
      response_level,
      COUNT(*) as employee_count,
      AVG(avg_response_time) as avg_response_time,
      AVG(score_15s_response) as avg_score_15s,
      AVG(score_30s_response) as avg_score_30s,
      AVG(score_1min_response) as avg_score_1min,
      AVG(score_1hour_timeout) as avg_score_1hour
    FROM response_data
    GROUP BY response_level
  ),
  region_response_stats AS (
    SELECT 
      region,
      COUNT(*) as employee_count,
      AVG(avg_response_time) as avg_response_time,
      AVG(score_15s_response) as avg_score_15s,
      AVG(score_30s_response) as avg_score_30s,
      AVG(score_1min_response) as avg_score_1min,
      AVG(score_1hour_timeout) as avg_score_1hour
    FROM response_data
    WHERE region IS NOT NULL
    GROUP BY region
    ORDER BY avg_response_time ASC
  ),
  top_responders AS (
    SELECT 
      employee_name,
      employee_uid,
      region,
      avg_response_time,
      score_15s_response,
      score_30s_response,
      score_1min_response,
      response_level
    FROM response_data
    ORDER BY avg_response_time ASC
    LIMIT 10
  )
  SELECT jsonb_build_object(
    'responseStats', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'level', rs.response_level,
          'employeeCount', rs.employee_count,
          'avgResponseTime', rs.avg_response_time,
          'avgScore15s', rs.avg_score_15s,
          'avgScore30s', rs.avg_score_30s,
          'avgScore1min', rs.avg_score_1min,
          'avgScore1hour', rs.avg_score_1hour
        )
      )
      FROM response_stats rs
    ),
    'regionResponseStats', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'region', rrs.region,
          'employeeCount', rrs.employee_count,
          'avgResponseTime', rrs.avg_response_time,
          'avgScore15s', rrs.avg_score_15s,
          'avgScore30s', rrs.avg_score_30s,
          'avgScore1min', rrs.avg_score_1min,
          'avgScore1hour', rrs.avg_score_1hour
        )
      )
      FROM region_response_stats rrs
    ),
    'topResponders', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'employeeName', tr.employee_name,
          'employeeUid', tr.employee_uid,
          'region', tr.region,
          'avgResponseTime', tr.avg_response_time,
          'score15s', tr.score_15s_response,
          'score30s', tr.score_30s_response,
          'score1min', tr.score_1min_response,
          'responseLevel', tr.response_level
        )
      )
      FROM top_responders tr
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- 3. 获取转化率分析
CREATE OR REPLACE FUNCTION get_conversion_analysis(
  time_range TEXT DEFAULT NULL,
  region TEXT DEFAULT NULL,
  min_form_leads INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  WITH conversion_data AS (
    SELECT 
      e.employee_name,
      e.employee_uid,
      eld.region,
      eld.total_interactions,
      eld.total_form_leads,
      eld.total_private_message_leads,
      eld.total_private_message_openings,
      eld.total_private_message_leads_kept,
      eld.notes_exposure_count,
      eld.notes_click_count,
      CASE 
        WHEN eld.total_interactions > 0 THEN 
          ROUND((eld.total_form_leads::NUMERIC / eld.total_interactions) * 100, 2)
        ELSE 0 
      END as form_conversion_rate,
      CASE 
        WHEN eld.total_interactions > 0 THEN 
          ROUND((eld.total_private_message_leads::NUMERIC / eld.total_interactions) * 100, 2)
        ELSE 0 
      END as message_conversion_rate,
      CASE 
        WHEN eld.notes_exposure_count > 0 THEN 
          ROUND((eld.notes_click_count::NUMERIC / eld.notes_exposure_count) * 100, 2)
        ELSE 0 
      END as click_rate,
      CASE 
        WHEN eld.total_form_leads > 50 THEN '优秀'
        WHEN eld.total_form_leads > 20 THEN '良好'
        WHEN eld.total_form_leads > 10 THEN '一般'
        ELSE '待提升'
      END as conversion_level
    FROM public.employee e
    LEFT JOIN public.employee_leads_data eld ON e.employee_uid = eld.account_id
    WHERE e.status = 'active'
      AND (time_range IS NULL OR eld.time_range->>'remark' = time_range)
      AND (region IS NULL OR eld.region = region)
      AND (min_form_leads IS NULL OR eld.total_form_leads >= min_form_leads)
  ),
  conversion_stats AS (
    SELECT 
      conversion_level,
      COUNT(*) as employee_count,
      AVG(total_form_leads) as avg_form_leads,
      AVG(total_private_message_leads) as avg_message_leads,
      AVG(form_conversion_rate) as avg_form_conversion_rate,
      AVG(message_conversion_rate) as avg_message_conversion_rate,
      AVG(click_rate) as avg_click_rate,
      SUM(total_form_leads) as total_form_leads,
      SUM(total_private_message_leads) as total_message_leads
    FROM conversion_data
    GROUP BY conversion_level
  ),
  region_conversion_stats AS (
    SELECT 
      region,
      COUNT(*) as employee_count,
      AVG(total_form_leads) as avg_form_leads,
      AVG(total_private_message_leads) as avg_message_leads,
      AVG(form_conversion_rate) as avg_form_conversion_rate,
      AVG(message_conversion_rate) as avg_message_conversion_rate,
      AVG(click_rate) as avg_click_rate
    FROM conversion_data
    WHERE region IS NOT NULL
    GROUP BY region
    ORDER BY avg_form_conversion_rate DESC
  ),
  top_converters AS (
    SELECT 
      employee_name,
      employee_uid,
      region,
      total_form_leads,
      total_private_message_leads,
      form_conversion_rate,
      message_conversion_rate,
      click_rate,
      conversion_level
    FROM conversion_data
    ORDER BY total_form_leads DESC
    LIMIT 10
  )
  SELECT jsonb_build_object(
    'conversionStats', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'level', cs.conversion_level,
          'employeeCount', cs.employee_count,
          'avgFormLeads', cs.avg_form_leads,
          'avgMessageLeads', cs.avg_message_leads,
          'avgFormConversionRate', cs.avg_form_conversion_rate,
          'avgMessageConversionRate', cs.avg_message_conversion_rate,
          'avgClickRate', cs.avg_click_rate,
          'totalFormLeads', cs.total_form_leads,
          'totalMessageLeads', cs.total_message_leads
        )
      )
      FROM conversion_stats cs
    ),
    'regionConversionStats', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'region', rcs.region,
          'employeeCount', rcs.employee_count,
          'avgFormLeads', rcs.avg_form_leads,
          'avgMessageLeads', rcs.avg_message_leads,
          'avgFormConversionRate', rcs.avg_form_conversion_rate,
          'avgMessageConversionRate', rcs.avg_message_conversion_rate,
          'avgClickRate', rcs.avg_click_rate
        )
      )
      FROM region_conversion_stats rcs
    ),
    'topConverters', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'employeeName', tc.employee_name,
          'employeeUid', tc.employee_uid,
          'region', tc.region,
          'totalFormLeads', tc.total_form_leads,
          'totalMessageLeads', tc.total_private_message_leads,
          'formConversionRate', tc.form_conversion_rate,
          'messageConversionRate', tc.message_conversion_rate,
          'clickRate', tc.click_rate,
          'conversionLevel', tc.conversion_level
        )
      )
      FROM top_converters tc
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- 4. 获取时间趋势分析
CREATE OR REPLACE FUNCTION get_time_trend_analysis(
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL,
  region TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  WITH time_trend_data AS (
    SELECT 
      DATE_TRUNC('day', e.created_at) as date,
      eld.region,
      COUNT(DISTINCT e.id) as new_employees,
      SUM(eld.total_interactions) as total_interactions,
      SUM(eld.total_form_leads) as total_form_leads,
      SUM(eld.total_private_message_leads) as total_message_leads,
      AVG(erd.avg_response_time) as avg_response_time,
      AVG(erd.user_rating_score) as avg_user_rating
    FROM public.employee e
    LEFT JOIN public.employee_leads_data eld ON e.employee_uid = eld.account_id
    LEFT JOIN public.employee_response_data erd ON e.employee_uid = erd.employee_uid
    WHERE (start_date IS NULL OR e.created_at >= start_date)
      AND (end_date IS NULL OR e.created_at <= end_date)
      AND (region IS NULL OR eld.region = region)
    GROUP BY DATE_TRUNC('day', e.created_at), eld.region
    ORDER BY date
  ),
  daily_stats AS (
    SELECT 
      date,
      SUM(new_employees) as new_employees,
      SUM(total_interactions) as total_interactions,
      SUM(total_form_leads) as total_form_leads,
      SUM(total_message_leads) as total_message_leads,
      AVG(avg_response_time) as avg_response_time,
      AVG(avg_user_rating) as avg_user_rating
    FROM time_trend_data
    GROUP BY date
    ORDER BY date
  ),
  weekly_stats AS (
    SELECT 
      DATE_TRUNC('week', date) as week,
      SUM(new_employees) as new_employees,
      SUM(total_interactions) as total_interactions,
      SUM(total_form_leads) as total_form_leads,
      SUM(total_message_leads) as total_message_leads,
      AVG(avg_response_time) as avg_response_time,
      AVG(avg_user_rating) as avg_user_rating
    FROM daily_stats
    GROUP BY DATE_TRUNC('week', date)
    ORDER BY week
  ),
  monthly_stats AS (
    SELECT 
      DATE_TRUNC('month', date) as month,
      SUM(new_employees) as new_employees,
      SUM(total_interactions) as total_interactions,
      SUM(total_form_leads) as total_form_leads,
      SUM(total_message_leads) as total_message_leads,
      AVG(avg_response_time) as avg_response_time,
      AVG(avg_user_rating) as avg_user_rating
    FROM daily_stats
    GROUP BY DATE_TRUNC('month', date)
    ORDER BY month
  )
  SELECT jsonb_build_object(
    'dailyStats', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'date', ds.date,
          'newEmployees', ds.new_employees,
          'totalInteractions', ds.total_interactions,
          'totalFormLeads', ds.total_form_leads,
          'totalMessageLeads', ds.total_message_leads,
          'avgResponseTime', ds.avg_response_time,
          'avgUserRating', ds.avg_user_rating
        )
      )
      FROM daily_stats ds
    ),
    'weeklyStats', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'week', ws.week,
          'newEmployees', ws.new_employees,
          'totalInteractions', ws.total_interactions,
          'totalFormLeads', ws.total_form_leads,
          'totalMessageLeads', ws.total_message_leads,
          'avgResponseTime', ws.avg_response_time,
          'avgUserRating', ws.avg_user_rating
        )
      )
      FROM weekly_stats ws
    ),
    'monthlyStats', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'month', ms.month,
          'newEmployees', ms.new_employees,
          'totalInteractions', ms.total_interactions,
          'totalFormLeads', ms.total_form_leads,
          'totalMessageLeads', ms.total_message_leads,
          'avgResponseTime', ms.avg_response_time,
          'avgUserRating', ms.avg_user_rating
        )
      )
      FROM monthly_stats ms
    )
  ) INTO result;
  
  RETURN result;
END;
$$;