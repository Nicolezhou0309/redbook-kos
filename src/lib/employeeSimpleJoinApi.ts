import { supabase } from './supabase'

// 定义简化版join数据的类型
export interface EmployeeSimpleJoinData {
  // 内部唯一标识符，用于React key，允许 employee_id 重复
  _unique_id?: string
  
  // 员工基本信息
  employee_id: string
  employee_name: string
  employee_uid: string
  status: string
  created_at: string
  
  // 线索数据
  leads_id: string
  xiaohongshu_account_id: string
  xiaohongshu_nickname: string
  region: string
  tags: string
  activation_time: string
  published_notes_count: number
  promoted_notes_count: number
  notes_promotion_cost: number
  total_interactions: number
  total_form_leads: number
  total_private_message_leads: number
  total_private_message_openings: number
  total_private_message_leads_kept: number
  notes_exposure_count: number
  notes_click_count: number
  time_range: any
  
  // 响应数据
  response_id: string
  score_15s_response: number
  score_30s_response: number
  score_1min_response: number
  score_1hour_timeout: number
  score_avg_response_time: number
  rate_15s_response: string
  rate_30s_response: string
  rate_1min_response: string
  rate_1hour_timeout: string
  avg_response_time: number
  user_rating_score: number
  response_time_range: any
  
  // 分页信息
  total_count: number
}

// 筛选条件类型
export interface SimpleJoinFilterParams {
  search_query?: string
  filter_employee_name?: string
  filter_employee_uid?: string
  filter_xiaohongshu_nickname?: string
  filter_region?: string
  filter_status?: string
  time_range_remark?: string
  start_date?: string
  end_date?: string
  
  // 数值筛选
  min_interactions?: number
  max_interactions?: number
  min_form_leads?: number
  max_form_leads?: number
  min_private_message_leads?: number
  max_private_message_leads?: number
  min_private_message_openings?: number
  max_private_message_openings?: number
  min_private_message_leads_kept?: number
  max_private_message_leads_kept?: number
  min_notes_exposure_count?: number
  max_notes_exposure_count?: number
  min_notes_click_count?: number
  max_notes_click_count?: number
  min_published_notes_count?: number
  max_published_notes_count?: number
  min_promoted_notes_count?: number
  max_promoted_notes_count?: number
  min_notes_promotion_cost?: number
  max_notes_promotion_cost?: number
  
  // 响应时间筛选
  min_response_time?: number
  max_response_time?: number
  min_user_rating?: number
  max_user_rating?: number
  min_score_15s_response?: number
  max_score_15s_response?: number
  min_score_30s_response?: number
  max_score_30s_response?: number
  min_score_1min_response?: number
  max_score_1min_response?: number
  min_score_1hour_timeout?: number
  max_score_1hour_timeout?: number
  min_score_avg_response_time?: number
  max_score_avg_response_time?: number
  
  // 回复率筛选
  min_rate_15s_response?: number
  max_rate_15s_response?: number
  min_rate_30s_response?: number
  max_rate_30s_response?: number
  min_rate_1min_response?: number
  max_rate_1min_response?: number
  min_rate_1hour_timeout?: number
  max_rate_1hour_timeout?: number
  
  // 黄牌筛选参数
  yellow_card_timeout_rate?: number
  yellow_card_notes_count?: number
  yellow_card_min_private_message_leads?: number
  yellow_card_start_date?: string
  yellow_card_end_date?: string
  

}

// 排序选项类型
export type SortField = 
  | 'employee_name' 
  | 'employee_uid' 
  | 'status' 
  | 'created_at' 
  | 'activation_time'
  | 'xiaohongshu_nickname' 
  | 'region' 
  | 'total_interactions' 
  | 'total_form_leads' 
  | 'total_private_message_leads' 
  | 'total_private_message_openings'
  | 'total_private_message_leads_kept' 
  | 'notes_exposure_count' 
  | 'notes_click_count'
  | 'published_notes_count' 
  | 'promoted_notes_count' 
  | 'notes_promotion_cost'
  | 'avg_response_time' 
  | 'user_rating_score' 
  | 'score_15s_response' 
  | 'score_30s_response'
  | 'score_1min_response' 
  | 'score_1hour_timeout' 
  | 'score_avg_response_time'
  | 'rate_15s_response' 
  | 'rate_30s_response'
  | 'rate_1min_response' 
  | 'rate_1hour_timeout'

