-- 简单测试黄牌筛选功能
-- 测试不同的筛选条件组合

-- 1. 测试基本黄牌筛选（超时率 > 50% AND 私信进线数 > 10）
SELECT 
  '测试1: 超时率>50% AND 私信进线数>10' as test_case,
  COUNT(*) as result_count
FROM get_employee_join_data(
  yellow_card_timeout_rate := 50,
  yellow_card_min_private_message_leads := 10
);

-- 2. 测试笔记数不足筛选（笔记数 < 5）
SELECT 
  '测试2: 笔记数<5' as test_case,
  COUNT(*) as result_count
FROM get_employee_join_data(
  yellow_card_notes_count := 5
);

-- 3. 测试组合条件筛选（超时率>30% AND 私信进线数>5 OR 笔记数<3）
SELECT 
  '测试3: 超时率>30% AND 私信进线数>5 OR 笔记数<3' as test_case,
  COUNT(*) as result_count
FROM get_employee_join_data(
  yellow_card_timeout_rate := 30,
  yellow_card_min_private_message_leads := 5,
  yellow_card_notes_count := 3
);

-- 4. 测试时间范围筛选
SELECT 
  '测试4: 时间范围筛选 2024-01-01 到 2024-12-31' as test_case,
  COUNT(*) as result_count
FROM get_employee_join_data(
  yellow_card_start_date := '2024-01-01',
  yellow_card_end_date := '2024-12-31'
);

-- 5. 测试完整黄牌筛选（时间范围 + 条件组合）
SELECT 
  '测试5: 完整黄牌筛选' as test_case,
  COUNT(*) as result_count
FROM get_employee_join_data(
  yellow_card_timeout_rate := 40,
  yellow_card_min_private_message_leads := 8,
  yellow_card_notes_count := 4,
  yellow_card_start_date := '2024-01-01',
  yellow_card_end_date := '2024-12-31'
);

-- 6. 查看原始数据，了解数据分布
SELECT 
  '数据分布分析' as analysis,
  COUNT(*) as total_records
FROM get_employee_join_data() LIMIT 1;
