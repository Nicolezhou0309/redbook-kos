-- 验证员工管理数据同步修复
-- 此脚本用于确认所有修复都正常工作

-- 1. 检查表结构
SELECT 
    'employee_list' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'employee_list' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 
    'employee_operation_log' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'employee_operation_log' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. 检查外键约束
SELECT 
    constraint_name,
    table_name,
    column_name,
    foreign_table_name,
    foreign_column_name,
    delete_rule
FROM information_schema.referential_constraints rc
JOIN information_schema.key_column_usage kcu ON rc.constraint_name = kcu.constraint_name
WHERE kcu.table_name = 'employee_operation_log'
AND kcu.column_name = 'employee_id';

-- 3. 检查触发器
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'employee_list'
AND trigger_schema = 'public';

-- 4. 检查员工数据统计
SELECT 
    COUNT(*) as total_employees,
    COUNT(CASE WHEN status IS NULL THEN 1 END) as null_status_employees,
    COUNT(CASE WHEN status IS NOT NULL THEN 1 END) as has_status_employees
FROM employee_list;

-- 5. 检查状态值分布
SELECT 
    status,
    COUNT(*) as count
FROM employee_list 
WHERE status IS NOT NULL
GROUP BY status
ORDER BY count DESC;

-- 6. 检查操作日志统计
SELECT 
    COUNT(*) as total_logs,
    COUNT(CASE WHEN operation_type = 'create' THEN 1 END) as create_logs,
    COUNT(CASE WHEN operation_type = 'update' THEN 1 END) as update_logs,
    COUNT(CASE WHEN operation_type = 'delete' THEN 1 END) as delete_logs,
    COUNT(CASE WHEN employee_id IS NULL THEN 1 END) as null_employee_id_logs
FROM employee_operation_log;

-- 7. 检查最近的员工操作记录
SELECT 
    el.employee_name,
    el.employee_uid,
    el.status,
    eol.operation_type,
    eol.operation_description,
    eol.created_at as operation_time
FROM employee_list el
LEFT JOIN employee_operation_log eol ON el.id = eol.employee_id
ORDER BY eol.created_at DESC
LIMIT 10;

-- 8. 检查视图
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'employee_operation_history'
AND table_schema = 'public';

-- 9. 测试结果总结
SELECT 
    '修复状态' as check_item,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'employee_operation_log' 
            AND column_name = 'employee_id' 
            AND is_nullable = 'YES'
        ) THEN '✅ employee_id 字段允许为NULL'
        ELSE '❌ employee_id 字段不允许为NULL'
    END as status
UNION ALL
SELECT 
    '外键约束' as check_item,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.referential_constraints 
            WHERE constraint_name = 'fk_employee_operation_log_employee_id'
            AND delete_rule = 'SET NULL'
        ) THEN '✅ 外键约束设置为ON DELETE SET NULL'
        ELSE '❌ 外键约束设置不正确'
    END as status
UNION ALL
SELECT 
    '触发器' as check_item,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.triggers 
            WHERE event_object_table = 'employee_list'
            AND trigger_schema = 'public'
            AND action_timing = 'BEFORE'
            AND event_manipulation = 'DELETE'
        ) THEN '✅ 删除触发器已创建'
        ELSE '❌ 删除触发器未创建'
    END as status; 