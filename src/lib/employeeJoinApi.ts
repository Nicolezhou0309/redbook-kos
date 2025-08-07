import { supabase } from './supabase'
import type { EmployeeJoinData } from '../utils/filterFunctions'

// 筛选条件类型
export interface JoinFilterParams {
  employee_names?: string[]
  regions?: string[]
  time_ranges?: string[]
  tags?: string[]
  min_score_15s_response?: number
  max_score_15s_response?: number
  min_user_rating_score?: number
  max_user_rating_score?: number
  min_total_interactions?: number
  max_total_interactions?: number
  min_total_form_leads?: number
  max_total_form_leads?: number
  min_published_notes_count?: number
  max_published_notes_count?: number
  min_promoted_notes_count?: number
  max_promoted_notes_count?: number
  min_notes_promotion_cost?: number
  max_notes_promotion_cost?: number
  min_avg_response_time?: number
  max_avg_response_time?: number
}

// 排序选项类型
export type SortField = 
  | 'employee_name' 
  | 'employee_uid' 
  | 'score_15s_response' 
  | 'score_30s_response' 
  | 'score_1min_response' 
  | 'score_1hour_timeout' 
  | 'score_avg_response_time' 
  | 'avg_response_time' 
  | 'user_rating_score' 
  | 'time_range' 
  | 'created_at' 
  | 'updated_at'
  | 'xiaohongshu_account_id' 
  | 'xiaohongshu_nickname' 
  | 'account_id' 
  | 'region' 
  | 'tags' 
  | 'activation_time' 
  | 'published_notes_count' 
  | 'promoted_notes_count' 
  | 'notes_promotion_cost' 
  | 'total_interactions' 
  | 'total_form_leads' 
  | 'total_private_message_leads' 
  | 'total_private_message_openings' 
  | 'total_private_message_leads_kept' 
  | 'notes_exposure_count' 
  | 'notes_click_count'

export type SortOrder = 'asc' | 'desc'

export interface PaginationParams {
  page: number
  pageSize: number
}

export interface JoinResponse {
  success: boolean
  data?: EmployeeJoinData[]
  total?: number
  error?: string
}

