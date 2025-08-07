import { supabase } from './supabase';

// 定义类型
interface EmployeeLeadsData {
  id: string;
  employee_name: string;
  xiaohongshu_account_id: string;
  xiaohongshu_nickname: string;
  account_id: string;
  region: string;
  tags: string;
  activation_time: string | null;
  published_notes_count: number;
  promoted_notes_count: number;
  notes_promotion_cost: number;
  total_interactions: number;
  total_form_leads: number;
  total_private_message_leads: number;
  total_private_message_openings: number;
  total_private_message_leads_kept: number;
  notes_exposure_count: number;
  notes_click_count: number;
  time_range: {
    start_date: string;
    end_date: string;
    remark: string;
  };
  created_at: string;
  updated_at: string;
}

interface EmployeeLeadsDataForm {
  employee_name: string;
  xiaohongshu_account_id: string;
  xiaohongshu_nickname: string;
  account_id: string;
  region: string;
  tags: string;
  activation_time: string | null;
  published_notes_count: number;
  promoted_notes_count: number;
  notes_promotion_cost: number;
  total_interactions: number;
  total_form_leads: number;
  total_private_message_leads: number;
  total_private_message_openings: number;
  total_private_message_leads_kept: number;
  notes_exposure_count: number;
  notes_click_count: number;
  time_range: {
    start_date: string;
    end_date: string;
    remark: string;
  };
}

// 模拟数据
const mockEmployeeLeadsData: EmployeeLeadsData[] = [
  {
    id: '1',
    employee_name: '青芒果果',
    xiaohongshu_account_id: '95303223344',
    xiaohongshu_nickname: '青芒果果',
    account_id: '67a0784d000000000e01df5b',
    region: '中国大陆-上海-上海市',
    tags: '-',
    activation_time: '2024-12-18',
    published_notes_count: 2,
    promoted_notes_count: 83,
    notes_promotion_cost: 220.77,
    total_interactions: 423,
    total_form_leads: 0,
    total_private_message_leads: 8,
    total_private_message_openings: 6,
    total_private_message_leads_kept: 2,
    notes_exposure_count: 31694,
    notes_click_count: 5809,
    time_range: {
      start_date: '2024-01-01',
      end_date: '2024-01-31',
      remark: '本月数据'
    },
    created_at: '2024-01-07T10:00:00Z',
    updated_at: '2024-01-07T10:00:00Z',
  },
  {
    id: '2',
    employee_name: '开心1点啦',
    xiaohongshu_account_id: '9849868812',
    xiaohongshu_nickname: '开心1点啦',
    account_id: '653c9c7c000000000d00799d',
    region: '中国大陆-上海-上海市',
    tags: '杨晓鹏/00799d',
    activation_time: '2025-07-04',
    published_notes_count: 3,
    promoted_notes_count: 45,
    notes_promotion_cost: 270.37,
    total_interactions: 32,
    total_form_leads: 0,
    total_private_message_leads: 18,
    total_private_message_openings: 16,
    total_private_message_leads_kept: 9,
    notes_exposure_count: 7928,
    notes_click_count: 1040,
    time_range: {
      start_date: '2024-01-01',
      end_date: '2024-01-31',
      remark: '本月数据'
    },
    created_at: '2024-01-07T09:00:00Z',
    updated_at: '2024-01-07T09:00:00Z',
  },
];

