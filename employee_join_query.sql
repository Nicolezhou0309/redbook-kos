-- 使用员工表数据，join employee_leads_data以及employee_response_data
-- 使用employee_uid作为外键，都使用right join（完整列出拼表的所有数据）
-- 支持字段多选和灵活排序

-- 字段选择配置（可以通过注释/取消注释来选择需要的字段）
SELECT 
    -- ===== 员工表字段 =====
    -- 基础信息字段
    e.id as employee_id,
    e.employee_name as employee_name,
    e.employee_uid as employee_uid,
    e.status as employee_status,
    e.created_at as employee_created_at,
    
    -- ===== 员工线索数据字段 =====
    -- 基础信息
    eld.id as leads_id,
    eld.xiaohongshu_account_id,
    eld.xiaohongshu_nickname,
    eld.account_id as leads_account_id,
    eld.region,
    eld.tags,
    eld.activation_time,
    
    -- 笔记相关数据
    eld.published_notes_count,
    eld.promoted_notes_count,
    eld.notes_promotion_cost,
    
    -- 互动数据
    eld.total_interactions,
    eld.total_form_leads,
    eld.total_private_message_leads,
    eld.total_private_message_openings,
    eld.total_private_message_leads_kept,
    
    -- 曝光和点击数据
    eld.notes_exposure_count,
    eld.notes_click_count,
    
    -- 时间范围
    eld.time_range as leads_time_range,
    eld.created_at as leads_created_at,
    eld.updated_at as leads_updated_at,
    
    -- ===== 员工回复数据字段 =====
    -- 基础信息
    erd.id as response_id,
    erd.employee_name as response_employee_name,
    erd.employee_uid as response_employee_uid,
    
    -- 响应时间评分
    erd.score_15s_response,
    erd.score_30s_response,
    erd.score_1min_response,
    erd.score_1hour_timeout,
    erd.score_avg_response_time,
    
    -- 响应率
    erd.rate_15s_response,
    erd.rate_30s_response,
    erd.rate_1min_response,
    erd.rate_1hour_timeout,
    
    -- 平均响应时间和用户评分
    erd.avg_response_time,
    erd.user_rating_score,
    
    -- 时间范围
    erd.time_range as response_time_range,
    erd.created_at as response_created_at,
    erd.updated_at as response_updated_at

FROM public.employee
RIGHT JOIN public.employee_leads_data eld ON e.employee_uid = eld.account_id
RIGHT JOIN public.employee_response_data erd ON COALESCE(e.employee_uid, eld.account_id) = erd.employee_uid

-- ===== 排序配置 =====
-- 可以取消注释并修改以下排序选项：

-- 按员工姓名排序（默认）
--ORDER BY 
--    COALESCE(e.employee_name, eld.xiaohongshu_nickname, erd.employee_name),
--    eld.created_at DESC,
--    erd.created_at DESC;

-- 按互动数量排序（取消注释使用）
-- ORDER BY eld.total_interactions DESC NULLS LAST, e.employee_name;

-- 按线索数量排序（取消注释使用）
ORDER BY eld.total_form_leads DESC NULLS LAST, e.employee_name;

-- 按响应时间排序（取消注释使用）
-- ORDER BY erd.avg_response_time ASC NULLS LAST, e.employee_name;

-- 按用户评分排序（取消注释使用）
-- ORDER BY erd.user_rating_score DESC NULLS LAST, e.employee_name;

-- 按创建时间排序（取消注释使用）
-- ORDER BY e.created_at DESC, eld.created_at DESC, erd.created_at DESC;

-- 按地区排序（取消注释使用）
-- ORDER BY eld.region, e.employee_name;

-- ===== 筛选条件配置 =====
-- 可以取消注释并修改以下筛选条件：

-- 只显示有线索数据的员工
-- WHERE eld.id IS NOT NULL

-- 只显示有回复数据的员工
-- WHERE erd.id IS NOT NULL

-- 只显示特定状态的员工
-- WHERE e.status = 'active'

-- 只显示特定地区的员工
-- WHERE eld.region = '北京'

-- 只显示互动数量大于0的员工
-- WHERE eld.total_interactions > 0

-- 只显示响应时间小于30秒的员工
-- WHERE erd.avg_response_time < 30

-- ===== 可选：只查看有完整数据的记录（三个表都有数据）=====
-- 取消注释以下查询来只显示三个表都有数据的记录
/*
SELECT 
    e.id as employee_id,
    e.employee_name,
    e.employee_uid,
    e.status,
    eld.xiaohongshu_nickname,
    eld.account_id as leads_account_id,
    eld.region,
    eld.total_interactions,
    eld.total_form_leads,
    erd.score_15s_response,
    erd.score_30s_response,
    erd.avg_response_time,
    erd.user_rating_score,
    eld.time_range as leads_time_range,
    erd.time_range as response_time_range
FROM public.employee e
INNER JOIN public.employee_leads_data eld ON e.employee_uid = eld.account_id
INNER JOIN public.employee_response_data erd ON e.employee_uid = erd.employee_uid
ORDER BY e.employee_name, eld.created_at DESC;
*/ 