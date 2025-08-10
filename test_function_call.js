import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nemmkwzijaaadrzwrtyg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lbW1rd3ppamFhYWRyendydHlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzOTk1MTksImV4cCI6MjA2OTk3NTUxOX0.alaL5ekLNXE1c499utZpzvhB2Ix0y9q5bLlXCHJGS-s'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testFunctionCall() {
  console.log('🔍 测试 get_employee_join_data 函数调用...')
  
  try {
    // 使用正确的参数名称调用函数
    const { data, error } = await supabase.rpc('get_employee_join_data', {
      search_query: '周璇',
      filter_employee_name: null,
      filter_employee_uid: null,
      filter_xiaohongshu_nickname: null,
      filter_region: null,
      filter_status: null,
      time_range_remark: null,
      start_date: null,
      end_date: null,
      min_interactions: null,
      max_interactions: null,
      min_form_leads: null,
      max_form_leads: null,
      min_private_message_leads: null,
      max_private_message_leads: null,
      min_private_message_openings: null,
      max_private_message_openings: null,
      min_private_message_leads_kept: null,
      max_private_message_leads_kept: null,
      min_notes_exposure_count: null,
      max_notes_exposure_count: null,
      min_notes_click_count: null,
      max_notes_click_count: null,
      min_published_notes_count: null,
      max_published_notes_count: null,
      min_promoted_notes_count: null,
      max_promoted_notes_count: null,
      min_notes_promotion_cost: null,
      max_notes_promotion_cost: null,
      min_response_time: null,
      max_response_time: null,
      min_user_rating: null,
      max_user_rating: null,
      min_score_15s_response: null,
      max_score_15s_response: null,
      min_score_30s_response: null,
      max_score_30s_response: null,
      min_score_1min_response: null,
      max_score_1min_response: null,
      min_score_1hour_timeout: null,
      max_score_1hour_timeout: null,
      min_score_avg_response_time: null,
      max_score_avg_response_time: null,
      min_rate_15s_response: null,
      max_rate_15s_response: null,
      min_rate_30s_response: null,
      max_rate_30s_response: null,
      min_rate_1min_response: null,
      max_rate_1min_response: null,
      min_rate_1hour_timeout: null,
      max_rate_1hour_timeout: null,
      yellow_card_timeout_rate: null,
      yellow_card_notes_count: null,
      yellow_card_min_private_message_leads: null,
      yellow_card_start_date: null,
      yellow_card_end_date: null,
      sort_by: 'employee_name',
      sort_direction: 'asc',
      page_number: 1,
      page_size: 20
    })
    
    if (error) {
      console.log('❌ 函数调用失败:', error.message)
      console.log('错误详情:', error)
    } else {
      console.log(`✅ 函数调用成功，返回 ${data?.length || 0} 条记录`)
      if (data && data.length > 0) {
        console.log('前几条记录:', data.slice(0, 3).map(r => ({
          employee_name: r.employee_name,
          employee_id: r.employee_id,
          xiaohongshu_nickname: r.xiaohongshu_nickname
        })))
      }
    }
  } catch (error) {
    console.log('❌ 调用函数时出错:', error.message)
  }
}

testFunctionCall()
