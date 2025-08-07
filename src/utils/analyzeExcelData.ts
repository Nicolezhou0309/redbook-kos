import * as XLSX from 'xlsx';

// 数据验证和一致性检查函数
export const validateDataConsistency = (excelData: any[], dbData: any[]) => {
  const validationResults = {
    totalExcelRecords: excelData.length,
    totalDbRecords: dbData.length,
    matchedRecords: 0,
    unmatchedRecords: 0,
    errors: [] as string[],
    warnings: [] as string[],
    dataComparison: [] as any[]
  };

  // 创建Excel数据的索引
  const excelIndex = new Map();
  excelData.forEach((record, index) => {
    const key = record.note_id || record['笔记ID'] || `excel_${index}`;
    excelIndex.set(key, { ...record, excelIndex: index });
  });

  // 创建数据库数据的索引
  const dbIndex = new Map();
  dbData.forEach((record, index) => {
    const key = record.note_id;
    dbIndex.set(key, { ...record, dbIndex: index });
  });

  // 比较数据
  for (const [key, excelRecord] of excelIndex) {
    const dbRecord = dbIndex.get(key);
    
    if (dbRecord) {
      // 找到匹配的记录，进行详细比较
      const comparison = compareRecords(excelRecord, dbRecord);
      validationResults.dataComparison.push(comparison);
      
      if (comparison.isConsistent) {
        validationResults.matchedRecords++;
      } else {
        validationResults.unmatchedRecords++;
        validationResults.warnings.push(`记录 ${key} 数据不一致: ${comparison.differences.join(', ')}`);
      }
    } else {
      // Excel中有但数据库中没有的记录
      validationResults.unmatchedRecords++;
      validationResults.errors.push(`Excel记录 ${key} 在数据库中不存在`);
    }
  }

  // 检查数据库中有但Excel中没有的记录
  for (const [key] of dbIndex) {
    if (!excelIndex.has(key)) {
      validationResults.unmatchedRecords++;
      validationResults.warnings.push(`数据库记录 ${key} 在Excel中不存在`);
    }
  }

  return validationResults;
};

// 比较两条记录
const compareRecords = (excelRecord: any, dbRecord: any) => {
  const comparison = {
    noteId: excelRecord.note_id || excelRecord['笔记ID'],
    excelTitle: excelRecord.note_title || excelRecord['笔记名称'],
    dbTitle: dbRecord.note_title,
    excelCreator: excelRecord.creator_name || excelRecord['创作者名称'],
    dbCreator: dbRecord.creator_name,
    excelEmployee: excelRecord.employee_name || excelRecord['员工姓名'],
    dbEmployee: dbRecord.employee_name,
    isConsistent: true,
    differences: [] as string[],
    fieldComparisons: {} as any
  };

  // 比较关键字段
  const keyFields = [
    { excel: 'total_exposure_count', db: 'total_exposure_count', name: '总曝光量' },
    { excel: 'total_read_count', db: 'total_read_count', name: '总阅读量' },
    { excel: 'total_interaction_count', db: 'total_interaction_count', name: '总互动量' },
    { excel: 'total_read_rate', db: 'total_read_rate', name: '总阅读率' },
    { excel: 'total_interaction_rate', db: 'total_interaction_rate', name: '总互动率' }
  ];

  keyFields.forEach(field => {
    const excelValue = Number(excelRecord[field.excel] || excelRecord[field.name] || 0);
    const dbValue = Number(dbRecord[field.db] || 0);
    
    comparison.fieldComparisons[field.name] = {
      excel: excelValue,
      db: dbValue,
      match: Math.abs(excelValue - dbValue) < 0.01 // 允许小的浮点数误差
    };
    
    if (!comparison.fieldComparisons[field.name].match) {
      comparison.isConsistent = false;
      comparison.differences.push(`${field.name}: Excel=${excelValue}, DB=${dbValue}`);
    }
  });

  return comparison;
};

// 数据清理和标准化函数
export const cleanAndStandardizeData = (data: any[]) => {
  return data.map((record, index) => {
    const cleaned = { ...record };
    
    // 确保数值字段为数字类型
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
    ];

    numericFields.forEach(field => {
      if (field in cleaned) {
        const value = cleaned[field];
        if (value === null || value === undefined || value === '') {
          cleaned[field] = 0;
        } else {
          const numValue = typeof value === 'string' ? parseFloat(value) : Number(value);
          cleaned[field] = isNaN(numValue) ? 0 : numValue;
        }
      }
    });

    // 确保字符串字段不为null
    const stringFields = [
      'note_title', 'creator_name', 'employee_name', 'note_status',
      'blogger_category', 'note_id'
    ];

    stringFields.forEach(field => {
      if (field in cleaned) {
        const value = cleaned[field];
        if (value === null || value === undefined) {
          cleaned[field] = '';
        }
      }
    });

    // 确保有唯一的ID
    if (!cleaned.note_id) {
      cleaned.note_id = `note_${Date.now()}_${index}`;
    }

    return cleaned;
  });
};

