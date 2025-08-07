-- 修复外键约束问题
-- 此脚本用于解决删除员工时的外键约束冲突

-- 1. 删除现有的外键约束
ALTER TABLE public.employee_operation_log 
DROP CONSTRAINT IF EXISTS fk_employee_operation_log_employee_id;

-- 2. 重新添加外键约束，使用ON DELETE SET NULL
ALTER TABLE public.employee_operation_log 
ADD CONSTRAINT fk_employee_operation_log_employee_id 
FOREIGN KEY (employee_id) REFERENCES public.employee_list(id) ON DELETE SET NULL;

-- 3. 删除现有的触发器
DROP TRIGGER IF EXISTS trigger_employee_operation_log ON public.employee_list;
DROP TRIGGER IF EXISTS trigger_employee_operation_log_insert_update ON public.employee_list;
DROP TRIGGER IF EXISTS trigger_employee_operation_log_delete ON public.employee_list;

-- 4. 重新创建触发器
CREATE TRIGGER trigger_employee_operation_log_insert_update
AFTER INSERT OR UPDATE ON public.employee_list
FOR EACH ROW EXECUTE FUNCTION log_employee_operation();

CREATE TRIGGER trigger_employee_operation_log_delete
BEFORE DELETE ON public.employee_list
FOR EACH ROW EXECUTE FUNCTION log_employee_operation();

-- 5. 验证修复结果
SELECT 
    'Foreign key constraint' as check_type,
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

-- 6. 检查触发器
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'employee_list'
AND trigger_schema = 'public'; 