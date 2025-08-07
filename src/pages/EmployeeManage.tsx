import { useState, useEffect } from 'react';
import { 
  Layout, 
  Card, 
  Table, 
  Tag, 
  Space, 
  Button, 
  Input, 
  Modal, 
  Form, 
  App, 
  Select,
  Popconfirm,
  Tooltip,
  Spin,
  Timeline,
  DatePicker,
  Upload,
  Progress,
  Alert,
  Dropdown
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  HistoryOutlined,
  UploadOutlined,
  DownloadOutlined,
  DownOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

import { employeeManageApi } from '../lib/employeeManageApi';
import { employeeOperationLogApi } from '../lib/employeeOperationLogApi';
import type { EmployeeOperationLog } from '../lib/employeeOperationLogApi';
import { disciplinaryRecordApi } from '../lib/disciplinaryRecordApi';
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
  getYellowCardsToRedCard,
  type ViolationStatus 
} from '../utils/violationStatusUtils';

// 定义类型
interface EmployeeListData {
  id: string;
  employee_name: string;
  employee_uid: string;
  status: string | null;
  activation_time: string | null;
  created_at: string;
  violation_status?: ViolationStatus | null;
}

interface EmployeeListForm {
  employee_name: string;
  employee_uid: string;
  status?: string;
  activation_time?: string;
}




const { Content } = Layout;
const { Search } = Input;
const { Option } = Select;