// 获取员工联合数据
export const getEmployeeJoinData = async (
  filterParams: JoinFilterParams = {},
  sortField: SortField = 'created_at',
  sortOrder: SortOrder = 'desc',
  pagination: PaginationParams = { page: 1, pageSize: 20 }
): Promise<JoinResponse> => {
  try {
    let query = `
      SELECT 
        e.id as employee_id,
        e.employee_name,
        e.employee_uid,
        e.status as employee_status,
        e.created_at as employee_created_at,
        
        eld.id as leads_id,
        eld.xiaohongshu_account_id,
        eld.xiaohongshu_nickname,
        eld.account_id as leads_account_id,
        eld.region,
        eld.tags,
        eld.activation_time,
        eld.published_notes_count,
        eld.promoted_notes_count,
        eld.notes_promotion_cost,
        eld.total_interactions,
        eld.total_form_leads,
        eld.total_private_message_leads,
        eld.total_private_message_openings,
        eld.total_private_message_leads_kept,
        eld.notes_exposure_count,
        eld.notes_click_count,
        eld.time_range as leads_time_range,
        eld.created_at as leads_created_at,
        eld.updated_at as leads_updated_at,
        
        erd.id as response_id,
        erd.employee_name as response_employee_name,
        erd.employee_uid as response_employee_uid,
        erd.score_15s_response,
        erd.score_30s_response,
        erd.score_1min_response,
        erd.score_1hour_timeout,
        erd.score_avg_response_time,
        erd.rate_15s_response,
        erd.rate_30s_response,
        erd.rate_1min_response,
        erd.rate_1hour_timeout,
        erd.avg_response_time,
        erd.user_rating_score,
        erd.time_range as response_time_range,
        erd.created_at as response_created_at,
        erd.updated_at as response_updated_at
      FROM public.employee_list e
      LEFT JOIN public.employee_leads_data eld ON e.employee_uid = eld.account_id
      LEFT JOIN public.employee_response_data erd ON e.employee_uid = erd.employee_uid
      WHERE 1=1
    `

    const conditions: string[] = []
    const params: any[] = []
    let paramIndex = 1

    // 添加筛选条件
    if (filterParams.employee_names && filterParams.employee_names.length > 0) {
      conditions.push(`e.employee_name = ANY($${paramIndex})`)
      params.push(filterParams.employee_names)
      paramIndex++
    }

    if (filterParams.regions && filterParams.regions.length > 0) {
      conditions.push(`eld.region = ANY($${paramIndex})`)
      params.push(filterParams.regions)
      paramIndex++
    }

    if (filterParams.time_ranges && filterParams.time_ranges.length > 0) {
      conditions.push(`eld.time_range->>'remark' = ANY($${paramIndex})`)
      params.push(filterParams.time_ranges)
      paramIndex++
    }

    if (filterParams.min_score_15s_response !== undefined) {
      conditions.push(`erd.score_15s_response >= $${paramIndex}`)
      params.push(filterParams.min_score_15s_response)
      paramIndex++
    }

    if (filterParams.max_score_15s_response !== undefined) {
      conditions.push(`erd.score_15s_response <= $${paramIndex}`)
      params.push(filterParams.max_score_15s_response)
      paramIndex++
    }

    if (filterParams.min_user_rating_score !== undefined) {
      conditions.push(`erd.user_rating_score >= $${paramIndex}`)
      params.push(filterParams.min_user_rating_score)
      paramIndex++
    }

    if (filterParams.max_user_rating_score !== undefined) {
      conditions.push(`erd.user_rating_score <= $${paramIndex}`)
      params.push(filterParams.max_user_rating_score)
      paramIndex++
    }

    if (filterParams.min_total_interactions !== undefined) {
      conditions.push(`eld.total_interactions >= $${paramIndex}`)
      params.push(filterParams.min_total_interactions)
      paramIndex++
    }

    if (filterParams.max_total_interactions !== undefined) {
      conditions.push(`eld.total_interactions <= $${paramIndex}`)
      params.push(filterParams.max_total_interactions)
      paramIndex++
    }

    if (filterParams.min_total_form_leads !== undefined) {
      conditions.push(`eld.total_form_leads >= $${paramIndex}`)
      params.push(filterParams.min_total_form_leads)
      paramIndex++
    }

    if (filterParams.max_total_form_leads !== undefined) {
      conditions.push(`eld.total_form_leads <= $${paramIndex}`)
      params.push(filterParams.max_total_form_leads)
      paramIndex++
    }

    if (filterParams.min_published_notes_count !== undefined) {
      conditions.push(`eld.published_notes_count >= $${paramIndex}`)
      params.push(filterParams.min_published_notes_count)
      paramIndex++
    }

    if (filterParams.max_published_notes_count !== undefined) {
      conditions.push(`eld.published_notes_count <= $${paramIndex}`)
      params.push(filterParams.max_published_notes_count)
      paramIndex++
    }

    if (filterParams.min_promoted_notes_count !== undefined) {
      conditions.push(`eld.promoted_notes_count >= $${paramIndex}`)
      params.push(filterParams.min_promoted_notes_count)
      paramIndex++
    }

    if (filterParams.max_promoted_notes_count !== undefined) {
      conditions.push(`eld.promoted_notes_count <= $${paramIndex}`)
      params.push(filterParams.max_promoted_notes_count)
      paramIndex++
    }

    if (filterParams.min_notes_promotion_cost !== undefined) {
      conditions.push(`eld.notes_promotion_cost >= $${paramIndex}`)
      params.push(filterParams.min_notes_promotion_cost)
      paramIndex++
    }

    if (filterParams.max_notes_promotion_cost !== undefined) {
      conditions.push(`eld.notes_promotion_cost <= $${paramIndex}`)
      params.push(filterParams.max_notes_promotion_cost)
      paramIndex++
    }

    if (filterParams.min_avg_response_time !== undefined) {
      conditions.push(`erd.avg_response_time >= $${paramIndex}`)
      params.push(filterParams.min_avg_response_time)
      paramIndex++
    }

    if (filterParams.max_avg_response_time !== undefined) {
      conditions.push(`erd.avg_response_time <= $${paramIndex}`)
      params.push(filterParams.max_avg_response_time)
      paramIndex++
    }

    // 添加WHERE条件
    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ')
    }

    // 添加排序
    query += ` ORDER BY ${sortField} ${sortOrder.toUpperCase()}`

    // 添加分页
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    params.push(pagination.pageSize, (pagination.page - 1) * pagination.pageSize)

    // 执行查询
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: query,
      params: params
    })

    if (error) {
      console.error('查询失败:', error)
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      data: data || [],
      total: data?.length || 0
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
export const getFilterOptions = async () => {
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

// 获取统计数据
export const getJoinDataStats = async (_filterParams: JoinFilterParams = {}) => {
  try {
    // 这里可以实现统计数据的查询逻辑
    // 暂时返回模拟数据
    return {
      success: true,
      stats: {
        totalEmployees: 0,
        avgResponseTime: 0,
        avgUserRating: 0,
        avgInteractions: 0
      }
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取统计数据失败'
    }
  }
}