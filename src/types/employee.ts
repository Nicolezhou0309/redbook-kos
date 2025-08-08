export interface EmployeeResponseData {
  id: string;
  employee_name: string;
  employee_uid: string;
  score_15s_response: number;
  score_30s_response: number;
  score_1min_response: number;
  score_1hour_timeout: number;
  score_avg_response_time: number;
  rate_15s_response: string;
  rate_30s_response: string;
  rate_1min_response: string;
  rate_1hour_timeout: string;
  avg_response_time: number;
  user_rating_score: number;
  time_range: string;
  created_at: string;
  updated_at: string;
}

export interface EmployeeResponseDataForm {
  employee_name: string;
  employee_uid: string;
  score_15s_response: number;
  score_30s_response: number;
  score_1min_response: number;
  score_1hour_timeout: number;
  score_avg_response_time: number;
  rate_15s_response: string;
  rate_30s_response: string;
  rate_1min_response: string;
  rate_1hour_timeout: string;
  avg_response_time: number;
  user_rating_score: number;
  time_range: string;
}

// 员工笔记数据类型定义
export interface EmployeeNotesData {
  id: string;
  // 基础信息
  publish_time: string | null;
  note_source: string | null;
  note_type: string | null;
  note_title: string | null;
  note_id: string;
  note_link: string | null;
  creator_name: string | null;
  creator_id: string | null;
  follower_count: number | null;
  note_status: string | null;
  custom_tags: string | null;
  product_binding_status: string | null;
  blogger_category: string | null;
  blogger_quotation: number | null;
  service_fee: number | null;
  content_tags: string | null;
  is_promoted: string | null;
  employee_region: string | null;
  employee_name: string | null;
  
  // 地域分布字段
  region_province_top1: string | null;
  region_province_top2: string | null;
  region_province_top3: string | null;
  region_city_top1: string | null;
  region_city_top2: string | null;
  region_city_top3: string | null;
  user_interest_top1: string | null;
  user_interest_top2: string | null;
  user_interest_top3: string | null;
  
  // 基础流量字段
  read_uv: number | null;
  like_count: number | null;
  comment_count: number | null;
  collect_count: number | null;
  follow_count: number | null;
  share_count: number | null;
  read_unit_price: number | null;
  interaction_unit_price: number | null;
  
  // 总流量效果字段
  total_exposure_count: number | null;
  total_exposure_ranking: string | null;
  total_read_count: number | null;
  total_read_ranking: string | null;
  total_interaction_count: number | null;
  total_interaction_ranking: string | null;
  total_interaction_rate: number | null;
  total_interaction_rate_ranking: string | null;
  total_read_rate: number | null;
  total_read_rate_ranking: string | null;
  avg_read_duration: number | null;
  three_sec_read_rate: number | null;
  five_sec_video_completion_rate: number | null;
  video_completion_rate: number | null;
  
  // 自然流量效果字段
  natural_exposure_count: number | null;
  natural_exposure_ranking: string | null;
  natural_read_count: number | null;
  natural_read_ranking: string | null;
  natural_read_rate: number | null;
  natural_read_rate_ranking: string | null;
  
  // 推广流量效果字段
  promotion_total_exposure_count: number | null;
  promotion_total_read_count: number | null;
  bidding_promotion_exposure_count: number | null;
  bidding_promotion_exposure_ranking: string | null;
  bidding_promotion_click_count: number | null;
  bidding_promotion_click_ranking: string | null;
  bidding_promotion_click_rate: number | null;
  bidding_promotion_click_rate_ranking: string | null;
  bidding_promotion_interaction_count: number | null;
  bidding_promotion_interaction_ranking: string | null;
  bidding_promotion_interaction_rate: number | null;
  bidding_promotion_interaction_rate_ranking: string | null;
  
  // 其他推广字段
  bidding_info_stream_exposure_count: number | null;
  bidding_info_stream_click_count: number | null;
  bidding_info_stream_click_rate: number | null;
  bidding_info_stream_interaction_count: number | null;
  bidding_info_stream_interaction_rate: number | null;
  bidding_video_stream_exposure_count: number | null;
  bidding_video_stream_click_count: number | null;
  bidding_video_stream_click_rate: number | null;
  bidding_video_stream_interaction_count: number | null;
  bidding_video_stream_interaction_rate: number | null;
  bidding_search_exposure_count: number | null;
  bidding_search_click_count: number | null;
  bidding_search_click_rate: number | null;
  bidding_search_interaction_count: number | null;
  bidding_search_interaction_rate: number | null;
  brand_ad_exposure_count: number | null;
  brand_ad_click_count: number | null;
  brand_ad_click_rate: number | null;
  
  // 转化指标字段
  seven_day_payment_orders: number | null;
  seven_day_payment_amount: number | null;
  seven_day_payment_conversion_rate: number | null;
  seven_day_payment_roi: number | null;
  live_room_valid_views: number | null;
  store_visits: number | null;
  product_visitors: number | null;
  product_add_to_cart: number | null;
  one_day_payment_conversion_rate: number | null;
  form_submissions: number | null;
  private_message_consultations: number | null;
  private_message_openings: number | null;
  private_message_leads: number | null;
  form_conversion_rate: number | null;
  
