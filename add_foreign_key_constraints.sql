-- 添加外键约束脚本
-- 确保employee_response_data和employee_leads_data表之间的关联关系

-- 首先检查现有的约束
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('employee_response_data', 'employee_leads_data');

-- 添加外键约束（如果不存在）
-- 假设employee_uid和account_id是关联字段

-- 为employee_response_data表添加外键约束
-- 注意：这里需要根据实际的业务逻辑来确定正确的关联字段
-- 如果employee_uid对应employee_leads_data的某个字段，则添加相应的约束

-- 示例：如果employee_uid对应employee_leads_data的account_id
-- ALTER TABLE employee_response_data 
-- ADD CONSTRAINT fk_employee_response_leads 
-- FOREIGN KEY (employee_uid) REFERENCES employee_leads_data(account_id);

-- 或者，如果两个表通过employee_name关联
-- ALTER TABLE employee_response_data 
-- ADD CONSTRAINT fk_employee_response_leads_name 
-- FOREIGN KEY (employee_name) REFERENCES employee_leads_data(employee_name);

-- 创建视图来简化join查询
CREATE OR REPLACE VIEW employee_join_view AS
SELECT 
    er.id,
    er.employee_name,
    er.employee_uid,
    er.score_15s_response,
    er.score_30s_response,
    er.score_1min_response,
    er.score_1hour_timeout,
    er.score_avg_response_time,
    er.rate_15s_response,
    er.rate_30s_response,
    er.rate_1min_response,
    er.rate_1hour_timeout,
    er.avg_response_time,
    er.user_rating_score,
    er.time_range,
    er.created_at,
    er.updated_at,
    el.id as leads_id,
    el.xiaohongshu_account_id,
    el.xiaohongshu_nickname,
    el.account_id,
    el.region,
    el.tags,
    el.activation_time,
    el.published_notes_count,
    el.promoted_notes_count,
    el.notes_promotion_cost,
    el.total_interactions,
    el.total_form_leads,
    el.total_private_message_leads,
    el.total_private_message_openings,
    el.total_private_message_leads_kept,
    el.notes_exposure_count,
    el.notes_click_count,
    el.time_range as leads_time_range,
    el.created_at as leads_created_at,
    el.updated_at as leads_updated_at
FROM employee_response_data er
LEFT JOIN employee_leads_data el ON er.employee_name = el.employee_name 
    AND er.time_range = el.time_range->>'remark';

-- 为视图创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_employee_join_view_employee_name ON employee_join_view(employee_name);
CREATE INDEX IF NOT EXISTS idx_employee_join_view_time_range ON employee_join_view(time_range);
CREATE INDEX IF NOT EXISTS idx_employee_join_view_region ON employee_join_view(region);
CREATE INDEX IF NOT EXISTS idx_employee_join_view_created_at ON employee_join_view(created_at);

-- 创建复合索引
CREATE INDEX IF NOT EXISTS idx_employee_join_view_name_time ON employee_join_view(employee_name, time_range);

-- 添加注释
COMMENT ON VIEW employee_join_view IS '员工回复数据和线索数据的关联视图';
COMMENT ON COLUMN employee_join_view.employee_name IS '员工姓名（关联字段）';
COMMENT ON COLUMN employee_join_view.time_range IS '时间范围（关联字段）'; 