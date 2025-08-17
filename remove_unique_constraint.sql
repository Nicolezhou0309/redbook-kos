-- 删除员工线索数据表的唯一约束
-- 这个约束限制了同一个account_id在同一个time_range.remark下只能有一条记录

-- 删除唯一索引约束
DROP INDEX IF EXISTS idx_employee_leads_data_unique;

-- 验证约束是否已删除
SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'employee_leads_data' 
    AND indexname = 'idx_employee_leads_data_unique';

-- 显示当前表的所有索引
SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'employee_leads_data';

-- 注意：删除约束后，同一个account_id可以在同一个time_range.remark下有多条记录
-- 如果需要防止完全重复的数据，建议在应用层面进行更灵活的控制
