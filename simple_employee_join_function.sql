-- ========================================
-- 简化版员工联合查询函数
-- 支持筛选和排序功能
-- ========================================

CREATE OR REPLACE FUNCTION get_employee_join_data(
  -- 搜索参数
  search_query TEXT DEFAULT NULL,
  filter_employee_name TEXT DEFAULT NULL,
  filter_employee_uid TEXT DEFAULT NULL,
  filter_xiaohongshu_nickname TEXT DEFAULT NULL,
  filter_region TEXT DEFAULT NULL,
  filter_status TEXT DEFAULT NULL,
  
  -- 时间范围筛选
  time_range_remark TEXT DEFAULT NULL,
  start_date TEXT DEFAULT NULL,
  end_date TEXT DEFAULT NULL,
  
  -- 数值筛选
  min_interactions INTEGER DEFAULT NULL,
  max_interactions INTEGER DEFAULT NULL,
  min_form_leads INTEGER DEFAULT NULL,
  max_form_leads INTEGER DEFAULT NULL,
  min_private_message_leads INTEGER DEFAULT NULL,
  max_private_message_leads INTEGER DEFAULT NULL,
  min_private_message_openings INTEGER DEFAULT NULL,
  max_private_message_openings INTEGER DEFAULT NULL,
  min_private_message_leads_kept INTEGER DEFAULT NULL,
  max_private_message_leads_kept INTEGER DEFAULT NULL,
  min_notes_exposure_count INTEGER DEFAULT NULL,
  max_notes_exposure_count INTEGER DEFAULT NULL,
  min_notes_click_count INTEGER DEFAULT NULL,
  max_notes_click_count INTEGER DEFAULT NULL,
  min_published_notes_count INTEGER DEFAULT NULL,
  max_published_notes_count INTEGER DEFAULT NULL,
  min_promoted_notes_count INTEGER DEFAULT NULL,
  max_promoted_notes_count INTEGER DEFAULT NULL,
  min_notes_promotion_cost NUMERIC DEFAULT NULL,
  max_notes_promotion_cost NUMERIC DEFAULT NULL,
  
  -- 响应时间筛选
  min_response_time NUMERIC DEFAULT NULL,
  max_response_time NUMERIC DEFAULT NULL,
  min_user_rating NUMERIC DEFAULT NULL,
  max_user_rating NUMERIC DEFAULT NULL,
  min_score_15s_response NUMERIC DEFAULT NULL,
  max_score_15s_response NUMERIC DEFAULT NULL,
  min_score_30s_response NUMERIC DEFAULT NULL,
  max_score_30s_response NUMERIC DEFAULT NULL,
  min_score_1min_response NUMERIC DEFAULT NULL,
  max_score_1min_response NUMERIC DEFAULT NULL,
  min_score_1hour_timeout NUMERIC DEFAULT NULL,
  max_score_1hour_timeout NUMERIC DEFAULT NULL,
  min_score_avg_response_time NUMERIC DEFAULT NULL,
  max_score_avg_response_time NUMERIC DEFAULT NULL,
  
  -- 回复率筛选
  min_rate_15s_response NUMERIC DEFAULT NULL,
  max_rate_15s_response NUMERIC DEFAULT NULL,
  min_rate_30s_response NUMERIC DEFAULT NULL,
  max_rate_30s_response NUMERIC DEFAULT NULL,
  min_rate_1min_response NUMERIC DEFAULT NULL,
  max_rate_1min_response NUMERIC DEFAULT NULL,
  min_rate_1hour_timeout NUMERIC DEFAULT NULL,
  max_rate_1hour_timeout NUMERIC DEFAULT NULL,
  
  -- 黄牌筛选参数
  yellow_card_timeout_rate NUMERIC DEFAULT NULL,
  yellow_card_notes_count INTEGER DEFAULT NULL,
  yellow_card_min_private_message_leads INTEGER DEFAULT NULL,
  yellow_card_start_date TEXT DEFAULT NULL,
  yellow_card_end_date TEXT DEFAULT NULL,
  
  -- 排序参数
  sort_by TEXT DEFAULT 'employee_name',
  sort_direction TEXT DEFAULT 'asc',
  
  -- 分页参数
  page_number INTEGER DEFAULT 1,
  page_size INTEGER DEFAULT 20
)
RETURNS TABLE(
  -- 员工基本信息
  employee_id UUID,
  employee_name TEXT,
  employee_uid TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  
  -- 线索数据
  leads_id UUID,
  xiaohongshu_account_id TEXT,
  xiaohongshu_nickname TEXT,
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
  time_range JSONB,
  
  -- 响应数据
  response_id UUID,
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
  response_time_range JSONB,
  
  -- 分页信息
  total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  base_query TEXT;
  where_conditions TEXT[] := ARRAY[]::TEXT[];
  result_count BIGINT;
BEGIN
  -- 构建基础查询
  base_query := '
    SELECT 
      e.id as employee_id,
      e.employee_name,
      e.employee_uid,
      e.status,
      e.created_at,
      
      eld.id as leads_id,
      eld.xiaohongshu_account_id,
      eld.xiaohongshu_nickname,
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
      eld.time_range,
      
      erd.id as response_id,
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
      
      COUNT(*) OVER() as total_count
    FROM public.employee_list e
    RIGHT JOIN public.employee_leads_data eld ON e.employee_uid = eld.account_id
    RIGHT JOIN public.employee_response_data erd ON e.employee_uid = erd.employee_uid
    WHERE 1=1
  ';

  -- 搜索条件
  IF search_query IS NOT NULL AND search_query != '' THEN
    where_conditions := array_append(where_conditions, 
      format('(e.employee_name ILIKE ''%%%s%%'' OR e.employee_uid ILIKE ''%%%s%%'' OR eld.xiaohongshu_nickname ILIKE ''%%%s%%'' OR eld.region ILIKE ''%%%s%%'')', 
      search_query, search_query, search_query, search_query));
  END IF;

  -- 精确筛选条件
  IF filter_employee_name IS NOT NULL THEN
    where_conditions := array_append(where_conditions, format('e.employee_name ILIKE ''%%%s%%''', filter_employee_name));
  END IF;

  IF filter_employee_uid IS NOT NULL THEN
    where_conditions := array_append(where_conditions, format('e.employee_uid ILIKE ''%%%s%%''', filter_employee_uid));
  END IF;

  IF filter_xiaohongshu_nickname IS NOT NULL THEN
    where_conditions := array_append(where_conditions, format('eld.xiaohongshu_nickname ILIKE ''%%%s%%''', filter_xiaohongshu_nickname));
  END IF;

  IF filter_region IS NOT NULL THEN
    where_conditions := array_append(where_conditions, format('eld.region = ''%s''', filter_region));
  END IF;

  IF filter_status IS NOT NULL THEN
    where_conditions := array_append(where_conditions, format('e.status = ''%s''', filter_status));
  END IF;

  -- 时间范围筛选
  IF time_range_remark IS NOT NULL THEN
    where_conditions := array_append(where_conditions, format('eld.time_range->>''remark'' = ''%s''', time_range_remark));
  END IF;

  -- 日期范围筛选 - 针对两张表的 time_range JSONB 字段
  IF start_date IS NOT NULL AND end_date IS NOT NULL THEN
    -- 筛选时间范围重叠的记录
    where_conditions := array_append(where_conditions, format('(
      (eld.time_range->>''start_date'')::DATE <= ''%s''::DATE AND (eld.time_range->>''end_date'')::DATE >= ''%s''::DATE
    ) OR (
      (erd.time_range->>''start_date'')::DATE <= ''%s''::DATE AND (erd.time_range->>''end_date'')::DATE >= ''%s''::DATE
    )', end_date, start_date, end_date, start_date));
  ELSIF start_date IS NOT NULL THEN
    where_conditions := array_append(where_conditions, format('(
      (eld.time_range->>''end_date'')::DATE >= ''%s''::DATE
    ) OR (
      (erd.time_range->>''end_date'')::DATE >= ''%s''::DATE
    )', start_date, start_date));
  ELSIF end_date IS NOT NULL THEN
    where_conditions := array_append(where_conditions, format('(
      (eld.time_range->>''start_date'')::DATE <= ''%s''::DATE
    ) OR (
      (erd.time_range->>''start_date'')::DATE <= ''%s''::DATE
    )', end_date, end_date));
  END IF;

  -- 数值范围筛选
  IF min_interactions IS NOT NULL THEN
    where_conditions := array_append(where_conditions, format('eld.total_interactions >= %s', min_interactions));
  END IF;

  IF max_interactions IS NOT NULL THEN
    where_conditions := array_append(where_conditions, format('eld.total_interactions <= %s', max_interactions));
  END IF;

  IF min_form_leads IS NOT NULL THEN
    where_conditions := array_append(where_conditions, format('eld.total_form_leads >= %s', min_form_leads));
  END IF;

  IF max_form_leads IS NOT NULL THEN
    where_conditions := array_append(where_conditions, format('eld.total_form_leads <= %s', max_form_leads));
  END IF;

  -- 私信相关筛选
  IF min_private_message_leads IS NOT NULL THEN
    where_conditions := array_append(where_conditions, format('eld.total_private_message_leads >= %s', min_private_message_leads));
  END IF;

  IF max_private_message_leads IS NOT NULL THEN
    where_conditions := array_append(where_conditions, format('eld.total_private_message_leads <= %s', max_private_message_leads));
  END IF;

  IF min_private_message_openings IS NOT NULL THEN
    where_conditions := array_append(where_conditions, format('eld.total_private_message_openings >= %s', min_private_message_openings));
  END IF;

  IF max_private_message_openings IS NOT NULL THEN
    where_conditions := array_append(where_conditions, format('eld.total_private_message_openings <= %s', max_private_message_openings));
  END IF;

  IF min_private_message_leads_kept IS NOT NULL THEN
    where_conditions := array_append(where_conditions, format('eld.total_private_message_leads_kept >= %s', min_private_message_leads_kept));
  END IF;

  IF max_private_message_leads_kept IS NOT NULL THEN
    where_conditions := array_append(where_conditions, format('eld.total_private_message_leads_kept <= %s', max_private_message_leads_kept));
  END IF;

  -- 笔记相关筛选
  IF min_notes_exposure_count IS NOT NULL THEN
    where_conditions := array_append(where_conditions, format('eld.notes_exposure_count >= %s', min_notes_exposure_count));
  END IF;

  IF max_notes_exposure_count IS NOT NULL THEN
    where_conditions := array_append(where_conditions, format('eld.notes_exposure_count <= %s', max_notes_exposure_count));
  END IF;

  IF min_notes_click_count IS NOT NULL THEN
    where_conditions := array_append(where_conditions, format('eld.notes_click_count >= %s', min_notes_click_count));
  END IF;

  IF max_notes_click_count IS NOT NULL THEN
    where_conditions := array_append(where_conditions, format('eld.notes_click_count <= %s', max_notes_click_count));
  END IF;

  IF min_published_notes_count IS NOT NULL THEN
    where_conditions := array_append(where_conditions, format('eld.published_notes_count >= %s', min_published_notes_count));
  END IF;

  IF max_published_notes_count IS NOT NULL THEN
    where_conditions := array_append(where_conditions, format('eld.published_notes_count < %s', max_published_notes_count));
  END IF;

  IF min_promoted_notes_count IS NOT NULL THEN
    where_conditions := array_append(where_conditions, format('eld.promoted_notes_count >= %s', min_promoted_notes_count));
  END IF;

  IF max_promoted_notes_count IS NOT NULL THEN
    where_conditions := array_append(where_conditions, format('eld.promoted_notes_count <= %s', max_promoted_notes_count));
  END IF;

  IF min_notes_promotion_cost IS NOT NULL THEN
    where_conditions := array_append(where_conditions, format('eld.notes_promotion_cost >= %s', min_notes_promotion_cost));
  END IF;

  IF max_notes_promotion_cost IS NOT NULL THEN
    where_conditions := array_append(where_conditions, format('eld.notes_promotion_cost <= %s', max_notes_promotion_cost));
  END IF;

  IF min_response_time IS NOT NULL THEN
    where_conditions := array_append(where_conditions, format('erd.avg_response_time >= %s', min_response_time));
  END IF;

  IF max_response_time IS NOT NULL THEN
    where_conditions := array_append(where_conditions, format('erd.avg_response_time <= %s', max_response_time));
  END IF;

  IF min_user_rating IS NOT NULL THEN
    where_conditions := array_append(where_conditions, format('erd.user_rating_score >= %s', min_user_rating));
  END IF;

  IF max_user_rating IS NOT NULL THEN
    where_conditions := array_append(where_conditions, format('erd.user_rating_score <= %s', max_user_rating));
  END IF;

  -- 响应评分筛选 - 支持数值和字符串格式
  IF min_score_15s_response IS NOT NULL THEN
    where_conditions := array_append(where_conditions, format('(
      CASE 
        WHEN erd.score_15s_response IS NOT NULL THEN erd.score_15s_response
        WHEN erd.rate_15s_response IS NOT NULL AND erd.rate_15s_response != '''' THEN 
          CASE 
            WHEN erd.rate_15s_response LIKE ''%%%%'' THEN 
              NULLIF(REPLACE(erd.rate_15s_response, ''%%'', ''''), '''')::NUMERIC
            ELSE 
              NULLIF(erd.rate_15s_response, '''')::NUMERIC
          END
        ELSE NULL
      END
    ) >= %s', min_score_15s_response));
  END IF;

  IF max_score_15s_response IS NOT NULL THEN
    where_conditions := array_append(where_conditions, format('(
      CASE 
        WHEN erd.score_15s_response IS NOT NULL THEN erd.score_15s_response
        WHEN erd.rate_15s_response IS NOT NULL AND erd.rate_15s_response != '''' THEN 
          CASE 
            WHEN erd.rate_15s_response LIKE ''%%%%'' THEN 
              NULLIF(REPLACE(erd.rate_15s_response, ''%%'', ''''), '''')::NUMERIC
            ELSE 
              NULLIF(erd.rate_15s_response, '''')::NUMERIC
          END
        ELSE NULL
      END
    ) <= %s', max_score_15s_response));
  END IF;

  IF min_score_30s_response IS NOT NULL THEN
    where_conditions := array_append(where_conditions, format('(
      CASE 
        WHEN erd.score_30s_response IS NOT NULL THEN erd.score_30s_response
        WHEN erd.rate_30s_response IS NOT NULL AND erd.rate_30s_response != '''' THEN 
          CASE 
            WHEN erd.rate_30s_response LIKE ''%%%%'' THEN 
              NULLIF(REPLACE(erd.rate_30s_response, ''%%'', ''''), '''')::NUMERIC
            ELSE 
              NULLIF(erd.rate_30s_response, '''')::NUMERIC
          END
        ELSE NULL
      END
    ) >= %s', min_score_30s_response));
  END IF;

  IF max_score_30s_response IS NOT NULL THEN
    where_conditions := array_append(where_conditions, format('(
      CASE 
        WHEN erd.score_30s_response IS NOT NULL THEN erd.score_30s_response
        WHEN erd.rate_30s_response IS NOT NULL AND erd.rate_30s_response != '''' THEN 
          CASE 
            WHEN erd.rate_30s_response LIKE ''%%%%'' THEN 
              NULLIF(REPLACE(erd.rate_30s_response, ''%%'', ''''), '''')::NUMERIC
            ELSE 
              NULLIF(erd.rate_30s_response, '''')::NUMERIC
          END
        ELSE NULL
      END
    ) <= %s', max_score_30s_response));
  END IF;

  IF min_score_1min_response IS NOT NULL THEN
    where_conditions := array_append(where_conditions, format('(
      CASE 
        WHEN erd.score_1min_response IS NOT NULL THEN erd.score_1min_response
        WHEN erd.rate_1min_response IS NOT NULL AND erd.rate_1min_response != '''' THEN 
          CASE 
            WHEN erd.rate_1min_response LIKE ''%%%%'' THEN 
              NULLIF(REPLACE(erd.rate_1min_response, ''%%'', ''''), '''')::NUMERIC
            ELSE 
              NULLIF(erd.rate_1min_response, '''')::NUMERIC
          END
        ELSE NULL
      END
    ) >= %s', min_score_1min_response));
  END IF;

  IF max_score_1min_response IS NOT NULL THEN
    where_conditions := array_append(where_conditions, format('(
      CASE 
        WHEN erd.score_1min_response IS NOT NULL THEN erd.score_1min_response
        WHEN erd.rate_1min_response IS NOT NULL AND erd.rate_1min_response != '''' THEN 
          CASE 
            WHEN erd.rate_1min_response LIKE ''%%%%'' THEN 
              NULLIF(REPLACE(erd.rate_1min_response, ''%%'', ''''), '''')::NUMERIC
            ELSE 
              NULLIF(erd.rate_1min_response, '''')::NUMERIC
          END
        ELSE NULL
      END
    ) <= %s', max_score_1min_response));
  END IF;

  -- 1小时超时评分筛选 - 支持数值和字符串格式
  IF min_score_1hour_timeout IS NOT NULL THEN
    where_conditions := array_append(where_conditions, format('(
      CASE 
        WHEN erd.score_1hour_timeout IS NOT NULL THEN erd.score_1hour_timeout
        WHEN erd.rate_1hour_timeout IS NOT NULL AND erd.rate_1hour_timeout != '''' THEN 
          CASE 
            WHEN erd.rate_1hour_timeout LIKE ''%%%%'' THEN 
              NULLIF(REPLACE(erd.rate_1hour_timeout, ''%%'', ''''), '''')::NUMERIC
            ELSE 
              NULLIF(erd.rate_1hour_timeout, '''')::NUMERIC
          END
        ELSE NULL
      END
    ) >= %s', min_score_1hour_timeout));
  END IF;

  IF max_score_1hour_timeout IS NOT NULL THEN
    where_conditions := array_append(where_conditions, format('(
      CASE 
        WHEN erd.score_1hour_timeout IS NOT NULL THEN erd.score_1hour_timeout
        WHEN erd.rate_1hour_timeout IS NOT NULL AND erd.rate_1hour_timeout != '''' THEN 
          CASE 
            WHEN erd.rate_1hour_timeout LIKE ''%%%%'' THEN 
              NULLIF(REPLACE(erd.rate_1hour_timeout, ''%%'', ''''), '''')::NUMERIC
            ELSE 
              NULLIF(erd.rate_1hour_timeout, '''')::NUMERIC
          END
        ELSE NULL
      END
    ) <= %s', max_score_1hour_timeout));
  END IF;

  IF min_score_avg_response_time IS NOT NULL THEN
    where_conditions := array_append(where_conditions, format('(
      CASE 
        WHEN erd.score_avg_response_time IS NOT NULL THEN erd.score_avg_response_time
        WHEN erd.avg_response_time IS NOT NULL THEN erd.avg_response_time
        ELSE NULL
      END
    ) >= %s', min_score_avg_response_time));
  END IF;

  IF max_score_avg_response_time IS NOT NULL THEN
    where_conditions := array_append(where_conditions, format('(
      CASE 
        WHEN erd.score_avg_response_time IS NOT NULL THEN erd.score_avg_response_time
        WHEN erd.avg_response_time IS NOT NULL THEN erd.avg_response_time
        ELSE NULL
      END
    ) <= %s', max_score_avg_response_time));
  END IF;

  -- 回复率筛选
  IF min_rate_15s_response IS NOT NULL THEN
    where_conditions := array_append(where_conditions, format('(
      CASE 
        WHEN erd.rate_15s_response IS NOT NULL AND erd.rate_15s_response != '''' THEN 
          CASE 
            WHEN erd.rate_15s_response LIKE ''%%%%'' THEN 
              NULLIF(REPLACE(erd.rate_15s_response, ''%%'', ''''), '''')::NUMERIC
            ELSE 
              NULLIF(erd.rate_15s_response, '''')::NUMERIC
          END
        ELSE NULL
      END
    ) >= %s', min_rate_15s_response));
  END IF;

  IF max_rate_15s_response IS NOT NULL THEN
    where_conditions := array_append(where_conditions, format('(
      CASE 
        WHEN erd.rate_15s_response IS NOT NULL AND erd.rate_15s_response != '''' THEN 
          CASE 
            WHEN erd.rate_15s_response LIKE ''%%%%'' THEN 
              NULLIF(REPLACE(erd.rate_15s_response, ''%%'', ''''), '''')::NUMERIC
            ELSE 
              NULLIF(erd.rate_15s_response, '''')::NUMERIC
          END
        ELSE NULL
      END
    ) <= %s', max_rate_15s_response));
  END IF;

  IF min_rate_30s_response IS NOT NULL THEN
    where_conditions := array_append(where_conditions, format('(
      CASE 
        WHEN erd.rate_30s_response IS NOT NULL AND erd.rate_30s_response != '''' THEN 
          CASE 
            WHEN erd.rate_30s_response LIKE ''%%%%'' THEN 
              NULLIF(REPLACE(erd.rate_30s_response, ''%%'', ''''), '''')::NUMERIC
            ELSE 
              NULLIF(erd.rate_30s_response, '''')::NUMERIC
          END
        ELSE NULL
      END
    ) >= %s', min_rate_30s_response));
  END IF;

  IF max_rate_30s_response IS NOT NULL THEN
    where_conditions := array_append(where_conditions, format('(
      CASE 
        WHEN erd.rate_30s_response IS NOT NULL AND erd.rate_30s_response != '''' THEN 
          CASE 
            WHEN erd.rate_30s_response LIKE ''%%%%'' THEN 
              NULLIF(REPLACE(erd.rate_30s_response, ''%%'', ''''), '''')::NUMERIC
            ELSE 
              NULLIF(erd.rate_30s_response, '''')::NUMERIC
          END
        ELSE NULL
      END
    ) <= %s', max_rate_30s_response));
  END IF;

  IF min_rate_1min_response IS NOT NULL THEN
    where_conditions := array_append(where_conditions, format('(
      CASE 
        WHEN erd.rate_1min_response IS NOT NULL AND erd.rate_1min_response != '''' THEN 
          CASE 
            WHEN erd.rate_1min_response LIKE ''%%%%'' THEN 
              NULLIF(REPLACE(erd.rate_1min_response, ''%%'', ''''), '''')::NUMERIC
            ELSE 
              NULLIF(erd.rate_1min_response, '''')::NUMERIC
          END
        ELSE NULL
      END
    ) >= %s', min_rate_1min_response));
  END IF;

  IF max_rate_1min_response IS NOT NULL THEN
    where_conditions := array_append(where_conditions, format('(
      CASE 
        WHEN erd.rate_1min_response IS NOT NULL AND erd.rate_1min_response != '''' THEN 
          CASE 
            WHEN erd.rate_1min_response LIKE ''%%%%'' THEN 
              NULLIF(REPLACE(erd.rate_1min_response, ''%%'', ''''), '''')::NUMERIC
            ELSE 
              NULLIF(erd.rate_1min_response, '''')::NUMERIC
          END
        ELSE NULL
      END
    ) <= %s', max_rate_1min_response));
  END IF;

  IF min_rate_1hour_timeout IS NOT NULL THEN
    where_conditions := array_append(where_conditions, format('(
      CASE 
        WHEN erd.rate_1hour_timeout IS NOT NULL AND erd.rate_1hour_timeout != '''' THEN 
          CASE 
            WHEN erd.rate_1hour_timeout LIKE ''%%%%'' THEN 
              NULLIF(REPLACE(erd.rate_1hour_timeout, ''%%'', ''''), '''')::NUMERIC
            ELSE 
              NULLIF(erd.rate_1hour_timeout, '''')::NUMERIC
          END
        ELSE NULL
      END
    ) > %s', min_rate_1hour_timeout));
  END IF;

  IF max_rate_1hour_timeout IS NOT NULL THEN
    where_conditions := array_append(where_conditions, format('(
      CASE 
        WHEN erd.rate_1hour_timeout IS NOT NULL AND erd.rate_1hour_timeout != '''' THEN 
          CASE 
            WHEN erd.rate_1hour_timeout LIKE ''%%%%'' THEN 
              NULLIF(REPLACE(erd.rate_1hour_timeout, ''%%'', ''''), '''')::NUMERIC
            ELSE 
              NULLIF(erd.rate_1hour_timeout, '''')::NUMERIC
          END
        ELSE NULL
      END
    ) <= %s', max_rate_1hour_timeout));
  END IF;

  -- 黄牌筛选逻辑：时间范围 AND 私信进线>x AND (超时率严格大于 OR 笔记数严格小于)
  IF yellow_card_timeout_rate IS NOT NULL OR yellow_card_notes_count IS NOT NULL OR yellow_card_min_private_message_leads IS NOT NULL THEN
    -- 时间范围条件
    IF yellow_card_start_date IS NOT NULL AND yellow_card_end_date IS NOT NULL THEN
      where_conditions := array_append(where_conditions, format('(
        (eld.time_range->>''start_date'')::DATE <= ''%s''::DATE AND (eld.time_range->>''end_date'')::DATE >= ''%s''::DATE
      ) AND (
        (erd.time_range->>''start_date'')::DATE <= ''%s''::DATE AND (erd.time_range->>''end_date'')::DATE >= ''%s''::DATE
      )', yellow_card_end_date, yellow_card_start_date, yellow_card_end_date, yellow_card_start_date));
    ELSIF yellow_card_start_date IS NOT NULL THEN
      where_conditions := array_append(where_conditions, format('(
        (eld.time_range->>''end_date'')::DATE >= ''%s''::DATE
      ) AND (
        (erd.time_range->>''end_date'')::DATE >= ''%s''::DATE
      )', yellow_card_start_date, yellow_card_start_date));
    ELSIF yellow_card_end_date IS NOT NULL THEN
      where_conditions := array_append(where_conditions, format('(
        (eld.time_range->>''start_date'')::DATE <= ''%s''::DATE
      ) AND (
        (erd.time_range->>''start_date'')::DATE <= ''%s''::DATE
      )', yellow_card_end_date, yellow_card_end_date));
    END IF;

    -- 私信进线最小值条件（剔除异常数据）
    IF yellow_card_min_private_message_leads IS NOT NULL THEN
      where_conditions := array_append(where_conditions, format('eld.total_private_message_leads >= %s', yellow_card_min_private_message_leads));
    END IF;

    -- 黄牌条件：(1小时超时回复率大于X AND 私信进线数大于x) OR 笔记发布量小于x
    DECLARE
      yellow_card_conditions TEXT[] := ARRAY[]::TEXT[];
      timeout_and_leads_condition TEXT := '';
      notes_condition TEXT := '';
    BEGIN
      -- 构建超时率AND私信进线的条件
      IF yellow_card_timeout_rate IS NOT NULL AND yellow_card_min_private_message_leads IS NOT NULL THEN
        timeout_and_leads_condition := format('(
          CASE 
            WHEN erd.rate_1hour_timeout IS NOT NULL AND erd.rate_1hour_timeout != '''' THEN 
              CASE 
                WHEN erd.rate_1hour_timeout LIKE ''%%%%'' THEN 
                  NULLIF(REPLACE(erd.rate_1hour_timeout, ''%%'', ''''), '''')::NUMERIC
                ELSE 
                  NULLIF(erd.rate_1hour_timeout, '''')::NUMERIC
              END
            ELSE NULL
          END
        ) > %s AND eld.total_private_message_leads >= %s', yellow_card_timeout_rate, yellow_card_min_private_message_leads);
      ELSIF yellow_card_timeout_rate IS NOT NULL THEN
        -- 只有超时率条件
        timeout_and_leads_condition := format('(
          CASE 
            WHEN erd.rate_1hour_timeout IS NOT NULL AND erd.rate_1hour_timeout != '''' THEN 
              CASE 
                WHEN erd.rate_1hour_timeout LIKE ''%%%%'' THEN 
                  NULLIF(REPLACE(erd.rate_1hour_timeout, ''%%'', ''''), '''')::NUMERIC
                ELSE 
                  NULLIF(erd.rate_1hour_timeout, '''')::NUMERIC
              END
            ELSE NULL
          END
        ) > %s', yellow_card_timeout_rate);
      ELSIF yellow_card_min_private_message_leads IS NOT NULL THEN
        -- 只有私信进线条件
        timeout_and_leads_condition := format('eld.total_private_message_leads >= %s', yellow_card_min_private_message_leads);
      END IF;

      -- 构建笔记数条件
      IF yellow_card_notes_count IS NOT NULL THEN
        notes_condition := format('eld.published_notes_count < %s', yellow_card_notes_count);
      END IF;

      -- 组合最终条件：(超时率AND私信进线) OR 笔记数
      IF timeout_and_leads_condition != '' AND notes_condition != '' THEN
        yellow_card_conditions := array_append(yellow_card_conditions, '(' || timeout_and_leads_condition || ' OR ' || notes_condition || ')');
      ELSIF timeout_and_leads_condition != '' THEN
        yellow_card_conditions := array_append(yellow_card_conditions, timeout_and_leads_condition);
      ELSIF notes_condition != '' THEN
        yellow_card_conditions := array_append(yellow_card_conditions, notes_condition);
      END IF;

      -- 添加黄牌条件
      IF array_length(yellow_card_conditions, 1) > 0 THEN
        where_conditions := array_append(where_conditions, '(' || array_to_string(yellow_card_conditions, ' OR ') || ')');
      END IF;
    END;
  END IF;

  -- 组合WHERE条件
  IF array_length(where_conditions, 1) > 0 THEN
    base_query := base_query || ' AND ' || array_to_string(where_conditions, ' AND ');
  END IF;

  -- 排序 - 支持文本数值的智能排序
  IF sort_by IS NOT NULL THEN
    -- 验证排序字段
    IF sort_by NOT IN ('employee_name', 'employee_uid', 'status', 'created_at', 'activation_time',
                       'xiaohongshu_nickname', 'region', 'total_interactions', 
                       'total_form_leads', 'total_private_message_leads', 'total_private_message_openings',
                       'total_private_message_leads_kept', 'notes_exposure_count', 'notes_click_count',
                       'published_notes_count', 'promoted_notes_count', 'notes_promotion_cost',
                       'avg_response_time', 'user_rating_score', 'score_15s_response', 'score_30s_response',
                       'score_1min_response', 'score_1hour_timeout', 'score_avg_response_time',
                       'rate_15s_response', 'rate_30s_response', 'rate_1min_response', 'rate_1hour_timeout') THEN
      sort_by := 'employee_name';
    END IF;
    
    IF sort_direction NOT IN ('asc', 'desc') THEN
      sort_direction := 'asc';
    END IF;
    
    -- 智能排序：根据字段类型选择排序方式
    IF sort_by IN ('score_15s_response', 'score_30s_response', 'score_1min_response', 'score_1hour_timeout', 'score_avg_response_time') THEN
      -- 响应评分字段：支持数值和字符串格式的智能排序
      base_query := base_query || format(' ORDER BY (
        CASE 
          WHEN erd.%s IS NOT NULL THEN erd.%s
          WHEN erd.rate_%s IS NOT NULL AND erd.rate_%s != '''' THEN 
            CASE 
              WHEN erd.rate_%s LIKE ''%%%%'' THEN 
                NULLIF(REPLACE(erd.rate_%s, ''%%'', ''''), '''')::NUMERIC
              ELSE 
                NULLIF(erd.rate_%s, '''')::NUMERIC
            END
          ELSE NULL
        END
      ) %s NULLS LAST', 
      sort_by, sort_by, 
      REPLACE(sort_by, 'score_', ''), REPLACE(sort_by, 'score_', ''),
      REPLACE(sort_by, 'score_', ''), REPLACE(sort_by, 'score_', ''), REPLACE(sort_by, 'score_', ''),
      sort_direction);
    ELSIF sort_by IN ('rate_15s_response', 'rate_30s_response', 'rate_1min_response', 'rate_1hour_timeout') THEN
      -- 回复率字段：支持百分比字符串的智能排序
      base_query := base_query || format(' ORDER BY (
        CASE 
          WHEN erd.%s IS NOT NULL AND erd.%s != '''' THEN 
            CASE 
              WHEN erd.%s LIKE ''%%%%'' THEN 
                NULLIF(REPLACE(erd.%s, ''%%'', ''''), '''')::NUMERIC
              ELSE 
                NULLIF(erd.%s, '''')::NUMERIC
            END
          ELSE NULL
        END
      ) %s NULLS LAST', 
      sort_by, sort_by, sort_by, sort_by, sort_by, sort_direction);
    ELSE
      -- 其他字段：直接排序
      base_query := base_query || format(' ORDER BY %s %s NULLS LAST', sort_by, sort_direction);
    END IF;
  ELSE
    base_query := base_query || ' ORDER BY e.employee_name ASC';
  END IF;

  -- 添加分页
  base_query := base_query || format(' LIMIT %s OFFSET %s', page_size, (page_number - 1) * page_size);

  -- 返回结果
  RETURN QUERY EXECUTE base_query;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION '查询失败: %', SQLERRM;
END;
$$;

-- 创建索引以优化查询性能
CREATE INDEX IF NOT EXISTS idx_employee_name ON public.employee_list(employee_name);
CREATE INDEX IF NOT EXISTS idx_employee_uid ON public.employee_list(employee_uid);
CREATE INDEX IF NOT EXISTS idx_employee_status ON public.employee_list(status);
CREATE INDEX IF NOT EXISTS idx_employee_leads_nickname ON public.employee_leads_data(xiaohongshu_nickname);
CREATE INDEX IF NOT EXISTS idx_employee_leads_region ON public.employee_leads_data(region);
CREATE INDEX IF NOT EXISTS idx_employee_leads_interactions ON public.employee_leads_data(total_interactions);
CREATE INDEX IF NOT EXISTS idx_employee_leads_form_leads ON public.employee_leads_data(total_form_leads);
CREATE INDEX IF NOT EXISTS idx_employee_leads_private_message_leads ON public.employee_leads_data(total_private_message_leads);
CREATE INDEX IF NOT EXISTS idx_employee_leads_private_message_openings ON public.employee_leads_data(total_private_message_openings);
CREATE INDEX IF NOT EXISTS idx_employee_leads_private_message_leads_kept ON public.employee_leads_data(total_private_message_leads_kept);
CREATE INDEX IF NOT EXISTS idx_employee_leads_notes_exposure_count ON public.employee_leads_data(notes_exposure_count);
CREATE INDEX IF NOT EXISTS idx_employee_leads_notes_click_count ON public.employee_leads_data(notes_click_count);
CREATE INDEX IF NOT EXISTS idx_employee_leads_published_notes_count ON public.employee_leads_data(published_notes_count);
CREATE INDEX IF NOT EXISTS idx_employee_leads_promoted_notes_count ON public.employee_leads_data(promoted_notes_count);
CREATE INDEX IF NOT EXISTS idx_employee_leads_notes_promotion_cost ON public.employee_leads_data(notes_promotion_cost);
CREATE INDEX IF NOT EXISTS idx_employee_response_time ON public.employee_response_data(avg_response_time);
CREATE INDEX IF NOT EXISTS idx_employee_response_rating ON public.employee_response_data(user_rating_score);
CREATE INDEX IF NOT EXISTS idx_employee_response_score_15s ON public.employee_response_data(score_15s_response);
CREATE INDEX IF NOT EXISTS idx_employee_response_score_30s ON public.employee_response_data(score_30s_response);
CREATE INDEX IF NOT EXISTS idx_employee_response_score_1min ON public.employee_response_data(score_1min_response);
CREATE INDEX IF NOT EXISTS idx_employee_response_score_1hour ON public.employee_response_data(score_1hour_timeout);
CREATE INDEX IF NOT EXISTS idx_employee_response_score_avg ON public.employee_response_data(score_avg_response_time); 