  // 加热推广字段
  heating_boost_exposure_count: number | null;
  heating_boost_click_count: number | null;
  heating_boost_click_rate: number | null;
  heating_boost_private_message_count: number | null;
  heating_boost_private_message_rate: number | null;
  heating_boost_lead_count: number | null;
  heating_boost_lead_rate: number | null;
  
  // 跨域字段
  cross_domain_exposure_count: number | null;
  cross_domain_click_count: number | null;
  cross_domain_click_rate: number | null;
  cross_domain_private_message_count: number | null;
  cross_domain_private_message_rate: number | null;
  cross_domain_lead_count: number | null;
  cross_domain_lead_rate: number | null;
  cross_domain_opening_count: number | null;
  cross_domain_opening_rate: number | null;
  cross_domain_retention_count: number | null;
  cross_domain_retention_rate: number | null;
  cross_domain_form_lead_count: number | null;
  cross_domain_form_lead_rate: number | null;
  cross_domain_form_opening_count: number | null;
  cross_domain_form_opening_rate: number | null;
  cross_domain_form_retention_count: number | null;
  cross_domain_form_retention_rate: number | null;
  cross_domain_total_lead_count: number | null;
  cross_domain_total_lead_rate: number | null;
  cross_domain_total_opening_count: number | null;
  cross_domain_total_opening_rate: number | null;
  cross_domain_total_retention_count: number | null;
  cross_domain_total_retention_rate: number | null;
  cross_domain_heating_boost_exposure_count: number | null;
  cross_domain_heating_boost_click_count: number | null;
  cross_domain_heating_boost_click_rate: number | null;
  cross_domain_heating_boost_private_message_count: number | null;
  cross_domain_heating_boost_private_message_rate: number | null;
  cross_domain_heating_boost_lead_count: number | null;
  cross_domain_heating_boost_lead_rate: number | null;
  cross_domain_heating_boost_opening_count: number | null;
  cross_domain_heating_boost_opening_rate: number | null;
  cross_domain_heating_boost_retention_count: number | null;
  cross_domain_heating_boost_retention_rate: number | null;
  
  // 行业信息
  industry_info: string | null;
  
  // 时间戳
  created_at: string;
  updated_at: string;
}

export interface EmployeeNotesDataForm {
  // 基础信息
  publish_time: string | null;
  note_source: string | null;
  note_type: string | null;
  note_title: string | null;
  note_id: string;
  note_link: string | null;
  creator_name: string | null;
  creator_id: string | null;
  follower_count: number | null;
  note_status: string | null;
  custom_tags: string | null;
  product_binding_status: string | null;
  blogger_category: string | null;
  blogger_quotation: number | null;
  service_fee: number | null;
  content_tags: string | null;
  is_promoted: string | null;
  employee_region: string | null;
  employee_name: string | null;
  
  // 地域分布字段
  region_province_top1: string | null;
  region_province_top2: string | null;
  region_province_top3: string | null;
  region_city_top1: string | null;
  region_city_top2: string | null;
  region_city_top3: string | null;
  user_interest_top1: string | null;
  user_interest_top2: string | null;
  user_interest_top3: string | null;
  
  // 基础流量字段
  read_uv: number | null;
  like_count: number | null;
  comment_count: number | null;
  collect_count: number | null;
  follow_count: number | null;
  share_count: number | null;
  read_unit_price: number | null;
  interaction_unit_price: number | null;
  
  // 总流量效果字段
  total_exposure_count: number | null;
  total_exposure_ranking: string | null;
  total_read_count: number | null;
  total_read_ranking: string | null;
  total_interaction_count: number | null;
  total_interaction_ranking: string | null;
  total_interaction_rate: number | null;
  total_interaction_rate_ranking: string | null;
  total_read_rate: number | null;
  total_read_rate_ranking: string | null;
  avg_read_duration: number | null;
  three_sec_read_rate: number | null;
  five_sec_video_completion_rate: number | null;
  video_completion_rate: number | null;
  
  // 自然流量效果字段
  natural_exposure_count: number | null;
  natural_exposure_ranking: string | null;
  natural_read_count: number | null;
  natural_read_ranking: string | null;
  natural_read_rate: number | null;
  natural_read_rate_ranking: string | null;
  
  // 推广流量效果字段
  promotion_total_exposure_count: number | null;
  promotion_total_read_count: number | null;
  bidding_promotion_exposure_count: number | null;
  bidding_promotion_exposure_ranking: string | null;
  bidding_promotion_click_count: number | null;
  bidding_promotion_click_ranking: string | null;
  bidding_promotion_click_rate: number | null;
  bidding_promotion_click_rate_ranking: string | null;
  bidding_promotion_interaction_count: number | null;
  bidding_promotion_interaction_ranking: string | null;
  bidding_promotion_interaction_rate: number | null;
  bidding_promotion_interaction_rate_ranking: string | null;
  
