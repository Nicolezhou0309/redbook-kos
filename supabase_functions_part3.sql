-- ========================================
-- 第三部分：数据分析和统计函数
-- ========================================

-- 1. 员工数据分析统计函数
CREATE OR REPLACE FUNCTION get_employee_analytics(
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL,
  region_filter TEXT DEFAULT NULL,
  status_filter TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  WITH base_data AS (
    SELECT 
      e.id,
      e.employee_name,
      e.employee_uid,
      e.status,
      e.created_at,
      eld.region,
      eld.total_interactions,
      eld.total_form_leads,
      eld.total_private_message_leads,
      eld.notes_exposure_count,
      eld.notes_click_count,
      erd.avg_response_time,
      erd.user_rating_score,
      erd.score_15s_response,
      erd.score_30s_response,
      erd.score_1min_response
    FROM public.employee e
    LEFT JOIN public.employee_leads_data eld ON e.employee_uid = eld.account_id
    LEFT JOIN public.employee_response_data erd ON e.employee_uid = erd.employee_uid
    WHERE (start_date IS NULL OR e.created_at >= start_date)
      AND (end_date IS NULL OR e.created_at <= end_date)
      AND (region_filter IS NULL OR eld.region = region_filter)
      AND (status_filter IS NULL OR e.status = status_filter)
  ),
  summary_stats AS (
    SELECT 
      COUNT(*) as total_employees,
      COUNT(CASE WHEN status = 'active' THEN 1 END) as active_employees,
      COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_employees,
      AVG(total_interactions) as avg_interactions,
      SUM(total_interactions) as total_interactions_sum,
      AVG(total_form_leads) as avg_form_leads,
      SUM(total_form_leads) as total_form_leads_sum,
      AVG(avg_response_time) as avg_response_time,
      AVG(user_rating_score) as avg_user_rating,
      AVG(score_15s_response) as avg_score_15s,
      AVG(score_30s_response) as avg_score_30s,
      AVG(score_1min_response) as avg_score_1min
    FROM base_data
  ),
  region_stats AS (
    SELECT 
      region,
      COUNT(*) as employee_count,
      AVG(total_interactions) as avg_interactions,
      AVG(total_form_leads) as avg_form_leads,
      AVG(avg_response_time) as avg_response_time,
      AVG(user_rating_score) as avg_user_rating
    FROM base_data
    WHERE region IS NOT NULL
    GROUP BY region
    ORDER BY employee_count DESC
  ),
  performance_tiers AS (
    SELECT 
      CASE 
        WHEN total_interactions >= 200 THEN '高互动'
        WHEN total_interactions >= 100 THEN '中互动'
        ELSE '低互动'
      END as interaction_tier,
      CASE 
        WHEN avg_response_time <= 15 THEN '快速响应'
        WHEN avg_response_time <= 30 THEN '中等响应'
        ELSE '慢速响应'
      END as response_tier,
      CASE 
        WHEN user_rating_score >= 4.5 THEN '高评分'
        WHEN user_rating_score >= 4.0 THEN '中评分'
        ELSE '低评分'
      END as rating_tier,
      COUNT(*) as count
    FROM base_data
    WHERE total_interactions IS NOT NULL 
      AND avg_response_time IS NOT NULL 
      AND user_rating_score IS NOT NULL
    GROUP BY interaction_tier, response_tier, rating_tier
  ),
  top_performers AS (
    SELECT 
      employee_name,
      region,
      total_interactions,
      total_form_leads,
      avg_response_time,
      user_rating_score
    FROM base_data
    WHERE total_interactions IS NOT NULL
    ORDER BY total_interactions DESC
    LIMIT 10
  )
  SELECT jsonb_build_object(
    'summary', (
      SELECT jsonb_build_object(
        'totalEmployees', total_employees,
        'activeEmployees', active_employees,
        'inactiveEmployees', inactive_employees,
        'avgInteractions', avg_interactions,
        'totalInteractions', total_interactions_sum,
        'avgFormLeads', avg_form_leads,
        'totalFormLeads', total_form_leads_sum,
        'avgResponseTime', avg_response_time,
        'avgUserRating', avg_user_rating,
        'avgScore15s', avg_score_15s,
        'avgScore30s', avg_score_30s,
        'avgScore1min', avg_score_1min
      ) FROM summary_stats
    ),
    'regionStats', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'region', region,
          'employeeCount', employee_count,
          'avgInteractions', avg_interactions,
          'avgFormLeads', avg_form_leads,
          'avgResponseTime', avg_response_time,
          'avgUserRating', avg_user_rating
        )
      ) FROM region_stats
    ),
    'performanceTiers', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'interactionTier', interaction_tier,
          'responseTier', response_tier,
          'ratingTier', rating_tier,
          'count', count
        )
      ) FROM performance_tiers
    ),
    'topPerformers', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'employeeName', employee_name,
          'region', region,
          'totalInteractions', total_interactions,
          'totalFormLeads', total_form_leads,
          'avgResponseTime', avg_response_time,
          'userRating', user_rating_score
        )
      ) FROM top_performers
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- 2. 高级时间趋势分析函数
CREATE OR REPLACE FUNCTION get_time_trend_analysis_advanced(
  time_period TEXT DEFAULT 'month', -- 'day', 'week', 'month', 'quarter'
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  date_format TEXT;
BEGIN
  -- 根据时间周期设置日期格式
  CASE time_period
    WHEN 'day' THEN date_format := 'YYYY-MM-DD';
    WHEN 'week' THEN date_format := 'YYYY-WW';
    WHEN 'month' THEN date_format := 'YYYY-MM';
    WHEN 'quarter' THEN date_format := 'YYYY-Q';
    ELSE date_format := 'YYYY-MM';
  END CASE;

  WITH time_series AS (
    SELECT 
      TO_CHAR(e.created_at, date_format) as time_period,
      COUNT(*) as new_employees,
      COUNT(CASE WHEN e.status = 'active' THEN 1 END) as active_employees,
      COALESCE(SUM(eld.total_interactions), 0) as total_interactions,
      COALESCE(SUM(eld.total_form_leads), 0) as total_form_leads,
      COALESCE(AVG(erd.avg_response_time), 0) as avg_response_time,
      COALESCE(AVG(erd.user_rating_score), 0) as avg_user_rating
    FROM public.employee e
    LEFT JOIN public.employee_leads_data eld ON e.employee_uid = eld.account_id
    LEFT JOIN public.employee_response_data erd ON e.employee_uid = erd.employee_uid
    WHERE (start_date IS NULL OR e.created_at >= start_date)
      AND (end_date IS NULL OR e.created_at <= end_date)
    GROUP BY TO_CHAR(e.created_at, date_format)
    ORDER BY time_period
  ),
  cumulative_stats AS (
    SELECT 
      time_period,
      new_employees,
      active_employees,
      total_interactions,
      total_form_leads,
      avg_response_time,
      avg_user_rating,
      SUM(new_employees) OVER (ORDER BY time_period) as cumulative_employees,
      SUM(total_interactions) OVER (ORDER BY time_period) as cumulative_interactions,
      SUM(total_form_leads) OVER (ORDER BY time_period) as cumulative_form_leads
    FROM time_series
  )
  SELECT jsonb_build_object(
    'timePeriod', time_period,
    'trends', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'timePeriod', time_period,
          'newEmployees', new_employees,
          'activeEmployees', active_employees,
          'totalInteractions', total_interactions,
          'totalFormLeads', total_form_leads,
          'avgResponseTime', avg_response_time,
          'avgUserRating', avg_user_rating,
          'cumulativeEmployees', cumulative_employees,
          'cumulativeInteractions', cumulative_interactions,
          'cumulativeFormLeads', cumulative_form_leads
        )
      ) FROM cumulative_stats
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- 3. 地区对比分析函数
CREATE OR REPLACE FUNCTION get_region_comparison()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  WITH region_metrics AS (
    SELECT 
      eld.region,
      COUNT(DISTINCT e.id) as employee_count,
      COUNT(CASE WHEN e.status = 'active' THEN 1 END) as active_count,
      COALESCE(SUM(eld.total_interactions), 0) as total_interactions,
      COALESCE(AVG(eld.total_interactions), 0) as avg_interactions,
      COALESCE(SUM(eld.total_form_leads), 0) as total_form_leads,
      COALESCE(AVG(eld.total_form_leads), 0) as avg_form_leads,
      COALESCE(AVG(erd.avg_response_time), 0) as avg_response_time,
      COALESCE(AVG(erd.user_rating_score), 0) as avg_user_rating,
      COALESCE(AVG(erd.score_15s_response), 0) as avg_score_15s,
      COALESCE(AVG(erd.score_30s_response), 0) as avg_score_30s,
      COALESCE(AVG(erd.score_1min_response), 0) as avg_score_1min
    FROM public.employee e
    LEFT JOIN public.employee_leads_data eld ON e.employee_uid = eld.account_id
    LEFT JOIN public.employee_response_data erd ON e.employee_uid = erd.employee_uid
    WHERE eld.region IS NOT NULL
    GROUP BY eld.region
  ),
  region_rankings AS (
    SELECT 
      region,
      employee_count,
      active_count,
      total_interactions,
      avg_interactions,
      total_form_leads,
      avg_form_leads,
      avg_response_time,
      avg_user_rating,
      avg_score_15s,
      avg_score_30s,
      avg_score_1min,
      RANK() OVER (ORDER BY total_interactions DESC) as interaction_rank,
      RANK() OVER (ORDER BY avg_response_time ASC) as response_rank,
      RANK() OVER (ORDER BY avg_user_rating DESC) as rating_rank,
      RANK() OVER (ORDER BY avg_score_15s DESC) as score_15s_rank,
      RANK() OVER (ORDER BY avg_score_30s DESC) as score_30s_rank,
      RANK() OVER (ORDER BY avg_score_1min DESC) as score_1min_rank
    FROM region_metrics
  )
  SELECT jsonb_build_object(
    'regions', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'region', region,
          'employeeCount', employee_count,
          'activeCount', active_count,
          'totalInteractions', total_interactions,
          'avgInteractions', avg_interactions,
          'totalFormLeads', total_form_leads,
          'avgFormLeads', avg_form_leads,
          'avgResponseTime', avg_response_time,
          'avgUserRating', avg_user_rating,
          'avgScore15s', avg_score_15s,
          'avgScore30s', avg_score_30s,
          'avgScore1min', avg_score_1min,
          'rankings', jsonb_build_object(
            'interactionRank', interaction_rank,
            'responseRank', response_rank,
            'ratingRank', rating_rank,
            'score15sRank', score_15s_rank,
            'score30sRank', score_30s_rank,
            'score1minRank', score_1min_rank
          )
        )
      ) FROM region_rankings
    ),
    'summary', (
      SELECT jsonb_build_object(
        'totalRegions', COUNT(*),
        'avgEmployeesPerRegion', AVG(employee_count),
        'avgInteractionsPerRegion', AVG(total_interactions),
        'avgResponseTime', AVG(avg_response_time),
        'avgUserRating', AVG(avg_user_rating)
      ) FROM region_rankings
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- 4. 性能评估函数
CREATE OR REPLACE FUNCTION get_performance_evaluation(
  evaluation_criteria JSONB DEFAULT '{"interactions_weight": 0.3, "response_time_weight": 0.3, "user_rating_weight": 0.4}'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  interactions_weight NUMERIC;
  response_time_weight NUMERIC;
  user_rating_weight NUMERIC;
BEGIN
  -- 获取权重参数
  interactions_weight := (evaluation_criteria->>'interactions_weight')::NUMERIC;
  response_time_weight := (evaluation_criteria->>'response_time_weight')::NUMERIC;
  user_rating_weight := (evaluation_criteria->>'user_rating_weight')::NUMERIC;

  WITH employee_scores AS (
    SELECT 
      e.id,
      e.employee_name,
      e.employee_uid,
      e.status,
      eld.region,
      eld.total_interactions,
      eld.total_form_leads,
      erd.avg_response_time,
      erd.user_rating_score,
      -- 标准化分数 (0-100)
      CASE 
        WHEN eld.total_interactions IS NOT NULL THEN 
          (eld.total_interactions - MIN(eld.total_interactions) OVER ()) / 
          (MAX(eld.total_interactions) OVER () - MIN(eld.total_interactions) OVER ()) * 100
        ELSE 0 
      END as interactions_score,
      CASE 
        WHEN erd.avg_response_time IS NOT NULL THEN 
          (MAX(erd.avg_response_time) OVER () - erd.avg_response_time) / 
          (MAX(erd.avg_response_time) OVER () - MIN(erd.avg_response_time) OVER ()) * 100
        ELSE 0 
      END as response_time_score,
      CASE 
        WHEN erd.user_rating_score IS NOT NULL THEN 
          (erd.user_rating_score - MIN(erd.user_rating_score) OVER ()) / 
          (MAX(erd.user_rating_score) OVER () - MIN(erd.user_rating_score) OVER ()) * 100
        ELSE 0 
      END as user_rating_score_normalized,
      -- 综合评分
      CASE 
        WHEN eld.total_interactions IS NOT NULL AND erd.avg_response_time IS NOT NULL AND erd.user_rating_score IS NOT NULL THEN
          (CASE 
            WHEN eld.total_interactions IS NOT NULL THEN 
              (eld.total_interactions - MIN(eld.total_interactions) OVER ()) / 
              (MAX(eld.total_interactions) OVER () - MIN(eld.total_interactions) OVER ()) * 100
            ELSE 0 
          END * interactions_weight) +
          (CASE 
            WHEN erd.avg_response_time IS NOT NULL THEN 
              (MAX(erd.avg_response_time) OVER () - erd.avg_response_time) / 
              (MAX(erd.avg_response_time) OVER () - MIN(erd.avg_response_time) OVER ()) * 100
            ELSE 0 
          END * response_time_weight) +
          (CASE 
            WHEN erd.user_rating_score IS NOT NULL THEN 
              (erd.user_rating_score - MIN(erd.user_rating_score) OVER ()) / 
              (MAX(erd.user_rating_score) OVER () - MIN(erd.user_rating_score) OVER ()) * 100
            ELSE 0 
          END * user_rating_weight)
        ELSE 0 
      END as composite_score
    FROM public.employee e
    LEFT JOIN public.employee_leads_data eld ON e.employee_uid = eld.account_id
    LEFT JOIN public.employee_response_data erd ON e.employee_uid = erd.employee_uid
    WHERE eld.total_interactions IS NOT NULL 
      OR erd.avg_response_time IS NOT NULL 
      OR erd.user_rating_score IS NOT NULL
  ),
  performance_tiers AS (
    SELECT 
      *,
      CASE 
        WHEN composite_score >= 80 THEN '优秀'
        WHEN composite_score >= 60 THEN '良好'
        WHEN composite_score >= 40 THEN '一般'
        ELSE '需改进'
      END as performance_tier
    FROM employee_scores
  ),
  tier_summary AS (
    SELECT 
      performance_tier,
      COUNT(*) as count,
      AVG(composite_score) as avg_score,
      AVG(total_interactions) as avg_interactions,
      AVG(avg_response_time) as avg_response_time,
      AVG(user_rating_score) as avg_user_rating
    FROM performance_tiers
    GROUP BY performance_tier
  ),
  top_performers AS (
    SELECT 
      employee_name,
      employee_uid,
      region,
      total_interactions,
      avg_response_time,
      user_rating_score,
      composite_score,
      performance_tier
    FROM performance_tiers
    ORDER BY composite_score DESC
    LIMIT 20
  )
  SELECT jsonb_build_object(
    'evaluationCriteria', evaluation_criteria,
    'tierSummary', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'tier', performance_tier,
          'count', count,
          'avgScore', avg_score,
          'avgInteractions', avg_interactions,
          'avgResponseTime', avg_response_time,
          'avgUserRating', avg_user_rating
        )
      ) FROM tier_summary
    ),
    'topPerformers', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'employeeName', employee_name,
          'employeeUid', employee_uid,
          'region', region,
          'totalInteractions', total_interactions,
          'avgResponseTime', avg_response_time,
          'userRating', user_rating_score,
          'compositeScore', composite_score,
          'performanceTier', performance_tier
        )
      ) FROM top_performers
    ),
    'scoreDistribution', (
      SELECT jsonb_build_object(
        'excellent', COUNT(*) FILTER (WHERE performance_tier = '优秀'),
        'good', COUNT(*) FILTER (WHERE performance_tier = '良好'),
        'average', COUNT(*) FILTER (WHERE performance_tier = '一般'),
        'needsImprovement', COUNT(*) FILTER (WHERE performance_tier = '需改进')
      ) FROM performance_tiers
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- 5. 创建索引以优化查询性能
CREATE INDEX IF NOT EXISTS idx_employee_created_at ON public.employee(created_at);
CREATE INDEX IF NOT EXISTS idx_employee_status ON public.employee(status);
CREATE INDEX IF NOT EXISTS idx_employee_leads_region ON public.employee_leads_data(region);
CREATE INDEX IF NOT EXISTS idx_employee_leads_interactions ON public.employee_leads_data(total_interactions);
CREATE INDEX IF NOT EXISTS idx_employee_leads_form_leads ON public.employee_leads_data(total_form_leads);
CREATE INDEX IF NOT EXISTS idx_employee_response_time ON public.employee_response_data(avg_response_time);
CREATE INDEX IF NOT EXISTS idx_employee_response_rating ON public.employee_response_data(user_rating_score);

-- 6. 创建全文搜索索引（用于语义搜索）
CREATE INDEX IF NOT EXISTS idx_employee_name_fts ON public.employee USING gin(to_tsvector('chinese', employee_name));
CREATE INDEX IF NOT EXISTS idx_employee_leads_nickname_fts ON public.employee_leads_data USING gin(to_tsvector('chinese', xiaohongshu_nickname));
CREATE INDEX IF NOT EXISTS idx_employee_leads_region_fts ON public.employee_leads_data USING gin(to_tsvector('chinese', region));
CREATE INDEX IF NOT EXISTS idx_employee_leads_tags_fts ON public.employee_leads_data USING gin(to_tsvector('chinese', tags)); 