import { supabase } from './supabase';

export interface EmployeeList {
  id: string;
  employee_name: string;
  employee_uid: string;
  status: string | null;
  created_at: string;
}

export class EmployeeListApi {
  // 获取所有员工列表
  async getAllEmployees(): Promise<EmployeeList[]> {
    try {
      const { data, error } = await supabase
        .from('employee_list')
        .select('*')
        .order('employee_name', { ascending: true });

      if (error) {
        console.error('获取员工列表失败:', error);
        throw new Error(error.message);
      }

      return data || [];
    } catch (error) {
      console.error('获取员工列表异常:', error);
      throw error;
    }
  }

  // 根据员工姓名搜索
  async getEmployeesByName(employeeName: string): Promise<EmployeeList[]> {
    try {
      const { data, error } = await supabase
        .from('employee_list')
        .select('*')
        .ilike('employee_name', `%${employeeName}%`)
        .order('employee_name', { ascending: true });

      if (error) {
        console.error('根据姓名搜索员工失败:', error);
        throw new Error(error.message);
      }

      return data || [];
    } catch (error) {
      console.error('根据姓名搜索员工异常:', error);
      throw error;
    }
  }

  // 根据员工UID搜索
  async getEmployeeByUid(employeeUid: string): Promise<EmployeeList | null> {
    try {
      const { data, error } = await supabase
        .from('employee_list')
        .select('*')
        .eq('employee_uid', employeeUid)
        .single();

      if (error) {
        console.error('根据UID获取员工失败:', error);
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      console.error('根据UID获取员工异常:', error);
      throw error;
    }
  }

  // 根据状态筛选员工
  async getEmployeesByStatus(status: string): Promise<EmployeeList[]> {
    try {
      const { data, error } = await supabase
        .from('employee_list')
        .select('*')
        .eq('status', status)
        .order('employee_name', { ascending: true });

      if (error) {
        console.error('根据状态获取员工失败:', error);
        throw new Error(error.message);
      }

      return data || [];
    } catch (error) {
      console.error('根据状态获取员工异常:', error);
      throw error;
    }
  }

  // 创建员工
  async createEmployee(employee: { employee_name: string; employee_uid: string; status?: string }): Promise<EmployeeList> {
    try {
      const { data, error } = await supabase
        .from('employee_list')
        .insert([employee])
        .select()
        .single();

      if (error) {
        console.error('创建员工失败:', error);
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      console.error('创建员工异常:', error);
      throw error;
    }
  }

  // 更新员工信息
  async updateEmployee(id: string, updates: Partial<{ employee_name: string; employee_uid: string; status: string }>): Promise<EmployeeList> {
    try {
      const { data, error } = await supabase
        .from('employee_list')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('更新员工失败:', error);
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      console.error('更新员工异常:', error);
      throw error;
    }
  }

  // 删除员工
  async deleteEmployee(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('employee_list')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('删除员工失败:', error);
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('删除员工异常:', error);
      throw error;
    }
  }

  // 获取员工统计信息
  async getStatistics() {
    try {
      const { data, error } = await supabase
        .from('employee_list')
        .select('*');

      if (error) {
        console.error('获取员工统计失败:', error);
        throw new Error(error.message);
      }

      const employees = data || [];
      
      // 按状态统计
      const statusStats = employees.reduce((acc, employee) => {
        const status = employee.status || '未知';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalEmployees: employees.length,
        statusStats,
      };
    } catch (error) {
      console.error('获取员工统计异常:', error);
      throw error;
    }
  }
}

// 导出API实例
export const employeeListApi = new EmployeeListApi(); 