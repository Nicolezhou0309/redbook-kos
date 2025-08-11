-- 测试修改后的 get_employee_join_data 函数
-- 测试时间范围筛选功能（不再需要匹配remark）

-- 1. 测试基本查询（无参数）
SELECT '测试1: 基本查询（无参数）' as test_case;
SELECT * FROM get_employee_join_data() LIMIT 5;

-- 2. 测试时间范围筛选（只使用start_date和end_date，不匹配remark）
SELECT '测试2: 时间范围筛选（2024-01-01 到 2024-12-31）' as test_case;
SELECT 
  employee_name,
  xiaohongshu_nickname,
  region,
  time_range,
  total_interactions,
  total_form_leads,
  total_private_message_leads
FROM get_employee_join_data(
  start_date := '2024-01-01',
  end_date := '2024-12-31'
) LIMIT 10;

-- 3. 测试只有开始日期
SELECT '测试3: 只有开始日期（2024-06-01之后）' as test_case;
SELECT 
  employee_name,
  xiaohongshu_nickname,
  region,
  time_range,
  total_interactions
FROM get_employee_join_data(
  start_date := '2024-06-01'
) LIMIT 10;

-- 4. 测试只有结束日期
SELECT '测试4: 只有结束日期（2024-06-30之前）' as test_case;
SELECT 
  employee_name,
  xiaohongshu_nickname,
  region,
  time_range,
  total_interactions
FROM get_employee_join_data(
  end_date := '2024-06-30'
) LIMIT 10;

-- 5. 测试组合筛选（时间范围 + 其他条件）
SELECT '测试5: 组合筛选（时间范围 + 地区筛选）' as test_case;
SELECT 
  employee_name,
  xiaohongshu_nickname,
  region,
  time_range,
  total_interactions,
  total_form_leads
FROM get_employee_join_data(
  start_date := '2024-01-01',
  end_date := '2024-12-31',
  filter_region := '华东',
  min_interactions := 100
) LIMIT 10;

-- 6. 测试搜索功能
SELECT '测试6: 搜索功能' as test_case;
SELECT 
  employee_name,
  xiaohongshu_nickname,
  region,
  total_interactions
FROM get_employee_join_data(
  search_query := '测试',
  start_date := '2024-01-01',
  end_date := '2024-12-31'
) LIMIT 10;

-- 7. 测试分页功能
SELECT '测试7: 分页功能（第1页，每页5条）' as test_case;
SELECT 
  employee_name,
  xiaohongshu_nickname,
  region,
  total_interactions,
  total_count
FROM get_employee_join_data(
  start_date := '2024-01-01',
  end_date := '2024-12-31',
  page_number := 1,
  page_size := 5
);

-- 8. 测试排序功能
SELECT '测试8: 按互动数降序排序' as test_case;
SELECT 
  employee_name,
  xiaohongshu_nickname,
  region,
  total_interactions,
  total_form_leads
FROM get_employee_join_data(
  start_date := '2024-01-01',
  end_date := '2024-12-31',
  sort_by := 'total_interactions',
  sort_direction := 'desc',
  page_size := 10
);

-- 9. 测试数值范围筛选
SELECT '测试9: 数值范围筛选（互动数100-1000，表单线索10-100）' as test_case;
SELECT 
  employee_name,
  xiaohongshu_nickname,
  region,
  total_interactions,
  total_form_leads,
  total_private_message_leads
FROM get_employee_join_data(
  start_date := '2024-01-01',
  end_date := '2024-12-31',
  min_interactions := 100,
  max_interactions := 1000,
  min_form_leads := 10,
  max_form_leads := 100
) LIMIT 10;

-- 10. 测试黄牌筛选功能
SELECT '测试10: 黄牌筛选（超时率>0.5 或 笔记数<5）' as test_case;
SELECT 
  employee_name,
  xiaohongshu_nickname,
  region,
  published_notes_count,
  rate_1hour_timeout,
  total_private_message_leads
FROM get_employee_join_data(
  start_date := '2024-01-01',
  end_date := '2024-12-31',
  yellow_card_timeout_rate := 0.5,
  yellow_card_notes_count := 5,
  yellow_card_min_private_message_leads := 10
) LIMIT 10;

-- 11. 验证函数参数数量（确认time_range_remark已被移除）
SELECT '测试11: 验证函数参数数量' as test_case;
SELECT 
  proname as function_name,
  pronargs as parameter_count
FROM pg_proc 
WHERE proname = 'get_employee_join_data';

-- 12. 测试空结果情况
SELECT '测试12: 测试无匹配结果的情况' as test_case;
SELECT 
  employee_name,
  xiaohongshu_nickname,
  region,
  total_interactions
FROM get_employee_join_data(
  start_date := '2030-01-01',
  end_date := '2030-12-31'
);

-- 总结测试结果
SELECT '测试完成！函数已成功修改，时间范围筛选不再需要匹配remark字段。' as test_summary;
