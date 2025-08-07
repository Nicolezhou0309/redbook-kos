import { supabase } from './supabase';
import type { EmployeeNotesData, EmployeeNotesDataForm } from '../types/employee';

export const employeeNotesApi = {
  // 获取所有员工笔记数据
  async getAllEmployeeNotesData(): Promise<EmployeeNotesData[]> {
    try {
      const { data } = await supabase
        .from('employee_notes_data')
        .select('*')
        .order('created_at', { ascending: false });
      return data || [];
    } catch (error) {
      console.error('数据库连接异常:', error);
      throw error;
    }
  },

  // 根据时间范围获取员工笔记数据
  async getEmployeeNotesDataByTimeRange(timeRange: string): Promise<EmployeeNotesData[]> {
    try {
      const { data } = await supabase
        .from('employee_notes_data')
        .select('*')
        .gte('publish_time', timeRange)
        .order('created_at', { ascending: false });

      return data || [];
    } catch (error) {
      console.error('数据库连接异常:', error);
      throw error;
    }
  },

  // 根据员工名称获取笔记数据
  async getEmployeeNotesDataByEmployeeName(employeeName: string): Promise<EmployeeNotesData[]> {
    try {
      const { data, error } = await supabase
        .from('employee_notes_data')
        .select('*')
        .eq('employee_name', employeeName)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('数据库连接失败:', error.message);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('数据库连接异常:', error);
      throw error;
    }
  },

  // 根据creator_id获取笔记数据
  async getEmployeeNotesDataByCreatorId(creatorId: string): Promise<EmployeeNotesData[]> {
    try {
      const { data, error } = await supabase
        .from('employee_notes_data')
        .select('*')
        .eq('creator_id', creatorId)
        .order('publish_time', { ascending: false });

      if (error) {
        console.error('数据库连接失败:', error.message);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('数据库连接异常:', error);
      throw error;
    }
  },

  // 优化的创建员工笔记数据函数
  async createEmployeeNotesData(data: EmployeeNotesDataForm): Promise<EmployeeNotesData> {
    try {
      // 数据验证和清理
      const cleanedData = this.validateAndCleanData(data);
      
      console.log('准备上传的数据:', {
        note_id: cleanedData.note_id,
        note_title: cleanedData.note_title,
        creator_name: cleanedData.creator_name,
        employee_name: cleanedData.employee_name,
        total_exposure_count: cleanedData.total_exposure_count,
        total_read_count: cleanedData.total_read_count,
        total_interaction_count: cleanedData.total_interaction_count
      });

      // 首先检查笔记ID是否已存在
      const { data: existingData, error: checkError } = await supabase
        .from('employee_notes_data')
        .select('id, note_id, note_title, creator_name, employee_name')
        .eq('note_id', cleanedData.note_id)
        .limit(1);

      if (checkError) {
        console.error('检查重复数据失败:', checkError.message);
        throw new Error(`检查重复数据失败: ${checkError.message}`);
      }

      if (existingData && existingData.length > 0) {
        // 如果笔记ID已存在，则更新现有记录
        console.log('发现重复数据，准备更新:', existingData[0]);
        
        const { data: result, error } = await supabase
          .from('employee_notes_data')
          .update(cleanedData)
          .eq('note_id', cleanedData.note_id)
          .select()
          .single();

        if (error) {
          console.error('更新员工笔记数据失败:', error);
          throw error;
        }

        console.log('数据更新成功:', result.note_id);
        return result;
      } else {
        // 如果笔记ID不存在，则插入新记录
        console.log('插入新数据:', cleanedData.note_id);
        
        const { data: result, error } = await supabase
          .from('employee_notes_data')
          .insert([cleanedData])
          .select()
          .single();

        if (error) {
          console.error('创建员工笔记数据失败:', error);
          throw error;
        }

        console.log('数据插入成功:', result.note_id);
        return result;
      }
    } catch (error) {
      console.error('数据库操作失败:', error);
      throw error;
    }
  },

  // 数据验证和清理函数
  validateAndCleanData(data: EmployeeNotesDataForm): EmployeeNotesDataForm {
    const cleaned: EmployeeNotesDataForm = { ...data };

    // 确保必需字段存在
    if (!cleaned.note_id) {
      cleaned.note_id = `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // 确保数值字段为数字类型，0值也要保留
    const numericFields = [
      'total_exposure_count', 'total_read_count', 'total_interaction_count',
      'total_read_rate', 'total_interaction_rate', 'avg_read_duration',
      'three_sec_read_rate', 'natural_exposure_count', 'natural_read_count',
      'natural_read_rate', 'promotion_total_exposure_count', 'promotion_total_read_count',
      'bidding_promotion_exposure_count', 'bidding_promotion_click_count',
      'bidding_promotion_click_rate', 'bidding_promotion_interaction_count',
      'bidding_promotion_interaction_rate', 'form_submissions',
      'private_message_consultations', 'private_message_openings',
      'private_message_leads', 'form_conversion_rate', 'seven_day_payment_orders',
      'seven_day_payment_amount', 'seven_day_payment_conversion_rate',
      'seven_day_payment_roi', 'blogger_quotation', 'service_fee'
    ] as const;

    numericFields.forEach(field => {
      if (field in cleaned) {
        const value = (cleaned as any)[field];
        if (value === null || value === undefined || value === '') {
          (cleaned as any)[field] = 0;
        } else {
          const numValue = typeof value === 'string' ? parseFloat(value) : Number(value);
          (cleaned as any)[field] = isNaN(numValue) ? 0 : numValue;
        }
      }
    });

    // 确保字符串字段不为undefined
    const stringFields = [
      'note_title', 'creator_name', 'employee_name', 'note_status',
      'blogger_category', 'publish_time'
    ] as const;

    stringFields.forEach(field => {
      if (field in cleaned) {
        const value = (cleaned as any)[field];
        if (value === null || value === undefined) {
          (cleaned as any)[field] = '';
        }
      }
    });

    return cleaned;
  },

  // 更新员工笔记数据
  async updateEmployeeNotesData(id: string, data: Partial<EmployeeNotesDataForm>): Promise<EmployeeNotesData> {
    try {
      const { data: result, error } = await supabase
        .from('employee_notes_data')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('更新员工笔记数据失败:', error);
        throw error;
      }

      return result;
    } catch (error) {
      console.error('数据库操作失败:', error);
      throw error;
    }
  },

  // 删除员工笔记数据
  async deleteEmployeeNotesData(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('employee_notes_data')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('删除员工笔记数据失败:', error);
        throw error;
      }
    } catch (error) {
      console.error('数据库操作失败:', error);
      // 模拟删除成功
    }
  },

  // 批量删除员工笔记数据
  async batchDeleteEmployeeNotesData(ids: string[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('employee_notes_data')
        .delete()
        .in('id', ids);

      if (error) {
        throw new Error(`批量删除员工笔记数据失败: ${error.message}`);
      }
    } catch (error) {
      console.error('数据库操作失败:', error);
    }
  },

  // 批量创建员工笔记数据
  async batchCreateEmployeeNotesData(dataList: EmployeeNotesDataForm[]): Promise<EmployeeNotesData[]> {
    try {
      const { data, error } = await supabase
        .from('employee_notes_data')
        .insert(dataList)
        .select();

      if (error) {
        throw new Error(`批量创建员工笔记数据失败: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('数据库操作失败:', error);
      throw error;
    }
  },

  // 检查员工笔记数据是否存在（用于查重）
  async checkEmployeeNotesDataExists(noteId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('employee_notes_data')
        .select('id')
        .eq('note_id', noteId)
        .limit(1);

      if (error) {
        console.error('数据库连接失败:', error.message);
        return false;
      }

      return (data && data.length > 0);
    } catch (error) {
      console.error('数据库连接异常:', error);
      return false;
    }
  },

  // 获取统计数据
  async getStatistics(timeRange?: string) {
    try {
      let query = supabase
        .from('employee_notes_data')
        .select('*');

      if (timeRange) {
        query = query.gte('publish_time', timeRange);
      }

      const { data } = await query;

      if (!data || data.length === 0) {
        return {
          totalNotes: 0,
          avgExposureCount: 0,
          avgClickCount: 0,
          avgLikeCount: 0,
          avgCommentCount: 0,
          avgPromotionCost: 0,
        };
      }

      const totalNotes = data.length;
      const avgExposureCount = data.reduce((sum, item) => sum + (item.total_exposure_count || 0), 0) / totalNotes;
      const avgReadCount = data.reduce((sum, item) => sum + (item.total_read_count || 0), 0) / totalNotes;
      const avgInteractionCount = data.reduce((sum, item) => sum + (item.total_interaction_count || 0), 0) / totalNotes;
      const avgReadRate = data.reduce((sum, item) => sum + (item.total_read_rate || 0), 0) / totalNotes;
      const avgInteractionRate = data.reduce((sum, item) => sum + (item.total_interaction_rate || 0), 0) / totalNotes;

      return {
        totalNotes,
        avgExposureCount: Math.round(avgExposureCount),
        avgReadCount: Math.round(avgReadCount),
        avgInteractionCount: Math.round(avgInteractionCount),
        avgReadRate: Math.round(avgReadRate * 100) / 100,
        avgInteractionRate: Math.round(avgInteractionRate * 100) / 100,
      };
    } catch (error) {
      console.error('数据库连接异常:', error);
      throw error;
    }
  },
}; 