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
      -- 关键修复：确保两个表的时间范围完全一致
      AND eld.time_range->>''start_date'' = erd.time_range->>''start_date''
      AND eld.time_range->>''end_date'' = erd.time_range->>''end_date''
      AND eld.time_range->>''remark'' = erd.time_range->>''remark''
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
    where_conditions := array_append(where_conditions, format('eld.published_notes_count <= %s', max_published_notes_count));
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

  -- 组合WHERE条件
  IF array_length(where_conditions, 1) > 0 THEN
    base_query := base_query || ' AND ' || array_to_string(where_conditions, ' AND ');
  END IF;

  -- 排序
  IF sort_by IS NOT NULL THEN
    IF sort_by NOT IN ('employee_name', 'employee_uid', 'status', 'created_at', 'activation_time',
                       'xiaohongshu_nickname', 'region', 'total_interactions', 
                       'total_form_leads', 'total_private_message_leads', 'total_private_message_openings',
                       'total_private_message_leads_kept', 'notes_exposure_count', 'notes_click_count',
                       'published_notes_count', 'promoted_notes_count', 'notes_promotion_cost',
                       'avg_response_time', 'user_rating_score') THEN
      sort_by := 'employee_name';
    END IF;
    
    IF sort_direction NOT IN ('asc', 'desc') THEN
      sort_direction := 'asc';
    END IF;
    
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
$function$;
