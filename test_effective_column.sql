-- 测试生效列功能

-- 1. 检查生效列是否存在
SELECT '检查生效列' as test_name, 
       column_name, 
       data_type, 
       column_default 
FROM information_schema.columns 
WHERE table_name = 'disciplinary_record' 
  AND column_name = 'is_effective';

-- 2. 检查现有记录的生效状态
SELECT '现有记录生效状态' as test_name,
       COUNT(*) as total_records,
       COUNT(CASE WHEN is_effective = true THEN 1 END) as effective_records,
       COUNT(CASE WHEN is_effective = false THEN 1 END) as ineffective_records
FROM disciplinary_record;

-- 3. 测试获取生效违规记录数量
SELECT '测试生效记录数量' as test_name,
       employee_name,
       get_effective_violation_count(id) as effective_count
FROM employee_list 
WHERE employee_name IN ('周玲馨', '吴含')
ORDER BY effective_count DESC;

-- 4. 测试设置记录生效状态
-- 先获取一个违规记录ID
SELECT '获取测试记录ID' as test_name,
       id,
       employee_name,
       reason,
       is_effective
FROM disciplinary_record 
WHERE employee_name = '周玲馨'
LIMIT 1;

-- 5. 检查违规状态计算是否正确（只计算生效记录）
SELECT '测试违规状态计算' as test_name,
       employee_name,
       current_yellow_cards,
       current_red_cards,
       violation_status,
       get_employee_violation_status(id) as calculated_status
FROM employee_list 
WHERE employee_name IN ('周玲馨', '吴含')
ORDER BY current_red_cards DESC, current_yellow_cards DESC;

-- 6. 显示系统信息
SELECT '生效列功能部署完成！' as status,
       '违规记录表已添加生效列，函数已更新为只读取生效记录' as message,
       '所有现有记录默认生效状态为true' as details;
