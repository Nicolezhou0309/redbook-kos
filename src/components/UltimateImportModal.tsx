import React, { useState, useCallback, useEffect } from 'react';
import { Modal, Button, Progress, message, Card, Tag, Space, Tabs, Table, Typography, Row, Col, DatePicker, Input, Select } from 'antd';
import { InboxOutlined, DeleteOutlined, EyeOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { employeeApi } from '../lib/employeeApi';
import { employeeLeadsApi } from '../lib/employeeLeadsApi';
import { 
  parseExcelFile, 
  parseCSVFile, 
  validateFileFormat, 
  validateDataContent, 
  formatFileSize,
  isExcelFile,
  isCSVFile,
  type FileParseResult,
  type FileValidationResult
} from '../utils/importUtils';
import dayjs from 'dayjs';




const { Text } = Typography;

interface UltimateImportModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FileInfo {
  uid: string;
  name: string;
  size: number;
  type: string;
  status: 'pending' | 'processing' | 'success' | 'error' | 'validating';
  progress: number;
  error?: string;
  category?: 'employee' | 'leads';
  manualCategory?: 'employee' | 'leads'; // 手动选择的文件类型
  preview?: any[];
  rowCount?: number;
  columns?: string[];
  validation?: FileValidationResult;
  parseResult?: FileParseResult;
  file?: File; // 添加原始File对象
  timeRange?: [string, string] | null; // 单独的时间范围
  remark?: string; // 单独的备注
}

interface ImportResult {
  success: boolean;
  message: string;
  importedRows?: number;
  errors?: string[];
}

const UltimateImportModal: React.FC<UltimateImportModalProps> = ({ visible, onClose, onSuccess }) => {
  const [fileList, setFileList] = useState<FileInfo[]>([]);
  const [importing, setImporting] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('upload');
  const [importResults, setImportResults] = useState<Record<string, ImportResult>>({});
  
  // 添加时间范围和remark状态
  const [selectedDateRange, setSelectedDateRange] = useState<[string, string] | null>(null);
  const [selectedRemark, setSelectedRemark] = useState<string>('');
  const [globalSettingsCollapsed, setGlobalSettingsCollapsed] = useState(true); // 全局设置默认折叠

  // 文件类型识别函数
  const identifyFileType = (fileName: string, fileType: string, columns?: string[]): 'employee' | 'leads' | 'unknown' => {
    const lowerFileName = fileName.toLowerCase();
    
    // 如果有列信息，根据列名识别
    if (columns && columns.length > 0) {
      const columnSet = new Set(columns.map(col => col.toLowerCase()));
      
      // 员工数据识别 - 检查员工数据特有的列
      if (columnSet.has('员工号名称') || columnSet.has('员工号uid') || 
          columnSet.has('15秒首响率得分') || columnSet.has('30秒回复率得分')) {
        return 'employee';
      }
      
      // 员工线索明细识别 - 检查线索数据特有的列（更具体）
      if (columnSet.has('账号id') || columnSet.has('小红书账号id') || 
          columnSet.has('小红书昵称') || columnSet.has('总互动数') || 
          columnSet.has('总表单客资数') || columnSet.has('总私信进线数') ||
          columnSet.has('投流笔记数') || columnSet.has('笔记投流消耗')) {
        return 'leads';
      }
    }
    
    // 根据文件名识别
    if (lowerFileName.includes('员工') && (lowerFileName.includes('回复') || lowerFileName.includes('响应'))) {
      return 'employee';
    }
    
    if (lowerFileName.includes('线索') || lowerFileName.includes('leads') ||
        lowerFileName.includes('明细') || lowerFileName.includes('detail')) {
      return 'leads';
    }
    
    // 根据文件扩展名判断
    if (isCSVFile({ name: fileName, type: fileType } as File)) {
      return 'leads'; // CSV文件默认作为线索数据
    }
    
    return 'unknown';
  };

  // 处理文件上传和解析
  const handleFileUpload = useCallback(async (files: FileList | File[] | null) => {
    if (!files) return;
    
    const newFiles: FileInfo[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // 初始类型识别，后续会根据解析结果更新
      const category = identifyFileType(file.name, file.type);
      
      const fileInfo: FileInfo = {
        uid: `${Date.now()}-${i}`,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'validating',
        progress: 0,
        category: category === 'unknown' ? undefined : category,
        file: file, // 保存原始File对象
      };

      newFiles.push(fileInfo);
    }
    
    // 追加文件列表而不是替换
    setFileList(prev => [...prev, ...newFiles]);

    // 异步处理文件解析和验证
    for (const fileInfo of newFiles) {
      await processFile(fileInfo);
    }
  }, []);

  // 处理单个文件
  const processFile = async (fileInfo: FileInfo) => {
    try {
      // 检查是否有原始File对象
      if (!fileInfo.file) {
        setFileList(prev => prev.map(f => 
          f.uid === fileInfo.uid ? { 
            ...f, 
            status: 'error', 
            error: '文件对象丢失，无法处理'
          } : f
        ));
        return;
      }

      // 验证文件格式
      const formatValidation = validateFileFormat(fileInfo.file);
      
      if (!formatValidation.isValid) {
        setFileList(prev => prev.map(f => 
          f.uid === fileInfo.uid ? { 
            ...f, 
            status: 'error', 
            error: formatValidation.errors.join(', '),
            validation: formatValidation
          } : f
        ));
        return;
      }

      // 解析文件内容
      let parseResult: FileParseResult;
      if (isExcelFile(fileInfo.file)) {
        parseResult = await parseExcelFile(fileInfo.file);
      } else {
        parseResult = await parseCSVFile(fileInfo.file);
      }

      if (!parseResult.success) {
        setFileList(prev => prev.map(f => 
          f.uid === fileInfo.uid ? { 
            ...f, 
            status: 'error', 
            error: parseResult.error,
            parseResult
          } : f
        ));
        return;
      }

      // 根据解析结果重新识别文件类型
      const updatedCategory = identifyFileType(fileInfo.name, fileInfo.type, parseResult.columns);
      
      // 对于线索数据，使用原来页面的数据转换逻辑
      let processedData = parseResult.data;
      if (updatedCategory === 'leads' && processedData) {
        processedData = processedData.map((row: any) => {
          // 处理开通时间，如果是 "-" 或无效日期则设为 null
          const activationTimeStr = String(row['开通时间'] || '');
          const activationTime = activationTimeStr && activationTimeStr !== '-' && activationTimeStr !== 'null' 
            ? activationTimeStr 
            : null;
          
          return {
            employee_name: String(row['员工名称'] || ''),
            xiaohongshu_account_id: String(row['小红书账号id'] || ''),
            xiaohongshu_nickname: String(row['小红书昵称'] || ''),
            account_id: String(row['账号ID'] || ''),
            region: String(row['所属地区'] || ''),
            tags: String(row['标签'] || ''),
            activation_time: activationTime,
            published_notes_count: parseInt(String(row['发布笔记数'])) || 0,
            promoted_notes_count: parseInt(String(row['投流笔记数'])) || 0,
            notes_promotion_cost: parseFloat(String(row['笔记投流消耗'])) || 0,
            total_interactions: parseInt(String(row['总互动数'])) || 0,
            total_form_leads: parseInt(String(row['总表单客资数'])) || 0,
            total_private_message_leads: parseInt(String(row['总私信进线数'])) || 0,
            total_private_message_openings: parseInt(String(row['总私信开口数'])) || 0,
            total_private_message_leads_kept: parseInt(String(row['总私信留资数'])) || 0,
            notes_exposure_count: parseInt(String(row['笔记曝光量'])) || 0,
            notes_click_count: parseInt(String(row['笔记点击量'])) || 0,
            time_range: {
              start_date: '',
              end_date: '',
              remark: ''
            }
          };
        });
      }
      
      // 验证数据内容
      const contentValidation = validateDataContent(
        processedData || [], 
        parseResult.columns || [], 
        (updatedCategory === 'unknown' ? 'employee' : updatedCategory) as 'employee' | 'leads'
      );

      setFileList(prev => prev.map(f => 
        f.uid === fileInfo.uid ? { 
          ...f, 
          status: 'pending',
          category: updatedCategory === 'unknown' ? undefined : updatedCategory,
          preview: processedData?.slice(0, 5),
          rowCount: processedData?.length || parseResult.rowCount,
          columns: parseResult.columns,
          validation: contentValidation,
          parseResult: {
            ...parseResult,
            data: processedData
          }
        } : f
      ));

      console.log('文件解析结果:', {
        fileName: fileInfo.name,
        columns: parseResult.columns,
        updatedCategory: updatedCategory,
        rowCount: processedData?.length || parseResult.rowCount
      });
      


    } catch (error) {
      setFileList(prev => prev.map(f => 
        f.uid === fileInfo.uid ? { 
          ...f, 
          status: 'error', 
          error: error instanceof Error ? error.message : '处理文件失败'
        } : f
      ));
    }
  };

  // 删除文件
  const removeFile = (uid: string) => {
    setFileList(prev => prev.filter(file => file.uid !== uid));
    setImportResults(prev => {
      const newResults = { ...prev };
      delete newResults[uid];
      return newResults;
    });
  };

  // 手动选择文件类型
  const handleManualCategoryChange = (uid: string, category: 'employee' | 'leads') => {
    setFileList(prev => prev.map(file => {
      if (file.uid === uid) {
        // 手动选择文件类型后，跳过验证，直接设置为有效状态
        return { 
          ...file, 
          manualCategory: category,
          status: 'pending', // 设置为待处理状态
          validation: {
            isValid: true,
            errors: [],
            warnings: []
          }
        };
      }
      return file;
    }));
  };

  // 更新单个文件的时间范围
  const handleFileTimeRangeChange = (uid: string, timeRange: [string, string] | null) => {
    setFileList(prev => prev.map(file => 
      file.uid === uid ? { ...file, timeRange } : file
    ));
  };

  // 更新单个文件的备注
  const handleFileRemarkChange = (uid: string, remark: string) => {
    setFileList(prev => prev.map(file => 
      file.uid === uid ? { ...file, remark } : file
    ));
  };



  // 员工数据导入函数 - 直接调用现有API
  const importEmployeeData = async (data: any[], timeRange: [string, string] | null, remark: string): Promise<any[]> => {
    const newData: any[] = [];
    
    for (const row of data) {
      const employeeData = {
        employee_name: String(row['员工号名称'] || ''),
        employee_uid: String(row['员工号UID'] || ''),
        score_15s_response: parseFloat(String(row['15秒首响率得分'] || '0')),
        score_30s_response: parseFloat(String(row['30秒回复率得分'] || '0')),
        score_1min_response: parseFloat(String(row['1分钟回复率得分'] || '0')),
        score_1hour_timeout: parseFloat(String(row['1小时超时回复率得分'] || '0')),
        score_avg_response_time: parseFloat(String(row['平均回复时长得分'] || '0')),
        rate_15s_response: String(row['15秒首响率'] || '0%'),
        rate_30s_response: String(row['30秒回复率'] || '0%'),
        rate_1min_response: String(row['1分钟回复率'] || '0%'),
        rate_1hour_timeout: String(row['1小时超时回复率'] || '0%'),
        avg_response_time: parseFloat(String(row['平均回复时长'] || '0')),
        user_rating_score: parseFloat(String(row['用户评价得分'] || '0')),
        time_range: {
          start_date: timeRange?.[0] || '',
          end_date: timeRange?.[1] || '',
          remark: remark || ''
        }
      };
      
      newData.push(employeeData);
    }
    
    return await employeeApi.batchCreateEmployeeData(newData);
  };

  // 线索数据导入函数 - 直接调用现有API
  const importLeadsData = async (data: any[]): Promise<any[]> => {
    // 直接调用 employeeLeadsApi.batchCreateEmployeeLeadsData，数据已经在 processFile 中正确解析
    return await employeeLeadsApi.batchCreateEmployeeLeadsData(data);
  };

  // 开始导入
  const startImport = async () => {
    if (fileList.length === 0) {
      message.warning('请先选择要导入的文件');
      return;
    }

    const validFiles = fileList.filter(f => f.status === 'pending' || f.status === 'success');
    if (validFiles.length === 0) {
      message.error('没有可导入的有效文件');
      return;
    }

    // 验证员工数据和线索数据的必填字段
    const employeeAndLeadsFiles = validFiles.filter(file => {
      const category = file.manualCategory || file.category;
      return category === 'employee' || category === 'leads';
    });

    console.log('验证员工数据和线索数据文件:', {
      totalFiles: validFiles.length,
      employeeAndLeadsFiles: employeeAndLeadsFiles.length,
      globalDateRange: selectedDateRange,
      globalRemark: selectedRemark
    });

    for (const file of employeeAndLeadsFiles) {
      const fileTimeRange = file.timeRange || selectedDateRange;
      // const fileRemark = file.remark || selectedRemark;
      
      console.log(`验证文件 ${file.name}:`, {
        fileTimeRange,
        // fileRemark,
        fileCategory: file.manualCategory || file.category
      });
      
      if (!fileTimeRange || !fileTimeRange[0] || !fileTimeRange[1]) {
        message.error(`文件 "${file.name}" 缺少时间范围设置`);
        setImporting(false);
        return;
      }
      // 备注非必填，不再校验
    }

    setImporting(true);
    setOverallProgress(0);
    setImportResults({});
    
    const totalFiles = validFiles.length;
    let completedFiles = 0;
    let localSuccessCount = 0; // 添加成功计数器

    for (const file of validFiles) {
      try {
        // 更新文件状态为处理中
        setFileList(prev => prev.map(f => 
          f.uid === file.uid ? { ...f, status: 'processing' } : f
        ));

        // 模拟文件上传进度
        for (let progress = 0; progress <= 100; progress += 10) {
          setFileList(prev => prev.map(f => 
            f.uid === file.uid ? { ...f, progress } : f
          ));
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // 优先使用手动选择的文件类型，如果没有则使用自动识别的类型
        const finalCategory = file.manualCategory || file.category;
        
        // 使用单个文件的导入设置，如果没有则使用全局设置
        const fileTimeRange = file.timeRange || selectedDateRange;
        const fileRemark = file.remark || selectedRemark;

        // 根据文件类型调用相应的API，直接传递解析后的数据
        let result: ImportResult;
        try {
          // 使用解析后的数据而不是文件对象
          if (!file.parseResult?.data) {
            throw new Error('文件数据解析失败');
          }

          // 根据文件类型调用相应的API，直接传递解析后的数据
          switch (finalCategory) {
            case 'employee':
              // 使用原页面的导入逻辑
              const employeeImportData = await importEmployeeData(file.parseResult.data, fileTimeRange, fileRemark);
              result = {
                success: true,
                message: `成功导入 ${employeeImportData.length} 条员工数据`,
                importedRows: employeeImportData.length
              };
              break;

            case 'leads':
              // 使用原页面的导入逻辑，但需要设置时间范围
              const leadsDataWithTimeRange = file.parseResult.data.map((item: any) => ({
                ...item,
                time_range: {
                  start_date: fileTimeRange?.[0] || '',
                  end_date: fileTimeRange?.[1] || '',
                  remark: fileRemark || ''
                }
              }));
              const leadsImportData = await importLeadsData(leadsDataWithTimeRange);
              result = {
                success: true,
                message: `成功导入 ${leadsImportData.length} 条线索数据`,
                importedRows: leadsImportData.length
              };
              break;



            default:
              // 默认作为员工数据处理
              const defaultImportData = await importEmployeeData(file.parseResult.data, fileTimeRange, fileRemark);
              result = {
                success: true,
                message: `成功导入 ${defaultImportData.length} 条数据`,
                importedRows: defaultImportData.length
              };
              break;
          }
        } catch (error) {
          result = {
            success: false,
            message: error instanceof Error ? error.message : '导入失败',
            errors: [error instanceof Error ? error.message : '未知错误']
          };
        }

        // 更新文件状态和结果
        setFileList(prev => prev.map(f => 
          f.uid === file.uid ? { 
            ...f, 
            status: result.success ? 'success' : 'error',
            progress: 100,
            error: result.success ? undefined : result.message
          } : f
        ));
        
        setImportResults(prev => ({
          ...prev,
          [file.uid]: result
        }));

        // 更新成功计数器
        if (result.success) {
          localSuccessCount++;
          console.log(`文件 ${file.name} 导入成功，当前成功数: ${localSuccessCount}`);
        } else {
          console.log(`文件 ${file.name} 导入失败: ${result.message}`);
        }

        completedFiles++;
        setOverallProgress((completedFiles / totalFiles) * 100);

      } catch (error) {
        console.error('导入失败:', error);
        const errorMessage = error instanceof Error ? error.message : '导入失败';
        
        setFileList(prev => prev.map(f => 
          f.uid === file.uid ? { 
            ...f, 
            status: 'error', 
            error: errorMessage
          } : f
        ));
        
        setImportResults(prev => ({
          ...prev,
          [file.uid]: {
            success: false,
            message: errorMessage
          }
        }));
        
        // 注意：这里不需要更新 localSuccessCount，因为失败的文件不计入成功数
      }
    }

    setImporting(false);
    
    // 检查导入结果
    console.log('导入完成，统计信息:', {
      localSuccessCount,
      validFilesLength: validFiles.length,
      importResults: importResults
    });
    
    if (localSuccessCount === validFiles.length) {
      message.success(`成功导入 ${localSuccessCount} 个文件`);
      onSuccess?.();
    } else {
      message.error(`导入完成，${localSuccessCount}/${validFiles.length} 个文件成功`);
    }
  };

  // 关闭弹窗
  const handleClose = () => {
    setFileList([]);
    setImporting(false);
    setOverallProgress(0);
    setImportResults({});
    setActiveTab('upload');
    setSelectedDateRange(null);
    setSelectedRemark('');
    onClose();
  };

  // 弹窗打开时清空文件列表
  useEffect(() => {
    if (visible) {
      setFileList([]);
      setImporting(false);
      setOverallProgress(0);
      setImportResults({});
      setActiveTab('upload');
      setSelectedDateRange(null);
      setSelectedRemark('');
      setGlobalSettingsCollapsed(true); // 重置为折叠状态
    }
  }, [visible]);

  // 监听全局设置变化，自动应用到现有文件
  useEffect(() => {
    if (fileList.length > 0) {
      console.log('全局设置变化，自动应用到文件:', {
        selectedDateRange,
        selectedRemark,
        fileListLength: fileList.length
      });
      
      setFileList(prev => prev.map(file => {
        const category = file.manualCategory || file.category;
        if (category === 'employee' || category === 'leads') {
          console.log(`更新文件 ${file.name} 的设置:`, {
            oldTimeRange: file.timeRange,
            newTimeRange: selectedDateRange || file.timeRange,
            oldRemark: file.remark,
            newRemark: selectedRemark || file.remark
          });
          return {
            ...file,
            timeRange: selectedDateRange || file.timeRange,
            remark: selectedRemark || file.remark
          };
        }
        return file;
      }));
    }
  }, [selectedDateRange, selectedRemark, fileList.length]);

  // 获取文件类型标签颜色

  // 获取文件类型标签文本

  // 获取文件状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'error': return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'processing': return '⏳';
      case 'validating': return '🔍';
      default: return '📄';
    }
  };

  // 预览表格列配置
  const getPreviewColumns = (columns: string[]) => {
    return columns.map(col => ({
      title: col,
      dataIndex: col,
      key: col,
      ellipsis: true,
      width: 150,
    }));
  };

  const items = [
    {
      key: 'upload',
      label: '文件上传',
      children: (
        <div>
          {/* 添加时间范围和remark设置 */}
          <div style={{ marginBottom: 16, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 6 }}>
            <div 
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                cursor: 'pointer',
                marginBottom: globalSettingsCollapsed ? 0 : 12
              }}
              onClick={() => setGlobalSettingsCollapsed(!globalSettingsCollapsed)}
            >
              <h4 style={{ margin: 0 }}>全局导入设置</h4>
              <span style={{ fontSize: '12px', color: '#666' }}>
                {globalSettingsCollapsed ? '展开' : '折叠'}
              </span>
            </div>
            
            {!globalSettingsCollapsed && (
              <>
                <Row gutter={16}>
                  <Col span={12}>
                    <div style={{ marginBottom: 8 }}>
                      <label>时间范围：</label>
                    </div>
                    <DatePicker.RangePicker
                      value={selectedDateRange ? [dayjs(selectedDateRange[0]), dayjs(selectedDateRange[1])] : null}
                      onChange={(dates, dateStrings) => {
                        if (dates && dates[0] && dates[1]) {
                          const newTimeRange: [string, string] = [dateStrings[0], dateStrings[1]];
                          setSelectedDateRange(newTimeRange);
                          console.log('全局时间范围变更:', newTimeRange);
                        } else {
                          setSelectedDateRange(null);
                        }
                      }}
                      format="YYYY-MM-DD"
                      placeholder={['开始日期', '结束日期']}
                      style={{ width: '100%' }}
                    />
                  </Col>
                  <Col span={12}>
                    <div style={{ marginBottom: 8 }}>
                      <label>备注：</label>
                    </div>
                    <Input
                      placeholder="请输入备注信息"
                      value={selectedRemark}
                      onChange={(e) => {
                        const newRemark = e.target.value;
                        setSelectedRemark(newRemark);
                        console.log('全局备注变更:', newRemark);
                      }}
                      style={{ width: '100%' }}
                    />
                  </Col>
                </Row>
                <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
                  提示：时间范围和备注将自动应用到员工数据和线索数据文件
                </div>
              </>
            )}
          </div>
          
          {importing && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8 }}>
                总体进度: {Math.round(overallProgress)}%
              </div>
              <Progress percent={overallProgress} status="active" />
            </div>
          )}

          {/* 文件上传区域 */}
          <div 
            style={{ 
              border: '2px dashed #d9d9d9', 
              borderRadius: 6, 
              padding: 20, 
              textAlign: 'center',
              backgroundColor: '#fafafa',
              marginBottom: 16,
              transition: 'all 0.3s'
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.style.borderColor = '#1890ff';
              e.currentTarget.style.backgroundColor = '#f0f8ff';
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.currentTarget.style.borderColor = '#d9d9d9';
              e.currentTarget.style.backgroundColor = '#fafafa';
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.style.borderColor = '#d9d9d9';
              e.currentTarget.style.backgroundColor = '#fafafa';
              
              const files = e.dataTransfer.files;
              if (files && files.length > 0) {
                // 将FileList转换为数组并传递给handleFileUpload
                const fileArray = Array.from(files);
                handleFileUpload(fileArray);
              }
            }}
          >
            <input
              type="file"
              multiple
              accept=".xlsx,.xls,.csv"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  const fileArray = Array.from(e.target.files);
                  handleFileUpload(fileArray);
                }
              }}
              style={{ display: 'none' }}
              id="file-upload-input"
            />
            <label htmlFor="file-upload-input" style={{ cursor: 'pointer' }}>
              <div style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: 8 }}>
                <InboxOutlined />
              </div>
              <div style={{ fontSize: '16px', color: '#666', marginBottom: 8 }}>
                点击或拖拽文件到此区域上传
              </div>
              <div style={{ fontSize: '12px', color: '#999', marginBottom: 8 }}>
                支持单个或批量上传，支持 Excel 和 CSV 格式
              </div>
              <div style={{ fontSize: '12px', color: '#1890ff' }}>
                提示：如果自动识别文件类型失败，可以手动选择正确的文件类型
              </div>
            </label>
          </div>

          {fileList.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <h4>待导入文件 ({fileList.length})</h4>
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {fileList.map((file) => (
                  <Card
                    key={file.uid}
                    size="small"
                    style={{ marginBottom: 8 }}
                    extra={
                      <Space>
                        <Button
                          type="text"
                          icon={<EyeOutlined />}
                          onClick={() => setActiveTab('preview')}
                          disabled={importing}
                        />
                        <Button
                          type="text"
                          icon={<DeleteOutlined />}
                          onClick={() => removeFile(file.uid)}
                          disabled={importing}
                        />
                      </Space>
                    }
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {getStatusIcon(file.status)}
                          <span style={{ fontWeight: 'bold', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={file.name}>
                            {file.name}
                          </span>
                          <Select
                            size="small"
                            style={{ width: 100 }}
                            value={file.manualCategory || file.category}
                            onChange={(value) => handleManualCategoryChange(file.uid, value)}
                            disabled={importing}
                            placeholder="选择类型"
                          >
                            <Select.Option value="employee">员工数据</Select.Option>
                            <Select.Option value="leads">线索明细</Select.Option>
                          </Select>
                          {file.rowCount && (
                            <Tag color="purple">{file.rowCount} 行数据</Tag>
                          )}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                          大小: {formatFileSize(file.size)}
                        </div>
                        {file.error && (
                          <div style={{ fontSize: '12px', color: '#ff4d4f', marginTop: 4 }}>
                            错误: {file.error}
                          </div>
                        )}
                        {file.validation && (
                          <div style={{ fontSize: '12px', marginTop: 4 }}>
                            {file.validation.errors.length > 0 && (
                              <div style={{ color: '#ff4d4f' }}>
                                验证错误: {file.validation.errors.join(', ')}
                              </div>
                            )}
                            {file.validation.warnings.length > 0 && (
                              <div style={{ color: '#faad14' }}>
                                警告: {file.validation.warnings.join(', ')}
                              </div>
                            )}
                          </div>
                        )}
                        {importResults[file.uid] && (
                          <div style={{ fontSize: '12px', marginTop: 4 }}>
                            <Text type={importResults[file.uid].success ? 'success' : 'danger'}>
                              {importResults[file.uid].message}
                            </Text>
                          </div>
                        )}
                      </div>
                      
                      {/* 单个文件导入设置 - 右侧 */}
                      {(file.manualCategory || file.category) && (
                        <div style={{ width: 500, marginLeft: 16 }}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '11px', color: '#666', marginBottom: 2 }}>时间范围：</div>
                              <DatePicker.RangePicker
                                size="small"
                                value={file.timeRange ? [dayjs(file.timeRange[0]), dayjs(file.timeRange[1])] : null}
                                onChange={(dates, dateStrings) => {
                                  if (dates && dates[0] && dates[1]) {
                                    handleFileTimeRangeChange(file.uid, [dateStrings[0], dateStrings[1]]);
                                  } else {
                                    handleFileTimeRangeChange(file.uid, null);
                                  }
                                }}
                                format="YYYY-MM-DD"
                                placeholder={['开始', '结束']}
                                style={{ width: '100%' }}
                                disabled={importing}
                              />
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '11px', color: '#666', marginBottom: 2 }}>备注：</div>
                              <Input
                                size="small"
                                placeholder="备注"
                                value={file.remark || ''}
                                onChange={(e) => handleFileRemarkChange(file.uid, e.target.value)}
                                style={{ width: '100%' }}
                                disabled={importing}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {file.status === 'processing' && (
                        <div style={{ width: 100, marginLeft: 16 }}>
                          <Progress percent={file.progress} size="small" />
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {fileList.length > 0 && (
            <div style={{ marginTop: 16, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span>员工数据: {fileList.filter(f => (f.manualCategory || f.category) === 'employee').length} 个</span>
                <span>线索明细: {fileList.filter(f => (f.manualCategory || f.category) === 'leads').length} 个</span>
                <span>未知类型: {fileList.filter(f => !(f.manualCategory || f.category)).length} 个</span>
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      key: 'preview',
      label: '数据预览',
      children: (
        <div>
          {fileList.map((file) => (
            <Card
              key={file.uid}
              title={`${file.name} - 数据预览`}
              style={{ marginBottom: 16 }}
            >
              {file.preview && file.columns ? (
                <Table
                  dataSource={file.preview}
                  columns={getPreviewColumns(file.columns)}
                  size="small"
                  pagination={false}
                  scroll={{ x: true }}
                />
              ) : (
                <Text type="secondary">无法预览此文件内容</Text>
              )}
            </Card>
          ))}
        </div>
      )
    }
  ];

  return (
    <Modal
      title="批量导入数据"
      open={visible}
      onCancel={handleClose}
      width={1000}
      footer={[
        <Button key="cancel" onClick={handleClose} disabled={importing}>
          取消
        </Button>,
        <Button 
          key="import" 
          type="primary" 
          onClick={startImport}
          loading={importing}
          disabled={fileList.filter(f => f.status === 'pending' || f.status === 'success').length === 0}
        >
          {importing ? '导入中...' : '开始导入'}
        </Button>
      ]}
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={items}
      />
    </Modal>
  );
};

export default UltimateImportModal; 