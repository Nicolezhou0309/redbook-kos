-- 测试修复后的 get_employee_join_data 函数
-- 验证时间范围完全匹配的JOIN逻辑

-- 1. 首先查看修复后的函数结构
SELECT 
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'get_employee_join_data';

-- 2. 测试修复后的函数 - 查看数据是否还有重复
-- 测试场景：查询特定时间范围的员工数据
SELECT 
  employee_name,
  employee_uid,
  time_range,
  response_time_range,
  COUNT(*) as record_count
FROM public.get_employee_join_data(
  time_range_remark := '本周',
  start_date := '2024-01-01',
  end_date := '2024-12-31'
)
GROUP BY 
  employee_name,
  employee_uid,
  time_range,
  response_time_range
HAVING COUNT(*) > 1
ORDER BY record_count DESC;

-- 3. 对比修复前后的数据量
-- 修复前（模拟）：使用原始JOIN逻辑
WITH original_join AS (
  SELECT 
    e.employee_name,
    e.employee_uid,
    eld.time_range,
    erd.time_range as response_time_range
  FROM public.employee_list e
  RIGHT JOIN public.employee_leads_data eld ON e.employee_uid = eld.account_id
  RIGHT JOIN public.employee_response_data erd ON e.employee_uid = erd.employee_uid
  WHERE eld.time_range->>'remark' = '本周'
)
SELECT 
  '修复前' as version,
  COUNT(*) as total_records,
  COUNT(DISTINCT (employee_uid, time_range, response_time_range)) as unique_records
FROM original_join

UNION ALL

-- 修复后：使用修复后的函数
SELECT 
  '修复后' as version,
  COUNT(*) as total_records,
  COUNT(DISTINCT (employee_uid, time_range, response_time_range)) as unique_records
FROM public.get_employee_join_data(time_range_remark := '本周');

-- 4. 验证时间范围完全匹配
-- 检查是否还有时间范围不一致的记录
SELECT 
  '时间范围不一致的记录' as check_type,
  COUNT(*) as count
FROM (
  SELECT 
    eld.employee_uid,
    eld.time_range->>'start_date' as eld_start,
    eld.time_range->>'end_date' as eld_end,
    eld.time_range->>'remark' as eld_remark,
    erd.time_range->>'start_date' as erd_start,
    erd.time_range->>'end_date' as erd_end,
    erd.time_range->>'remark' as erd_remark
  FROM public.employee_leads_data eld
  JOIN public.employee_response_data erd ON eld.employee_uid = erd.employee_uid
  WHERE eld.time_range->>'remark' = '本周'
    AND (
      eld.time_range->>'start_date' != erd.time_range->>'start_date'
      OR eld.time_range->>'end_date' != erd.time_range->>'end_date'
      OR eld.time_range->>'remark' != erd.time_range->>'remark'
    )
) t;

-- 5. 性能测试 - 对比查询时间
-- 注意：实际环境中需要多次运行取平均值
\timing on

-- 修复后的函数查询
SELECT COUNT(*) FROM public.get_employee_join_data(time_range_remark := '本周');

\timing off

-- 6. 数据完整性检查
-- 确保修复后的函数返回的数据与原始表的数据一致
SELECT 
  '数据完整性检查' as check_type,
  COUNT(*) as total_records,
  COUNT(DISTINCT employee_uid) as unique_employees,
  COUNT(DISTINCT leads_id) as unique_leads,
  COUNT(DISTINCT response_id) as unique_responses
FROM public.get_employee_join_data(time_range_remark := '本周');
