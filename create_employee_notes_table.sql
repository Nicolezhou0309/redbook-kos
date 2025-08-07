-- 创建员工笔记数据表
CREATE TABLE IF NOT EXISTS employee_notes_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    publish_time TIMESTAMP WITH TIME ZONE,
    note_source VARCHAR(50),
    note_type VARCHAR(50),
    note_title TEXT,
    note_id VARCHAR(255) NOT NULL,
    note_link TEXT,
    creator_name VARCHAR(255),
    creator_id VARCHAR(255),
    follower_count INTEGER DEFAULT 0,
    note_status VARCHAR(50),
    custom_tags TEXT,
    product_binding_status VARCHAR(50),
    blogger_category VARCHAR(100),
    blogger_quotation DECIMAL(10,2) DEFAULT 0.00,
    service_fee DECIMAL(10,2) DEFAULT 0.00,
    content_tags TEXT,
    is_promoted VARCHAR(10),
    employee_region VARCHAR(255),
    employee_name VARCHAR(255),
    region_province_top1 VARCHAR(100),
    region_province_top2 VARCHAR(100),
    region_province_top3 VARCHAR(100),
    region_city_top1 VARCHAR(100),
    region_city_top2 VARCHAR(100),
    region_city_top3 VARCHAR(100),
    user_interest_top1 VARCHAR(100),
    user_interest_top2 VARCHAR(100),
    user_interest_top3 VARCHAR(100),
    read_uv INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    collect_count INTEGER DEFAULT 0,
    follow_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    read_unit_price DECIMAL(10,4) DEFAULT 0.0000,
    interaction_unit_price DECIMAL(10,4) DEFAULT 0.0000,
    total_exposure_count INTEGER DEFAULT 0,
    total_exposure_ranking VARCHAR(50),
    total_read_count INTEGER DEFAULT 0,
    total_read_ranking VARCHAR(50),
    total_interaction_count INTEGER DEFAULT 0,
    total_interaction_ranking VARCHAR(50),
    total_interaction_rate DECIMAL(5,2) DEFAULT 0.00,
    total_interaction_rate_ranking VARCHAR(50),
    total_read_rate DECIMAL(5,2) DEFAULT 0.00,
    total_read_rate_ranking VARCHAR(50),
    avg_read_duration DECIMAL(5,2) DEFAULT 0.00,
    three_sec_read_rate DECIMAL(5,2) DEFAULT 0.00,
    five_sec_video_completion_rate DECIMAL(5,2) DEFAULT 0.00,
    video_completion_rate DECIMAL(5,2) DEFAULT 0.00,
    natural_exposure_count INTEGER DEFAULT 0,
    natural_exposure_ranking VARCHAR(50),
    natural_read_count INTEGER DEFAULT 0,
    natural_read_ranking VARCHAR(50),
    natural_read_rate DECIMAL(5,2) DEFAULT 0.00,
    natural_read_rate_ranking VARCHAR(50),
    promotion_total_exposure_count INTEGER DEFAULT 0,
    promotion_total_read_count INTEGER DEFAULT 0,
    bidding_promotion_exposure_count INTEGER DEFAULT 0,
    bidding_promotion_exposure_ranking VARCHAR(50),
    bidding_promotion_click_count INTEGER DEFAULT 0,
    bidding_promotion_click_ranking VARCHAR(50),
    bidding_promotion_click_rate DECIMAL(5,2) DEFAULT 0.00,
    bidding_promotion_click_rate_ranking VARCHAR(50),
    bidding_promotion_interaction_count INTEGER DEFAULT 0,
    bidding_promotion_interaction_ranking VARCHAR(50),
    bidding_promotion_interaction_rate DECIMAL(5,2) DEFAULT 0.00,
    bidding_promotion_interaction_rate_ranking VARCHAR(50),
    bidding_info_stream_exposure_count INTEGER DEFAULT 0,
    bidding_info_stream_click_count INTEGER DEFAULT 0,
    bidding_info_stream_click_rate DECIMAL(5,2) DEFAULT 0.00,
    bidding_info_stream_interaction_count INTEGER DEFAULT 0,
    bidding_info_stream_interaction_rate DECIMAL(5,2) DEFAULT 0.00,
    bidding_video_stream_exposure_count INTEGER DEFAULT 0,
    bidding_video_stream_click_count INTEGER DEFAULT 0,
    bidding_video_stream_click_rate DECIMAL(5,2) DEFAULT 0.00,
    bidding_video_stream_interaction_count INTEGER DEFAULT 0,
    bidding_video_stream_interaction_rate DECIMAL(5,2) DEFAULT 0.00,
    bidding_search_exposure_count INTEGER DEFAULT 0,
    bidding_search_click_count INTEGER DEFAULT 0,
    bidding_search_click_rate DECIMAL(5,2) DEFAULT 0.00,
    bidding_search_interaction_count INTEGER DEFAULT 0,
    bidding_search_interaction_rate DECIMAL(5,2) DEFAULT 0.00,
    brand_ad_exposure_count INTEGER DEFAULT 0,
    brand_ad_click_count INTEGER DEFAULT 0,
    brand_ad_click_rate DECIMAL(5,2) DEFAULT 0.00,
    seven_day_payment_orders INTEGER DEFAULT 0,
    seven_day_payment_amount DECIMAL(10,2) DEFAULT 0.00,
    seven_day_payment_conversion_rate DECIMAL(5,2) DEFAULT 0.00,
    seven_day_payment_roi DECIMAL(5,2) DEFAULT 0.00,
    live_room_valid_views INTEGER DEFAULT 0,
    store_visits INTEGER DEFAULT 0,
    product_visitors INTEGER DEFAULT 0,
    product_add_to_cart INTEGER DEFAULT 0,
    one_day_payment_conversion_rate DECIMAL(5,2) DEFAULT 0.00,
    form_submissions INTEGER DEFAULT 0,
    private_message_consultations INTEGER DEFAULT 0,
    private_message_openings INTEGER DEFAULT 0,
    private_message_leads INTEGER DEFAULT 0,
    form_conversion_rate DECIMAL(5,2) DEFAULT 0.00,
    heating_boost_exposure_count INTEGER DEFAULT 0,
    heating_boost_click_count INTEGER DEFAULT 0,
    heating_boost_click_rate DECIMAL(5,2) DEFAULT 0.00,
    heating_boost_private_message_count INTEGER DEFAULT 0,
    heating_boost_private_message_rate DECIMAL(5,2) DEFAULT 0.00,
    heating_boost_lead_count INTEGER DEFAULT 0,
    heating_boost_lead_rate DECIMAL(5,2) DEFAULT 0.00,
    cross_domain_exposure_count INTEGER DEFAULT 0,
    cross_domain_click_count INTEGER DEFAULT 0,
    cross_domain_click_rate DECIMAL(5,2) DEFAULT 0.00,
    cross_domain_private_message_count INTEGER DEFAULT 0,
    cross_domain_private_message_rate DECIMAL(5,2) DEFAULT 0.00,
    cross_domain_lead_count INTEGER DEFAULT 0,
    cross_domain_lead_rate DECIMAL(5,2) DEFAULT 0.00,
    cross_domain_opening_count INTEGER DEFAULT 0,
    cross_domain_opening_rate DECIMAL(5,2) DEFAULT 0.00,
    cross_domain_retention_count INTEGER DEFAULT 0,
    cross_domain_retention_rate DECIMAL(5,2) DEFAULT 0.00,
    cross_domain_form_lead_count INTEGER DEFAULT 0,
    cross_domain_form_lead_rate DECIMAL(5,2) DEFAULT 0.00,
    cross_domain_form_opening_count INTEGER DEFAULT 0,
    cross_domain_form_opening_rate DECIMAL(5,2) DEFAULT 0.00,
    cross_domain_form_retention_count INTEGER DEFAULT 0,
    cross_domain_form_retention_rate DECIMAL(5,2) DEFAULT 0.00,
    cross_domain_total_lead_count INTEGER DEFAULT 0,
    cross_domain_total_lead_rate DECIMAL(5,2) DEFAULT 0.00,
    cross_domain_total_opening_count INTEGER DEFAULT 0,
    cross_domain_total_opening_rate DECIMAL(5,2) DEFAULT 0.00,
    cross_domain_total_retention_count INTEGER DEFAULT 0,
    cross_domain_total_retention_rate DECIMAL(5,2) DEFAULT 0.00,
    cross_domain_heating_boost_exposure_count INTEGER DEFAULT 0,
    cross_domain_heating_boost_click_count INTEGER DEFAULT 0,
    cross_domain_heating_boost_click_rate DECIMAL(5,2) DEFAULT 0.00,
    cross_domain_heating_boost_private_message_count INTEGER DEFAULT 0,
    cross_domain_heating_boost_private_message_rate DECIMAL(5,2) DEFAULT 0.00,
    cross_domain_heating_boost_lead_count INTEGER DEFAULT 0,
    cross_domain_heating_boost_lead_rate DECIMAL(5,2) DEFAULT 0.00,
    cross_domain_heating_boost_opening_count INTEGER DEFAULT 0,
    cross_domain_heating_boost_opening_rate DECIMAL(5,2) DEFAULT 0.00,
    cross_domain_heating_boost_retention_count INTEGER DEFAULT 0,
    cross_domain_heating_boost_retention_rate DECIMAL(5,2) DEFAULT 0.00,
    industry_info TEXT,
    raw_excel_data JSONB, -- 存储所有原始Excel数据
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_employee_notes_note_id ON employee_notes_data(note_id);
CREATE INDEX IF NOT EXISTS idx_employee_notes_employee_name ON employee_notes_data(employee_name);
CREATE INDEX IF NOT EXISTS idx_employee_notes_creator_id ON employee_notes_data(creator_id);
CREATE INDEX IF NOT EXISTS idx_employee_notes_publish_time ON employee_notes_data(publish_time DESC);
CREATE INDEX IF NOT EXISTS idx_employee_notes_created_at ON employee_notes_data(created_at DESC);

