import * as XLSX from 'xlsx';

export interface FileParseResult {
  success: boolean;
  data?: any[];
  columns?: string[];
  rowCount?: number;
  error?: string;
}

export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * 解析Excel文件
 */
export const parseExcelFile = async (file: File): Promise<FileParseResult> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length === 0) {
          resolve({
            success: false,
            error: '文件内容为空'
          });
          return;
        }
        
        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1) as any[][];
        
        // 过滤空行
        const filteredRows = rows.filter(row => 
          row && row.some((cell: any) => cell !== null && cell !== undefined && cell !== '')
        );
        
        const parsedData = filteredRows.map((row, _index) => {
          const obj: any = {};
          headers.forEach((header, colIndex) => {
            obj[header] = row[colIndex] || '';
          });
          return obj;
        });
        
        console.log(`Excel数据解析完成，原始行数: ${rows.length}，处理后行数: ${parsedData.length}`);
        
        resolve({
          success: true,
          data: parsedData,
          columns: headers,
          rowCount: parsedData.length
        });
      } catch (error) {
        resolve({
          success: false,
          error: `解析Excel文件失败: ${error instanceof Error ? error.message : '未知错误'}`
        });
      }
    };
    
    reader.onerror = () => {
      resolve({
        success: false,
        error: '读取文件失败'
      });
    };
    
    reader.readAsArrayBuffer(file);
  });
};

/**
 * 解析CSV文件
 */
export const parseCSVFile = async (file: File): Promise<FileParseResult> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const lines = content.split('\n').filter(line => line.trim());
        
        if (lines.length === 0) {
          resolve({
            success: false,
            error: '文件内容为空'
          });
          return;
        }
        
        // 简单的CSV解析，支持逗号分隔
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const rows = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = values[index] || '';
          });
          return obj;
        });
        
        // 过滤空行
        const filteredRows = rows.filter(row => 
          Object.values(row).some(value => value !== null && value !== undefined && value !== '')
        );
        
        console.log(`CSV数据解析完成，原始行数: ${rows.length}，处理后行数: ${filteredRows.length}`);
        
        resolve({
          success: true,
          data: filteredRows,
          columns: headers,
          rowCount: filteredRows.length
        });
      } catch (error) {
        resolve({
          success: false,
          error: `解析CSV文件失败: ${error instanceof Error ? error.message : '未知错误'}`
        });
      }
    };
    
    reader.onerror = () => {
      resolve({
        success: false,
        error: '读取文件失败'
      });
    };
    
    reader.readAsText(file, 'UTF-8');
  });
};

/**
 * 验证文件格式
 */
export const validateFileFormat = (file: File): FileValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // 检查文件大小
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    errors.push(`文件大小超过限制 (${(file.size / 1024 / 1024).toFixed(2)}MB > 10MB)`);
  }
  
  // 检查文件类型
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/csv', // .csv
    'application/csv', // .csv
  ];
  
  if (!allowedTypes.includes(file.type) && 
      !file.name.endsWith('.xlsx') && 
      !file.name.endsWith('.xls') && 
      !file.name.endsWith('.csv')) {
    errors.push('不支持的文件格式，请上传 Excel 或 CSV 文件');
  }
  
  // 检查文件名
  if (file.name.length > 100) {
    warnings.push('文件名过长，建议使用更短的文件名');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * 验证数据内容
 */
export const validateDataContent = (data: any[], columns: string[], fileType: 'employee' | 'leads' | 'notes'): FileValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (data.length === 0) {
    errors.push('文件没有数据行');
    return { isValid: false, errors, warnings };
  }
  
  // 根据文件类型检查必要的列
  const requiredColumns = getRequiredColumns(fileType);
  const missingColumns = requiredColumns.filter(col => !columns.includes(col));
  
  if (missingColumns.length > 0) {
    errors.push(`缺少必要的列: ${missingColumns.join(', ')}`);
  }
  
  // 检查数据行数
  if (data.length > 10000) {
    warnings.push(`数据行数较多 (${data.length}行)，导入可能需要较长时间`);
  }
  
  // 空行已在解析时自动过滤，不再需要检查
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * 获取不同文件类型的必要列
 */
const getRequiredColumns = (fileType: 'employee' | 'leads' | 'notes'): string[] => {
  switch (fileType) {
    case 'employee':
      // 员工数据模板列
      return ['员工号名称', '员工号UID'];
    case 'leads':
      // 员工线索明细模板列
      return ['员工名称', '小红书账号id', '小红书昵称'];
    case 'notes':
      // 员工笔记数据模板列 - 笔记数据有很多字段，这里只检查最基础的
      return ['笔记标题', '创作者', '发布时间'];
    default:
      return [];
  }
};

/**
 * 格式化文件大小
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 生成文件预览数据
 */
export const generatePreviewData = (data: any[], maxRows: number = 5): any[] => {
  return data.slice(0, maxRows);
};

/**
 * 检查文件是否为Excel格式
 */
export const isExcelFile = (file: File): boolean => {
  return file.type.includes('excel') || 
         file.name.endsWith('.xlsx') || 
         file.name.endsWith('.xls');
};

/**
 * 检查文件是否为CSV格式
 */
export const isCSVFile = (file: File): boolean => {
  return file.type.includes('csv') || 
         file.name.endsWith('.csv');
};

/**
 * 获取文件扩展名
 */
export const getFileExtension = (fileName: string): string => {
  return fileName.split('.').pop()?.toLowerCase() || '';
};

/**
 * 清理文件名
 */
export const sanitizeFileName = (fileName: string): string => {
  return fileName.replace(/[<>:"/\\|?*]/g, '_');
}; 