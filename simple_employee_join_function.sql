CREATE OR REPLACE FUNCTION public.get_employee_join_data(search_query text DEFAULT NULL::text, filter_employee_name text DEFAULT NULL::text, filter_employee_uid text DEFAULT NULL::text, filter_xiaohongshu_nickname text DEFAULT NULL::text, filter_region text DEFAULT NULL::text, filter_status text DEFAULT NULL::text, time_range_remark text DEFAULT NULL::text, start_date text DEFAULT NULL::text, end_date text DEFAULT NULL::text, min_interactions integer DEFAULT NULL::integer, max_interactions integer DEFAULT NULL::integer, min_form_leads integer DEFAULT NULL::integer, max_form_leads integer DEFAULT NULL::integer, min_private_message_leads integer DEFAULT NULL::integer, max_private_message_leads integer DEFAULT NULL::integer, min_private_message_openings integer DEFAULT NULL::integer, max_private_message_openings integer DEFAULT NULL::integer, min_private_message_leads_kept integer DEFAULT NULL::integer, max_private_message_leads_kept integer DEFAULT NULL::integer, min_notes_exposure_count integer DEFAULT NULL::integer, max_notes_exposure_count integer DEFAULT NULL::integer, min_notes_click_count integer DEFAULT NULL::integer, max_notes_click_count integer DEFAULT NULL::integer, min_published_notes_count integer DEFAULT NULL::integer, max_published_notes_count integer DEFAULT NULL::integer, min_promoted_notes_count integer DEFAULT NULL::integer, max_promoted_notes_count integer DEFAULT NULL::integer, min_notes_promotion_cost numeric DEFAULT NULL::numeric, max_notes_promotion_cost numeric DEFAULT NULL::numeric, min_response_time numeric DEFAULT NULL::numeric, max_response_time numeric DEFAULT NULL::numeric, min_user_rating numeric DEFAULT NULL::numeric, max_user_rating numeric DEFAULT NULL::numeric, min_score_15s_response numeric DEFAULT NULL::numeric, max_score_15s_response numeric DEFAULT NULL::numeric, min_score_30s_response numeric DEFAULT NULL::numeric, max_score_30s_response numeric DEFAULT NULL::numeric, min_score_1min_response numeric DEFAULT NULL::numeric, max_score_1min_response numeric DEFAULT NULL::numeric, min_score_1hour_timeout numeric DEFAULT NULL::numeric, max_score_1hour_timeout numeric DEFAULT NULL::numeric, min_score_avg_response_time numeric DEFAULT NULL::numeric, max_score_avg_response_time numeric DEFAULT NULL::numeric, min_rate_15s_response numeric DEFAULT NULL::numeric, max_rate_15s_response numeric DEFAULT NULL::numeric, min_rate_30s_response numeric DEFAULT NULL::numeric, max_rate_30s_response numeric DEFAULT NULL::numeric, min_rate_1min_response numeric DEFAULT NULL::numeric, max_rate_1min_response numeric DEFAULT NULL::numeric, min_rate_1hour_timeout numeric DEFAULT NULL::numeric, max_rate_1hour_timeout numeric DEFAULT NULL::numeric, yellow_card_timeout_rate numeric DEFAULT NULL::numeric, yellow_card_notes_count integer DEFAULT NULL::integer, yellow_card_min_private_message_leads integer DEFAULT NULL::integer, yellow_card_start_date text DEFAULT NULL::text, yellow_card_end_date text DEFAULT NULL::text, sort_by text DEFAULT 'employee_name'::text, sort_direction text DEFAULT 'asc'::text, page_number integer DEFAULT 1, page_size integer DEFAULT 20)
 RETURNS TABLE(employee_id uuid, employee_name text, employee_uid text, status text, created_at timestamp with time zone, leads_id uuid, xiaohongshu_account_id text, xiaohongshu_nickname text, region text, tags text, activation_time date, published_notes_count integer, promoted_notes_count integer, notes_promotion_cost numeric, total_interactions integer, total_form_leads integer, total_private_message_leads integer, total_private_message_openings integer, total_private_message_leads_kept integer, notes_exposure_count integer, notes_click_count integer, time_range jsonb, response_id uuid, score_15s_response numeric, score_30s_response numeric, score_1min_response numeric, score_1hour_timeout numeric, score_avg_response_time numeric, rate_15s_response text, rate_30s_response text, rate_1min_response text, rate_1hour_timeout text, avg_response_time numeric, user_rating_score numeric, response_time_range jsonb, total_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
          RIGHT JOIN public.employee_response_data erd ON (
        COALESCE(e.employee_uid, eld.account_id) = erd.employee_uid
        -- 只匹配时间范围，不匹配remark
        AND eld.time_range->>''start_date'' = erd.time_range->>''start_date''
        AND eld.time_range->>''end_date'' = erd.time_range->>''end_date''
      )
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

  -- 日期范围筛选 - 由于JOIN已经确保时间范围一致，这里只需要筛选其中一个表
  IF start_date IS NOT NULL AND end_date IS NOT NULL THEN
    where_conditions := array_append(where_conditions, format('(
      (eld.time_range->>''start_date'')::DATE <= ''%s''::DATE AND (eld.time_range->>''end_date'')::DATE >= ''%s''::DATE
    )', end_date, start_date));
  ELSIF start_date IS NOT NULL THEN
    where_conditions := array_append(where_conditions, format('(
      (eld.time_range->>''end_date'')::DATE >= ''%s''::DATE
    )', start_date));
  ELSIF end_date IS NOT NULL THEN
    where_conditions := array_append(where_conditions, format('(
      (eld.time_range->>''start_date'')::DATE <= ''%s''::DATE
    )', end_date));
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
      )', yellow_card_end_date));
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
      -- 简化黄牌条件构建，避免复杂的字符串转义
      IF yellow_card_timeout_rate IS NOT NULL AND yellow_card_min_private_message_leads IS NOT NULL THEN
        timeout_and_leads_condition := format('eld.total_private_message_leads >= %s', yellow_card_min_private_message_leads);
      ELSIF yellow_card_timeout_rate IS NOT NULL THEN
        timeout_and_leads_condition := format('erd.rate_1hour_timeout > %s', yellow_card_timeout_rate);
      ELSIF yellow_card_min_private_message_leads IS NOT NULL THEN
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
    
    -- 简化排序逻辑，避免复杂的字符串转义
    base_query := base_query || format(' ORDER BY %s %s NULLS LAST', sort_by, sort_direction);
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
$function$