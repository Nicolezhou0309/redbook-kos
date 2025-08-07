-- 检查员工管理数据同步情况
-- 运行此脚本来验证员工列表表和操作日志表的同步状态

-- 1. 检查员工列表表结构
SELECT 
    'employee_list' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'employee_list' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. 检查操作日志表结构
SELECT 
    'employee_operation_log' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'employee_operation_log' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. 检查员工数据统计
SELECT 
    COUNT(*) as total_employees,
    COUNT(CASE WHEN status IS NULL THEN 1 END) as null_status_employees,
    COUNT(CASE WHEN status IS NOT NULL THEN 1 END) as has_status_employees
FROM employee_list;

-- 3.1. 检查状态值分布
SELECT 
    status,
    COUNT(*) as count
FROM employee_list 
WHERE status IS NOT NULL
GROUP BY status
ORDER BY count DESC;

-- 4. 检查操作日志统计
SELECT 
    COUNT(*) as total_logs,
    COUNT(CASE WHEN operation_type = 'create' THEN 1 END) as create_logs,
    COUNT(CASE WHEN operation_type = 'update' THEN 1 END) as update_logs,
    COUNT(CASE WHEN operation_type = 'delete' THEN 1 END) as delete_logs
FROM employee_operation_log;

-- 5. 检查触发器是否存在
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'employee_list'
AND trigger_schema = 'public';

-- 6. 检查视图是否存在
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'employee_operation_history'
AND table_schema = 'public';

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

-- 8. 检查状态值分布
SELECT 
    id,
    employee_name,
    employee_uid,
    status,
    created_at
FROM employee_list 
WHERE status IS NOT NULL
ORDER BY created_at DESC;

-- 9. 检查是否有员工没有对应的操作日志
SELECT 
    el.id,
    el.employee_name,
    el.employee_uid,
    el.created_at
FROM employee_list el
LEFT JOIN employee_operation_log eol ON el.id = eol.employee_id
WHERE eol.id IS NULL;

-- 10. 检查操作日志中的员工信息
SELECT 
    eol.id as log_id,
    eol.employee_id,
    eol.operation_type,
    eol.operation_description,
    el.employee_name,
    el.employee_uid,
    eol.created_at
FROM employee_operation_log eol
LEFT JOIN employee_list el ON eol.employee_id = el.id
ORDER BY eol.created_at DESC
LIMIT 10; 