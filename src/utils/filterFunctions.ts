import { EmployeeResponseData, EmployeeNotesData } from '../types/employee';

// 员工线索数据类型定义
export interface EmployeeLeadsData {
  id: string;
  employee_name: string;
  xiaohongshu_account_id: string;
  xiaohongshu_nickname: string;
  account_id: string;
  region: string | null;
  tags: string | null;
  activation_time: string | null;
  published_notes_count: number | null;
  promoted_notes_count: number | null;
  notes_promotion_cost: number | null;
  total_interactions: number | null;
  total_form_leads: number | null;
  total_private_message_leads: number | null;
  total_private_message_openings: number | null;
  total_private_message_leads_kept: number | null;
  notes_exposure_count: number | null;
  notes_click_count: number | null;
  time_range: any;
  created_at: string;
  updated_at: string;
}

// 员工基础数据类型定义
export interface Employee {
  id: string;
  employee_name: string;
  employee_uid: string;
  status: string;
  created_at: string;
  updated_at: string;
}

// 联合数据类型（用于JOIN查询结果）
export interface EmployeeJoinData {
  // 员工表字段
  employee_id?: string;
  employee_name?: string;
  employee_uid?: string;
  employee_status?: string;
  employee_created_at?: string;
  
  // 员工线索数据字段
  leads_id?: string;
  xiaohongshu_account_id?: string;
  xiaohongshu_nickname?: string;
  leads_account_id?: string;
  region?: string;
  tags?: string;
  activation_time?: string;
  published_notes_count?: number;
  promoted_notes_count?: number;
  notes_promotion_cost?: number;
  total_interactions?: number;
  total_form_leads?: number;
  total_private_message_leads?: number;
  total_private_message_openings?: number;
  total_private_message_leads_kept?: number;
  notes_exposure_count?: number;
  notes_click_count?: number;
  leads_time_range?: string;
  leads_created_at?: string;
  leads_updated_at?: string;
  
  // 员工回复数据字段
  response_id?: string;
  response_employee_name?: string;
  response_employee_uid?: string;
  score_15s_response?: number;
  score_30s_response?: number;
  score_1min_response?: number;
  score_1hour_timeout?: number;
  score_avg_response_time?: number;
  rate_15s_response?: string;
  rate_30s_response?: string;
  rate_1min_response?: string;
  rate_1hour_timeout?: string;
  avg_response_time?: number;
  user_rating_score?: number;
  response_time_range?: string;
  response_created_at?: string;
  response_updated_at?: string;
}

// 筛选条件接口
export interface FilterConditions {
  // 基础筛选
  searchText?: string;
  employeeName?: string;
  employeeUid?: string;
  region?: string;
  status?: string;
  
  // 数值范围筛选
  minInteractions?: number;
  maxInteractions?: number;
  minFormLeads?: number;
  maxFormLeads?: number;
  minResponseTime?: number;
  maxResponseTime?: number;
  minUserRating?: number;
  maxUserRating?: number;
  
  // 时间范围筛选
  startDate?: string;
  endDate?: string;
  timeRange?: string;
  
  // 多选筛选
  regions?: string[];
  statuses?: string[];
  tags?: string[];
  
  // 布尔筛选
  hasLeadsData?: boolean;
  hasResponseData?: boolean;
  isActive?: boolean;
}

// 排序选项接口
export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