// 数据质量检查函数
export const checkDataQuality = (data: any[]) => {
  const qualityReport = {
    totalRecords: data.length,
    validRecords: 0,
    invalidRecords: 0,
    missingRequiredFields: 0,
    invalidNumericFields: 0,
    warnings: [] as string[],
    errors: [] as string[]
  };

  data.forEach((record, index) => {
    let isValid = true;
    const recordErrors: string[] = [];
    const recordWarnings: string[] = [];

    // 检查必需字段
    if (!record.note_id && !record.note_title) {
      recordErrors.push('缺少笔记ID和标题');
      isValid = false;
    }

    // 检查数值字段
    const numericFields = [
      'total_exposure_count', 'total_read_count', 'total_interaction_count',
      'total_read_rate', 'total_interaction_rate'
    ];

    numericFields.forEach(field => {
      if (field in record) {
        const value = record[field];
        if (value !== null && value !== undefined && value !== '') {
          const numValue = Number(value);
          if (isNaN(numValue)) {
            recordWarnings.push(`${field} 不是有效数字: ${value}`);
          }
        }
      }
    });

    if (isValid) {
      qualityReport.validRecords++;
    } else {
      qualityReport.invalidRecords++;
      qualityReport.errors.push(`记录 ${index + 1}: ${recordErrors.join(', ')}`);
    }

    if (recordWarnings.length > 0) {
      qualityReport.warnings.push(`记录 ${index + 1}: ${recordWarnings.join(', ')}`);
    }
  });

  return qualityReport;
};

