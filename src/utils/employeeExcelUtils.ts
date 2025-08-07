import * as XLSX from 'xlsx';
import dayjs from 'dayjs';
import { getHoldingPeriodDetails } from './employeeUtils';

// 员工数据接口
export interface EmployeeExcelData {
  employee_name: string;
  employee_uid: string;
  status?: string;
  activation_time?: string;
}

// 下载员工数据为Excel文件
export const downloadEmployeeData = (data: any[]) => {
  // 准备Excel数据
  const excelData = data.map(item => {
    const holdingPeriodDetails = getHoldingPeriodDetails(item.activation_time);
    
    // 计算违规状态
    let violationStatus = '正常';
    if (item.violation_status) {
      if (item.violation_status.status === 'red') {
        violationStatus = `红牌 ${item.violation_status.currentRedCards}张`;
      } else if (item.violation_status.status === 'yellow') {
        violationStatus = `黄牌 ${item.violation_status.currentYellowCards}张`;
      }
    }
    
    return {
      '员工姓名': item.employee_name,
      '员工UID': item.employee_uid,
      '状态': item.status || '',
      '开通时间': item.activation_time ? dayjs(item.activation_time).format('YYYY-MM-DD') : '',
      '持有周期': holdingPeriodDetails.text,
      '违规状态': violationStatus,
      '创建时间': dayjs(item.created_at).format('YYYY-MM-DD HH:mm:ss')
    };
  });

  // 创建工作簿
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // 设置列宽
  const colWidths = [
    { wch: 15 }, // 员工姓名
    { wch: 20 }, // 员工UID
    { wch: 15 }, // 状态
    { wch: 20 }, // 开通时间
    { wch: 15 }, // 持有周期
    { wch: 15 }, // 违规状态
    { wch: 20 }  // 创建时间
  ];
  worksheet['!cols'] = colWidths;

  // 添加工作表
  XLSX.utils.book_append_sheet(workbook, worksheet, '员工列表');

  // 生成文件名
  const fileName = `员工列表_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.xlsx`;

  // 下载文件
  XLSX.writeFile(workbook, fileName);

  return fileName;
};

// 解析上传的Excel文件
export const parseEmployeeExcelFile = async (file: File): Promise<{
  success: boolean;
  data?: EmployeeExcelData[];
  error?: string;
  warnings?: string[];
}> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    // 获取第一个工作表
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // 转换为JSON
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (rawData.length < 2) {
      return {
        success: false,
        error: 'Excel文件格式错误：至少需要表头行和数据行'
      };
    }

    // 获取表头
    const headers = rawData[0] as string[];
    
    // 验证必需字段
    const requiredFields = ['员工姓名', '员工UID'];
    const missingFields = requiredFields.filter(field => !headers.includes(field));
    
    if (missingFields.length > 0) {
      return {
        success: false,
        error: `缺少必需字段：${missingFields.join(', ')}`
      };
    }

    // 处理数据行
    const processedData: EmployeeExcelData[] = [];
    const warnings: string[] = [];

    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i] as any[];
      if (!row || row.every(cell => cell === null || cell === undefined || cell === '')) {
        continue; // 跳过空行
      }

      const rowData: any = {};
      
      // 映射字段
      headers.forEach((header, index) => {
        const value = row[index];
        if (value !== null && value !== undefined && value !== '') {
          rowData[header] = value;
        }
      });

      // 验证必需字段
      if (!rowData['员工姓名'] || !rowData['员工UID']) {
        warnings.push(`第${i + 1}行：缺少必需字段`);
        continue;
      }

      // 验证UID格式
      const uidPattern = /^[A-Za-z0-9_-]+$/;
      if (!uidPattern.test(rowData['员工UID'])) {
        warnings.push(`第${i + 1}行：员工UID格式不正确，只能包含字母、数字、下划线和连字符`);
        continue;
      }

      // 处理开通时间
      let activationTime = null;
      if (rowData['开通时间']) {
        const timeValue = rowData['开通时间'];
        if (typeof timeValue === 'string') {
          // 尝试解析日期（只包含日期，不包含时间）
          const parsedTime = dayjs(timeValue, 'YYYY-MM-DD');
          if (parsedTime.isValid()) {
            activationTime = parsedTime.toISOString();
          } else {
            warnings.push(`第${i + 1}行：开通时间格式不正确，请使用YYYY-MM-DD格式`);
          }
        } else if (timeValue instanceof Date) {
          activationTime = dayjs(timeValue).format('YYYY-MM-DD');
        }
      }

             processedData.push({
         employee_name: rowData['员工姓名'].toString().trim(),
         employee_uid: rowData['员工UID'].toString().trim(),
         status: (rowData['员工状态'] || rowData['状态']) ? (rowData['员工状态'] || rowData['状态']).toString().trim() : undefined,
         activation_time: activationTime || undefined
       });
    }

    if (processedData.length === 0) {
      return {
        success: false,
        error: '没有找到有效的数据行'
      };
    }

    return {
      success: true,
      data: processedData,
      warnings: warnings.length > 0 ? warnings : undefined
    };

  } catch (error) {
    console.error('解析Excel文件失败:', error);
    return {
      success: false,
      error: '解析Excel文件失败：' + (error instanceof Error ? error.message : '未知错误')
    };
  }
};

