-- 测试违规状态系统
-- 这个脚本用于验证部署是否成功

-- 1. 检查是否有员工数据
SELECT '员工总数' as test_name, COUNT(*) as result FROM employee_list;

-- 2. 检查是否有违规记录
SELECT '违规记录总数' as test_name, COUNT(*) as result FROM disciplinary_record;

-- 3. 测试获取员工状态函数（选择第一个员工）
SELECT '测试获取员工状态' as test_name, 
       get_employee_violation_status(id) as result 
FROM employee_list 
LIMIT 1;

-- 4. 测试批量获取状态函数
SELECT '测试批量获取状态' as test_name, 
       get_multiple_employees_violation_status(ARRAY[id]) as result 
FROM employee_list 
LIMIT 1;

-- 5. 检查当前员工状态分布
SELECT '员工状态分布' as test_name,
       violation_status,
       COUNT(*) as count
FROM employee_list 
GROUP BY violation_status
ORDER BY violation_status;

-- 6. 检查黄牌和红牌分布
SELECT '黄牌分布' as test_name,
       current_yellow_cards,
       COUNT(*) as count
FROM employee_list 
GROUP BY current_yellow_cards
ORDER BY current_yellow_cards;

SELECT '红牌分布' as test_name,
       current_red_cards,
       COUNT(*) as count
FROM employee_list 
GROUP BY current_red_cards
ORDER BY current_red_cards;

-- 7. 测试手动刷新函数（选择第一个员工）
SELECT '测试手动刷新状态' as test_name, 
       refresh_employee_violation_status(id) as result 
FROM employee_list 
LIMIT 1;

-- 8. 显示系统信息
SELECT '系统部署完成！' as status,
       '违规状态系统已成功部署到Supabase数据库' as message,
       '所有函数和触发器都已创建' as details;