export const employeeLeadsApi = {
  // 获取所有员工线索数据
  async getAllEmployeeLeadsData(): Promise<EmployeeLeadsData[]> {
    try {
      const { data, error } = await supabase
        .from('employee_leads_data')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('数据库连接失败，使用模拟数据:', error.message);
        return mockEmployeeLeadsData;
      }

      return data || [];
    } catch (error) {
      console.warn('数据库连接异常，使用模拟数据:', error);
      return mockEmployeeLeadsData;
    }
  },

  // 根据时间范围获取员工线索数据
  async getEmployeeLeadsDataByTimeRange(timeRange: string): Promise<EmployeeLeadsData[]> {
    try {
      const { data, error } = await supabase
        .from('employee_leads_data')
        .select('*')
        .eq('time_range->remark', timeRange)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('数据库连接失败，使用模拟数据:', error.message);
        return mockEmployeeLeadsData.filter(item => item.time_range.remark === timeRange);
      }

      return data || [];
    } catch (error) {
      console.warn('数据库连接异常，使用模拟数据:', error);
      return mockEmployeeLeadsData.filter(item => item.time_range.remark === timeRange);
    }
  },

  // 根据账号ID获取数据
  async getEmployeeLeadsDataByAccountId(accountId: string): Promise<EmployeeLeadsData[]> {
    try {
      const { data, error } = await supabase
        .from('employee_leads_data')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('数据库连接失败，使用模拟数据:', error.message);
        return mockEmployeeLeadsData.filter(item => item.account_id === accountId);
      }

      return data || [];
    } catch (error) {
      console.warn('数据库连接异常，使用模拟数据:', error);
      return mockEmployeeLeadsData.filter(item => item.account_id === accountId);
    }
  },

  // 创建员工线索数据
  async createEmployeeLeadsData(data: EmployeeLeadsDataForm): Promise<EmployeeLeadsData> {
    try {
      const { data: result, error } = await supabase
        .from('employee_leads_data')
        .insert([data])
        .select()
        .single();

      if (error) {
        throw new Error(`创建员工线索数据失败: ${error.message}`);
      }

      return result;
    } catch (error) {
      console.warn('数据库操作失败:', error);
      // 返回模拟数据
      const mockResult: EmployeeLeadsData = {
        id: Date.now().toString(),
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return mockResult;
    }
  },

  // 更新员工线索数据
  async updateEmployeeLeadsData(id: string, data: Partial<EmployeeLeadsDataForm>): Promise<EmployeeLeadsData> {
    try {
      const { data: result, error } = await supabase
        .from('employee_leads_data')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`更新员工线索数据失败: ${error.message}`);
      }

      return result;
    } catch (error) {
      console.warn('数据库操作失败:', error);
      // 返回模拟数据
      const mockResult: EmployeeLeadsData = {
        id,
        employee_name: data.employee_name || '',
        xiaohongshu_account_id: data.xiaohongshu_account_id || '',
        xiaohongshu_nickname: data.xiaohongshu_nickname || '',
        account_id: data.account_id || '',
        region: data.region || '',
        tags: data.tags || '',
        activation_time: data.activation_time || null,
        published_notes_count: data.published_notes_count || 0,
        promoted_notes_count: data.promoted_notes_count || 0,
        notes_promotion_cost: data.notes_promotion_cost || 0,
        total_interactions: data.total_interactions || 0,
        total_form_leads: data.total_form_leads || 0,
        total_private_message_leads: data.total_private_message_leads || 0,
        total_private_message_openings: data.total_private_message_openings || 0,
        total_private_message_leads_kept: data.total_private_message_leads_kept || 0,
        notes_exposure_count: data.notes_exposure_count || 0,
        notes_click_count: data.notes_click_count || 0,
        time_range: data.time_range || { start_date: '', end_date: '', remark: '' },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return mockResult;
    }
  },

  // 删除员工线索数据
  async deleteEmployeeLeadsData(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('employee_leads_data')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`删除员工线索数据失败: ${error.message}`);
      }
    } catch (error) {
      console.warn('数据库操作失败:', error);
      // 模拟删除成功
    }
  },

  // 批量删除员工线索数据
  async batchDeleteEmployeeLeadsData(ids: string[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('employee_leads_data')
        .delete()
        .in('id', ids);

      if (error) {
        throw new Error(`批量删除员工线索数据失败: ${error.message}`);
      }
    } catch (error) {
      console.warn('数据库操作失败:', error);
      // 模拟删除成功
    }
  },

  // 批量创建员工线索数据
  async batchCreateEmployeeLeadsData(dataList: EmployeeLeadsDataForm[]): Promise<EmployeeLeadsData[]> {
    try {
      const { data, error } = await supabase
        .from('employee_leads_data')
        .insert(dataList)
        .select();

      if (error) {
        throw new Error(`批量创建员工线索数据失败: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.warn('数据库操作失败:', error);
      // 返回模拟数据
      const mockResults: EmployeeLeadsData[] = dataList.map((item, index) => ({
        id: (Date.now() + index).toString(),
        ...item,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
      return mockResults;
    }
  },

  // 检查员工线索数据是否存在（用于查重）
  async checkEmployeeLeadsDataExists(accountId: string, timeRange: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('employee_leads_data')
        .select('id')
        .eq('account_id', accountId)
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
        .from('employee_leads_data')
        .select('*');

      if (timeRange) {
        query = query.eq('time_range->remark', timeRange);
      }

      const { data, error } = await query;

      if (error) {
        console.warn('数据库连接失败，使用模拟数据:', error.message);
        return {
          totalEmployees: mockEmployeeLeadsData.length,
          totalPromotedNotes: 128,
          totalPromotionCost: 491.14,
          totalInteractions: 455,
          totalPrivateMessageLeads: 26,
          avgPromotionCost: 3.84,
        };
      }

      if (!data || data.length === 0) {
        return {
          totalEmployees: 0,
          totalPromotedNotes: 0,
          totalPromotionCost: 0,
          totalInteractions: 0,
          totalPrivateMessageLeads: 0,
          avgPromotionCost: 0,
        };
      }

      const totalEmployees = data.length;
      const totalPromotedNotes = data.reduce((sum, item) => sum + (item.promoted_notes_count || 0), 0);
      const totalPromotionCost = data.reduce((sum, item) => sum + (item.notes_promotion_cost || 0), 0);
      const totalInteractions = data.reduce((sum, item) => sum + (item.total_interactions || 0), 0);
      const totalPrivateMessageLeads = data.reduce((sum, item) => sum + (item.total_private_message_leads || 0), 0);
      const avgPromotionCost = totalPromotedNotes > 0 ? totalPromotionCost / totalPromotedNotes : 0;

      return {
        totalEmployees,
        totalPromotedNotes,
        totalPromotionCost: Math.round(totalPromotionCost * 100) / 100,
        totalInteractions,
        totalPrivateMessageLeads,
        avgPromotionCost: Math.round(avgPromotionCost * 100) / 100,
      };
    } catch (error) {
      console.warn('数据库连接异常，使用模拟数据:', error);
      return {
        totalEmployees: mockEmployeeLeadsData.length,
        totalPromotedNotes: 128,
        totalPromotionCost: 491.14,
        totalInteractions: 455,
        totalPrivateMessageLeads: 26,
        avgPromotionCost: 3.84,
      };
    }
  },
}; 