-- 创建唯一约束，防止重复数据
CREATE UNIQUE INDEX IF NOT EXISTS idx_employee_notes_unique 
ON employee_notes_data(note_id);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_employee_notes_updated_at 
    BEFORE UPDATE ON employee_notes_data 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 添加表注释
COMMENT ON TABLE employee_notes_data IS '员工笔记数据表';
COMMENT ON COLUMN employee_notes_data.publish_time IS '发布时间';
COMMENT ON COLUMN employee_notes_data.note_source IS '笔记来源';
COMMENT ON COLUMN employee_notes_data.note_type IS '笔记类型';
COMMENT ON COLUMN employee_notes_data.note_title IS '笔记标题';
COMMENT ON COLUMN employee_notes_data.note_id IS '笔记ID';
COMMENT ON COLUMN employee_notes_data.note_link IS '笔记链接';
COMMENT ON COLUMN employee_notes_data.creator_name IS '创作者名称';
COMMENT ON COLUMN employee_notes_data.creator_id IS '创作者ID';
COMMENT ON COLUMN employee_notes_data.follower_count IS '粉丝数';
COMMENT ON COLUMN employee_notes_data.note_status IS '笔记状态';
COMMENT ON COLUMN employee_notes_data.custom_tags IS '自定义标签';
COMMENT ON COLUMN employee_notes_data.product_binding_status IS '产品绑定状态';
COMMENT ON COLUMN employee_notes_data.blogger_category IS '博主垂类';
COMMENT ON COLUMN employee_notes_data.blogger_quotation IS '博主报价';
COMMENT ON COLUMN employee_notes_data.service_fee IS '服务费金额';
COMMENT ON COLUMN employee_notes_data.content_tags IS '内容标签';
COMMENT ON COLUMN employee_notes_data.is_promoted IS '是否已推广';
COMMENT ON COLUMN employee_notes_data.employee_region IS '员工所属地域';
COMMENT ON COLUMN employee_notes_data.employee_name IS '员工姓名';
COMMENT ON COLUMN employee_notes_data.like_count IS '点赞数';
COMMENT ON COLUMN employee_notes_data.comment_count IS '评论数';
COMMENT ON COLUMN employee_notes_data.collect_count IS '收藏数';
COMMENT ON COLUMN employee_notes_data.share_count IS '分享数';
COMMENT ON COLUMN employee_notes_data.total_exposure_count IS '总曝光量';
COMMENT ON COLUMN employee_notes_data.total_read_count IS '总阅读量';
COMMENT ON COLUMN employee_notes_data.total_interaction_count IS '总互动量';
COMMENT ON COLUMN employee_notes_data.natural_exposure_count IS '自然曝光量';
COMMENT ON COLUMN employee_notes_data.natural_read_count IS '自然阅读量';
COMMENT ON COLUMN employee_notes_data.promotion_total_exposure_count IS '推广总曝光量';
COMMENT ON COLUMN employee_notes_data.promotion_total_read_count IS '推广总阅读量';
COMMENT ON COLUMN employee_notes_data.private_message_consultations IS '私信咨询数';
COMMENT ON COLUMN employee_notes_data.private_message_openings IS '私信开口数';
COMMENT ON COLUMN employee_notes_data.private_message_leads IS '私信留资数';
COMMENT ON COLUMN employee_notes_data.form_submissions IS '表单提交数';
COMMENT ON COLUMN employee_notes_data.form_conversion_rate IS '表单转化率';
COMMENT ON COLUMN employee_notes_data.created_at IS '创建时间';
COMMENT ON COLUMN employee_notes_data.updated_at IS '更新时间'; 