export type SortOrder = 'asc' | 'desc'

export interface PaginationParams {
  page: number
  pageSize: number
}

export interface SimpleJoinResponse {
  success: boolean
  data?: EmployeeSimpleJoinData[]
  total?: number
  error?: string
}

// 调用简化版员工联合查询函数
export const getEmployeeSimpleJoinData = async (
  filterParams: SimpleJoinFilterParams = {},
  sortField: SortField = 'employee_name',
  sortOrder: SortOrder = 'asc',
  pagination: PaginationParams = { page: 1, pageSize: 20 }
): Promise<SimpleJoinResponse> => {
  try {
    const {
      search_query,
      filter_employee_name,
      filter_employee_uid,
      filter_xiaohongshu_nickname,
      filter_region,
      filter_status,
      time_range_remark,
      start_date,
      end_date,
      min_interactions,
      max_interactions,
      min_form_leads,
      max_form_leads,
      min_private_message_leads,
      max_private_message_leads,
      min_private_message_openings,
      max_private_message_openings,
      min_private_message_leads_kept,
      max_private_message_leads_kept,
      min_notes_exposure_count,
      max_notes_exposure_count,
      min_notes_click_count,
      max_notes_click_count,
      min_published_notes_count,
      max_published_notes_count,
      min_promoted_notes_count,
      max_promoted_notes_count,
      min_notes_promotion_cost,
      max_notes_promotion_cost,
      min_response_time,
      max_response_time,
      min_user_rating,
      max_user_rating,
      min_score_15s_response,
      max_score_15s_response,
      min_score_30s_response,
      max_score_30s_response,
      min_score_1min_response,
      max_score_1min_response,
      min_score_1hour_timeout,
      max_score_1hour_timeout,
      min_score_avg_response_time,
      max_score_avg_response_time,
      min_rate_15s_response,
      max_rate_15s_response,
      min_rate_30s_response,
      max_rate_30s_response,
      min_rate_1min_response,
      max_rate_1min_response,
      min_rate_1hour_timeout,
      max_rate_1hour_timeout,
      yellow_card_timeout_rate,
      yellow_card_notes_count,
      yellow_card_min_private_message_leads,
      yellow_card_start_date,
      yellow_card_end_date
    } = filterParams

    const { data, error } = await supabase.rpc('get_employee_join_data', {
      search_query: search_query || null,
      filter_employee_name: filter_employee_name || null,
      filter_employee_uid: filter_employee_uid || null,
      filter_xiaohongshu_nickname: filter_xiaohongshu_nickname || null,
      filter_region: filter_region || null,
      filter_status: filter_status || null,
      time_range_remark: time_range_remark || null,
      start_date: start_date || null,
      end_date: end_date || null,
      min_interactions: min_interactions || null,
      max_interactions: max_interactions || null,
      min_form_leads: min_form_leads || null,
      max_form_leads: max_form_leads || null,
      min_private_message_leads: min_private_message_leads || null,
      max_private_message_leads: max_private_message_leads || null,
      min_private_message_openings: min_private_message_openings || null,
      max_private_message_openings: max_private_message_openings || null,
      min_private_message_leads_kept: min_private_message_leads_kept || null,
      max_private_message_leads_kept: max_private_message_leads_kept || null,
      min_notes_exposure_count: min_notes_exposure_count || null,
      max_notes_exposure_count: max_notes_exposure_count || null,
      min_notes_click_count: min_notes_click_count || null,
      max_notes_click_count: max_notes_click_count || null,
      min_published_notes_count: min_published_notes_count || null,
      max_published_notes_count: max_published_notes_count || null,
      min_promoted_notes_count: min_promoted_notes_count || null,
      max_promoted_notes_count: max_promoted_notes_count || null,
      min_notes_promotion_cost: min_notes_promotion_cost || null,
      max_notes_promotion_cost: max_notes_promotion_cost || null,
      min_response_time: min_response_time || null,
      max_response_time: max_response_time || null,
      min_user_rating: min_user_rating || null,
      max_user_rating: max_user_rating || null,
      min_score_15s_response: min_score_15s_response || null,
      max_score_15s_response: max_score_15s_response || null,
      min_score_30s_response: min_score_30s_response || null,
      max_score_30s_response: max_score_30s_response || null,
      min_score_1min_response: min_score_1min_response || null,
      max_score_1min_response: max_score_1min_response || null,
      min_score_1hour_timeout: min_score_1hour_timeout || null,
      max_score_1hour_timeout: max_score_1hour_timeout || null,
      min_score_avg_response_time: min_score_avg_response_time || null,
      max_score_avg_response_time: max_score_avg_response_time || null,
      min_rate_15s_response: min_rate_15s_response || null,
      max_rate_15s_response: max_rate_15s_response || null,
      min_rate_30s_response: min_rate_30s_response || null,
      max_rate_30s_response: max_rate_30s_response || null,
      min_rate_1min_response: min_rate_1min_response || null,
      max_rate_1min_response: max_rate_1min_response || null,
      min_rate_1hour_timeout: min_rate_1hour_timeout || null,
      max_rate_1hour_timeout: max_rate_1hour_timeout || null,
      yellow_card_timeout_rate: yellow_card_timeout_rate || null,
      yellow_card_notes_count: yellow_card_notes_count || null,
      yellow_card_min_private_message_leads: yellow_card_min_private_message_leads || null,
      yellow_card_start_date: yellow_card_start_date || null,
      yellow_card_end_date: yellow_card_end_date || null,
      sort_by: sortField,
      sort_direction: sortOrder,
      page_number: pagination.page,
      page_size: pagination.pageSize
    })

    if (error) {
      console.error('查询失败:', error)
      return {
        success: false,
        error: error.message
      }
    }

    // 处理返回的数据
    const resultData = data || []
    let totalCount = 0

    // 获取总计数（所有行都包含相同的total_count）
    if (resultData.length > 0) {
      totalCount = resultData[0].total_count || 0
      // 不需要移除任何行，因为所有行都是真实数据
    }

    return {
      success: true,
      data: resultData,
      total: totalCount
    }
  } catch (error) {
    console.error('API调用失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }
  }
}

// 获取筛选选项
export const getSimpleFilterOptions = async () => {
  try {
    // 获取地区选项
    const { data: regions } = await supabase
      .from('employee_leads_data')
      .select('region')
      .not('region', 'is', null)

    // 获取状态选项
    const { data: statuses } = await supabase
      .from('employee_list')
      .select('status')
      .not('status', 'is', null)

    // 获取时间范围选项
    const { data: timeRanges } = await supabase
      .from('employee_leads_data')
      .select('time_range')
      .not('time_range', 'is', null)

    return {
      success: true,
      regions: [...new Set(regions?.map(r => r.region) || [])],
      statuses: [...new Set(statuses?.map(s => s.status) || [])],
      timeRanges: [...new Set(timeRanges?.map(t => t.time_range?.remark).filter(Boolean) || [])]
    }
  } catch (error) {
    console.error('获取筛选选项失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取筛选选项失败'
    }
  }
} 

// 批量下载数据（不分页）
export const downloadEmployeeSimpleJoinData = async (
  filterParams: SimpleJoinFilterParams = {},
  sortField: SortField = 'employee_name',
  sortOrder: SortOrder = 'asc'
): Promise<SimpleJoinResponse> => {
  try {
    const {
      search_query,
      filter_employee_name,
      filter_employee_uid,
      filter_xiaohongshu_nickname,
      filter_region,
      filter_status,
      time_range_remark,
      start_date,
      end_date,
      min_interactions,
      max_interactions,
      min_form_leads,
      max_form_leads,
      min_private_message_leads,
      max_private_message_leads,
      min_private_message_openings,
      max_private_message_openings,
      min_private_message_leads_kept,
      max_private_message_leads_kept,
      min_notes_exposure_count,
      max_notes_exposure_count,
      min_notes_click_count,
      max_notes_click_count,
      min_published_notes_count,
      max_published_notes_count,
      min_promoted_notes_count,
      max_promoted_notes_count,
      min_notes_promotion_cost,
      max_notes_promotion_cost,
      min_response_time,
      max_response_time,
      min_user_rating,
      max_user_rating,
      min_score_15s_response,
      max_score_15s_response,
      min_score_30s_response,
      max_score_30s_response,
      min_score_1min_response,
      max_score_1min_response,
      min_score_1hour_timeout,
      max_score_1hour_timeout,
      min_score_avg_response_time,
      max_score_avg_response_time,
      min_rate_15s_response,
      max_rate_15s_response,
      min_rate_30s_response,
      max_rate_30s_response,
      min_rate_1min_response,
      max_rate_1min_response,
      min_rate_1hour_timeout,
      max_rate_1hour_timeout,
      yellow_card_timeout_rate,
      yellow_card_notes_count,
      yellow_card_min_private_message_leads,
      yellow_card_start_date,
      yellow_card_end_date
    } = filterParams

    // 调用RPC函数获取所有数据（不分页）
    const { data, error } = await supabase.rpc('get_employee_join_data', {
      search_query: search_query || null,
      filter_employee_name: filter_employee_name || null,
      filter_employee_uid: filter_employee_uid || null,
      filter_xiaohongshu_nickname: filter_xiaohongshu_nickname || null,
      filter_region: filter_region || null,
      filter_status: filter_status || null,
      time_range_remark: time_range_remark || null,
      start_date: start_date || null,
      end_date: end_date || null,
      min_interactions: min_interactions || null,
      max_interactions: max_interactions || null,
      min_form_leads: min_form_leads || null,
      max_form_leads: max_form_leads || null,
      min_private_message_leads: min_private_message_leads || null,
      max_private_message_leads: max_private_message_leads || null,
      min_private_message_openings: min_private_message_openings || null,
      max_private_message_openings: max_private_message_openings || null,
      min_private_message_leads_kept: min_private_message_leads_kept || null,
      max_private_message_leads_kept: max_private_message_leads_kept || null,
      min_notes_exposure_count: min_notes_exposure_count || null,
      max_notes_exposure_count: max_notes_exposure_count || null,
      min_notes_click_count: min_notes_click_count || null,
      max_notes_click_count: max_notes_click_count || null,
      min_published_notes_count: min_published_notes_count || null,
      max_published_notes_count: max_published_notes_count || null,
      min_promoted_notes_count: min_promoted_notes_count || null,
      max_promoted_notes_count: max_promoted_notes_count || null,
      min_notes_promotion_cost: min_notes_promotion_cost || null,
      max_notes_promotion_cost: max_notes_promotion_cost || null,
      min_response_time: min_response_time || null,
      max_response_time: max_response_time || null,
      min_user_rating: min_user_rating || null,
      max_user_rating: max_user_rating || null,
      min_score_15s_response: min_score_15s_response || null,
      max_score_15s_response: max_score_15s_response || null,
      min_score_30s_response: min_score_30s_response || null,
      max_score_30s_response: max_score_30s_response || null,
      min_score_1min_response: min_score_1min_response || null,
      max_score_1min_response: max_score_1min_response || null,
      min_score_1hour_timeout: min_score_1hour_timeout || null,
      max_score_1hour_timeout: max_score_1hour_timeout || null,
      min_score_avg_response_time: min_score_avg_response_time || null,
      max_score_avg_response_time: max_score_avg_response_time || null,
      min_rate_15s_response: min_rate_15s_response || null,
      max_rate_15s_response: max_rate_15s_response || null,
      min_rate_30s_response: min_rate_30s_response || null,
      max_rate_30s_response: max_rate_30s_response || null,
      min_rate_1min_response: min_rate_1min_response || null,
      max_rate_1min_response: max_rate_1min_response || null,
      min_rate_1hour_timeout: min_rate_1hour_timeout || null,
      max_rate_1hour_timeout: max_rate_1hour_timeout || null,
      yellow_card_timeout_rate: yellow_card_timeout_rate || null,
      yellow_card_notes_count: yellow_card_notes_count || null,
      yellow_card_min_private_message_leads: yellow_card_min_private_message_leads || null,
      yellow_card_start_date: yellow_card_start_date || null,
      yellow_card_end_date: yellow_card_end_date || null,
      sort_by: sortField,
      sort_direction: sortOrder,
      page_number: 1,
      page_size: 999999 // 获取所有数据
    })

    if (error) {
      console.error('下载数据失败:', error)
      return {
        success: false,
        error: error.message
      }
    }

    // 处理返回的数据
    const resultData = data || []
    let totalCount = 0

    // 获取总计数（所有行都包含相同的total_count）
    if (resultData.length > 0) {
      totalCount = resultData[0].total_count || 0
      // 不需要移除任何行，因为所有行都是真实数据
    }

    return {
      success: true,
      data: resultData,
      total: totalCount
    }
  } catch (error) {
    console.error('下载API调用失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }
  }
} 