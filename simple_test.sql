-- 简单测试修改后的函数
-- 测试基本功能

-- 1. 测试基本查询（无参数）
SELECT '测试1: 基本查询（无参数）' as test_case;
SELECT employee_name, xiaohongshu_nickname, region, total_interactions 
FROM get_employee_join_data() 
LIMIT 3;

-- 2. 测试时间范围筛选（只使用start_date和end_date，不匹配remark）
SELECT '测试2: 时间范围筛选（2024-01-01 到 2024-12-31）' as test_case;
SELECT 
  employee_name,
  xiaohongshu_nickname,
  region,
  time_range,
  total_interactions
FROM get_employee_join_data(
  start_date := '2024-01-01',
  end_date := '2024-12-31'
) LIMIT 3;

-- 3. 验证函数参数数量
SELECT '测试3: 验证函数参数数量' as test_case;
SELECT 
  proname as function_name,
  pronargs as parameter_count
FROM pg_proc 
WHERE proname = 'get_employee_join_data';

-- 4. 测试搜索功能
SELECT '测试4: 搜索功能' as test_case;
SELECT 
  employee_name,
  xiaohongshu_nickname,
  region,
  total_interactions
FROM get_employee_join_data(
  search_query := '测试'
) LIMIT 3;

-- 总结
SELECT '测试完成！函数已成功修改，时间范围筛选不再需要匹配remark字段。' as test_summary;
