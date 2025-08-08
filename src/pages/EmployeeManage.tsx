import { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Tag, 
  Space, 
  Button, 
  Input, 
  Modal, 
  Form, 
  App, 
  Popconfirm,
  Tooltip,
  Spin,
  DatePicker,
  Upload,
  Progress,
  Alert,
  Dropdown,
  Menu
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  HistoryOutlined,
  UploadOutlined,
  DownloadOutlined,
  DownOutlined,
  FilterOutlined,
  ReloadOutlined
} from '@ant-design/icons';
// 额外用于“重置违规记录”的图标
import { StopOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

import { employeeManageApi } from '../lib/employeeManageApi';

import { disciplinaryRecordApi } from '../lib/disciplinaryRecordApi.ts';
import { 
  downloadEmployeeData, 
  parseEmployeeExcelFile, 
  validateEmployeeData,
  type EmployeeExcelData 
} from '../utils/employeeExcelUtils';
import { getHoldingPeriodDetails } from '../utils/employeeUtils';
import { 
  getStatusDisplayText, 
  getStatusColor, 
  getStatusDescription,
  getYellowCardsToRedCard
} from '../utils/violationStatusUtils';
// 定义违规状态类型
interface ViolationStatus {
  employeeId: string;
  employeeName: string;
  currentYellowCards: number;
  currentRedCards: number;
  status: 'normal' | 'yellow' | 'red';
}

// 定义类型
interface EmployeeListData {
  id: string;
  employee_name: string;
  employee_uid: string;
  status: string | null;
  activation_time: string | null;
  created_at: string;
  violation_status?: string | null;
  current_yellow_cards?: number | null;
  current_red_cards?: number | null;
}






const { Search } = Input;

export default function EmployeeManage() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<EmployeeListData[]>([]);
  // 原始数据（用于前端筛选的基准数据）
  const [allData, setAllData] = useState<EmployeeListData[]>([]);
  const [, setSearchText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<EmployeeListData | null>(null);
  const [form] = Form.useForm();


  // 移除分页相关状态

  // 表头筛选相关状态
  const [filteredInfo, setFilteredInfo] = useState<Record<string, any>>({});



  // 批量上传相关状态
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [batchUploadFile, setBatchUploadFile] = useState<File | null>(null);
  const [batchParsedData, setBatchParsedData] = useState<EmployeeExcelData[]>([]);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);

  // 违规记录弹窗相关状态
  const [violationModalVisible, setViolationModalVisible] = useState(false);
  const [violationData, setViolationData] = useState<any[]>([]);
  const [violationLoading, setViolationLoading] = useState(false);
  const [currentEmployeeForViolation, setCurrentEmployeeForViolation] = useState<EmployeeListData | null>(null);

  // 违规状态详情弹窗相关状态
  const [violationStatusModalVisible, setViolationStatusModalVisible] = useState(false);
  const [violationStatusData, setViolationStatusData] = useState<ViolationStatus | null>(null);
  const [violationStatusLoading, setViolationStatusLoading] = useState(false);
  const [currentEmployeeForStatus, setCurrentEmployeeForStatus] = useState<EmployeeListData | null>(null);


  
  // 批量选择相关状态
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys as string[]);
  };

  // 行右键菜单状态
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    record: EmployeeListData | null;
  }>({ visible: false, x: 0, y: 0, record: null });

  const closeContextMenu = () => setContextMenu(prev => ({ ...prev, visible: false }));

  useEffect(() => {
    const onWindowClick = () => closeContextMenu();
    window.addEventListener('click', onWindowClick);
    return () => window.removeEventListener('click', onWindowClick);
  }, []);

  // 性能优化：缓存违规状态数据
  const [violationStatusCache, setViolationStatusCache] = useState<Record<string, ViolationStatus | null>>({});
  const [cacheTimestamp, setCacheTimestamp] = useState<number>(0);
  
  // 缓存有效期（5分钟）
  const CACHE_DURATION = 5 * 60 * 1000;

  // 计算持有周期键值（与筛选项一致）
  const computeHoldingPeriodKey = (activationTime: string | null): string => {
    if (!activationTime) return 'not_activated';
    const today = dayjs();
    const activated = dayjs(activationTime);
    const days = today.diff(activated, 'day');
    if (days < 1) return '1_30';
    if (days <= 30) return '1_30';
    if (days <= 90) return '31_90';
    if (days <= 180) return '91_180';
    if (days <= 365) return '181_365';
    return '365_plus';
  };

  // 前端应用筛选
  const applyFilters = (source: EmployeeListData[], tableFilters: any): EmployeeListData[] => {
    if (!source || source.length === 0) return [];
    const statusFilters: string[] | undefined = tableFilters?.status;
    const holdingFilters: string[] | undefined = tableFilters?.holding_period;
    const violationFilters: string[] | undefined = tableFilters?.violation_status;

    return source.filter((item) => {
      // 员工状态筛选（status）
      if (statusFilters && statusFilters.length > 0) {
        const value = item.status || '';
        if (!statusFilters.includes(value)) return false;
      }

      // 持有周期筛选（基于 activation_time 推导）
      if (holdingFilters && holdingFilters.length > 0) {
        const key = computeHoldingPeriodKey(item.activation_time || null);
        if (!holdingFilters.includes(key)) return false;
      }

      // 违规状态筛选（violation_status: normal|yellow|red）
      if (violationFilters && violationFilters.length > 0) {
        const vs = (item.violation_status as string) || 'normal';
        if (!violationFilters.includes(vs)) return false;
      }

      return true;
    });
  };

  // 单个员工重置违规记录（软清空）并刷新状态
  const handleClearEmployeeViolations = async (record: EmployeeListData) => {
    try {
      setLoading(true);
      await disciplinaryRecordApi.softClearEmployeeViolations(record.id);
      await disciplinaryRecordApi.refreshEmployeeViolationStatus(record.id);
      message.success(`已重置 ${record.employee_name} 的违规记录并刷新状态`);
      loadData();
    } catch (error) {
      message.error('重置违规记录失败');
      console.error('重置违规记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 批量清空所选员工违规记录（软清空）并刷新状态
  const handleBatchClearSelectedViolations = async () => {
    if (!selectedRowKeys.length) {
      message.warning('请先选择员工');
      return;
    }
    try {
      setLoading(true);
      await disciplinaryRecordApi.softClearEmployeesViolations(selectedRowKeys);
      await Promise.all(selectedRowKeys.map(id => disciplinaryRecordApi.refreshEmployeeViolationStatus(id)));
      message.success(`已重置所选 ${selectedRowKeys.length} 位员工的违规记录并刷新状态`);
      setSelectedRowKeys([]);
      loadData();
    } catch (error) {
      message.error('批量重置违规记录失败');
      console.error('批量重置违规记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取状态选项
  const getStatusOptions = () => {
    const statusSet = new Set<string>();
    (allData.length ? allData : data).forEach(item => {
      if (item.status) {
        statusSet.add(item.status);
      }
    });
    return Array.from(statusSet).map(status => ({ text: status, value: status }));
  };

  // 获取违规状态选项
  const getViolationStatusOptions = () => {
    const options = [
      { text: '正常', value: 'normal' },
      { text: '黄牌', value: 'yellow' },
      { text: '红牌', value: 'red' }
    ];
    return options;
  };

  // 获取持有周期选项
  const getHoldingPeriodOptions = () => {
    const options = [
      { text: '未开通', value: 'not_activated' },
      { text: '1-30天', value: '1_30' },
      { text: '31-90天', value: '31_90' },
      { text: '91-180天', value: '91_180' },
      { text: '181-365天', value: '181_365' },
      { text: '365天以上', value: '365_plus' }
    ];
    return options;
  };





  // 获取违规状态（带缓存）
  const getViolationStatusesWithCache = async (employeeIds: string[]) => {
    const now = Date.now();
    
    // 检查缓存是否有效
    if (now - cacheTimestamp < CACHE_DURATION && Object.keys(violationStatusCache).length > 0) {
      // 从缓存中获取数据
      const cachedData: Record<string, ViolationStatus | null> = {};
      const missingIds: string[] = [];
      
      employeeIds.forEach(id => {
        if (id in violationStatusCache) {
          cachedData[id] = violationStatusCache[id];
        } else {
          missingIds.push(id);
        }
      });
      
      // 如果有缺失的数据，只获取缺失的部分
      if (missingIds.length > 0) {
        const missingStatuses = await disciplinaryRecordApi.getEmployeeViolationStatuses(missingIds);
        
        // 更新缓存
        setViolationStatusCache(prev => ({
          ...prev,
          ...missingStatuses
        }));
        
        return { ...cachedData, ...missingStatuses };
      }
      
      return cachedData;
    } else {
      // 缓存无效，重新获取所有数据
      const statuses = await disciplinaryRecordApi.getEmployeeViolationStatuses(employeeIds);
      
      // 更新缓存
      setViolationStatusCache(statuses);
      setCacheTimestamp(now);
      
      return statuses;
    }
  };

  // 加载数据（加载全量后前端筛选）
  const loadData = async () => {
    setLoading(true);
    
    try {
      const result = await employeeManageApi.getEmployeeListWithViolations();
      const normalized: EmployeeListData[] = (result.data || []).map((emp: EmployeeListData) => ({
        ...emp,
        violation_status: emp.violation_status || 'normal',
      }));

      setAllData(normalized);
      const filtered = applyFilters(normalized, filteredInfo);
      setData(filtered);

    } catch (error) {
      message.error('加载数据失败');
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 搜索功能
  const handleSearch = async (value: string) => {
    setSearchText(value);
    if (!value.trim()) {
      loadData();
      return;
    }

    setLoading(true);
    try {
      let searchResults: any;
      
      // 尝试按姓名搜索
      searchResults = await employeeManageApi.searchEmployeeByName(value);
      
      // 如果按姓名没找到，尝试按UID搜索
      if (searchResults.data.length === 0) {
        searchResults = await employeeManageApi.searchEmployeeByUid(value);
      }
      
      // 获取违规状态（仅在数据量较小时）
      if (searchResults.data.length > 0 && searchResults.data.length <= 100) {
        const employeeIds = searchResults.data.map((emp: EmployeeListData) => emp.id);
        const violationStatuses = await getViolationStatusesWithCache(employeeIds);
        
        const dataWithViolations = searchResults.data.map((emp: EmployeeListData) => ({
          ...emp,
          violation_status: violationStatuses[emp.id] || null
        }));
        
        setData(dataWithViolations);
      } else {
        // 数据量较大时，直接使用搜索结果，违规状态可以延迟加载
        setData(searchResults.data);
      }
    } catch (error) {
      message.error('搜索失败');
      console.error('搜索失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 处理表格变化（前端筛选）
  const handleTableChange = (_paginationInfo: any, filters: any) => {
    setFilteredInfo(filters);
    const filtered = applyFilters(allData, filters);
    setData(filtered);
  };



  // 获取当前页面数据（服务器端筛选后的数据）
  const getCurrentPageData = () => {
    return data;
  };

  // 添加/编辑员工
  const handleAddEdit = (record?: EmployeeListData) => {
    setEditingRecord(record || null);
          if (record) {
        form.setFieldsValue({
          employee_name: record.employee_name,
          employee_uid: record.employee_uid,
          status: record.status || '',
          activation_time: record.activation_time ? dayjs(record.activation_time) : null,
        });
      } else {
        form.resetFields();
      }
    setModalVisible(true);
  };

  // 保存员工信息
  const handleSave = async (values: any) => {
    try {
      // 处理开通时间格式
      const processedValues = {
        ...values,
        activation_time: values.activation_time ? values.activation_time.format('YYYY-MM-DD') : null
      };

      if (editingRecord) {
        // 更新
        await employeeManageApi.updateEmployee(editingRecord.id, processedValues);
        message.success('更新成功');
      } else {
        // 检查UID是否已存在
        const exists = await employeeManageApi.checkEmployeeUidExists(values.employee_uid);
        if (exists) {
          message.error('员工UID已存在');
          return;
        }
        
        // 创建时不预设状态
        const createData = {
          ...processedValues
        };
        await employeeManageApi.createEmployee(createData);
        message.success('创建成功');
      }
      
      setModalVisible(false);
      form.resetFields();
      loadData();
    } catch (error) {
      message.error('操作失败');
      console.error('保存失败:', error);
    }
  };

  // 删除员工
  const handleDelete = async (id: string) => {
    try {
      await employeeManageApi.deleteEmployee(id);
      message.success('删除成功');
      loadData();
    } catch (error) {
      message.error('删除失败');
      console.error('删除失败:', error);
    }
  };



  useEffect(() => {
    loadData();
  }, []);

  // 下载员工数据
  const handleDownloadData = () => {
    try {
      const fileName = downloadEmployeeData(data);
      message.success(`数据已下载为: ${fileName}`);
    } catch (error) {
      message.error('下载失败');
      console.error('下载失败:', error);
    }
  };

  // 处理文件上传
  const handleFileUpload = async (file: File) => {
    setBatchUploadFile(file);
    setUploadLoading(true);
    setValidationResult(null);
    setUploadResult(null);

    try {
      const result = await parseEmployeeExcelFile(file);
      
      if (result.success && result.data) {
        setBatchParsedData(result.data);
        
        // 验证数据
        const validation = validateEmployeeData(result.data, data);
        setValidationResult(validation);
        
        if (result.warnings) {
          message.warning(`文件解析完成，但有 ${result.warnings.length} 个警告`);
        } else {
          message.success('文件解析成功');
        }
      } else {
        message.error(result.error || '文件解析失败');
      }
    } catch (error) {
      message.error('文件处理失败');
      console.error('文件处理失败:', error);
    } finally {
      setUploadLoading(false);
    }
  };

  // 执行批量上传
  const handleBatchUpload = async () => {
    if (!batchParsedData.length) {
      message.error('没有可上传的数据');
      return;
    }

    setUploadLoading(true);
    setUploadProgress(0);

    try {
      const result = await employeeManageApi.batchUpsertEmployees(batchParsedData);
      setUploadResult(result);
      
      if (result.errors.length > 0) {
        message.warning(`上传完成，但有 ${result.errors.length} 个错误`);
      } else {
        message.success(`批量上传成功！新增 ${result.created.length} 条，更新 ${result.updated.length} 条`);
      }
      
      // 重新加载数据
      loadData();
    } catch (error) {
      message.error('批量上传失败');
      console.error('批量上传失败:', error);
    } finally {
      setUploadLoading(false);
      setUploadProgress(100);
    }
  };

  // 重置上传状态
  const resetUploadState = () => {
    setBatchUploadFile(null);
    setBatchParsedData([]);
    setValidationResult(null);
    setUploadResult(null);
    setUploadProgress(0);
  };

  // 查看违规记录
  const handleViewViolations = async (record: EmployeeListData) => {
    setCurrentEmployeeForViolation(record);
    setViolationModalVisible(true);
    setViolationLoading(true);
    
    try {
      const violations = await disciplinaryRecordApi.getDisciplinaryRecordsByEmployeeId(record.id);
      setViolationData(violations);
    } catch (error) {
      message.error('加载违规记录失败');
      console.error('加载违规记录失败:', error);
    } finally {
      setViolationLoading(false);
    }
  };

  // 查看违规状态详情
  const handleViewViolationStatus = async (record: EmployeeListData) => {
    setCurrentEmployeeForStatus(record);
    setViolationStatusModalVisible(true);
    setViolationStatusLoading(true);
    
    try {
      const status = await disciplinaryRecordApi.getEmployeeViolationStatus(record.id);
      setViolationStatusData(status);
    } catch (error) {
      message.error('加载违规状态失败');
      console.error('加载违规状态失败:', error);
    } finally {
      setViolationStatusLoading(false);
    }
  };

  // 刷新员工违规状态
  const handleRefreshViolationStatus = async (record: EmployeeListData) => {
    try {
      await disciplinaryRecordApi.refreshEmployeeViolationStatus(record.id);
      message.success('违规状态已刷新');
      // 重新加载数据
      loadData();
    } catch (error) {
      message.error('刷新违规状态失败');
      console.error('刷新违规状态失败:', error);
    }
  };

  // 批量刷新所有员工违规状态
  const handleRefreshAllViolationStatus = async () => {
    try {
      await disciplinaryRecordApi.refreshAllEmployeesViolationStatus();
      message.success('所有员工违规状态已刷新');
      // 重新加载数据
      loadData();
    } catch (error) {
      message.error('批量刷新违规状态失败');
      console.error('批量刷新违规状态失败:', error);
    }
  };



  // 表格列定义 - 根据数据库结构重新设计
  const columns = [
    {
      title: '员工姓名',
      dataIndex: 'employee_name',
      key: 'employee_name',
      width: 120,
      fixed: 'left' as const,
      sorter: (a: EmployeeListData, b: EmployeeListData) => 
        a.employee_name.localeCompare(b.employee_name),
      render: (name: string) => (
        <span style={{ fontWeight: 'bold' }}>{name}</span>
      ),
    },
    {
      title: '员工UID',
      dataIndex: 'employee_uid',
      key: 'employee_uid',
      width: 180,
      sorter: (a: EmployeeListData, b: EmployeeListData) => 
        a.employee_uid.localeCompare(b.employee_uid),
      render: (uid: string) => (
        <code style={{ fontSize: '12px', backgroundColor: '#f5f5f5', padding: '2px 4px', borderRadius: '3px' }}>
          {uid}
        </code>
      ),
    },
    {
      title: '员工状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      filters: getStatusOptions(),
      filteredValue: filteredInfo.status || null,
      filterIcon: (filtered: boolean) => (
        <FilterOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
      ),
      render: (status: string | null) => {
        if (!status) {
          return <Tag color="default">未设置</Tag>;
        }
        
        // 根据状态文本设置颜色
        let color = 'default';
        if (status.includes('正常') || status.includes('绿')) {
          color = 'green';
        } else if (status.includes('黄牌') || status.includes('警告')) {
          color = 'orange';
        } else if (status.includes('红牌') || status.includes('严重')) {
          color = 'red';
        }
        
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: '开通时间',
      dataIndex: 'activation_time',
      key: 'activation_time',
      width: 120,
      sorter: (a: EmployeeListData, b: EmployeeListData) => {
        if (!a.activation_time && !b.activation_time) return 0;
        if (!a.activation_time) return 1;
        if (!b.activation_time) return -1;
        return dayjs(a.activation_time).unix() - dayjs(b.activation_time).unix();
      },
      render: (date: string | null) => {
        if (!date) {
          return <span style={{ color: '#999' }}>未开通</span>;
        }
        return dayjs(date).format('YYYY-MM-DD');
      },
    },
    {
      title: '持有周期',
      dataIndex: 'activation_time',
      key: 'holding_period',
      width: 120,
      filters: getHoldingPeriodOptions(),
      filteredValue: filteredInfo.holding_period || null,
      render: (activationTime: string | null) => {
        const details = getHoldingPeriodDetails(activationTime);
        return <Tag color={details.color}>{details.text}</Tag>;
      },
    },
    {
      title: '违规状态',
      dataIndex: 'violation_status',
      key: 'violation_status',
      width: 100,
      filters: getViolationStatusOptions(),
      filteredValue: filteredInfo.violation_status || null,
      filterIcon: (filtered: boolean) => (
        <FilterOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
      ),
      render: (status: string | null, record: EmployeeListData) => {
        if (!status || status === 'normal') {
          return <Tag color="green">正常</Tag>;
        }
        
        let displayText = '正常';
        let color = 'green';
        
        if (status === 'yellow') {
          displayText = '黄牌';
          color = 'orange';
        } else if (status === 'red') {
          displayText = '红牌';
          color = 'red';
        }
        
        return (
          <Tooltip title={`违规状态: ${displayText} (单击查看详情)`}>
            <Tag 
              color={color} 
              style={{ cursor: 'pointer' }}
              onClick={() => handleViewViolationStatus(record)}
            >
              {displayText}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: '黄牌数量',
      dataIndex: 'current_yellow_cards',
      key: 'current_yellow_cards',
      width: 100,
      sorter: (a: EmployeeListData, b: EmployeeListData) => 
        (a.current_yellow_cards || 0) - (b.current_yellow_cards || 0),
      render: (cards: number | null) => {
        const count = cards || 0;
        return (
          <Tag color={count > 0 ? 'orange' : 'default'}>
            {count} 张
          </Tag>
        );
      },
    },
    {
      title: '红牌数量',
      dataIndex: 'current_red_cards',
      key: 'current_red_cards',
      width: 100,
      sorter: (a: EmployeeListData, b: EmployeeListData) => 
        (a.current_red_cards || 0) - (b.current_red_cards || 0),
      render: (cards: number | null) => {
        const count = cards || 0;
        return (
          <Tag color={count > 0 ? 'red' : 'default'}>
            {count} 张
          </Tag>
        );
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      sorter: (a: EmployeeListData, b: EmployeeListData) => 
        dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
  ];

  return (
    <div>
      {/* 主卡片 */}
      <Card
        title="员工管理"
        extra={
          <Space>
            <Search
              placeholder="搜索员工姓名或UID"
              onSearch={handleSearch}
              style={{ width: 250 }}
              allowClear
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleAddEdit()}
            >
              添加员工
            </Button>
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'download',
                    icon: <DownloadOutlined />,
                    label: '下载数据',
                    onClick: handleDownloadData
                  },
                  {
                    key: 'upload',
                    icon: <UploadOutlined />,
                    label: '批量上传',
                    onClick: () => setUploadModalVisible(true)
                  },
                  {
                    key: 'refresh_violation',
                    icon: <ReloadOutlined />,
                    label: '刷新违规状态',
                    onClick: handleRefreshAllViolationStatus
                  }
                ]
              }}
              placement="bottomRight"
            >
              <Button>
                数据操作 <DownOutlined />
              </Button>
            </Dropdown>
            <Popconfirm
              title={`确定要重置所选 ${selectedRowKeys.length} 位员工的全部违规记录吗？`}
              okText="确定"
              cancelText="取消"
              onConfirm={handleBatchClearSelectedViolations}
              disabled={selectedRowKeys.length === 0}
            >
              <Button danger disabled={selectedRowKeys.length === 0} icon={<StopOutlined />}>重置违规</Button>
            </Popconfirm>
          </Space>
        }
      >



        


        <Table
          columns={columns}
          dataSource={getCurrentPageData()}
          rowKey="id"
          loading={loading}
          size="small"
          pagination={false}
          onChange={handleTableChange}
          scroll={{ x: 1400 }}
          rowSelection={{ selectedRowKeys, onChange: onSelectChange }}
          onRow={(record) => ({
            onContextMenu: (e) => {
              e.preventDefault();
              setContextMenu({ visible: true, x: e.clientX, y: e.clientY, record });
            }
          })}
        />
      </Card>

      {contextMenu.visible && contextMenu.record && (
        <div
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            zIndex: 1000,
            background: '#fff',
            boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
            borderRadius: 4,
            overflow: 'hidden',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Menu
            selectable={false}
            onClick={({ key }) => {
              const record = contextMenu.record!;
              closeContextMenu();
              switch (key) {
                case 'edit':
                  handleAddEdit(record);
                  break;
                case 'violations':
                  handleViewViolations(record);
                  break;
                case 'refresh':
                  handleRefreshViolationStatus(record);
                  break;
                case 'clear':
                  Modal.confirm({
                    title: `重置【${record.employee_name}】的全部违规记录？`,
                    okText: '确定',
                    cancelText: '取消',
                    okButtonProps: { danger: true },
                    onOk: () => handleClearEmployeeViolations(record),
                  });
                  break;
                case 'delete':
                  Modal.confirm({
                    title: `删除员工【${record.employee_name}】？`,
                    okText: '确定',
                    cancelText: '取消',
                    okButtonProps: { danger: true },
                    onOk: () => handleDelete(record.id),
                  });
                  break;
              }
            }}
            items={[
              { key: 'edit', icon: <EditOutlined />, label: '编辑' },
              { key: 'violations', icon: <HistoryOutlined />, label: '违规记录' },
              { key: 'refresh', icon: <ReloadOutlined />, label: '刷新违规状态' },
              { type: 'divider' as const },
              { key: 'clear', icon: <StopOutlined />, label: '重置违规记录', danger: true },
              { key: 'delete', icon: <DeleteOutlined />, label: '删除员工', danger: true },
            ]}
          />
        </div>
      )}

      {/* 添加/编辑模态框 */}
      <Modal
        title={editingRecord ? '编辑员工' : '添加员工'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          <Form.Item
            name="employee_name"
            label="员工姓名"
            rules={[{ required: true, message: '请输入员工姓名' }]}
          >
            <Input placeholder="请输入员工姓名" />
          </Form.Item>
          
          <Form.Item
            name="employee_uid"
            label="员工UID"
            rules={[
              { required: true, message: '请输入员工UID' },
              { pattern: /^[A-Za-z0-9_-]+$/, message: 'UID只能包含字母、数字、下划线和连字符' }
            ]}
          >
            <Input placeholder="请输入员工UID" />
          </Form.Item>
          
          <Form.Item
            name="status"
            label="员工状态"
          >
            <Input placeholder="请输入员工状态（如：正常、黄牌、红牌等）" />
          </Form.Item>
          
          <Form.Item
            name="activation_time"
            label="开通时间"
          >
            <DatePicker 
              format="YYYY-MM-DD"
              placeholder="请选择开通时间"
              style={{ width: '100%' }}
            />
          </Form.Item>
          

          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingRecord ? '更新' : '创建'}
              </Button>
              <Button onClick={() => {
                setModalVisible(false);
                form.resetFields();
              }}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>



      {/* 批量上传模态框 */}
      <Modal
        title="批量上传员工数据"
        open={uploadModalVisible}
        onCancel={() => {
          setUploadModalVisible(false);
          resetUploadState();
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setUploadModalVisible(false);
            resetUploadState();
          }}>
            取消
          </Button>,
          <Button 
            key="upload" 
            type="primary" 
            loading={uploadLoading}
            disabled={!batchParsedData.length}
            onClick={handleBatchUpload}
          >
            开始上传
          </Button>
        ]}
        width={800}
      >
        <div style={{ marginBottom: 16 }}>
          <Alert
            message="上传说明"
            description={
              <div>
                <p>• 支持Excel文件格式（.xlsx, .xls）</p>
                <p>• 必需字段：员工姓名、员工UID</p>
                <p>• 可选字段：状态、开通时间</p>
                <p>• 系统会自动识别现有记录并更新，新记录将被创建</p>
                <p>• 建议先下载现有数据作为模板</p>
              </div>
            }
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <Upload
            accept=".xlsx,.xls"
            beforeUpload={(file) => {
              handleFileUpload(file);
              return false; // 阻止自动上传
            }}
            showUploadList={false}
          >
            <Button icon={<UploadOutlined />} loading={uploadLoading}>
              选择Excel文件
            </Button>
          </Upload>
          {batchUploadFile && (
            <div style={{ marginTop: 8 }}>
              <Tag color="blue">已选择: {batchUploadFile.name}</Tag>
            </div>
          )}
        </div>

        {uploadProgress > 0 && uploadProgress < 100 && (
          <div style={{ marginBottom: 16 }}>
            <Progress percent={uploadProgress} status="active" />
          </div>
        )}

        {validationResult && (
          <div style={{ marginBottom: 16 }}>
            <Card size="small" title="数据验证结果">
              <div style={{ marginBottom: 8 }}>
                <Tag color="blue">总记录数: {validationResult.totalRecords}</Tag>
                <Tag color="green">有效记录: {validationResult.validRecords}</Tag>
                <Tag color="orange">新增记录: {validationResult.newRecords}</Tag>
                <Tag color="purple">更新记录: {validationResult.updateRecords}</Tag>
                {validationResult.invalidRecords > 0 && (
                  <Tag color="red">无效记录: {validationResult.invalidRecords}</Tag>
                )}
              </div>
              
              {validationResult.warnings.length > 0 && (
                <Alert
                  message="警告信息"
                  description={
                    <ul style={{ margin: 0, paddingLeft: 16 }}>
                      {validationResult.warnings.map((warning: string, index: number) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  }
                  type="warning"
                  showIcon
                  style={{ marginBottom: 8 }}
                />
              )}
              
              {validationResult.errors.length > 0 && (
                <Alert
                  message="错误信息"
                  description={
                    <ul style={{ margin: 0, paddingLeft: 16 }}>
                      {validationResult.errors.map((error: string, index: number) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  }
                  type="error"
                  showIcon
                />
              )}
            </Card>
          </div>
        )}

        {uploadResult && (
          <div style={{ marginBottom: 16 }}>
            <Card size="small" title="上传结果">
              <div style={{ marginBottom: 8 }}>
                <Tag color="green">成功创建: {uploadResult.created.length}</Tag>
                <Tag color="blue">成功更新: {uploadResult.updated.length}</Tag>
                {uploadResult.errors.length > 0 && (
                  <Tag color="red">错误数量: {uploadResult.errors.length}</Tag>
                )}
              </div>
              
              {uploadResult.errors.length > 0 && (
                <Alert
                  message="上传错误"
                  description={
                    <ul style={{ margin: 0, paddingLeft: 16 }}>
                      {uploadResult.errors.map((error: string, index: number) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  }
                  type="error"
                  showIcon
                />
              )}
            </Card>
          </div>
        )}

        {batchParsedData.length > 0 && (
          <div>
            <Card size="small" title="预览数据">
              <Table
                dataSource={batchParsedData.slice(0, 5)}
                columns={[
                  { title: '员工姓名', dataIndex: 'employee_name', key: 'employee_name', width: 150 },
                  { title: '员工UID', dataIndex: 'employee_uid', key: 'employee_uid', width: 150 },
                  { 
                    title: '状态', 
                    dataIndex: 'status', 
                    key: 'status',
                    width: 100,
                    render: (status: string) => {
                      if (!status) {
                        return <Tag color="default">未设置</Tag>;
                      }
                      
                      // 根据状态文本设置颜色
                      let color = 'default';
                      if (status.includes('正常') || status.includes('绿')) {
                        color = 'green';
                      } else if (status.includes('黄牌') || status.includes('警告')) {
                        color = 'orange';
                      } else if (status.includes('红牌') || status.includes('严重')) {
                        color = 'red';
                      }
                      
                      return <Tag color={color}>{status}</Tag>;
                    }
                  },
                  { 
                    title: '开通时间', 
                    dataIndex: 'activation_time', 
                    key: 'activation_time',
                    width: 120,
                    render: (value: string) => {
                      if (!value) {
                        return <span style={{ color: '#999' }}>未设置</span>;
                      }
                      return dayjs(value).format('YYYY-MM-DD');
                    }
                  },
                  {
                    title: '持有周期',
                    dataIndex: 'activation_time',
                    key: 'holding_period',
                    width: 120,
                    render: (activationTime: string) => {
                      const details = getHoldingPeriodDetails(activationTime);
                      return <Tag color={details.color}>{details.text}</Tag>;
                    }
                  }
                ]}
                pagination={false}
                size="small"
                scroll={{ x: 700 }}
              />
              {batchParsedData.length > 5 && (
                <div style={{ marginTop: 8, textAlign: 'center', color: '#666' }}>
                  显示前5条记录，共 {batchParsedData.length} 条
                </div>
              )}
            </Card>
          </div>
        )}
      </Modal>

      {/* 违规记录弹窗 */}
      <Modal
        title={`${currentEmployeeForViolation?.employee_name || '员工'} - 违规记录`}
        open={violationModalVisible}
        onCancel={() => {
          setViolationModalVisible(false);
          setViolationData([]);
          setCurrentEmployeeForViolation(null);
        }}
        footer={null}
        width={800}
      >
        <div style={{ maxHeight: '500px', overflow: 'auto', paddingTop: '16px' }}>
          {violationLoading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Spin size="large" />
            </div>
          ) : violationData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
              暂无违规记录
            </div>
          ) : (
            <Table
              dataSource={violationData}
              columns={[
                {
                  title: '违规类型',
                  dataIndex: 'type',
                  key: 'type',
                  width: 120,
                  render: (type: string) => {
                    if (!type) return '-';
                    const colorMap: Record<string, string> = {
                      '回复率': 'orange',
                      '发布量': 'red',
                      '其他': 'blue'
                    };
                    return <Tag color={colorMap[type] || 'default'}>{type}</Tag>;
                  }
                },
                {
                  title: '违规原因',
                  dataIndex: 'reason',
                  key: 'reason',
                  width: 300,
                  render: (reason: string) => (
                    <div style={{ 
                      maxWidth: '280px', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap',
                      cursor: 'pointer'
                    }} title={reason}>
                      {reason}
                    </div>
                  )
                },
                {
                  title: '违规时间',
                  dataIndex: 'created_at',
                  key: 'created_at',
                  width: 180,
                  render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss')
                }
              ]}
              pagination={false}
              size="small"
              scroll={{ x: 600 }}
              rowKey="id"
            />
          )}
        </div>
      </Modal>

      {/* 违规状态详情弹窗 */}
      <Modal
        title={`${currentEmployeeForStatus?.employee_name || '员工'} - 违规状态详情`}
        open={violationStatusModalVisible}
        onCancel={() => {
          setViolationStatusModalVisible(false);
          setViolationStatusData(null);
          setCurrentEmployeeForStatus(null);
        }}
        footer={null}
        width={800}
      >
        <div style={{ maxHeight: '500px', overflow: 'auto', paddingTop: '16px' }}>
          {violationStatusLoading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Spin size="large" />
            </div>
          ) : !violationStatusData ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
              暂无违规状态信息
            </div>
          ) : (
            <div>
              {/* 当前状态概览 */}
              <Card size="small" title="当前状态" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div>
                    <Tag color={getStatusColor(violationStatusData)} style={{ fontSize: '14px', padding: '4px 8px' }}>
                      {getStatusDisplayText(violationStatusData)}
                    </Tag>
                  </div>
                  <div>
                    <div>黄牌: {violationStatusData.currentYellowCards}张</div>
                    <div>红牌: {violationStatusData.currentRedCards}张</div>
                    {violationStatusData.status === 'yellow' && (
                      <div style={{ color: '#faad14', fontSize: '12px' }}>
                        还需{getYellowCardsToRedCard(violationStatusData.currentYellowCards)}张黄牌升级为红牌
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ marginTop: 8, padding: 8, backgroundColor: '#f6f6f6', borderRadius: 4 }}>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {getStatusDescription(violationStatusData)}
                  </div>
                </div>
              </Card>

              {/* 状态说明 */}
              <Card size="small" title="状态说明">
                <div style={{ padding: '16px', color: '#666' }}>
                  <p><strong>黄牌规则：</strong>每次违规获得1张黄牌，每周无违规可恢复1张黄牌</p>
                  <p><strong>红牌规则：</strong>2张黄牌升级为1张红牌，红牌不会自动恢复</p>
                  <p><strong>状态优先级：</strong>红牌 {'>'} 黄牌 {'>'} 正常</p>
                  <p><strong>注意：</strong>违规状态由数据库自动计算，添加违规记录时会自动更新</p>
                </div>
              </Card>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
} 