import { supabase } from './supabase';

// 定义类型
interface EmployeeListData {
  id: string;
  employee_name: string;
  employee_uid: string;
  status: string | null;
  activation_time: string | null;
  created_at: string;
  violation_status?: string | null;
  current_yellow_cards?: number | null;
  current_red_cards?: number | null;
}

interface EmployeeListForm {
  employee_name: string;
  employee_uid: string;
  status?: string;
  activation_time?: string;
}

interface PaginationParams {
  page: number;
  pageSize: number;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const employeeManageApi = {
  // 获取所有员工列表（带分页）
  async getEmployeeList(params?: PaginationParams): Promise<PaginatedResponse<EmployeeListData>> {
    try {
      const page = params?.page || 1;
      const pageSize = params?.pageSize || 10;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // 获取总数
      const { count, error: countError } = await supabase
        .from('employee_list')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        throw countError;
      }

      // 获取分页数据
      const { data, error } = await supabase
        .from('employee_list')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        throw error;
      }

      return {
        data: data || [],
        total: count || 0,
        page,
        pageSize
      };
    } catch (error) {
      console.error('获取员工列表失败:', error);
      throw error;
    }
  },

  // 根据员工姓名搜索（带分页）
  async searchEmployeeByName(name: string, params?: PaginationParams): Promise<PaginatedResponse<EmployeeListData>> {
    try {
      // 如果没有传入分页参数，返回所有匹配数据
      if (!params) {
        const { data, error } = await supabase
          .from('employee_list')
          .select('*')
          .ilike('employee_name', `%${name}%`)
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        return {
          data: data || [],
          total: data?.length || 0,
          page: 1,
          pageSize: data?.length || 0
        };
      }

      // 如果有分页参数，使用分页逻辑
      const page = params.page || 1;
      const pageSize = params.pageSize || 10;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // 获取总数
      const { count, error: countError } = await supabase
        .from('employee_list')
        .select('*', { count: 'exact', head: true })
        .ilike('employee_name', `%${name}%`);

      if (countError) {
        throw countError;
      }

      // 获取分页数据
      const { data, error } = await supabase
        .from('employee_list')
        .select('*')
        .ilike('employee_name', `%${name}%`)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        throw error;
      }

      return {
        data: data || [],
        total: count || 0,
        page,
        pageSize
      };
    } catch (error) {
      console.error('搜索员工失败:', error);
      throw error;
    }
  },

  // 根据员工UID搜索（支持分页或全部数据）
  async searchEmployeeByUid(uid: string, params?: PaginationParams): Promise<PaginatedResponse<EmployeeListData>> {
    try {
      // 如果没有传入分页参数，返回所有匹配数据
      if (!params) {
        const { data, error } = await supabase
          .from('employee_list')
          .select('*')
          .ilike('employee_uid', `%${uid}%`)
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        return {
          data: data || [],
          total: data?.length || 0,
          page: 1,
          pageSize: data?.length || 0
        };
      }

      // 如果有分页参数，使用分页逻辑
      const page = params.page || 1;
      const pageSize = params.pageSize || 10;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // 获取总数
      const { count, error: countError } = await supabase
        .from('employee_list')
        .select('*', { count: 'exact', head: true })
        .ilike('employee_uid', `%${uid}%`);

      if (countError) {
        throw countError;
      }

      // 获取分页数据
      const { data, error } = await supabase
        .from('employee_list')
        .select('*')
        .ilike('employee_uid', `%${uid}%`)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        throw error;
      }

      return {
        data: data || [],
        total: count || 0,
        page,
        pageSize
      };
    } catch (error) {
      console.error('搜索员工失败:', error);
      throw error;
    }
  },

  // 根据开通时间搜索（带分页）
  async searchEmployeeByActivationTime(timeRange: { start: string; end: string }, params?: PaginationParams): Promise<PaginatedResponse<EmployeeListData>> {
    try {
      const page = params?.page || 1;
      const pageSize = params?.pageSize || 10;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // 获取总数
      const { count, error: countError } = await supabase
        .from('employee_list')
        .select('*', { count: 'exact', head: true })
        .gte('activation_time', timeRange.start)
        .lte('activation_time', timeRange.end);

      if (countError) {
        throw countError;
      }

      // 获取分页数据
      const { data, error } = await supabase
        .from('employee_list')
        .select('*')
        .gte('activation_time', timeRange.start)
        .lte('activation_time', timeRange.end)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        throw error;
      }

      return {
        data: data || [],
        total: count || 0,
        page,
        pageSize
      };
    } catch (error) {
      console.error('按开通时间搜索员工失败:', error);
      throw error;
    }
  },

  // 根据状态筛选（带分页）
  async getEmployeeByStatus(status: string, params?: PaginationParams): Promise<PaginatedResponse<EmployeeListData>> {
    try {
      const page = params?.page || 1;
      const pageSize = params?.pageSize || 10;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // 获取总数
      const { count, error: countError } = await supabase
        .from('employee_list')
        .select('*', { count: 'exact', head: true })
        .ilike('status', `%${status}%`);

      if (countError) {
        throw countError;
      }

      // 获取分页数据
      const { data, error } = await supabase
        .from('employee_list')
        .select('*')
        .ilike('status', `%${status}%`)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        throw error;
      }

      return {
        data: data || [],
        total: count || 0,
        page,
        pageSize
      };
    } catch (error) {
      console.error('获取员工状态失败:', error);
      throw error;
    }
  },

  // 根据持有周期筛选（带分页）
  async getEmployeeByHoldingPeriod(period: string, params?: PaginationParams): Promise<PaginatedResponse<EmployeeListData>> {
    try {
      const page = params?.page || 1;
      const pageSize = params?.pageSize || 10;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const base = supabase.from('employee_list');
      const applyPeriodFilters = (q: any) => {
        switch (period) {
          case 'not_activated':
            return q.is('activation_time', null);
          case '1_30':
            return q
              .not('activation_time', 'is', null)
              .gte('activation_time', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
              .lte('activation_time', new Date().toISOString().split('T')[0]);
          case '31_90':
            return q
              .not('activation_time', 'is', null)
              .gte('activation_time', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
              .lt('activation_time', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
          case '91_180':
            return q
              .not('activation_time', 'is', null)
              .gte('activation_time', new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
              .lt('activation_time', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
          case '181_365':
            return q
              .not('activation_time', 'is', null)
              .gte('activation_time', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
              .lt('activation_time', new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
          case '365_plus':
            return q
              .not('activation_time', 'is', null)
              .lt('activation_time', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
          default:
            throw new Error('无效的持有周期类型');
        }
      };

      // 获取总数（在 PostgrestQueryBuilder 上使用带 options 的 select）
      const { count, error: countError } = await applyPeriodFilters(
        base.select('*', { count: 'exact', head: true })
      );

      if (countError) {
        throw countError;
      }

      // 获取分页数据
      const { data, error } = await applyPeriodFilters(base.select('*'))
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        throw error;
      }

      return {
        data: data || [],
        total: count || 0,
        page,
        pageSize
      };
    } catch (error) {
      console.error('获取员工持有周期失败:', error);
      throw error;
    }
  },

  // 根据开通时间范围筛选（带分页）
  async getEmployeeByActivationTimeRange(timeRange: { start: string; end: string }, params?: PaginationParams): Promise<PaginatedResponse<EmployeeListData>> {
    try {
      const page = params?.page || 1;
      const pageSize = params?.pageSize || 10;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // 获取总数
      const { count, error: countError } = await supabase
        .from('employee_list')
        .select('*', { count: 'exact', head: true })
        .gte('activation_time', timeRange.start)
        .lte('activation_time', timeRange.end);

      if (countError) {
        throw countError;
      }

      // 获取分页数据
      const { data, error } = await supabase
        .from('employee_list')
        .select('*')
        .gte('activation_time', timeRange.start)
        .lte('activation_time', timeRange.end)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        throw error;
      }

      return {
        data: data || [],
        total: count || 0,
        page,
        pageSize
      };
    } catch (error) {
      console.error('获取员工开通时间范围失败:', error);
      throw error;
    }
  },

  // 根据创建时间范围筛选（带分页）
  async getEmployeeByCreatedTimeRange(timeRange: { start: string; end: string }, params?: PaginationParams): Promise<PaginatedResponse<EmployeeListData>> {
    try {
      const page = params?.page || 1;
      const pageSize = params?.pageSize || 10;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // 获取总数
      const { count, error: countError } = await supabase
        .from('employee_list')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', timeRange.start)
        .lte('created_at', timeRange.end);

      if (countError) {
        throw countError;
      }

      // 获取分页数据
      const { data, error } = await supabase
        .from('employee_list')
        .select('*')
        .gte('created_at', timeRange.start)
        .lte('created_at', timeRange.end)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        throw error;
      }

      return {
        data: data || [],
        total: count || 0,
        page,
        pageSize
      };
    } catch (error) {
      console.error('获取员工创建时间范围失败:', error);
      throw error;
    }
  },

  // 多条件筛选（支持分页或全部数据）
  async getEmployeeByMultipleFilters(filters: {
    status?: string;
    holdingPeriod?: string;
    violationStatus?: string | string[];
    activationTimeRange?: { start: string; end: string };
    createdTimeRange?: { start: string; end: string };
  }, params?: PaginationParams): Promise<PaginatedResponse<EmployeeListData>> {
    try {
      const base = supabase.from('employee_list');
      const applyFilters = (q: any) => {
        let next = q;

      // 应用状态筛选
      if (filters.status) {
        next = next.ilike('status', `%${filters.status}%`);
      }

      // 应用违规状态筛选
      if (filters.violationStatus) {
        if (Array.isArray(filters.violationStatus)) {
          // 多选情况
          next = next.in('violation_status', filters.violationStatus);
        } else {
          // 单选情况
          next = next.eq('violation_status', filters.violationStatus);
        }
      }

      // 应用持有周期筛选
      if (filters.holdingPeriod) {
        switch (filters.holdingPeriod) {
          case 'not_activated':
            next = next.is('activation_time', null);
            break;
          case '1_30':
            next = next
              .not('activation_time', 'is', null)
              .gte('activation_time', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
              .lte('activation_time', new Date().toISOString().split('T')[0]);
            break;
          case '31_90':
            next = next
              .not('activation_time', 'is', null)
              .gte('activation_time', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
              .lt('activation_time', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
            break;
          case '91_180':
            next = next
              .not('activation_time', 'is', null)
              .gte('activation_time', new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
              .lt('activation_time', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
            break;
          case '181_365':
            next = next
              .not('activation_time', 'is', null)
              .gte('activation_time', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
              .lt('activation_time', new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
            break;
          case '365_plus':
            next = next
              .not('activation_time', 'is', null)
              .lt('activation_time', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
            break;
        }
      }

      // 应用开通时间范围筛选
      if (filters.activationTimeRange) {
        next = next
          .gte('activation_time', filters.activationTimeRange.start)
          .lte('activation_time', filters.activationTimeRange.end);
      }

      // 应用创建时间范围筛选
      if (filters.createdTimeRange) {
        next = next
          .gte('created_at', filters.createdTimeRange.start)
          .lte('created_at', filters.createdTimeRange.end);
      }
      return next;
    };

      // 如果没有传入分页参数，返回所有匹配数据
      if (!params) {
        const { data, error } = await applyFilters(base.select('*'))
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        return {
          data: data || [],
          total: data?.length || 0,
          page: 1,
          pageSize: data?.length || 0
        };
      }

      // 如果有分页参数，使用分页逻辑
      const page = params.page || 1;
      const pageSize = params.pageSize || 10;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // 获取总数
      const { count, error: countError } = await applyFilters(
        base.select('*', { count: 'exact', head: true })
      );

      if (countError) {
        throw countError;
      }

      // 获取分页数据
      const { data, error } = await applyFilters(base.select('*'))
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        throw error;
      }

      return {
        data: data || [],
        total: count || 0,
        page,
        pageSize
      };
    } catch (error) {
      console.error('多条件筛选员工失败:', error);
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

  // 获取员工列表（支持分页或全部数据）
  async getEmployeeListWithViolations(params?: PaginationParams): Promise<PaginatedResponse<EmployeeListData>> {
    try {
      // 如果没有传入分页参数，返回所有数据
      if (!params) {
        const { data, error } = await supabase
          .from('employee_list')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        // 确保数据包含违规状态信息
        const dataWithViolations = data?.map(emp => ({
          ...emp,
          violation_status: emp.violation_status || 'normal',
          current_yellow_cards: emp.current_yellow_cards || 0,
          current_red_cards: emp.current_red_cards || 0
        })) || [];

        return {
          data: dataWithViolations,
          total: dataWithViolations.length,
          page: 1,
          pageSize: dataWithViolations.length
        };
      }

      // 如果有分页参数，使用分页逻辑
      const page = params.page || 1;
      const pageSize = params.pageSize || 10;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // 获取总数
      const { count, error: countError } = await supabase
        .from('employee_list')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        throw countError;
      }

      // 获取分页数据
      const { data, error } = await supabase
        .from('employee_list')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        throw error;
      }

      // 确保数据包含违规状态信息
      const dataWithViolations = data?.map(emp => ({
        ...emp,
        violation_status: emp.violation_status || 'normal',
        current_yellow_cards: emp.current_yellow_cards || 0,
        current_red_cards: emp.current_red_cards || 0
      })) || [];

      return {
        data: dataWithViolations,
        total: count || 0,
        page,
        pageSize
      };
    } catch (error) {
      console.error('获取员工列表失败:', error);
      throw error;
    }
  },
}; 