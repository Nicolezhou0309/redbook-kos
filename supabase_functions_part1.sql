-- ========================================
-- 第一部分：基础搜索函数
-- ========================================

-- 1. 执行动态SQL查询并返回结果和计数
CREATE OR REPLACE FUNCTION execute_sql_with_count(
  sql_query TEXT,
  sql_params TEXT[] DEFAULT '{}'
)
RETURNS TABLE(
  data JSONB,
  count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result_data JSONB;
  result_count BIGINT;
BEGIN
  -- 执行查询获取数据
  EXECUTE sql_query INTO result_data USING VARIADIC sql_params;
  
  -- 获取总计数（移除LIMIT和OFFSET）
  EXECUTE 'SELECT COUNT(*) FROM (' || 
          REPLACE(REPLACE(sql_query, 'LIMIT', '-- LIMIT'), 'OFFSET', '-- OFFSET') || 
          ') as count_query' INTO result_count USING VARIADIC sql_params;
  
  RETURN QUERY SELECT result_data, result_count;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION '执行查询失败: %', SQLERRM;
END;
$$;

-- 2. 获取搜索统计信息
CREATE OR REPLACE FUNCTION get_search_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  WITH stats AS (
    SELECT 
      COUNT(DISTINCT e.id) as total_employees,
      COUNT(DISTINCT CASE WHEN e.status = 'active' THEN e.id END) as active_employees,
      COALESCE(SUM(eld.total_interactions), 0) as total_interactions,
      COALESCE(AVG(erd.avg_response_time), 0) as avg_response_time,
      ARRAY_AGG(DISTINCT eld.region) FILTER (WHERE eld.region IS NOT NULL) as regions,
      ARRAY_AGG(DISTINCT eld.tags) FILTER (WHERE eld.tags IS NOT NULL) as tags
    FROM public.employee e
    LEFT JOIN public.employee_leads_data eld ON e.employee_uid = eld.account_id
    LEFT JOIN public.employee_response_data erd ON e.employee_uid = erd.employee_uid
  ),
  top_regions AS (
    SELECT eld.region, COUNT(*) as count
    FROM public.employee_leads_data eld
    WHERE eld.region IS NOT NULL
    GROUP BY eld.region
    ORDER BY count DESC
    LIMIT 10
  ),
  top_tags AS (
    SELECT unnest(string_to_array(eld.tags, ',')) as tag, COUNT(*) as count
    FROM public.employee_leads_data eld
    WHERE eld.tags IS NOT NULL
    GROUP BY tag
    ORDER BY count DESC
    LIMIT 10
  )
  SELECT jsonb_build_object(
    'totalEmployees', s.total_employees,
    'activeEmployees', s.active_employees,
    'totalInteractions', s.total_interactions,
    'avgResponseTime', s.avg_response_time,
    'topRegions', ARRAY_AGG(tr.region),
    'topTags', ARRAY_AGG(tt.tag)
  ) INTO result
  FROM stats s
  CROSS JOIN LATERAL (SELECT * FROM top_regions) tr
  CROSS JOIN LATERAL (SELECT * FROM top_tags) tt;
  
  RETURN result;
END;
$$;

-- 3. 获取搜索建议
CREATE OR REPLACE FUNCTION get_search_suggestions(search_query TEXT)
RETURNS TEXT[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  suggestions TEXT[];
BEGIN
  -- 基于搜索历史生成建议
  WITH search_history AS (
    SELECT query, COUNT(*) as frequency
    FROM public.search_history
    WHERE query ILIKE '%' || search_query || '%'
    GROUP BY query
    ORDER BY frequency DESC
    LIMIT 5
  ),
  employee_suggestions AS (
    SELECT DISTINCT employee_name as suggestion
    FROM public.employee
    WHERE employee_name ILIKE '%' || search_query || '%'
    LIMIT 3
  ),
  nickname_suggestions AS (
    SELECT DISTINCT xiaohongshu_nickname as suggestion
    FROM public.employee_leads_data
    WHERE xiaohongshu_nickname ILIKE '%' || search_query || '%'
    LIMIT 3
  ),
  region_suggestions AS (
    SELECT DISTINCT region as suggestion
    FROM public.employee_leads_data
    WHERE region ILIKE '%' || search_query || '%'
    LIMIT 2
  ),
  tag_suggestions AS (
    SELECT DISTINCT unnest(string_to_array(tags, ',')) as suggestion
    FROM public.employee_leads_data
    WHERE tags ILIKE '%' || search_query || '%'
    LIMIT 3
  )
  SELECT ARRAY_AGG(DISTINCT suggestion) INTO suggestions
  FROM (
    SELECT suggestion FROM search_history
    UNION ALL
    SELECT suggestion FROM employee_suggestions
    UNION ALL
    SELECT suggestion FROM nickname_suggestions
    UNION ALL
    SELECT suggestion FROM region_suggestions
    UNION ALL
    SELECT suggestion FROM tag_suggestions
  ) all_suggestions;
  
  RETURN COALESCE(suggestions, ARRAY[]::TEXT[]);
END;
$$;

-- 4. 创建搜索历史表（如果不存在）
CREATE TABLE IF NOT EXISTS public.search_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  query TEXT NOT NULL,
  result_count INTEGER NOT NULL,
  search_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID,
  session_id TEXT
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_search_history_query ON public.search_history(query);
CREATE INDEX IF NOT EXISTS idx_search_history_time ON public.search_history(search_time);
CREATE INDEX IF NOT EXISTS idx_search_history_user ON public.search_history(user_id);

-- 5. 获取数值范围统计
CREATE OR REPLACE FUNCTION get_numeric_ranges()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  WITH ranges AS (
    SELECT 
      MIN(eld.total_interactions) as min_interactions,
      MAX(eld.total_interactions) as max_interactions,
      MIN(eld.total_form_leads) as min_form_leads,
      MAX(eld.total_form_leads) as max_form_leads,
      MIN(erd.avg_response_time) as min_response_time,
      MAX(erd.avg_response_time) as max_response_time,
      MIN(erd.user_rating_score) as min_user_rating,
      MAX(erd.user_rating_score) as max_user_rating
    FROM public.employee_leads_data eld
    LEFT JOIN public.employee_response_data erd ON eld.account_id = erd.employee_uid
    WHERE eld.total_interactions IS NOT NULL 
       OR eld.total_form_leads IS NOT NULL 
       OR erd.avg_response_time IS NOT NULL 
       OR erd.user_rating_score IS NOT NULL
  )
  SELECT jsonb_build_object(
    'interactions', jsonb_build_object('min', COALESCE(min_interactions, 0), 'max', COALESCE(max_interactions, 0)),
    'formLeads', jsonb_build_object('min', COALESCE(min_form_leads, 0), 'max', COALESCE(max_form_leads, 0)),
    'responseTime', jsonb_build_object('min', COALESCE(min_response_time, 0), 'max', COALESCE(max_response_time, 0)),
    'userRating', jsonb_build_object('min', COALESCE(min_user_rating, 0), 'max', COALESCE(max_user_rating, 0))
  ) INTO result
  FROM ranges;
  
  RETURN result;
END;
$$;

-- 6. 获取筛选选项
CREATE OR REPLACE FUNCTION get_filter_options()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  WITH regions AS (
    SELECT DISTINCT region
    FROM public.employee_leads_data
    WHERE region IS NOT NULL
    ORDER BY region
  ),
  statuses AS (
    SELECT DISTINCT status
    FROM public.employee
    WHERE status IS NOT NULL
    ORDER BY status
  ),
  tags AS (
    SELECT DISTINCT unnest(string_to_array(tags, ',')) as tag
    FROM public.employee_leads_data
    WHERE tags IS NOT NULL
    ORDER BY tag
  )
  SELECT jsonb_build_object(
    'regions', ARRAY_AGG(region),
    'statuses', ARRAY_AGG(status),
    'tags', ARRAY_AGG(tag)
  ) INTO result
  FROM (
    SELECT region FROM regions
    UNION ALL
    SELECT status FROM statuses
    UNION ALL
    SELECT tag FROM tags
  ) all_options;
  
  RETURN result;
END;
$$; 