export default function EmployeeManage() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<EmployeeListData[]>([]);
  const [searchText, setSearchText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<EmployeeListData | null>(null);
  const [form] = Form.useForm();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [historyData, setHistoryData] = useState<EmployeeOperationLog[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<EmployeeListData | null>(null);

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

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    try {
      let data: EmployeeListData[] = [];
      
      if (statusFilter === 'all') {
        data = await employeeManageApi.getEmployeeListWithViolations();
      } else {
        // 对于状态筛选，直接获取数据
        data = await employeeManageApi.getEmployeeByStatus(statusFilter);
      }
      
      // 获取违规状态
      if (data.length > 0) {
        const employeeIds = data.map(emp => emp.id);
        const violationStatuses = await disciplinaryRecordApi.getEmployeeViolationStatuses(employeeIds);
        
        data = data.map(emp => ({
          ...emp,
          violation_status: violationStatuses[emp.id] || null
        }));
      }
      
      setData(data);
      

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
      let searchResults: EmployeeListData[] = [];
      
      // 尝试按姓名搜索
      searchResults = await employeeManageApi.searchEmployeeByName(value);
      
      // 如果按姓名没找到，尝试按UID搜索
      if (searchResults.length === 0) {
        searchResults = await employeeManageApi.searchEmployeeByUid(value);
      }
      
      setData(searchResults);
    } catch (error) {
      message.error('搜索失败');
      console.error('搜索失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 状态筛选

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

  // 查看历史记录
  const handleViewHistory = async (record: EmployeeListData) => {
    setCurrentEmployee(record);
    setHistoryModalVisible(true);
    setHistoryLoading(true);
    
    try {
      const history = await employeeOperationLogApi.getEmployeeHistoryByView(record.id);
      setHistoryData(history);
    } catch (error) {
      message.error('加载历史记录失败');
      console.error('加载历史记录失败:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

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

  // 表格列定义
  const columns = [
    {
      title: '员工姓名',
      dataIndex: 'employee_name',
      key: 'employee_name',
      width: 150,
    },
    {
      title: '员工UID',
      dataIndex: 'employee_uid',
      key: 'employee_uid',
      width: 150,
    },
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
      },
    },
    {
      title: '开通时间',
      dataIndex: 'activation_time',
      key: 'activation_time',
      width: 120,
      render: (date: string | null) => {
        if (!date) {
          return <span style={{ color: '#999' }}>未设置</span>;
        }
        return dayjs(date).format('YYYY-MM-DD');
      },
    },
    {
      title: '持有周期',
      dataIndex: 'activation_time',
      key: 'holding_period',
      width: 120,
      render: (activationTime: string | null) => {
        const details = getHoldingPeriodDetails(activationTime);
        return <Tag color={details.color}>{details.text}</Tag>;
      },
    },

    {
      title: '违规状态',
      dataIndex: 'violation_status',
      key: 'violation_status',
      width: 120,
      render: (status: ViolationStatus | null, record: EmployeeListData) => {
        if (!status) {
          return <Tag color="green">正常</Tag>;
        }
        
        const displayText = getStatusDisplayText(status);
        const color = getStatusColor(status);
        
        return (
          <Tooltip title={`黄牌: ${status.currentYellowCards}张, 红牌: ${status.currentRedCards}张 (单击查看状态详情，双击查看违规记录)`}>
            <Tag 
              color={color} 
              style={{ cursor: 'pointer' }}
              onClick={() => handleViewViolationStatus(record)}
              onDoubleClick={() => handleViewViolations(record)}
            >
              {displayText}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: EmployeeListData) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleAddEdit(record)}
            />
          </Tooltip>
          <Tooltip title="历史记录">
            <Button
              type="text"
              icon={<HistoryOutlined />}
              onClick={() => handleViewHistory(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这个员工吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
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
            <Input
              placeholder="筛选状态"
              value={statusFilter === 'all' ? '' : statusFilter}
              onChange={(e) => {
                const value = e.target.value;
                setStatusFilter(value || 'all');
              }}
              style={{ width: 120 }}
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
                  }
                ]
              }}
              placement="bottomRight"
            >
              <Button>
                数据操作 <DownOutlined />
              </Button>
            </Dropdown>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          size="small"
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            pageSize: 10,
            showTotal: (total, range) => 
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          }}
          scroll={{ x: 1220 }}
        />
      </Card>

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

      {/* 历史记录模态框 */}
      <Modal
        title={`${currentEmployee?.employee_name || '员工'} - 操作历史`}
        open={historyModalVisible}
        onCancel={() => {
          setHistoryModalVisible(false);
          setHistoryData([]);
          setCurrentEmployee(null);
        }}
        footer={null}
        width={800}
      >
        <div style={{ maxHeight: '500px', overflow: 'auto', paddingTop: '16px' }}>
          {historyLoading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Spin size="large" />
            </div>
          ) : historyData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
              暂无操作历史
            </div>
          ) : (
            <Timeline>
              {historyData.map((log) => (
                <Timeline.Item
                  key={log.id}
                  color={
                    log.operation_type === 'create' ? 'green' :
                    log.operation_type === 'update' ? 'blue' :
                    log.operation_type === 'delete' ? 'red' : 'gray'
                  }
                >
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                      {log.operation_description}
                    </div>
                    <div style={{ color: '#666', fontSize: '12px', marginBottom: '8px' }}>
                      {dayjs(log.created_at).format('YYYY-MM-DD HH:mm:ss')}
                      {log.operator_name && ` · 操作人: ${log.operator_name}`}
                    </div>
                    {log.old_data && (
                      <div style={{ marginBottom: '8px' }}>
                        <div style={{ fontWeight: 'bold', color: '#d32f2f' }}>修改前:</div>
                        <pre style={{ 
                          background: '#f5f5f5', 
                          padding: '8px', 
                          borderRadius: '4px',
                          fontSize: '12px',
                          margin: '4px 0'
                        }}>
                          {JSON.stringify(log.old_data, null, 2)}
                        </pre>
                      </div>
                    )}
                    {log.new_data && (
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#2e7d32' }}>修改后:</div>
                        <pre style={{ 
                          background: '#f5f5f5', 
                          padding: '8px', 
                          borderRadius: '4px',
                          fontSize: '12px',
                          margin: '4px 0'
                        }}>
                          {JSON.stringify(log.new_data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          )}
        </div>
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
                    <div>总违规: {violationStatusData.totalViolations}次</div>
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

              {/* 状态历史 */}
              <Card size="small" title="状态变化历史">
                {violationStatusData.statusHistory.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                    暂无状态变化记录
                  </div>
                ) : (
                  <Timeline>
                    {violationStatusData.statusHistory.map((change, index) => (
                      <Timeline.Item
                        key={index}
                        color={
                          change.changeType === 'violation' ? 'orange' :
                          change.changeType === 'recovery' ? 'green' :
                          change.changeType === 'escalation' ? 'red' : 'gray'
                        }
                      >
                        <div>
                          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                            {change.reason}
                          </div>
                          <div style={{ color: '#666', fontSize: '12px' }}>
                            第{change.week}周 · {change.timestamp}
                          </div>
                        </div>
                      </Timeline.Item>
                    ))}
                  </Timeline>
                )}
              </Card>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
} 