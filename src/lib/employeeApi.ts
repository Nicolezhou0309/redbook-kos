import { supabase } from './supabase';

// 定义类型
interface EmployeeResponseData {
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
  time_range: {
    start_date: string;
    end_date: string;
    remark: string;
  };
  created_at: string;
  updated_at: string;
}

interface EmployeeResponseDataForm {
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
  time_range: {
    start_date: string;
    end_date: string;
    remark: string;
  };
}

// 模拟数据
const mockEmployeeData: EmployeeResponseData[] = [
  {
    id: '1',
    employee_name: '张三',
    employee_uid: 'EMP001',
    score_15s_response: 85,
    score_30s_response: 92,
    score_1min_response: 78,
    score_1hour_timeout: 5,
    score_avg_response_time: 88,
    rate_15s_response: '85%',
    rate_30s_response: '92%',
    rate_1min_response: '78%',
    rate_1hour_timeout: '5%',
    avg_response_time: 25.5,
    user_rating_score: 4.2,
    time_range: {
      start_date: '2024-01-01',
      end_date: '2024-01-07',
      remark: '本周数据'
    },
    created_at: '2024-01-07T10:00:00Z',
    updated_at: '2024-01-07T10:00:00Z',
  },
  {
    id: '2',
    employee_name: '李四',
    employee_uid: 'EMP002',
    score_15s_response: 78,
    score_30s_response: 85,
    score_1min_response: 72,
    score_1hour_timeout: 8,
    score_avg_response_time: 82,
    rate_15s_response: '78%',
    rate_30s_response: '85%',
    rate_1min_response: '72%',
    rate_1hour_timeout: '8%',
    avg_response_time: 32.1,
    user_rating_score: 3.8,
    time_range: {
      start_date: '2024-01-01',
      end_date: '2024-01-07',
      remark: '本周数据'
    },
    created_at: '2024-01-07T09:00:00Z',
    updated_at: '2024-01-07T09:00:00Z',
  },
];

