import { supabase } from './supabase';

export interface EmployeeOperationLog {
  id: string;
  employee_id: string | null;
  operation_type: string;
  operation_description: string;
  old_data: any;
  new_data: any;
  operator_id: string | null;
  operator_name: string | null;
  created_at: string;
  employee_name?: string;
  employee_uid?: string;
}

export const employeeOperationLogApi = {
  // 获取员工操作历史
  async getEmployeeOperationHistory(employeeId: string): Promise<EmployeeOperationLog[]> {
    const { data, error } = await supabase
      .from('employee_operation_log')
      .select(`
        *,
        employee_list!inner(employee_name, employee_uid)
      `)
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  },

  // 获取所有操作历史（通过视图）
  async getAllOperationHistory(): Promise<EmployeeOperationLog[]> {
    const { data, error } = await supabase
      .from('employee_operation_history')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  },

  // 获取特定员工的操作历史（通过视图）
  async getEmployeeHistoryByView(employeeId: string): Promise<EmployeeOperationLog[]> {
    const { data, error } = await supabase
      .from('employee_operation_history')
      .select('*')
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  },

  // 手动记录操作日志
  async manualLogOperation(
    employeeId: string,
    operationType: string,
    operationDescription: string,
    oldData?: any,
    newData?: any,
    operatorId?: string,
    operatorName?: string
  ): Promise<string> {
    const { data, error } = await supabase
      .rpc('manual_log_employee_operation', {
        p_employee_id: employeeId,
        p_operation_type: operationType,
        p_operation_description: operationDescription,
        p_old_data: oldData,
        p_new_data: newData,
        p_operator_id: operatorId,
        p_operator_name: operatorName
      });

    if (error) {
      throw error;
    }

    return data;
  }
}; 