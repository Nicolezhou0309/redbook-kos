-- 测试修改后的函数
-- 1. 首先创建测试数据
INSERT INTO public.employee_leads_data (id, account_id, xiaohongshu_nickname, region, time_range, total_interactions, total_form_leads, total_private_message_leads, published_notes_count)
VALUES 
  (gen_random_uuid(), 'test_001', '测试用户1', '华东', '{"start_date": "2024-01-01", "end_date": "2024-01-31", "remark": "2024年1月"}', 100, 50, 30, 10),
  (gen_random_uuid(), 'test_002', '测试用户2', '华南', '{"start_date": "2024-02-01", "end_date": "2024-02-29", "remark": "2024年2月"}', 200, 80, 60, 15);

INSERT INTO public.employee_response_data (id, employee_uid, time_range, score_15s_response, rate_15s_response, avg_response_time)
VALUES 
  (gen_random_uuid(), 'test_001', '{"start_date": "2024-01-01", "end_date": "2024-01-31", "remark": "2024年1月"}', 85.5, '85%', 2.5),
  (gen_random_uuid(), 'test_002', '{"start_date": "2024-02-01", "end_date": "2024-02-29", "remark": "2024年2月"}', 92.0, '92%', 1.8);

-- 2. 测试函数调用
SELECT * FROM public.get_employee_join_data(
  search_query := '测试',
  start_date := '2024-01-01',
  end_date := '2024-02-29',
  page_size := 10
);

-- 3. 测试时间范围筛选
SELECT * FROM public.get_employee_join_data(
  time_range_remark := '2024年1月',
  page_size := 10
);

-- 4. 测试数值范围筛选
SELECT * FROM public.get_employee_join_data(
  min_interactions := 150,
  max_interactions := 250,
  page_size := 10
);

-- 5. 测试响应时间筛选
SELECT * FROM public.get_employee_join_data(
  min_response_time := 2.0,
  max_response_time := 3.0,
  page_size := 10
);

-- 6. 清理测试数据
DELETE FROM public.employee_response_data WHERE employee_uid IN ('test_001', 'test_002');
DELETE FROM public.employee_leads_data WHERE account_id IN ('test_001', 'test_002');