// 通用筛选函数
export const filterData = <T extends Record<string, any>>(
  data: T[],
  conditions: FilterConditions
): T[] => {
  return data.filter(item => {
    // 文本搜索
    if (conditions.searchText) {
      const searchText = conditions.searchText.toLowerCase();
      const searchableFields = [
        item.employee_name,
        item.employee_uid,
        item.xiaohongshu_nickname,
        item.region,
        item.tags
      ].filter(Boolean);
      
      const hasMatch = searchableFields.some(field => 
        field?.toString().toLowerCase().includes(searchText)
      );
      
      if (!hasMatch) return false;
    }
    
    // 员工姓名筛选
    if (conditions.employeeName && item.employee_name) {
      if (!item.employee_name.toLowerCase().includes(conditions.employeeName.toLowerCase())) {
        return false;
      }
    }
    
    // 员工UID筛选
    if (conditions.employeeUid && item.employee_uid) {
      if (!item.employee_uid.toLowerCase().includes(conditions.employeeUid.toLowerCase())) {
        return false;
      }
    }
    
    // 地区筛选
    if (conditions.region && item.region) {
      if (item.region !== conditions.region) {
        return false;
      }
    }
    
    // 多地区筛选
    if (conditions.regions && conditions.regions.length > 0 && item.region) {
      if (!conditions.regions.includes(item.region)) {
        return false;
      }
    }
    
    // 状态筛选
    if (conditions.status && item.status) {
      if (item.status !== conditions.status) {
        return false;
      }
    }
    
    // 多状态筛选
    if (conditions.statuses && conditions.statuses.length > 0 && item.status) {
      if (!conditions.statuses.includes(item.status)) {
        return false;
      }
    }
    
    // 互动数量范围筛选
    if (conditions.minInteractions !== undefined && item.total_interactions !== null) {
      if (item.total_interactions < conditions.minInteractions) {
        return false;
      }
    }
    
    if (conditions.maxInteractions !== undefined && item.total_interactions !== null) {
      if (item.total_interactions > conditions.maxInteractions) {
        return false;
      }
    }
    
    // 表单线索数量范围筛选
    if (conditions.minFormLeads !== undefined && item.total_form_leads !== null) {
      if (item.total_form_leads < conditions.minFormLeads) {
        return false;
      }
    }
    
    if (conditions.maxFormLeads !== undefined && item.total_form_leads !== null) {
      if (item.total_form_leads > conditions.maxFormLeads) {
        return false;
      }
    }
    
    // 响应时间范围筛选
    if (conditions.minResponseTime !== undefined && item.avg_response_time !== null) {
      if (item.avg_response_time < conditions.minResponseTime) {
        return false;
      }
    }
    
    if (conditions.maxResponseTime !== undefined && item.avg_response_time !== null) {
      if (item.avg_response_time > conditions.maxResponseTime) {
        return false;
      }
    }
    
    // 用户评分范围筛选
    if (conditions.minUserRating !== undefined && item.user_rating_score !== null) {
      if (item.user_rating_score < conditions.minUserRating) {
        return false;
      }
    }
    
    if (conditions.maxUserRating !== undefined && item.user_rating_score !== null) {
      if (item.user_rating_score > conditions.maxUserRating) {
        return false;
      }
    }
    
    // 时间范围筛选
    if (conditions.startDate && item.created_at) {
      if (new Date(item.created_at) < new Date(conditions.startDate)) {
        return false;
      }
    }
    
    if (conditions.endDate && item.created_at) {
      if (new Date(item.created_at) > new Date(conditions.endDate)) {
        return false;
      }
    }
    
    // 时间范围筛选
    if (conditions.timeRange && item.time_range) {
      if (item.time_range !== conditions.timeRange) {
        return false;
      }
    }
    
    // 标签筛选
    if (conditions.tags && conditions.tags.length > 0 && item.tags) {
      const itemTags = item.tags.split(',').map(tag => tag.trim());
      const hasMatchingTag = conditions.tags.some(tag => itemTags.includes(tag));
      if (!hasMatchingTag) {
        return false;
      }
    }
    
    // 数据存在性筛选
    if (conditions.hasLeadsData !== undefined) {
      const hasLeads = item.leads_id || item.total_interactions !== null;
      if (conditions.hasLeadsData !== hasLeads) {
        return false;
      }
    }
    
    if (conditions.hasResponseData !== undefined) {
      const hasResponse = item.response_id || item.avg_response_time !== null;
      if (conditions.hasResponseData !== hasResponse) {
        return false;
      }
    }
    
    // 活跃状态筛选
    if (conditions.isActive !== undefined && item.status) {
      const isActive = item.status === 'active';
      if (conditions.isActive !== isActive) {
        return false;
      }
    }
    
    return true;
  });
};