// 验证员工数据
export const validateEmployeeData = (data: EmployeeExcelData[], existingData: any[]) => {
  const validation = {
    totalRecords: data.length,
    validRecords: 0,
    invalidRecords: 0,
    newRecords: 0,
    updateRecords: 0,
    errors: [] as string[],
    warnings: [] as string[]
  };

  // 创建现有数据的索引
  const existingIndex = new Map();
  existingData.forEach(item => {
    existingIndex.set(item.employee_uid, item);
  });

  data.forEach((record, index) => {
    let isValid = true;
    const recordErrors: string[] = [];
    const recordWarnings: string[] = [];

    // 验证必需字段
    if (!record.employee_name || !record.employee_uid) {
      recordErrors.push('缺少员工姓名或UID');
      isValid = false;
    }

    // 验证UID格式
    const uidPattern = /^[A-Za-z0-9_-]+$/;
    if (!uidPattern.test(record.employee_uid)) {
      recordErrors.push('UID格式不正确');
      isValid = false;
    }

    // 检查是否为重复记录
    const existingRecord = existingIndex.get(record.employee_uid);
    if (existingRecord) {
      validation.updateRecords++;
      recordWarnings.push(`将更新现有记录：${existingRecord.employee_name}`);
    } else {
      validation.newRecords++;
    }

    if (isValid) {
      validation.validRecords++;
    } else {
      validation.invalidRecords++;
      validation.errors.push(`第${index + 1}行：${recordErrors.join(', ')}`);
    }

    if (recordWarnings.length > 0) {
      validation.warnings.push(`第${index + 1}行：${recordWarnings.join(', ')}`);
    }
  });

  return validation;
}; 