export const analyzeExcelFile = async (filePath: string) => {
  try {
    console.log('🔍 开始分析Excel文件:', filePath);
    
    // 读取Excel文件
    const response = await fetch(filePath);
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    console.log('📊 Excel文件信息:');
    console.log('- 工作表数量:', workbook.SheetNames.length);
    console.log('- 工作表名称:', workbook.SheetNames);
    
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // 获取原始数据
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log('📋 数据概览:');
    console.log('- 总行数:', rawData.length);
    console.log('- 表头行数:', 2); // 根据之前的日志，有级联表头
    
    // 分析表头
    if (rawData.length >= 2) {
      const headerRow1 = (rawData[0] as any[]) || [];
      const headerRow2 = (rawData[1] as any[]) || [];
      
      console.log('📋 第一行表头 (前10个):', headerRow1.slice(0, 10));
      console.log('📋 第二行表头 (前10个):', headerRow2.slice(0, 10));
      console.log('📋 表头总数:', headerRow2.length);
    }
    
    // 分析数据行
    const dataRows = rawData.slice(2); // 跳过表头行
    console.log('📊 数据行数:', dataRows.length);
    
    // 分析每行数据
    dataRows.forEach((row: unknown, index: number) => {
      const typedRow = row as any[];
      if (typedRow && typedRow.some((cell: any) => cell !== null && cell !== undefined && cell !== '')) {
        console.log(`\n📝 第${index + 3}行数据 (非空字段):`);
        
        // 显示非空字段
        const nonEmptyFields: { [key: string]: any } = {};
        typedRow.forEach((cell: any, cellIndex: number) => {
          if (cell !== null && cell !== undefined && cell !== '') {
            const header = (rawData[1] as any[])?.[cellIndex] || `列${cellIndex + 1}`;
            nonEmptyFields[header] = cell;
          }
        });
        
        // 显示关键字段
        const keyFields = [
          '笔记名称', '笔记id', '笔记创作者名称', '员工标签', 
          '总曝光量', '总阅读量', '总互动量', '全部阅读率', '全部互动率'
        ];
        
        keyFields.forEach(field => {
          if (nonEmptyFields[field] !== undefined) {
            console.log(`  ${field}: ${nonEmptyFields[field]}`);
          }
        });
        
        // 查找流量相关字段
        console.log('  📊 流量相关字段:');
        Object.entries(nonEmptyFields).forEach(([key, value]) => {
          if (key.includes('曝光') || key.includes('阅读') || key.includes('互动') || key.includes('点击')) {
            console.log(`    ${key}: ${value}`);
          }
        });
        
        // 显示所有非空字段
        console.log('  所有非空字段数量:', Object.keys(nonEmptyFields).length);
        console.log('  前10个非空字段:', Object.entries(nonEmptyFields).slice(0, 10));
        
        // 如果关键字段太少，显示更多信息
        const foundKeyFields = keyFields.filter(field => nonEmptyFields[field] !== undefined);
        if (foundKeyFields.length < 3) {
          console.log('  所有非空字段:', nonEmptyFields);
        }
      }
    });
    
    return {
      success: true,
      totalRows: rawData.length,
      headerCount: (rawData[1] as any[])?.length || 0,
      dataRows: dataRows.length,
      headers: rawData[1] || [],
      sampleData: dataRows.slice(0, 3) // 前3行数据作为样本
    };
    
  } catch (error) {
    console.error('❌ 分析Excel文件失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    };
  }
};

export const compareWithDatabase = (excelData: any, dbData: any) => {
  console.log('🔍 对比Excel数据与数据库数据:');
  
  if (!excelData.success || !dbData.success) {
    console.log('❌ 数据获取失败，无法对比');
    return;
  }
  
  console.log('📊 Excel数据概览:');
  console.log('- 总行数:', excelData.totalRows);
  console.log('- 表头数量:', excelData.headerCount);
  console.log('- 数据行数:', excelData.dataRows);
  
  console.log('📊 数据库数据概览:');
  console.log('- 记录数:', dbData.totalCount);
  
  // 对比关键字段
  if (excelData.sampleData && dbData.recentData) {
    console.log('\n📋 数据对比:');
    
    excelData.sampleData.forEach((excelRow: any[], index: number) => {
      const dbRecord = dbData.recentData[index];
      if (dbRecord) {
        console.log(`\n--- 记录 ${index + 1} 对比 ---`);
        
        // 提取Excel中的关键数据
        const excelNoteId = excelRow.find((cell: any, cellIndex: number) => {
          const header = excelData.headers[cellIndex];
          return header && (header.includes('笔记id') || header.includes('笔记ID'));
        });
        
        const excelTitle = excelRow.find((cell: any, cellIndex: number) => {
          const header = excelData.headers[cellIndex];
          return header && (header.includes('笔记名称') || header.includes('笔记标题'));
        });
        
        const excelCreator = excelRow.find((cell: any, cellIndex: number) => {
          const header = excelData.headers[cellIndex];
          return header && (header.includes('笔记创作者名称') || header.includes('创作者'));
        });
        
        const excelExposure = excelRow.find((cell: any, cellIndex: number) => {
          const header = excelData.headers[cellIndex];
          return header && (header.includes('全部曝光量') || header.includes('总曝光量')) && !header.includes('排名');
        });
        
        const excelRead = excelRow.find((cell: any, cellIndex: number) => {
          const header = excelData.headers[cellIndex];
          return header && (header.includes('全部阅读量') || header.includes('总阅读量')) && !header.includes('排名');
        });
        
        console.log('Excel数据:');
        console.log(`  笔记ID: ${excelNoteId || '未找到'}`);
        console.log(`  标题: ${excelTitle || '未找到'}`);
        console.log(`  创作者: ${excelCreator || '未找到'}`);
        console.log(`  曝光量: ${excelExposure || '未找到'}`);
        console.log(`  阅读量: ${excelRead || '未找到'}`);
        
        console.log('数据库数据:');
        console.log(`  笔记ID: ${dbRecord.note_id}`);
        console.log(`  标题: ${dbRecord.note_title}`);
        console.log(`  创作者: ${dbRecord.creator_name}`);
        console.log(`  曝光量: ${dbRecord.total_exposure_count}`);
        console.log(`  阅读量: ${dbRecord.total_read_count}`);
        
        // 检查数据一致性 - 只检查笔记ID，因为其他字段可能在不同行
        const isConsistent = excelNoteId === dbRecord.note_id;
        
        console.log(`  一致性: ${isConsistent ? '✅ 一致' : '❌ 不一致'}`);
        
        // 如果笔记ID一致，检查数值字段
        if (isConsistent) {
          const exposureMatch = Number(excelExposure) === dbRecord.total_exposure_count;
          const readMatch = Number(excelRead) === dbRecord.total_read_count;
          console.log(`  曝光量匹配: ${exposureMatch ? '✅' : '❌'} (Excel: ${excelExposure}, DB: ${dbRecord.total_exposure_count})`);
          console.log(`  阅读量匹配: ${readMatch ? '✅' : '❌'} (Excel: ${excelRead}, DB: ${dbRecord.total_read_count})`);
        }
      }
    });
  }
}; 