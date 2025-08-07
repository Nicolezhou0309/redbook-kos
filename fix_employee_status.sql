-- 检查员工状态值分布
-- 此脚本用于查看当前员工状态值的分布情况

-- 1. 查看当前状态值分布
SELECT 
    status,
    COUNT(*) as count
FROM employee_list 
WHERE status IS NOT NULL
GROUP BY status
ORDER BY count DESC;

-- 2. 查看所有员工记录及其状态
SELECT 
    id,
    employee_name,
    employee_uid,
    status,
    created_at
FROM employee_list 
ORDER BY created_at DESC;

-- 3. 统计信息
SELECT 
    COUNT(*) as total_employees,
    COUNT(CASE WHEN status IS NULL THEN 1 END) as null_status_employees,
    COUNT(CASE WHEN status IS NOT NULL THEN 1 END) as has_status_employees
FROM employee_list; 