// 员工数据宽表Excel导出
export const downloadEmployeeSimpleJoinData = (data: any[], timeRange?: { start_date?: string; end_date?: string }) => {
  // 准备Excel数据
  const excelData = data.map(item => {
    // 处理时间范围显示
    let timeRangeDisplay = '-'
    if (item.time_range) {
      if (item.time_range.remark && item.time_range.remark.trim() !== '') {
        timeRangeDisplay = item.time_range.remark
      } else if (item.time_range.start_date && item.time_range.end_date) {
        timeRangeDisplay = `${item.time_range.start_date} ~ ${item.time_range.end_date}`
      }
    }

    // 处理响应时间范围显示
    let responseTimeRangeDisplay = '-'
    if (item.response_time_range) {
      if (item.response_time_range.remark && item.response_time_range.remark.trim() !== '') {
        responseTimeRangeDisplay = item.response_time_range.remark
      } else if (item.response_time_range.start_date && item.response_time_range.end_date) {
        responseTimeRangeDisplay = `${item.response_time_range.start_date} ~ ${item.response_time_range.end_date}`
      }
    }

    return {
      // 员工基本信息
      '员工姓名': item.employee_name || '',
      '员工UID': item.employee_uid || '',
      '员工状态': item.status || '',
      '创建时间': item.created_at ? dayjs(item.created_at).format('YYYY-MM-DD HH:mm:ss') : '',
      
      // 小红书账号信息
      '小红书昵称': item.xiaohongshu_nickname || '',
      '小红书账号ID': item.xiaohongshu_account_id || '',
      '地区': item.region || '',
      '标签': item.tags || '',
      '激活时间': item.activation_time ? dayjs(item.activation_time).format('YYYY-MM-DD') : '',
      '互动时间范围': timeRangeDisplay,
      
      // 互动数据
      '总互动数': item.total_interactions || 0,
      '表单留资': item.total_form_leads || 0,
      '私信进线': item.total_private_message_leads || 0,
      '私信开口': item.total_private_message_openings || 0,
      '私信留资': item.total_private_message_leads_kept || 0,
      
      // 笔记数据
      '发布笔记数': item.published_notes_count || 0,
      '推广笔记数': item.promoted_notes_count || 0,
      '推广费用': item.notes_promotion_cost ? `¥${item.notes_promotion_cost.toFixed(2)}` : '¥0.00',
      '笔记曝光数': item.notes_exposure_count || 0,
      '笔记点击数': item.notes_click_count || 0,
      
      // 响应数据
      '平均响应时间(秒)': item.avg_response_time ? item.avg_response_time.toFixed(1) : '0',
      '15秒响应率': item.rate_15s_response || '0%',
      '30秒响应率': item.rate_30s_response || '0%',
      '1分钟响应率': item.rate_1min_response || '0%',
      '1小时超时率': item.rate_1hour_timeout || '0%',
      '用户评分': item.user_rating_score ? item.user_rating_score.toFixed(2) : '0.00',
      '响应时间范围': responseTimeRangeDisplay,
      
      // 响应评分
      '15秒响应评分': item.score_15s_response ? item.score_15s_response.toFixed(2) : '0.00',
      '30秒响应评分': item.score_30s_response ? item.score_30s_response.toFixed(2) : '0.00',
      '1分钟响应评分': item.score_1min_response ? item.score_1min_response.toFixed(2) : '0.00',
      '1小时超时评分': item.score_1hour_timeout ? item.score_1hour_timeout.toFixed(2) : '0.00',
      '平均响应评分': item.score_avg_response_time ? item.score_avg_response_time.toFixed(2) : '0.00'
    };
  });

  // 创建工作簿
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // 设置列宽
  const colWidths = [
    { wch: 12 }, // 员工姓名
    { wch: 20 }, // 员工UID
    { wch: 10 }, // 员工状态
    { wch: 20 }, // 创建时间
    { wch: 15 }, // 小红书昵称
    { wch: 20 }, // 小红书账号ID
    { wch: 10 }, // 地区
    { wch: 15 }, // 标签
    { wch: 15 }, // 激活时间
    { wch: 20 }, // 互动时间范围
    { wch: 12 }, // 总互动数
    { wch: 12 }, // 表单留资
    { wch: 12 }, // 私信进线
    { wch: 12 }, // 私信开口
    { wch: 12 }, // 私信留资
    { wch: 12 }, // 发布笔记数
    { wch: 12 }, // 推广笔记数
    { wch: 12 }, // 推广费用
    { wch: 12 }, // 笔记曝光数
    { wch: 12 }, // 笔记点击数
    { wch: 15 }, // 平均响应时间
    { wch: 12 }, // 15秒响应率
    { wch: 12 }, // 30秒响应率
    { wch: 12 }, // 1分钟响应率
    { wch: 12 }, // 1小时超时率
    { wch: 12 }, // 用户评分
    { wch: 20 }, // 响应时间范围
    { wch: 15 }, // 15秒响应评分
    { wch: 15 }, // 30秒响应评分
    { wch: 15 }, // 1分钟响应评分
    { wch: 15 }, // 1小时超时评分
    { wch: 15 }  // 平均响应评分
  ];
  worksheet['!cols'] = colWidths;

  // 添加工作表
  XLSX.utils.book_append_sheet(workbook, worksheet, '员工数据宽表');

  // 生成文件名
  let fileName = `员工数据宽表_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}`
  if (timeRange?.start_date && timeRange?.end_date) {
    fileName += `_${timeRange.start_date}_${timeRange.end_date}`
  }
  fileName += '.xlsx'

  // 下载文件
  XLSX.writeFile(workbook, fileName);

  return fileName;
}; 