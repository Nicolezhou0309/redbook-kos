import { supabase } from './supabase';

export interface EmployeeSimpleJoinImportData {
  employee_name: string;
  employee_uid: string;
  xiaohongshu_nickname?: string;
  xiaohongshu_account_id?: string;
  region?: string;
  status?: string;
  activation_time?: string;
  total_interactions?: number;
  total_form_leads?: number;
  total_private_message_leads?: number;
  total_private_message_openings?: number;
  total_private_message_leads_kept?: number;
  published_notes_count?: number;
  promoted_notes_count?: number;
  notes_promotion_cost?: number;
  notes_exposure_count?: number;
  notes_click_count?: number;
  avg_response_time?: number;
  rate_1min_response?: string;
  rate_1hour_timeout?: string;
  user_rating_score?: number;
  time_range?: {
    start_date: string;
    end_date: string;
    remark: string;
  };
  response_time_range?: {
    start_date: string;
    end_date: string;
    remark: string;
  };
}

export interface ImportResult {
  success: boolean;
  message: string;
  importedRows?: number;
  errors?: string[];
}

// 批量导入员工数据宽表
export const importEmployeeSimpleJoinData = async (data: EmployeeSimpleJoinImportData[]): Promise<ImportResult> => {
  try {
    console.log('🔶 开始导入员工数据宽表:', data.length, '条数据');

    // 验证数据
    const validationErrors: string[] = [];
    const validData: EmployeeSimpleJoinImportData[] = [];

    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      const rowNumber = i + 2; // Excel行号从2开始（第1行是标题）

      // 必填字段验证
      if (!item.employee_name?.trim()) {
        validationErrors.push(`第${rowNumber}行: 员工姓名不能为空`);
        continue;
      }
      if (!item.employee_uid?.trim()) {
        validationErrors.push(`第${rowNumber}行: 员工UID不能为空`);
        continue;
      }

      // 数据格式验证
      if (item.total_interactions !== undefined && (item.total_interactions < 0 || !Number.isInteger(item.total_interactions))) {
        validationErrors.push(`第${rowNumber}行: 总互动数必须是正整数`);
        continue;
      }
      if (item.total_form_leads !== undefined && (item.total_form_leads < 0 || !Number.isInteger(item.total_form_leads))) {
        validationErrors.push(`第${rowNumber}行: 表单留资数必须是正整数`);
        continue;
      }
      if (item.total_private_message_leads !== undefined && (item.total_private_message_leads < 0 || !Number.isInteger(item.total_private_message_leads))) {
        validationErrors.push(`第${rowNumber}行: 私信进线数必须是正整数`);
        continue;
      }
      if (item.published_notes_count !== undefined && (item.published_notes_count < 0 || !Number.isInteger(item.published_notes_count))) {
        validationErrors.push(`第${rowNumber}行: 发布笔记数必须是正整数`);
        continue;
      }
      if (item.avg_response_time !== undefined && item.avg_response_time < 0) {
        validationErrors.push(`第${rowNumber}行: 平均响应时间不能为负数`);
        continue;
      }
      if (item.user_rating_score !== undefined && (item.user_rating_score < 0 || item.user_rating_score > 5)) {
        validationErrors.push(`第${rowNumber}行: 用户评分必须在0-5之间`);
        continue;
      }

      validData.push(item);
    }

    if (validationErrors.length > 0) {
      return {
        success: false,
        message: `数据验证失败，发现 ${validationErrors.length} 个错误`,
        errors: validationErrors
      };
    }

    if (validData.length === 0) {
      return {
        success: false,
        message: '没有有效的数据需要导入'
      };
    }

    // 检查重复数据
    const existingRecords = await checkExistingRecords(validData);
    if (existingRecords.length > 0) {
      const duplicateNames = existingRecords.map(record => record.employee_name).join(', ');
      return {
        success: false,
        message: `发现重复数据: ${duplicateNames}`,
        errors: [`以下员工数据已存在: ${duplicateNames}`]
      };
    }

    // 批量插入数据
    const { data: insertedData, error } = await supabase
      .from('employee_simple_join')
      .insert(validData)
      .select();

    if (error) {
      console.error('🔶 导入失败:', error);
      return {
        success: false,
        message: `导入失败: ${error.message}`,
        errors: [error.message]
      };
    }

    console.log('🔶 成功导入员工数据宽表:', insertedData?.length || 0, '条数据');
    return {
      success: true,
      message: `成功导入 ${insertedData?.length || 0} 条数据`,
      importedRows: insertedData?.length || 0
    };

  } catch (error) {
    console.error('🔶 导入过程中发生错误:', error);
    return {
      success: false,
      message: `导入失败: ${error instanceof Error ? error.message : '未知错误'}`,
      errors: [error instanceof Error ? error.message : '未知错误']
    };
  }
};

// 检查重复数据
const checkExistingRecords = async (data: EmployeeSimpleJoinImportData[]): Promise<EmployeeSimpleJoinImportData[]> => {
  const employeeUids = data.map(item => item.employee_uid).filter(Boolean);
  
  if (employeeUids.length === 0) {
    return [];
  }

  const { data: existingRecords, error } = await supabase
    .from('employee_simple_join')
    .select('employee_uid, employee_name')
    .in('employee_uid', employeeUids);

  if (error) {
    console.error('🔶 检查重复数据失败:', error);
    return [];
  }

  return existingRecords || [];
};

// 获取导入模板数据
export const getImportTemplate = (): EmployeeSimpleJoinImportData[] => {
  return [
    {
      employee_name: '示例员工',
      employee_uid: 'example_uid_123',
      xiaohongshu_nickname: '示例昵称',
      xiaohongshu_account_id: 'example_account_123',
      region: '北京',
      status: 'active',
      activation_time: '2024-01-01',
      total_interactions: 100,
      total_form_leads: 10,
      total_private_message_leads: 20,
      total_private_message_openings: 15,
      total_private_message_leads_kept: 8,
      published_notes_count: 5,
      promoted_notes_count: 3,
      notes_promotion_cost: 150.50,
      notes_exposure_count: 1000,
      notes_click_count: 100,
      avg_response_time: 120.5,
      rate_1min_response: '85%',
      rate_1hour_timeout: '5%',
      user_rating_score: 4.2,
      time_range: {
        start_date: '2024-01-01',
        end_date: '2024-01-31',
        remark: '2024年1月数据'
      },
      response_time_range: {
        start_date: '2024-01-01',
        end_date: '2024-01-31',
        remark: '2024年1月响应数据'
      }
    }
  ];
}; 