  // 其他推广字段
  bidding_info_stream_exposure_count: number | null;
  bidding_info_stream_click_count: number | null;
  bidding_info_stream_click_rate: number | null;
  bidding_info_stream_interaction_count: number | null;
  bidding_info_stream_interaction_rate: number | null;
  bidding_video_stream_exposure_count: number | null;
  bidding_video_stream_click_count: number | null;
  bidding_video_stream_click_rate: number | null;
  bidding_video_stream_interaction_count: number | null;
  bidding_video_stream_interaction_rate: number | null;
  bidding_search_exposure_count: number | null;
  bidding_search_click_count: number | null;
  bidding_search_click_rate: number | null;
  bidding_search_interaction_count: number | null;
  bidding_search_interaction_rate: number | null;
  brand_ad_exposure_count: number | null;
  brand_ad_click_count: number | null;
  brand_ad_click_rate: number | null;
  
  // 转化指标字段
  seven_day_payment_orders: number | null;
  seven_day_payment_amount: number | null;
  seven_day_payment_conversion_rate: number | null;
  seven_day_payment_roi: number | null;
  live_room_valid_views: number | null;
  store_visits: number | null;
  product_visitors: number | null;
  product_add_to_cart: number | null;
  one_day_payment_conversion_rate: number | null;
  form_submissions: number | null;
  private_message_consultations: number | null;
  private_message_openings: number | null;
  private_message_leads: number | null;
  form_conversion_rate: number | null;
  
  // 加热推广字段
  heating_boost_exposure_count: number | null;
  heating_boost_click_count: number | null;
  heating_boost_click_rate: number | null;
  heating_boost_private_message_count: number | null;
  heating_boost_private_message_rate: number | null;
  heating_boost_lead_count: number | null;
  heating_boost_lead_rate: number | null;
  
  // 跨域字段
  cross_domain_exposure_count: number | null;
  cross_domain_click_count: number | null;
  cross_domain_click_rate: number | null;
  cross_domain_private_message_count: number | null;
  cross_domain_private_message_rate: number | null;
  cross_domain_lead_count: number | null;
  cross_domain_lead_rate: number | null;
  cross_domain_opening_count: number | null;
  cross_domain_opening_rate: number | null;
  cross_domain_retention_count: number | null;
  cross_domain_retention_rate: number | null;
  cross_domain_form_lead_count: number | null;
  cross_domain_form_lead_rate: number | null;
  cross_domain_form_opening_count: number | null;
  cross_domain_form_opening_rate: number | null;
  cross_domain_form_retention_count: number | null;
  cross_domain_form_retention_rate: number | null;
  cross_domain_total_lead_count: number | null;
  cross_domain_total_lead_rate: number | null;
  cross_domain_total_opening_count: number | null;
  cross_domain_total_opening_rate: number | null;
  cross_domain_total_retention_count: number | null;
  cross_domain_total_retention_rate: number | null;
  cross_domain_heating_boost_exposure_count: number | null;
  cross_domain_heating_boost_click_count: number | null;
  cross_domain_heating_boost_click_rate: number | null;
  cross_domain_heating_boost_private_message_count: number | null;
  cross_domain_heating_boost_private_message_rate: number | null;
  cross_domain_heating_boost_lead_count: number | null;
  cross_domain_heating_boost_lead_rate: number | null;
  cross_domain_heating_boost_opening_count: number | null;
  cross_domain_heating_boost_opening_rate: number | null;
  cross_domain_heating_boost_retention_count: number | null;
  cross_domain_heating_boost_retention_rate: number | null;
  
  // 行业信息
  industry_info: string | null;
}

// 违规记录数据类型定义（只记录黄牌）
export interface DisciplinaryRecord {
  id: string;
  employee_name: string;
  reason: string;
  type: string | null;
  created_at: string;
  employee_id: string | null;
  
  // 来源字段
  source_type: string | null; // 'manual', 'import', 'auto'
  source_table: string | null; // 原始数据表名
  source_record_id: string | null; // 原始记录ID
  source_time_range: any | null; // JSONB格式的时间范围
  source_batch_id: string | null; // 批量导入批次ID
  source_file_name: string | null; // 导入文件名
  source_import_time: string | null; // 导入时间
  source_metadata: any | null; // 额外来源信息
  
  // 生效状态字段
  is_effective?: boolean; // 记录是否生效，默认为true
}

export interface DisciplinaryRecordForm {
  employee_name: string;
  reason: string;
  type?: string;
  employee_id?: string;
  
  // 来源字段
  source_type?: string;
  source_table?: string;
  source_record_id?: string;
  source_time_range?: any;
  source_batch_id?: string;
  source_file_name?: string;
  source_import_time?: string | null;
  source_metadata?: any;
  
  // 生效状态字段
  is_effective?: boolean;
}