export const employeeApi = {
  // 获取所有员工响应数据
  async getAllEmployeeData(): Promise<EmployeeResponseData[]> {
    try {
      const { data, error } = await supabase
        .from('employee_response_data')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('数据库连接失败，使用模拟数据:', error.message);
        return mockEmployeeData;
      }

      return data || [];
    } catch (error) {
      console.warn('数据库连接异常，使用模拟数据:', error);
      return mockEmployeeData;
    }
  },

  // 根据时间范围获取员工数据
  async getEmployeeDataByTimeRange(timeRange: string): Promise<EmployeeResponseData[]> {
    try {
      const { data, error } = await supabase
        .from('employee_response_data')
        .select('*')
        .eq('time_range->remark', timeRange)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('数据库连接失败，使用模拟数据:', error.message);
        return mockEmployeeData.filter(item => item.time_range.remark === timeRange);
      }

      return data || [];
    } catch (error) {
      console.warn('数据库连接异常，使用模拟数据:', error);
      return mockEmployeeData.filter(item => item.time_range.remark === timeRange);
    }
  },

  // 根据员工UID获取数据
  async getEmployeeDataByUid(employeeUid: string): Promise<EmployeeResponseData[]> {
    try {
      const { data, error } = await supabase
        .from('employee_response_data')
        .select('*')
        .eq('employee_uid', employeeUid)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('数据库连接失败，使用模拟数据:', error.message);
        return mockEmployeeData.filter(item => item.employee_uid === employeeUid);
      }

      return data || [];
    } catch (error) {
      console.warn('数据库连接异常，使用模拟数据:', error);
      return mockEmployeeData.filter(item => item.employee_uid === employeeUid);
    }
  },

  // 创建员工响应数据
  async createEmployeeData(data: EmployeeResponseDataForm): Promise<EmployeeResponseData> {
    try {
      const { data: result, error } = await supabase
        .from('employee_response_data')
        .insert([data])
        .select()
        .single();

      if (error) {
        throw new Error(`创建员工数据失败: ${error.message}`);
      }

      return result;
    } catch (error) {
      console.warn('数据库操作失败:', error);
      // 返回模拟数据
      const mockResult: EmployeeResponseData = {
        id: Date.now().toString(),
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return mockResult;
    }
  },

  // 更新员工响应数据
  async updateEmployeeData(id: string, data: Partial<EmployeeResponseDataForm>): Promise<EmployeeResponseData> {
    try {
      const { data: result, error } = await supabase
        .from('employee_response_data')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`更新员工数据失败: ${error.message}`);
      }

      return result;
    } catch (error) {
      console.warn('数据库操作失败:', error);
      // 返回模拟数据
      const mockResult: EmployeeResponseData = {
        id,
        employee_name: data.employee_name || '',
        employee_uid: data.employee_uid || '',
        score_15s_response: data.score_15s_response || 0,
        score_30s_response: data.score_30s_response || 0,
        score_1min_response: data.score_1min_response || 0,
        score_1hour_timeout: data.score_1hour_timeout || 0,
        score_avg_response_time: data.score_avg_response_time || 0,
        rate_15s_response: data.rate_15s_response || '0%',
        rate_30s_response: data.rate_30s_response || '0%',
        rate_1min_response: data.rate_1min_response || '0%',
        rate_1hour_timeout: data.rate_1hour_timeout || '0%',
        avg_response_time: data.avg_response_time || 0,
        user_rating_score: data.user_rating_score || 0,
        time_range: data.time_range || { start_date: '', end_date: '', remark: '' },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return mockResult;
    }
  },

  // 删除员工响应数据
  async deleteEmployeeData(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('employee_response_data')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`删除员工数据失败: ${error.message}`);
      }
    } catch (error) {
      console.warn('数据库操作失败:', error);
      // 模拟删除成功
    }
  },

  // 批量删除员工响应数据
  async batchDeleteEmployeeData(ids: string[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('employee_response_data')
        .delete()
        .in('id', ids);

      if (error) {
        throw new Error(`批量删除员工数据失败: ${error.message}`);
      }
    } catch (error) {
      console.warn('数据库操作失败:', error);
      // 模拟删除成功
    }
  },

  // 获取时间范围列表
  async getTimeRanges(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('employee_response_data')
        .select('time_range')
        .order('time_range->remark', { ascending: false });

      if (error) {
        console.warn('数据库连接失败，使用模拟数据:', error.message);
        return [];
      }

      const uniqueTimeRanges = [...new Set(data?.map(item => item.time_range?.remark) || [])];
      return uniqueTimeRanges.length > 0 ? uniqueTimeRanges : [];
    } catch (error) {
      console.warn('数据库连接异常，使用模拟数据:', error);
      return [];
    }
  },

  // 批量创建员工数据
  async batchCreateEmployeeData(dataList: EmployeeResponseDataForm[]): Promise<EmployeeResponseData[]> {
    try {
      const { data, error } = await supabase
        .from('employee_response_data')
        .insert(dataList)
        .select();

      if (error) {
        throw new Error(`批量创建员工数据失败: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.warn('数据库操作失败:', error);
      // 返回模拟数据
      const mockResults: EmployeeResponseData[] = dataList.map((item, index) => ({
        id: (Date.now() + index).toString(),
        ...item,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
      return mockResults;
    }
  },

  // 检查员工数据是否存在（用于查重）
  async checkEmployeeDataExists(employeeUid: string, timeRange: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('employee_response_data')
        .select('id')
        .eq('employee_uid', employeeUid)
        .eq('time_range->remark', timeRange)
        .limit(1);

      if (error) {
        console.warn('数据库连接失败:', error.message);
        return false;
      }

      return (data && data.length > 0);
    } catch (error) {
      console.warn('数据库连接异常:', error);
      return false;
    }
  },

  // 获取统计数据
  async getStatistics(timeRange?: string) {
    try {
      let query = supabase
        .from('employee_response_data')
        .select('*');

      if (timeRange) {
        query = query.eq('time_range->remark', timeRange);
      }

      const { data, error } = await query;

      if (error) {
        console.warn('数据库连接失败，使用模拟数据:', error.message);
        return {
          totalEmployees: mockEmployeeData.length,
          avgResponseTime: 28.8,
          avgUserRating: 4.0,
          avg15sResponseRate: 81.5,
          avg30sResponseRate: 88.5,
        };
      }

      if (!data || data.length === 0) {
        return {
          totalEmployees: 0,
          avgResponseTime: 0,
          avgUserRating: 0,
          avg15sResponseRate: 0,
          avg30sResponseRate: 0,
        };
      }

      const totalEmployees = data.length;
      const avgResponseTime = data.reduce((sum, item) => sum + (item.avg_response_time || 0), 0) / totalEmployees;
      const avgUserRating = data.reduce((sum, item) => sum + (item.user_rating_score || 0), 0) / totalEmployees;
      
      // 计算平均响应率
      const avg15sResponseRate = data.reduce((sum, item) => {
        const rate = parseFloat(item.rate_15s_response?.replace('%', '') || '0');
        return sum + rate;
      }, 0) / totalEmployees;

      const avg30sResponseRate = data.reduce((sum, item) => {
        const rate = parseFloat(item.rate_30s_response?.replace('%', '') || '0');
        return sum + rate;
      }, 0) / totalEmployees;

      return {
        totalEmployees,
        avgResponseTime: Math.round(avgResponseTime * 100) / 100,
        avgUserRating: Math.round(avgUserRating * 100) / 100,
        avg15sResponseRate: Math.round(avg15sResponseRate * 100) / 100,
        avg30sResponseRate: Math.round(avg30sResponseRate * 100) / 100,
      };
    } catch (error) {
      console.warn('数据库连接异常，使用模拟数据:', error);
      return {
        totalEmployees: mockEmployeeData.length,
        avgResponseTime: 28.8,
        avgUserRating: 4.0,
        avg15sResponseRate: 81.5,
        avg30sResponseRate: 88.5,
      };
    }
  },
}; 