// 排序函数
export const sortData = <T extends Record<string, any>>(
  data: T[],
  sortOptions: SortOptions
): T[] => {
  return [...data].sort((a, b) => {
    const aValue = a[sortOptions.field];
    const bValue = b[sortOptions.field];
    
    // 处理null值
    if (aValue === null && bValue === null) return 0;
    if (aValue === null) return sortOptions.direction === 'asc' ? 1 : -1;
    if (bValue === null) return sortOptions.direction === 'asc' ? -1 : 1;
    
    // 数值比较
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortOptions.direction === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    // 字符串比较
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      const comparison = aValue.localeCompare(bValue);
      return sortOptions.direction === 'asc' ? comparison : -comparison;
    }
    
    // 日期比较
    if (aValue instanceof Date && bValue instanceof Date) {
      const comparison = aValue.getTime() - bValue.getTime();
      return sortOptions.direction === 'asc' ? comparison : -comparison;
    }
    
    // 字符串日期比较
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      const aDate = new Date(aValue);
      const bDate = new Date(bValue);
      if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
        const comparison = aDate.getTime() - bDate.getTime();
        return sortOptions.direction === 'asc' ? comparison : -comparison;
      }
    }
    
    return 0;
  });
};

// 分页函数
export const paginateData = <T>(
  data: T[],
  page: number,
  pageSize: number
): { data: T[]; total: number; totalPages: number } => {
  const total = data.length;
  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = data.slice(startIndex, endIndex);
  
  return {
    data: paginatedData,
    total,
    totalPages
  };
};

// 组合筛选、排序和分页
export const processData = <T extends Record<string, any>>(
  data: T[],
  filters: FilterConditions,
  sortOptions?: SortOptions,
  pagination?: { page: number; pageSize: number }
): { data: T[]; total: number; totalPages: number } => {
  let processedData = filterData(data, filters);
  
  if (sortOptions) {
    processedData = sortData(processedData, sortOptions);
  }
  
  if (pagination) {
    return paginateData(processedData, pagination.page, pagination.pageSize);
  }
  
  return {
    data: processedData,
    total: processedData.length,
    totalPages: 1
  };
};

// 获取筛选选项（用于下拉菜单等）
export const getFilterOptions = <T extends Record<string, any>>(
  data: T[],
  field: keyof T
): string[] => {
  const values = data
    .map(item => item[field])
    .filter((value, index, arr) => 
      value !== null && 
      value !== undefined && 
      value !== '' && 
      arr.indexOf(value) === index
    );
  
  return values.map(value => value.toString()).sort();
};

// 获取数值范围（用于滑块等）
export const getNumericRange = <T extends Record<string, any>>(
  data: T[],
  field: keyof T
): { min: number; max: number } => {
  const numericValues = data
    .map(item => item[field])
    .filter((value): value is number => 
      typeof value === 'number' && !isNaN(value)
    );
  
  if (numericValues.length === 0) {
    return { min: 0, max: 0 };
  }
  
  return {
    min: Math.min(...numericValues),
    max: Math.max(...numericValues)
  };
};

// 数据统计函数
export const getDataStats = <T extends Record<string, any>>(
  data: T[]
): {
  totalRecords: number;
  regions: Record<string, number>;
  statuses: Record<string, number>;
  avgInteractions: number;
  avgResponseTime: number;
  avgUserRating: number;
} => {
  const totalRecords = data.length;
  
  const regions: Record<string, number> = {};
  const statuses: Record<string, number> = {};
  
  let totalInteractions = 0;
  let totalResponseTime = 0;
  let totalUserRating = 0;
  let interactionsCount = 0;
  let responseTimeCount = 0;
  let userRatingCount = 0;
  
  data.forEach(item => {
    // 统计地区
    if (item.region) {
      regions[item.region] = (regions[item.region] || 0) + 1;
    }
    
    // 统计状态
    if (item.status) {
      statuses[item.status] = (statuses[item.status] || 0) + 1;
    }
    
    // 统计互动数量
    if (typeof item.total_interactions === 'number') {
      totalInteractions += item.total_interactions;
      interactionsCount++;
    }
    
    // 统计响应时间
    if (typeof item.avg_response_time === 'number') {
      totalResponseTime += item.avg_response_time;
      responseTimeCount++;
    }
    
    // 统计用户评分
    if (typeof item.user_rating_score === 'number') {
      totalUserRating += item.user_rating_score;
      userRatingCount++;
    }
  });
  
  return {
    totalRecords,
    regions,
    statuses,
    avgInteractions: interactionsCount > 0 ? totalInteractions / interactionsCount : 0,
    avgResponseTime: responseTimeCount > 0 ? totalResponseTime / responseTimeCount : 0,
    avgUserRating: userRatingCount > 0 ? totalUserRating / userRatingCount : 0
  };
}; 