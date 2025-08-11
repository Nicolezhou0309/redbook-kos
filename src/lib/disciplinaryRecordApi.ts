import { supabase } from './supabase';
import type { DisciplinaryRecord, DisciplinaryRecordForm } from '../types/employee';

// 简化的违规状态类型（直接从数据库获取）
export interface ViolationStatus {
  employeeId: string;
  employeeName: string;
  currentYellowCards: number;
  currentRedCards: number;
  status: 'normal' | 'yellow' | 'red';
}

// 扩展的违规记录类型，包含生效状态
export interface DisciplinaryRecordWithEffective extends DisciplinaryRecord {
  is_effective?: boolean;
}

export const disciplinaryRecordApi = {
  // 获取所有违规记录（只获取生效的记录）
  async getAllDisciplinaryRecords(): Promise<DisciplinaryRecord[]> {
    try {
      const { data, error } = await supabase
        .from('disciplinary_record')
        .select('*')
        .eq('is_effective', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('获取违规记录失败:', error);
      throw error;
    }
  },

  // 获取所有违规记录（包括生效和失效的记录）
  async getAllDisciplinaryRecordsWithEffective(): Promise<DisciplinaryRecordWithEffective[]> {
    try {
      const { data, error } = await supabase
        .from('disciplinary_record')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('获取所有违规记录失败:', error);
      throw error;
    }
  },

  // 根据员工姓名获取违规记录（只获取生效的记录）
  async getDisciplinaryRecordsByEmployeeName(employeeName: string): Promise<DisciplinaryRecord[]> {
    try {
      const { data, error } = await supabase
        .from('disciplinary_record')
        .select('*')
        .ilike('employee_name', `%${employeeName}%`)
        .eq('is_effective', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('根据员工姓名获取违规记录失败:', error);
      throw error;
    }
  },

  // 根据时间范围获取违规记录（只获取生效的记录）
  async getDisciplinaryRecordsByTimeRange(startDate: string, endDate: string): Promise<DisciplinaryRecord[]> {
    try {
      const { data, error } = await supabase
        .from('disciplinary_record')
        .select('*')
        .gte('created_at', `${startDate}T00:00:00`)
        .lte('created_at', `${endDate}T23:59:59`)
        .eq('is_effective', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('根据时间范围获取违规记录失败:', error);
      throw error;
    }
  },

  // 根据来源类型获取违规记录（只获取生效的记录）
  async getDisciplinaryRecordsBySourceType(sourceType: string): Promise<DisciplinaryRecord[]> {
    try {
      const { data, error } = await supabase
        .from('disciplinary_record')
        .select('*')
        .eq('source_type', sourceType)
        .eq('is_effective', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('根据来源类型获取违规记录失败:', error);
      throw error;
    }
  },

  // 根据来源表名获取违规记录（只获取生效的记录）
  async getDisciplinaryRecordsBySourceTable(sourceTable: string): Promise<DisciplinaryRecord[]> {
    try {
      const { data, error } = await supabase
        .from('disciplinary_record')
        .select('*')
        .eq('source_table', sourceTable)
        .eq('is_effective', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('根据来源表名获取违规记录失败:', error);
      throw error;
    }
  },

  // 根据员工ID获取违规记录（只获取生效的记录）
  async getDisciplinaryRecordsByEmployeeId(employeeId: string): Promise<DisciplinaryRecord[]> {
    try {
      const { data, error } = await supabase
        .from('disciplinary_record')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('is_effective', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('获取员工违规记录失败:', error);
      throw error;
    }
  },

  // 根据员工ID获取所有违规记录（包括生效和失效的记录）
  async getAllDisciplinaryRecordsByEmployeeId(employeeId: string): Promise<DisciplinaryRecordWithEffective[]> {
    try {
      const { data, error } = await supabase
        .from('disciplinary_record')
        .select('*')
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('获取员工所有违规记录失败:', error);
      throw error;
    }
  },

  // 获取员工违规数量（只计算生效的记录）
  async getEmployeeViolationCount(employeeId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('disciplinary_record')
        .select('*', { count: 'exact', head: true })
        .eq('employee_id', employeeId)
        .eq('is_effective', true);

      if (error) {
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error('获取员工违规数量失败:', error);
      throw error;
    }
  },

  // 批量获取员工违规数量（只计算生效的记录）
  async getEmployeeViolationCounts(employeeIds: string[]): Promise<Record<string, number>> {
    try {
      const { data, error } = await supabase
        .from('disciplinary_record')
        .select('employee_id')
        .in('employee_id', employeeIds)
        .eq('is_effective', true);

      if (error) {
        throw error;
      }

      // 统计每个员工的违规数量
      const violationCounts: Record<string, number> = {};
      employeeIds.forEach(id => {
        violationCounts[id] = 0;
      });

      data?.forEach(record => {
        if (record.employee_id) {
          violationCounts[record.employee_id] = (violationCounts[record.employee_id] || 0) + 1;
        }
      });

      return violationCounts;
    } catch (error) {
      console.error('批量获取员工违规数量失败:', error);
      throw error;
    }
  },

  // 创建违规记录
  async createDisciplinaryRecord(data: DisciplinaryRecordForm): Promise<DisciplinaryRecord> {
    try {
      const { data: newRecord, error } = await supabase
        .from('disciplinary_record')
        .insert([{ ...data, is_effective: data.is_effective ?? true }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return newRecord;
    } catch (error) {
      console.error('创建违规记录失败:', error);
      throw error;
    }
  },

  // 更新违规记录
  async updateDisciplinaryRecord(id: string, data: Partial<DisciplinaryRecordForm>): Promise<DisciplinaryRecord> {
    try {
      const { data: updatedRecord, error } = await supabase
        .from('disciplinary_record')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return updatedRecord;
    } catch (error) {
      console.error('更新违规记录失败:', error);
      throw error;
    }
  },

  // 删除违规记录
  async deleteDisciplinaryRecord(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('disciplinary_record')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('删除违规记录失败:', error);
      throw error;
    }
  },

  // 根据类型获取违规记录（只获取生效的记录）
  async getDisciplinaryRecordsByType(type: string): Promise<DisciplinaryRecord[]> {
    try {
      const { data, error } = await supabase
        .from('disciplinary_record')
        .select('*')
        .eq('type', type)
        .eq('is_effective', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('根据类型获取违规记录失败:', error);
      throw error;
    }
  },

  // 批量创建违规记录
  async batchCreateDisciplinaryRecords(records: DisciplinaryRecordForm[]): Promise<DisciplinaryRecord[]> {
    try {
      if (!records || records.length === 0) {
        throw new Error('没有要创建的记录')
      }

      // 验证每条记录的必填字段
      const validatedRecords = records.map((record, index) => {
        if (!record.employee_name || !record.reason) {
          throw new Error(`记录 ${index + 1} 缺少必填字段: employee_name 或 reason`)
        }
        
        // 确保所有字段都有有效值，避免 undefined 或 null
        return {
          ...record,
          employee_name: record.employee_name || '',
          reason: record.reason || '',
          type: record.type || '',
          employee_id: record.employee_id || '',
          source_type: record.source_type || 'auto',
          source_table: record.source_table || '',
          source_record_id: record.source_record_id || '',
          source_time_range: record.source_time_range || {},
          source_batch_id: record.source_batch_id || '',
          source_file_name: record.source_file_name || '',
          source_import_time: record.source_import_time || new Date().toISOString(),
          source_metadata: record.source_metadata || {},
          is_effective: record.is_effective ?? true
        }
      })

      console.log('验证后的记录:', validatedRecords)

      const { data, error } = await supabase
        .from('disciplinary_record')
        .insert(validatedRecords)
        .select()

      if (error) {
        console.error('Supabase 插入错误:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('批量创建违规记录失败:', error)
      throw error
    }
  },

  // 设置违规记录生效状态
  async setDisciplinaryRecordEffective(recordId: string, isEffective: boolean): Promise<void> {
    try {
      const { error } = await supabase
        .rpc('set_disciplinary_record_effective', {
          p_record_id: recordId,
          p_is_effective: isEffective
        });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('设置违规记录生效状态失败:', error);
      throw error;
    }
  },

  // 批量设置违规记录生效状态
  async batchSetDisciplinaryRecordsEffective(recordIds: string[], isEffective: boolean): Promise<void> {
    try {
      const { error } = await supabase
        .rpc('batch_set_disciplinary_records_effective', {
          p_record_ids: recordIds,
          p_is_effective: isEffective
        });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('批量设置违规记录生效状态失败:', error);
      throw error;
    }
  },

  // 获取生效违规记录数量
  async getEffectiveViolationCount(employeeId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .rpc('get_effective_violation_count', {
          p_employee_id: employeeId
        });

      if (error) {
        throw error;
      }

      return data || 0;
    } catch (error) {
      console.error('获取生效违规记录数量失败:', error);
      throw error;
    }
  },

  // 获取统计信息（只统计生效的记录）
  async getStatistics(): Promise<{
    totalRecords: number;
    employeeCount: number;
    employeeStats: Record<string, number>;
    monthlyStats: Record<string, number>;
  }> {
    try {
      const { data, error } = await supabase
        .from('disciplinary_record')
        .select('*')
        .eq('is_effective', true);

      if (error) {
        throw error;
      }

      const records = data || [];
      const totalRecords = records.length;
      
      // 统计涉及员工数
      const employeeSet = new Set(records.map(r => r.employee_name));
      const employeeCount = employeeSet.size;
      
      // 统计每个员工的违规次数
      const employeeStats: Record<string, number> = {};
      records.forEach(record => {
        employeeStats[record.employee_name] = (employeeStats[record.employee_name] || 0) + 1;
      });
      
      // 统计每月违规次数
      const monthlyStats: Record<string, number> = {};
      records.forEach(record => {
        const month = new Date(record.created_at).toISOString().slice(0, 7);
        monthlyStats[month] = (monthlyStats[month] || 0) + 1;
      });

      return {
        totalRecords,
        employeeCount,
        employeeStats,
        monthlyStats
      };
    } catch (error) {
      console.error('获取统计信息失败:', error);
      throw error;
    }
  },

  // 获取员工违规状态（从数据库直接获取）
  async getEmployeeViolationStatus(employeeId: string): Promise<ViolationStatus | null> {
    try {
      const { data, error } = await supabase
        .from('employee_list')
        .select('id, employee_name, current_yellow_cards, current_red_cards, violation_status')
        .eq('id', employeeId)
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        return null;
      }

      return {
        employeeId: data.id,
        employeeName: data.employee_name,
        currentYellowCards: data.current_yellow_cards || 0,
        currentRedCards: data.current_red_cards || 0,
        status: data.violation_status || 'normal'
      };
    } catch (error) {
      console.error('获取员工违规状态失败:', error);
      throw error;
    }
  },

  // 批量获取员工违规状态（从数据库直接获取）
  async getEmployeeViolationStatuses(employeeIds: string[]): Promise<Record<string, ViolationStatus | null>> {
    try {
      const { data, error } = await supabase
        .from('employee_list')
        .select('id, employee_name, current_yellow_cards, current_red_cards, violation_status')
        .in('id', employeeIds);

      if (error) {
        throw error;
      }

      const statuses: Record<string, ViolationStatus | null> = {};
      
      // 初始化所有员工的状态为null
      employeeIds.forEach(id => {
        statuses[id] = null;
      });

      // 填充有数据的员工状态
      data?.forEach(employee => {
        statuses[employee.id] = {
          employeeId: employee.id,
          employeeName: employee.employee_name,
          currentYellowCards: employee.current_yellow_cards || 0,
          currentRedCards: employee.current_red_cards || 0,
          status: employee.violation_status || 'normal'
        };
      });

      return statuses;
    } catch (error) {
      console.error('批量获取员工违规状态失败:', error);
      throw error;
    }
  },

  // 手动刷新员工违规状态
  async refreshEmployeeViolationStatus(employeeId: string): Promise<ViolationStatus | null> {
    try {
      const { data, error } = await supabase
        .rpc('refresh_employee_violation_status', { p_employee_id: employeeId });

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('刷新员工违规状态失败:', error);
      throw error;
    }
  },

  // 批量刷新所有员工违规状态
  async refreshAllEmployeesViolationStatus(): Promise<void> {
    try {
      const { error } = await supabase
        .rpc('refresh_all_employees_violation_status');

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('批量刷新员工违规状态失败:', error);
      throw error;
    }
  },

  // 软清空：将某员工的所有生效违规记录置为无效
  async softClearEmployeeViolations(employeeId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('disciplinary_record')
        .update({ is_effective: false })
        .eq('employee_id', employeeId)
        .eq('is_effective', true);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('软清空员工违规记录失败:', error);
      throw error;
    }
  },

  // 软清空：将多个员工的所有生效违规记录置为无效
  async softClearEmployeesViolations(employeeIds: string[]): Promise<void> {
    if (!employeeIds || employeeIds.length === 0) return;
    try {
      const { error } = await supabase
        .from('disciplinary_record')
        .update({ is_effective: false })
        .in('employee_id', employeeIds)
        .eq('is_effective', true);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('批量软清空员工违规记录失败:', error);
      throw error;
    }
  },

  // 获取员工违规状态历史
  async getEmployeeViolationHistory(employeeId: string): Promise<{
    violations: DisciplinaryRecord[];
    status: ViolationStatus | null;
    weeklyStats: Record<string, number>;
  }> {
    try {
      const violations = await this.getDisciplinaryRecordsByEmployeeId(employeeId);
      const status = await this.getEmployeeViolationStatus(employeeId);
      
      // 按周统计违规次数
      const weeklyStats: Record<string, number> = {};
      violations.forEach(violation => {
        const week = new Date(violation.created_at).toISOString().slice(0, 10);
        const weekKey = new Date(week).toISOString().slice(0, 7) + '-W' + 
          Math.ceil((new Date(week).getDate() + new Date(week).getDay()) / 7);
        weeklyStats[weekKey] = (weeklyStats[weekKey] || 0) + 1;
      });
      
      return {
        violations,
        status,
        weeklyStats
      };
    } catch (error) {
      console.error('获取员工违规历史失败:', error);
      throw error;
    }
  },

  // 获取所有员工的违规状态概览
  async getAllEmployeeViolationStatuses(): Promise<{
    totalEmployees: number;
    normalCount: number;
    yellowCount: number;
    redCount: number;
    statuses: Record<string, ViolationStatus | null>;
  }> {
    try {
      // 获取所有员工的状态
      const { data, error } = await supabase
        .from('employee_list')
        .select('id, employee_name, current_yellow_cards, current_red_cards, violation_status');

      if (error) {
        throw error;
      }

      const employees = data || [];
      const statuses: Record<string, ViolationStatus | null> = {};
      
      // 统计各状态数量
      let normalCount = 0;
      let yellowCount = 0;
      let redCount = 0;
      
      employees.forEach(employee => {
        const status: ViolationStatus = {
          employeeId: employee.id,
          employeeName: employee.employee_name,
          currentYellowCards: employee.current_yellow_cards || 0,
          currentRedCards: employee.current_red_cards || 0,
          status: employee.violation_status || 'normal'
        };
        
        statuses[employee.id] = status;
        
        switch (status.status) {
          case 'normal':
            normalCount++;
            break;
          case 'yellow':
            yellowCount++;
            break;
          case 'red':
            redCount++;
            break;
        }
      });
      
      return {
        totalEmployees: employees.length,
        normalCount,
        yellowCount,
        redCount,
        statuses
      };
    } catch (error) {
      console.error('获取所有员工违规状态概览失败:', error);
      throw error;
    }
  },

  // 获取所有员工的违规状态统计（重命名避免重复）
  async getAllEmployeeViolationStatusesWithStats(): Promise<{
    totalEmployees: number;
    normalCount: number;
    yellowCount: number;
    redCount: number;
    statuses: Record<string, ViolationStatus | null>;
  }> {
    try {
      // 首先获取所有员工
      const { data: employees, error: employeesError } = await supabase
        .from('employee_list')
        .select('id, employee_name');

      if (employeesError) {
        throw employeesError;
      }

      if (!employees || employees.length === 0) {
        return {
          totalEmployees: 0,
          normalCount: 0,
          yellowCount: 0,
          redCount: 0,
          statuses: {}
        };
      }

      // 获取所有员工的违规状态
      const employeeIds = employees.map(emp => emp.id);
      const statuses = await this.getEmployeeViolationStatuses(employeeIds);

      // 统计各状态数量
      let normalCount = 0;
      let yellowCount = 0;
      let redCount = 0;

      Object.values(statuses).forEach((status: ViolationStatus | null) => {
        if (status) {
          switch (status.status) {
            case 'normal':
              normalCount++;
              break;
            case 'yellow':
              yellowCount++;
              break;
            case 'red':
              redCount++;
              break;
          }
        } else {
          normalCount++; // 没有违规状态记录视为正常
        }
      });

      return {
        totalEmployees: employees.length,
        normalCount,
        yellowCount,
        redCount,
        statuses
      };
    } catch (error) {
      console.error('获取所有员工违规状态失败:', error);
      throw error;
    }
  },

  // 根据违规状态筛选员工（带分页）
  async getEmployeesByViolationStatus(status: 'normal' | 'yellow' | 'red', params?: { page: number; pageSize: number }): Promise<{
    data: Array<{ id: string; employee_name: string; employee_uid: string; violation_status: ViolationStatus | null }>;
    total: number;
    page: number;
    pageSize: number;
  }> {
    try {
      // 如果没有提供分页参数，返回所有数据
      if (!params) {
        // 首先获取所有员工
        const { data: employees, error: employeesError } = await supabase
          .from('employee_list')
          .select('id, employee_name, employee_uid')
          .order('created_at', { ascending: false });

        if (employeesError) {
          throw employeesError;
        }

        if (!employees || employees.length === 0) {
          return {
            data: [],
            total: 0,
            page: 1,
            pageSize: employees.length
          };
        }

        // 获取所有员工的违规状态
        const employeeIds = employees.map(emp => emp.id);
        const statuses = await this.getEmployeeViolationStatuses(employeeIds);

        // 根据违规状态筛选员工
        const filteredEmployees = employees.filter(emp => {
          const violationStatus = statuses[emp.id];
          if (status === 'normal') {
            return !violationStatus || violationStatus.status === 'normal';
          } else {
            return violationStatus && violationStatus.status === status;
          }
        });

        // 为筛选后的员工添加违规状态信息
        const dataWithViolations = filteredEmployees.map(emp => ({
          ...emp,
          violation_status: statuses[emp.id] || null
        }));

        return {
          data: dataWithViolations,
          total: filteredEmployees.length,
          page: 1,
          pageSize: filteredEmployees.length
        };
      } else {
        // 使用分页参数的情况
        const page = params.page || 1;
        const pageSize = params.pageSize || 10;
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        // 首先获取所有员工
        const { data: employees, error: employeesError } = await supabase
          .from('employee_list')
          .select('id, employee_name, employee_uid')
          .order('created_at', { ascending: false });

        if (employeesError) {
          throw employeesError;
        }

        if (!employees || employees.length === 0) {
          return {
            data: [],
            total: 0,
            page,
            pageSize
          };
        }

        // 获取所有员工的违规状态
        const employeeIds = employees.map(emp => emp.id);
        const statuses = await this.getEmployeeViolationStatuses(employeeIds);

        // 根据违规状态筛选员工
        const filteredEmployees = employees.filter(emp => {
          const violationStatus = statuses[emp.id];
          if (status === 'normal') {
            return !violationStatus || violationStatus.status === 'normal';
          } else {
            return violationStatus && violationStatus.status === status;
          }
        });

        // 应用分页
        const paginatedEmployees = filteredEmployees.slice(from, to);

        // 为分页后的员工添加违规状态信息
        const dataWithViolations = paginatedEmployees.map(emp => ({
          ...emp,
          violation_status: statuses[emp.id] || null
        }));

        return {
          data: dataWithViolations,
          total: filteredEmployees.length,
          page,
          pageSize
        };
      }
    } catch (error) {
      console.error('根据违规状态筛选员工失败:', error);
      throw error;
    }
  },

  // 根据多个违规状态筛选员工（支持多选，带分页）
  async getEmployeesByMultipleViolationStatuses(statuses: ('normal' | 'yellow' | 'red')[], params?: { page: number; pageSize: number }): Promise<{
    data: Array<{ id: string; employee_name: string; employee_uid: string; violation_status: ViolationStatus | null }>;
    total: number;
    page: number;
    pageSize: number;
  }> {
    try {
      // 如果没有提供分页参数，返回所有数据
      if (!params) {
        // 首先获取所有员工
        const { data: employees, error: employeesError } = await supabase
          .from('employee_list')
          .select('id, employee_name, employee_uid')
          .order('created_at', { ascending: false });

        if (employeesError) {
          throw employeesError;
        }

        if (!employees || employees.length === 0) {
          return {
            data: [],
            total: 0,
            page: 1,
            pageSize: employees.length
          };
        }

        // 获取所有员工的违规状态
        const employeeIds = employees.map(emp => emp.id);
        const violationStatuses = await this.getEmployeeViolationStatuses(employeeIds);

        // 根据多个违规状态筛选员工
        const filteredEmployees = employees.filter(emp => {
          const violationStatus = violationStatuses[emp.id];
          const currentStatus = violationStatus ? violationStatus.status : 'normal';
          return statuses.includes(currentStatus);
        });

        // 为筛选后的员工添加违规状态信息
        const dataWithViolations = filteredEmployees.map(emp => ({
          ...emp,
          violation_status: violationStatuses[emp.id] || null
        }));

        return {
          data: dataWithViolations,
          total: filteredEmployees.length,
          page: 1,
          pageSize: filteredEmployees.length
        };
      } else {
        // 使用分页参数的情况
        const page = params.page || 1;
        const pageSize = params.pageSize || 10;
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        // 首先获取所有员工
        const { data: employees, error: employeesError } = await supabase
          .from('employee_list')
          .select('id, employee_name, employee_uid')
          .order('created_at', { ascending: false });

        if (employeesError) {
          throw employeesError;
        }

        if (!employees || employees.length === 0) {
          return {
            data: [],
            total: 0,
            page,
            pageSize
          };
        }

        // 获取所有员工的违规状态
        const employeeIds = employees.map(emp => emp.id);
        const violationStatuses = await this.getEmployeeViolationStatuses(employeeIds);

        // 根据多个违规状态筛选员工
        const filteredEmployees = employees.filter(emp => {
          const violationStatus = violationStatuses[emp.id];
          const currentStatus = violationStatus ? violationStatus.status : 'normal';
          return statuses.includes(currentStatus);
        });

        // 应用分页
        const paginatedEmployees = filteredEmployees.slice(from, to);

        // 为分页后的员工添加违规状态信息
        const dataWithViolations = paginatedEmployees.map(emp => ({
          ...emp,
          violation_status: violationStatuses[emp.id] || null
        }));

        return {
          data: dataWithViolations,
          total: filteredEmployees.length,
          page,
          pageSize
        };
      }
    } catch (error) {
      console.error('根据多个违规状态筛选员工失败:', error);
      throw error;
    }
  },

  // 根据违规状态和持有周期组合筛选员工（带分页）
  async getEmployeesByViolationStatusAndHoldingPeriod(
    violationStatus: 'normal' | 'yellow' | 'red',
    holdingPeriod: string,
    params?: { page: number; pageSize: number }
  ): Promise<{
    data: Array<{ id: string; employee_name: string; employee_uid: string; violation_status: ViolationStatus | null }>;
    total: number;
    page: number;
    pageSize: number;
  }> {
    try {
      const page = params?.page || 1;
      const pageSize = params?.pageSize || 10;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // 首先根据持有周期筛选员工
      let query = supabase.from('employee_list').select('id, employee_name, employee_uid, activation_time');

      // 根据持有周期类型筛选
      switch (holdingPeriod) {
        case 'not_activated':
          query = query.is('activation_time', null);
          break;
        case '1_30':
          query = query
            .not('activation_time', 'is', null)
            .gte('activation_time', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
            .lte('activation_time', new Date().toISOString().split('T')[0]);
          break;
        case '31_90':
          query = query
            .not('activation_time', 'is', null)
            .gte('activation_time', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
            .lt('activation_time', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
          break;
        case '91_180':
          query = query
            .not('activation_time', 'is', null)
            .gte('activation_time', new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
            .lt('activation_time', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
          break;
        case '181_365':
          query = query
            .not('activation_time', 'is', null)
            .gte('activation_time', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
            .lt('activation_time', new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
          break;
        case '365_plus':
          query = query
            .not('activation_time', 'is', null)
            .lt('activation_time', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
          break;
        default:
          throw new Error('无效的持有周期类型');
      }

      const { data: employees, error: employeesError } = await query.order('created_at', { ascending: false });

      if (employeesError) {
        throw employeesError;
      }

      if (!employees || employees.length === 0) {
        return {
          data: [],
          total: 0,
          page,
          pageSize
        };
      }

      // 获取这些员工的违规状态
      const employeeIds = employees.map(emp => emp.id);
      const statuses = await this.getEmployeeViolationStatuses(employeeIds);

      // 根据违规状态进一步筛选
      const filteredEmployees = employees.filter(emp => {
        const violationStatusObj = statuses[emp.id];
        // 如果没有违规状态对象，默认不过滤
        if (!violationStatusObj) return true;
        // violationStatusObj.status 可能为 'normal' | 'yellow' | 'red'
        // 这里假设有一个变量 violationStatusFilter，表示当前筛选的违规状态
        // 如果 violationStatusFilter 为 'normal'，只保留 status 为 'normal' 的员工
        // 如果 violationStatusFilter 为 'yellow' 或 'red'，只保留对应状态的员工
        // 如果 violationStatusFilter 为空或未指定，则不过滤
        if (!violationStatus) return true;
        return violationStatusObj.status === violationStatus;
      });

      // 应用分页
      const paginatedEmployees = filteredEmployees.slice(from, to);

      // 为分页后的员工添加违规状态信息
      const dataWithViolations = paginatedEmployees.map(emp => ({
        ...emp,
        violation_status: statuses[emp.id] || null
      }));

      return {
        data: dataWithViolations,
        total: filteredEmployees.length,
        page,
        pageSize
      };
    } catch (error) {
      console.error('根据违规状态和持有周期筛选员工失败:', error);
      throw error;
    }
  },

  // 获取本周违规统计（只统计生效的记录）
  async getCurrentWeekViolationStats(): Promise<{
    totalViolations: number;
    newYellowCards: number;
    newRedCards: number;
    recoveredYellowCards: number;
    employeeStats: Record<string, number>;
  }> {
    try {
      const currentWeek = new Date().toISOString().slice(0, 10);
      const weekStart = new Date(currentWeek);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const { data: violations, error } = await supabase
        .from('disciplinary_record')
        .select('*')
        .gte('created_at', weekStart.toISOString())
        .lte('created_at', weekEnd.toISOString())
        .eq('is_effective', true);

      if (error) {
        throw error;
      }

      const violationsList = violations || [];
      
      // 统计员工违规次数
      const employeeStats: Record<string, number> = {};
      violationsList.forEach(violation => {
        if (violation.employee_id) {
          employeeStats[violation.employee_id] = (employeeStats[violation.employee_id] || 0) + 1;
        }
      });
      
      return {
        totalViolations: violationsList.length,
        newYellowCards: violationsList.length, // 每次违规都产生一张黄牌
        newRedCards: 0, // 需要根据累计黄牌计算
        recoveredYellowCards: 0, // 需要根据上周状态计算
        employeeStats
      };
    } catch (error) {
      console.error('获取本周违规统计失败:', error);
      throw error;
    }
  }
}; 