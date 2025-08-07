import { supabase } from './supabase';

// 定义类型
interface EmployeeListData {
  id: string;
  employee_name: string;
  employee_uid: string;
  status: string | null;
  activation_time: string | null;
  created_at: string;
}

interface EmployeeListForm {
  employee_name: string;
  employee_uid: string;
  status?: string;
  activation_time?: string;
}

export const employeeManageApi = {
  // 获取所有员工列表
  async getEmployeeList(): Promise<EmployeeListData[]> {
    try {
      const { data, error } = await supabase
        .from('employee_list')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('获取员工列表失败:', error);
      throw error;
    }
  },

  // 根据员工姓名搜索
  async searchEmployeeByName(name: string): Promise<EmployeeListData[]> {
    try {
      const { data, error } = await supabase
        .from('employee_list')
        .select('*')
        .ilike('employee_name', `%${name}%`)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('搜索员工失败:', error);
      throw error;
    }
  },

  // 根据员工UID搜索
  async searchEmployeeByUid(uid: string): Promise<EmployeeListData[]> {
    try {
      const { data, error } = await supabase
        .from('employee_list')
        .select('*')
        .ilike('employee_uid', `%${uid}%`)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('搜索员工失败:', error);
      throw error;
    }
  },

  // 根据开通时间搜索
  async searchEmployeeByActivationTime(timeRange: { start: string; end: string }): Promise<EmployeeListData[]> {
    try {
      const { data, error } = await supabase
        .from('employee_list')
        .select('*')
        .gte('activation_time', timeRange.start)
        .lte('activation_time', timeRange.end)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('按开通时间搜索员工失败:', error);
      throw error;
    }
  },

  // 根据状态筛选
  async getEmployeeByStatus(status: string): Promise<EmployeeListData[]> {
    try {
      const { data, error } = await supabase
        .from('employee_list')
        .select('*')
        .ilike('status', `%${status}%`)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('获取员工状态失败:', error);
      throw error;
    }
  },

  // 创建新员工
  async createEmployee(data: EmployeeListForm): Promise<EmployeeListData> {
    try {
      const { data: newEmployee, error } = await supabase
        .from('employee_list')
        .insert([data])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return newEmployee;
    } catch (error) {
      console.error('创建员工失败:', error);
      throw error;
    }
  },

  // 更新员工信息
  async updateEmployee(id: string, data: Partial<EmployeeListForm>): Promise<EmployeeListData> {
    try {
      const { data: updatedEmployee, error } = await supabase
        .from('employee_list')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return updatedEmployee;
    } catch (error) {
      console.error('更新员工失败:', error);
      throw error;
    }
  },

  // 删除员工
  async deleteEmployee(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('employee_list')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('删除员工失败:', error);
      throw error;
    }
  },

  // 检查员工UID是否已存在
  async checkEmployeeUidExists(uid: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('employee_list')
        .select('id')
        .eq('employee_uid', uid)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return !!data;
    } catch (error) {
      console.error('检查员工UID失败:', error);
      throw error;
    }
  },

  // 批量创建员工
  async batchCreateEmployees(dataList: EmployeeListForm[]): Promise<EmployeeListData[]> {
    try {
      const { data, error } = await supabase
        .from('employee_list')
        .insert(dataList)
        .select();

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('批量创建员工失败:', error);
      throw error;
    }
  },

  // 批量更新员工
  async batchUpdateEmployees(updates: { id: string; data: Partial<EmployeeListForm> }[]): Promise<EmployeeListData[]> {
    try {
      const results: EmployeeListData[] = [];
      
      for (const update of updates) {
        const { data, error } = await supabase
          .from('employee_list')
          .update(update.data)
          .eq('id', update.id)
          .select()
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          results.push(data);
        }
      }

      return results;
    } catch (error) {
      console.error('批量更新员工失败:', error);
      throw error;
    }
  },

  // 批量操作（创建新记录和更新现有记录）
  async batchUpsertEmployees(dataList: EmployeeListForm[]): Promise<{
    created: EmployeeListData[];
    updated: EmployeeListData[];
    errors: string[];
  }> {
    try {
      const created: EmployeeListData[] = [];
      const updated: EmployeeListData[] = [];
      const errors: string[] = [];

      for (const item of dataList) {
        try {
          // 检查是否存在相同UID的记录
          const { data: existing } = await supabase
            .from('employee_list')
            .select('id')
            .eq('employee_uid', item.employee_uid)
            .single();

          if (existing) {
            // 更新现有记录
            const { data: updatedRecord, error: updateError } = await supabase
              .from('employee_list')
              .update(item)
              .eq('id', existing.id)
              .select()
              .single();

            if (updateError) {
              errors.push(`更新员工 ${item.employee_name} 失败: ${updateError.message}`);
            } else if (updatedRecord) {
              updated.push(updatedRecord);
            }
          } else {
            // 创建新记录
            const { data: newRecord, error: createError } = await supabase
              .from('employee_list')
              .insert([item])
              .select()
              .single();

            if (createError) {
              errors.push(`创建员工 ${item.employee_name} 失败: ${createError.message}`);
            } else if (newRecord) {
              created.push(newRecord);
            }
          }
        } catch (error) {
          errors.push(`处理员工 ${item.employee_name} 失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
      }

      return { created, updated, errors };
    } catch (error) {
      console.error('批量操作员工失败:', error);
      throw error;
    }
  },

  // 获取统计数据
  async getStatistics() {
    try {
      const { data: totalData, error: totalError } = await supabase
        .from('employee_list')
        .select('id', { count: 'exact' });

      if (totalError) throw totalError;

      const { data: normalData, error: normalError } = await supabase
        .from('employee_list')
        .select('id', { count: 'exact' })
        .ilike('status', '%正常%');

      if (normalError) throw normalError;

      const { data: yellowCardData, error: yellowCardError } = await supabase
        .from('employee_list')
        .select('id', { count: 'exact' })
        .ilike('status', '%黄牌%');

      if (yellowCardError) throw yellowCardError;

      const { data: redCardData, error: redCardError } = await supabase
        .from('employee_list')
        .select('id', { count: 'exact' })
        .ilike('status', '%红牌%');

      if (redCardError) throw redCardError;

      return {
        total: totalData?.length || 0,
        normal: normalData?.length || 0,
        yellowCard: yellowCardData?.length || 0,
        redCard: redCardData?.length || 0,
      };
    } catch (error) {
      console.error('获取统计数据失败:', error);
      throw error;
    }
  },

  // 获取员工列表
  async getEmployeeListWithViolations(): Promise<EmployeeListData[]> {
    try {
      const { data, error } = await supabase
        .from('employee_list')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('获取员工列表失败:', error);
      throw error;
    }
  },
}; 