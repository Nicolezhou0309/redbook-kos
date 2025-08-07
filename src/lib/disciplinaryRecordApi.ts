import { supabase } from './supabase';
import type { DisciplinaryRecord, DisciplinaryRecordForm } from '../types/employee';
import { calculateViolationStatus, type ViolationStatus, type ViolationRecord } from '../utils/violationStatusUtils';

export const disciplinaryRecordApi = {
  // 获取所有违规记录
  async getAllDisciplinaryRecords(): Promise<DisciplinaryRecord[]> {
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
      console.error('获取违规记录失败:', error);
      throw error;
    }
  },

  // 根据员工姓名获取违规记录
  async getDisciplinaryRecordsByEmployeeName(employeeName: string): Promise<DisciplinaryRecord[]> {
    try {
      const { data, error } = await supabase
        .from('disciplinary_record')
        .select('*')
        .ilike('employee_name', `%${employeeName}%`)
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

  // 根据时间范围获取违规记录
  async getDisciplinaryRecordsByTimeRange(startDate: string, endDate: string): Promise<DisciplinaryRecord[]> {
    try {
      const { data, error } = await supabase
        .from('disciplinary_record')
        .select('*')
        .gte('created_at', `${startDate}T00:00:00`)
        .lte('created_at', `${endDate}T23:59:59`)
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

  // 根据来源类型获取违规记录
  async getDisciplinaryRecordsBySourceType(sourceType: string): Promise<DisciplinaryRecord[]> {
    try {
      const { data, error } = await supabase
        .from('disciplinary_record')
        .select('*')
        .eq('source_type', sourceType)
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

  // 根据来源表名获取违规记录
  async getDisciplinaryRecordsBySourceTable(sourceTable: string): Promise<DisciplinaryRecord[]> {
    try {
      const { data, error } = await supabase
        .from('disciplinary_record')
        .select('*')
        .eq('source_table', sourceTable)
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

  // 根据员工ID获取违规记录
  async getDisciplinaryRecordsByEmployeeId(employeeId: string): Promise<DisciplinaryRecord[]> {
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
      console.error('获取员工违规记录失败:', error);
      throw error;
    }
  },

  // 获取员工违规数量
  async getEmployeeViolationCount(employeeId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('disciplinary_record')
        .select('*', { count: 'exact', head: true })
        .eq('employee_id', employeeId);

      if (error) {
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error('获取员工违规数量失败:', error);
      throw error;
    }
  },

  // 批量获取员工违规数量
  async getEmployeeViolationCounts(employeeIds: string[]): Promise<Record<string, number>> {
    try {
      const { data, error } = await supabase
        .from('disciplinary_record')
        .select('employee_id')
        .in('employee_id', employeeIds);

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
        .insert([data])
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

  // 根据类型获取违规记录
  async getDisciplinaryRecordsByType(type: string): Promise<DisciplinaryRecord[]> {
    try {
      const { data, error } = await supabase
        .from('disciplinary_record')
        .select('*')
        .eq('type', type)
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
      const { data, error } = await supabase
        .from('disciplinary_record')
        .insert(records)
        .select();

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('批量创建违规记录失败:', error);
      throw error;
    }
  },

  // 获取统计信息
  async getStatistics(): Promise<{
    totalRecords: number;
    employeeCount: number;
    employeeStats: Record<string, number>;
    monthlyStats: Record<string, number>;
  }> {
    try {
      const { data, error } = await supabase
        .from('disciplinary_record')
        .select('*');

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

  // 获取员工违规状态
  async getEmployeeViolationStatus(employeeId: string): Promise<ViolationStatus | null> {
    try {
      // 获取员工的所有违规记录
      const violations = await this.getDisciplinaryRecordsByEmployeeId(employeeId);
      
      if (violations.length === 0) {
        return null;
      }
      
      // 转换为ViolationRecord格式
      const violationRecords: ViolationRecord[] = violations.map(v => ({
        id: v.id,
        employeeId: v.employee_id || '',
        employeeName: v.employee_name,
        type: v.type || '',
        reason: v.reason,
        created_at: v.created_at,
        week: '' // 将在calculateViolationStatus中计算
      }));
      
      // 计算违规状态
      return calculateViolationStatus(violationRecords);
    } catch (error) {
      console.error('获取员工违规状态失败:', error);
      throw error;
    }
  },

  // 批量获取员工违规状态
  async getEmployeeViolationStatuses(employeeIds: string[]): Promise<Record<string, ViolationStatus | null>> {
    try {
      const statuses: Record<string, ViolationStatus | null> = {};
      
      // 并行获取每个员工的违规状态
      const promises = employeeIds.map(async (employeeId) => {
        try {
          const status = await this.getEmployeeViolationStatus(employeeId);
          statuses[employeeId] = status;
        } catch (error) {
          console.error(`获取员工 ${employeeId} 违规状态失败:`, error);
          statuses[employeeId] = null;
        }
      });
      
      await Promise.all(promises);
      return statuses;
    } catch (error) {
      console.error('批量获取员工违规状态失败:', error);
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
      // 获取所有有违规记录的员工ID
      const { data: violations, error } = await supabase
        .from('disciplinary_record')
        .select('employee_id')
        .not('employee_id', 'is', null);

      if (error) {
        throw error;
      }

      // 获取唯一的员工ID
      const employeeIds = [...new Set(violations?.map(v => v.employee_id).filter(Boolean) || [])];
      
      // 获取所有员工的违规状态
      const statuses = await this.getEmployeeViolationStatuses(employeeIds);
      
      // 统计各状态数量
      let normalCount = 0;
      let yellowCount = 0;
      let redCount = 0;
      
      Object.values(statuses).forEach(status => {
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
        }
      });
      
      return {
        totalEmployees: employeeIds.length,
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

  // 获取本周违规统计
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
        .lte('created_at', weekEnd.toISOString());

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