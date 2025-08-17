import { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Tag, Space, Button, Input, Modal, Form, App, Upload, DatePicker, Dropdown } from 'antd';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import * as XLSX from 'xlsx';
import { 
  PlusOutlined, 
  SearchOutlined, 
  UserOutlined,
  UploadOutlined,
  DownloadOutlined,
  EyeOutlined,
  MessageOutlined,
  DollarOutlined,
  FireOutlined,
  DeleteOutlined
} from '@ant-design/icons';

import { employeeLeadsApi } from '../lib/employeeLeadsApi';

// 设置 dayjs 中文环境
dayjs.locale('zh-cn');

// 定义类型
interface EmployeeLeadsData {
  id: string;
  employee_name: string;
  xiaohongshu_account_id: string;
  xiaohongshu_nickname: string;
  account_id: string;
  region: string;
  tags: string;
  activation_time: string | null;
  published_notes_count: number;
  promoted_notes_count: number;
  notes_promotion_cost: number;
  total_interactions: number;
  total_form_leads: number;
  total_private_message_leads: number;
  total_private_message_openings: number;
  total_private_message_leads_kept: number;
  notes_exposure_count: number;
  notes_click_count: number;
  time_range: {
    start_date: string;
    end_date: string;
    remark: string;
  };
  created_at: string;
  updated_at: string;
}

interface EmployeeLeadsDataForm {
  employee_name: string;
  xiaohongshu_account_id: string;
  xiaohongshu_nickname: string;
  account_id: string;
  region: string;
  tags: string;
  activation_time: string | null;
  published_notes_count: number;
  promoted_notes_count: number;
  notes_promotion_cost: number;
  total_interactions: number;
  total_form_leads: number;
  total_private_message_leads: number;
  total_private_message_openings: number;
  total_private_message_leads_kept: number;
  notes_exposure_count: number;
  notes_click_count: number;
  time_range: {
    start_date: string;
    end_date: string;
    remark: string;
  };
}




export default function EmployeeLeads() {
  const { message } = App.useApp();

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<EmployeeLeadsData[]>([]);
  const [searchText, setSearchText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<EmployeeLeadsData | null>(null);
  const [form] = Form.useForm();
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState<[string, string] | null>(null);
  const [selectedRemark, setSelectedRemark] = useState<string>('');
  const [parsedData, setParsedData] = useState<EmployeeLeadsDataForm[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // 加载数据
  const loadData = async () => {
    try {
      setLoading(true);
      const employeeData = await employeeLeadsApi.getAllEmployeeLeadsData();
      setData(employeeData);
    } catch (error) {
      message.error(`加载数据失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  // 过滤数据
  const filteredData = data.filter(item =>
    item.employee_name.toLowerCase().includes(searchText.toLowerCase()) ||
    item.xiaohongshu_nickname.toLowerCase().includes(searchText.toLowerCase()) ||
    item.account_id.toLowerCase().includes(searchText.toLowerCase())
  );

  // 处理添加/编辑
  const handleAddEdit = (record?: EmployeeLeadsData) => {
    setEditingRecord(record || null);
    if (record) {
      // 转换时间范围格式用于表单显示
      const formData = {
        ...record,
        time_range: record.time_range.remark
      };
      form.setFieldsValue(formData);
    } else {
      form.resetFields();
    }
    setModalVisible(true);
  };

  // 处理保存
  const handleSave = async (values: any) => {
    try {
      // 转换时间范围格式
      const timeRangeValue = typeof values.time_range === 'string' 
        ? { start_date: '', end_date: '', remark: values.time_range }
        : values.time_range;

      const formData: EmployeeLeadsDataForm = {
        ...values,
        time_range: timeRangeValue
      };

      if (editingRecord) {
        await employeeLeadsApi.updateEmployeeLeadsData(editingRecord.id, formData);
        message.success('更新成功');
      } else {
        await employeeLeadsApi.createEmployeeLeadsData(formData);
        message.success('创建成功');
      }
      setModalVisible(false);
      form.resetFields();
      loadData();
    } catch (error) {
      message.error(`保存失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // 处理删除
  const handleDelete = async (id: string) => {
    try {
      await employeeLeadsApi.deleteEmployeeLeadsData(id);
      message.success('删除成功');
      loadData();
    } catch (error) {
      message.error(`删除失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // 处理批量删除
  const handleBatchDelete = async () => {
    try {
      setDeleteLoading(true);
      await employeeLeadsApi.batchDeleteEmployeeLeadsData(selectedRowKeys);
      message.success(`成功删除 ${selectedRowKeys.length} 条数据`);
      setSelectedRowKeys([]);
      setDeleteModalVisible(false);
      loadData();
    } catch (error) {
      message.error(`批量删除失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  // 处理行选择变化
  const handleRowSelectionChange = (selectedKeys: React.Key[]) => {
    setSelectedRowKeys(selectedKeys as string[]);
  };

  // 解析文件数据
  const parseFileData = async (file: File) => {
    let dataArray: any[][] = [];
    
    // 根据文件类型处理
    if (file.name.toLowerCase().endsWith('.csv')) {
      // 处理CSV文件
      const text = await file.text();
      const lines = text.split('\n');
      dataArray = lines.map(line => line.split(',').map(cell => cell.trim()));
    } else if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
      // 处理Excel文件
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      dataArray = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    } else {
      message.error('不支持的文件格式，请上传CSV或Excel文件');
      return null;
    }

    if (dataArray.length < 2) {
      message.error('文件内容为空或格式不正确');
      return null;
    }

    const headers = dataArray[0];
    const parsedData: EmployeeLeadsDataForm[] = [];

    // 解析数据
    for (let i = 1; i < dataArray.length; i++) {
      const row = dataArray[i];
      if (!row || row.length < headers.length) continue;

      // 处理开通时间，如果是 "-" 或无效日期则设为 null
      const activationTimeStr = String(row[6] || '');
      const activationTime = activationTimeStr && activationTimeStr !== '-' && activationTimeStr !== 'null' 
        ? activationTimeStr 
        : null;

      const data: EmployeeLeadsDataForm = {
        employee_name: String(row[0] || ''),
        xiaohongshu_account_id: String(row[1] || ''),
        xiaohongshu_nickname: String(row[2] || ''),
        account_id: String(row[3] || ''),
        region: String(row[4] || ''),
        tags: String(row[5] || ''),
        activation_time: activationTime,
        published_notes_count: parseInt(String(row[7])) || 0,
        promoted_notes_count: parseInt(String(row[8])) || 0,
        notes_promotion_cost: parseFloat(String(row[9])) || 0,
        total_interactions: parseInt(String(row[10])) || 0,
        total_form_leads: parseInt(String(row[11])) || 0,
        total_private_message_leads: parseInt(String(row[12])) || 0,
        total_private_message_openings: parseInt(String(row[13])) || 0,
        total_private_message_leads_kept: parseInt(String(row[14])) || 0,
        notes_exposure_count: parseInt(String(row[15])) || 0,
        notes_click_count: parseInt(String(row[16])) || 0,
        time_range: {
          start_date: selectedDateRange?.[0] || '',
          end_date: selectedDateRange?.[1] || '',
          remark: selectedRemark || ''
        }
      };

      parsedData.push(data);
    }

    return parsedData;
  };

  // 处理文件上传
  const handleFileUpload = async (file: File) => {
    try {
      setImportLoading(true);
      
      const data = await parseFileData(file);
      if (!data) return;

      // 直接使用所有解析的数据，不进行查重
      setParsedData(data);

      setUploadedFile(file);
      
      message.success(`文件解析完成，共 ${data.length} 条数据`);
      
    } catch (error) {
      message.error(`文件解析失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setImportLoading(false);
    }
  };

  // 确认导入数据
  const handleConfirmImport = async () => {
    try {
      setImportLoading(true);
      
      // 批量创建数据
      await employeeLeadsApi.batchCreateEmployeeLeadsData(parsedData);
      
      message.success(`成功导入 ${parsedData.length} 条数据`);
      
      setImportModalVisible(false);
      setParsedData([]);
      setUploadedFile(null);
      setSelectedDateRange(null);
      setSelectedRemark('');
      loadData();
    } catch (error) {
      message.error(`导入失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setImportLoading(false);
    }
  };

  // 下载模板
  const handleDownloadTemplate = () => {
    const link = document.createElement('a');
    link.href = '/专业号-线索明细-20250805.csv';
    link.download = '员工线索明细导入模板.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 下载Excel模板
  const handleDownloadExcelTemplate = () => {
    // 创建工作簿
    const workbook = XLSX.utils.book_new();
    
    // 准备数据
    const data = [
      ['员工名称', '小红书账号id', '小红书昵称', '账号ID', '所属地区', '标签', '开通时间', '发布笔记数', '投流笔记数', '笔记投流消耗', '总互动数', '总表单客资数', '总私信进线数', '总私信开口数', '总私信留资数', '笔记曝光量', '笔记点击量'],
      ['青芒果果', '95303223344', '青芒果果', '67a0784d000000000e01df5b', '中国大陆-上海-上海市', '-', '2024-12-18', 2, 83, 220.77, 423, 0, 8, 6, 2, 31694, 5809],
      ['开心1点啦', '9849868812', '开心1点啦', '653c9c7c000000000d00799d', '中国大陆-上海-上海市', '杨晓鹏/00799d', '2025-07-04', 3, 45, 270.37, 32, 0, 18, 16, 9, 7928, 1040],
    ];
    
    // 创建工作表
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    
    // 设置列宽
    const colWidths = [
      { wch: 12 }, // 员工名称
      { wch: 15 }, // 小红书账号id
      { wch: 15 }, // 小红书昵称
      { wch: 25 }, // 账号ID
      { wch: 20 }, // 所属地区
      { wch: 15 }, // 标签
      { wch: 12 }, // 开通时间
      { wch: 12 }, // 发布笔记数
      { wch: 12 }, // 投流笔记数
      { wch: 15 }, // 笔记投流消耗
      { wch: 12 }, // 总互动数
      { wch: 15 }, // 总表单客资数
      { wch: 15 }, // 总私信进线数
      { wch: 15 }, // 总私信开口数
      { wch: 15 }, // 总私信留资数
      { wch: 12 }, // 笔记曝光量
      { wch: 12 }, // 笔记点击量
    ];
    worksheet['!cols'] = colWidths;
    
    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(workbook, worksheet, '员工线索明细');
    
    // 生成Excel文件并下载
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = '员工线索明细导入模板.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const columns = [
    {
      title: '员工名称',
      dataIndex: 'employee_name',
      key: 'employee_name',
      width: 120,
      render: (text: string) => (
        <Space>
          <UserOutlined />
          {text}
        </Space>
      ),
    },
    {
      title: '小红书昵称',
      dataIndex: 'xiaohongshu_nickname',
      key: 'xiaohongshu_nickname',
      width: 120,
      render: (text: string) => (
        <Tag color="red">{text}</Tag>
      ),
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      render: (text: string) => (
        <Tag color="purple">{text || '-'}</Tag>
      ),
    },
    {
      title: '开通时间',
      dataIndex: 'activation_time',
      key: 'activation_time',
      render: (text: string) => (
        <span>{text || '-'}</span>
      ),
    },
    {
      title: '发布笔记数',
      dataIndex: 'published_notes_count',
      key: 'published_notes_count',
      render: (value: number) => (
        <Space>
          <EyeOutlined />
          {value}
        </Space>
      ),
    },
    {
      title: '投流笔记数',
      dataIndex: 'promoted_notes_count',
      key: 'promoted_notes_count',
      render: (value: number) => (
        <Space>
          <FireOutlined />
          {value}
        </Space>
      ),
    },
    {
      title: '投流消耗',
      dataIndex: 'notes_promotion_cost',
      key: 'notes_promotion_cost',
      render: (value: number) => (
        <Space>
          <DollarOutlined />
          ¥{value.toFixed(2)}
        </Space>
      ),
    },
    {
      title: '总互动数',
      dataIndex: 'total_interactions',
      key: 'total_interactions',
      render: (value: number) => (
        <Tag color="green">{value}</Tag>
      ),
    },
    {
      title: '私信进线数',
      dataIndex: 'total_private_message_leads',
      key: 'total_private_message_leads',
      render: (value: number) => (
        <Space>
          <MessageOutlined />
          {value}
        </Space>
      ),
    },
    {
      title: '私信开口数',
      dataIndex: 'total_private_message_openings',
      key: 'total_private_message_openings',
      render: (value: number) => (
        <Tag color="orange">{value}</Tag>
      ),
    },
    {
      title: '私信留资数',
      dataIndex: 'total_private_message_leads_kept',
      key: 'total_private_message_leads_kept',
      render: (value: number) => (
        <Tag color="cyan">{value}</Tag>
      ),
    },
    {
      title: '笔记曝光量',
      dataIndex: 'notes_exposure_count',
      key: 'notes_exposure_count',
      render: (value: number) => (
        <span>{value.toLocaleString()}</span>
      ),
    },
    {
      title: '笔记点击量',
      dataIndex: 'notes_click_count',
      key: 'notes_click_count',
      render: (value: number) => (
        <span>{value.toLocaleString()}</span>
      ),
    },
    {
      title: '时间范围',
      dataIndex: 'time_range',
      key: 'time_range',
      width: 200,
      render: (timeRange: { start_date: string; end_date: string; remark: string }) => (
        <Tag color="purple">
          {timeRange.remark}
          {timeRange.start_date && timeRange.end_date && (
            <span style={{ marginLeft: 4, fontSize: '12px', opacity: 0.7 }}>
              ({timeRange.start_date} ~ {timeRange.end_date})
            </span>
          )}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (text: string) => (
        <span>{new Date(text).toLocaleString('zh-CN')}</span>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 150,
      render: (text: string) => (
        <span>{new Date(text).toLocaleString('zh-CN')}</span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: EmployeeLeadsData) => (
        <Space>
          <Button 
            type="link" 
            size="small"
            onClick={() => handleAddEdit(record)}
          >
            编辑
          </Button>
          <Button 
            type="link" 
            size="small"
            danger
            onClick={() => {
              Modal.confirm({
                title: '确认删除',
                content: `确定要删除员工 "${record.employee_name}" 的线索数据吗？`,
                okText: '确认',
                cancelText: '取消',
                onOk: () => handleDelete(record.id),
              });
            }}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
          <Card>
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col flex="auto">
                <Input
                  placeholder="搜索员工名称、昵称或账号ID..."
                  prefix={<SearchOutlined />}
                  onChange={(e) => handleSearch(e.target.value)}
                  style={{ maxWidth: 300 }}
                />
              </Col>
              <Col>
                <Space>
                  <Button 
                    icon={<PlusOutlined />}
                    onClick={() => handleAddEdit()}
                    size="small"
                  >
                    添加数据
                  </Button>
                  <Button 
                    type="default" 
                    icon={<UploadOutlined />}
                    onClick={() => setImportModalVisible(true)}
                    size="small"
                  >
                    批量导入
                  </Button>
                  {selectedRowKeys.length > 0 && (
                    <Button 
                      type="primary" 
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => setDeleteModalVisible(true)}
                      size="small"
                    >
                      批量删除 ({selectedRowKeys.length})
                    </Button>
                  )}
                  <Dropdown
                    menu={{
                      items: [
                        {
                          key: 'csv',
                          icon: <DownloadOutlined />,
                          label: '下载CSV模板',
                          onClick: handleDownloadTemplate,
                        },
                        {
                          key: 'excel',
                          icon: <DownloadOutlined />,
                          label: '下载Excel模板',
                          onClick: handleDownloadExcelTemplate,
                        },
                      ],
                    }}
                    placement="bottomRight"
                  >
                    <Button 
                      type="link" 
                      icon={<DownloadOutlined />}
                      size="small"
                    >
                      下载模板
                    </Button>
                  </Dropdown>
                </Space>
              </Col>
            </Row>

            <Table
              columns={columns}
              dataSource={filteredData}
              loading={loading}
              rowKey="id"
              scroll={{ x: 'max-content' }}
              rowSelection={{
                selectedRowKeys,
                onChange: handleRowSelectionChange,
                preserveSelectedRowKeys: true,
              }}
              pagination={{
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
              }}
              size="small"
            />
            </Card>

            {/* 添加/编辑模态框 */}
            <Modal
              title={editingRecord ? '编辑员工线索数据' : '添加员工线索数据'}
              open={modalVisible}
              onCancel={() => {
                setModalVisible(false);
                form.resetFields();
              }}
              footer={null}
              width={1000}
            >
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSave}
                initialValues={{
                  published_notes_count: 0,
                  promoted_notes_count: 0,
                  notes_promotion_cost: 0,
                  total_interactions: 0,
                  total_form_leads: 0,
                  total_private_message_leads: 0,
                  total_private_message_openings: 0,
                  total_private_message_leads_kept: 0,
                  notes_exposure_count: 0,
                  notes_click_count: 0,
                  time_range: {
                    start_date: '',
                    end_date: '',
                    remark: ''
                  }
                }}
              >
                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item
                      name="employee_name"
                      label="员工名称"
                      rules={[{ required: true, message: '请输入员工名称' }]}
                    >
                      <Input placeholder="请输入员工名称" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="xiaohongshu_account_id"
                      label="小红书账号ID"
                      rules={[{ required: true, message: '请输入小红书账号ID' }]}
                    >
                      <Input placeholder="请输入小红书账号ID" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="xiaohongshu_nickname"
                      label="小红书昵称"
                      rules={[{ required: true, message: '请输入小红书昵称' }]}
                    >
                      <Input placeholder="请输入小红书昵称" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item
                      name="account_id"
                      label="账号ID"
                      rules={[{ required: true, message: '请输入账号ID' }]}
                    >
                      <Input placeholder="请输入账号ID" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="region"
                      label="所属地区"
                    >
                      <Input placeholder="请输入所属地区" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="tags"
                      label="标签"
                    >
                      <Input placeholder="请输入标签" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item
                      name="activation_time"
                      label="开通时间"
                    >
                      <DatePicker style={{ width: '100%' }} placeholder="选择开通时间" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="published_notes_count"
                      label="发布笔记数"
                    >
                      <Input type="number" placeholder="0" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="promoted_notes_count"
                      label="投流笔记数"
                    >
                      <Input type="number" placeholder="0" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item
                      name="notes_promotion_cost"
                      label="投流消耗"
                    >
                      <Input type="number" placeholder="0.00" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="total_interactions"
                      label="总互动数"
                    >
                      <Input type="number" placeholder="0" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="total_form_leads"
                      label="总表单客资数"
                    >
                      <Input type="number" placeholder="0" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item
                      name="total_private_message_leads"
                      label="总私信进线数"
                    >
                      <Input type="number" placeholder="0" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="total_private_message_openings"
                      label="总私信开口数"
                    >
                      <Input type="number" placeholder="0" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="total_private_message_leads_kept"
                      label="总私信留资数"
                    >
                      <Input type="number" placeholder="0" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item
                      name="notes_exposure_count"
                      label="笔记曝光量"
                    >
                      <Input type="number" placeholder="0" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="notes_click_count"
                      label="笔记点击量"
                    >
                      <Input type="number" placeholder="0" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="time_range"
                      label="备注"
                    >
                      <Input placeholder="请输入备注信息（可选）" />
                    </Form.Item>
                  </Col>
                </Row>

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

            {/* 批量删除确认模态框 */}
            <Modal
              title="确认批量删除"
              open={deleteModalVisible}
              onCancel={() => setDeleteModalVisible(false)}
              footer={[
                <Button 
                  key="cancel" 
                  onClick={() => setDeleteModalVisible(false)}
                >
                  取消
                </Button>,
                <Button 
                  key="confirm" 
                  type="primary" 
                  danger
                  loading={deleteLoading}
                  onClick={handleBatchDelete}
                >
                  确认删除
                </Button>
              ]}
            >
              <p>确定要删除选中的 <strong>{selectedRowKeys.length}</strong> 条线索数据吗？</p>
              <p style={{ color: '#ff4d4f', fontSize: '14px' }}>
                此操作不可恢复，请谨慎操作！
              </p>
            </Modal>

            {/* 批量导入模态框 */}
            <Modal
              title="批量导入员工线索数据"
              open={importModalVisible}
              onCancel={() => {
                setImportModalVisible(false);
                setSelectedDateRange(null);
                setSelectedRemark('');
                setParsedData([]);
                setUploadedFile(null);
              }}
              footer={[
                <Button 
                  key="cancel" 
                  onClick={() => {
                    setImportModalVisible(false);
                    setSelectedDateRange(null);
                    setSelectedRemark('');
                    setParsedData([]);
                    setUploadedFile(null);
                  }}
                >
                  取消
                </Button>,
                <Button 
                  key="confirm" 
                  type="primary" 
                  loading={importLoading}
                  disabled={parsedData.length === 0}
                  onClick={handleConfirmImport}
                >
                  确认导入
                </Button>
              ]}
              width={600}
            >
              <Form layout="vertical">
                <Form.Item
                  label="备注"
                >
                  <Input
                    value={selectedRemark}
                    onChange={(e) => setSelectedRemark(e.target.value)}
                    placeholder="请输入备注信息（可选）"
                    style={{ width: '100%' }}
                  />
                </Form.Item>

                <Form.Item
                  label="选择日期范围"
                  required
                >
                  <DatePicker.RangePicker
                    value={selectedDateRange ? [dayjs(selectedDateRange[0]), dayjs(selectedDateRange[1])] : null}
                    onChange={(dates) => {
                      if (dates) {
                        setSelectedDateRange([
                          dates[0]?.format('YYYY-MM-DD') || '',
                          dates[1]?.format('YYYY-MM-DD') || ''
                        ]);
                      } else {
                        setSelectedDateRange(null);
                      }
                    }}
                    style={{ width: '100%' }}
                  />
                </Form.Item>

                <Form.Item
                  label="上传文件"
                  required
                >
                  <Upload
                    accept=".csv,.xlsx,.xls"
                    beforeUpload={(file) => {
                      if (!selectedDateRange) {
                        message.error('请先选择日期范围');
                        return false;
                      }
                      handleFileUpload(file);
                      return false;
                    }}
                    showUploadList={false}
                  >
                    <Button icon={<UploadOutlined />} loading={importLoading}>
                      选择文件
                    </Button>
                  </Upload>
                  <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
                    支持CSV和Excel格式(.xlsx, .xls)，请确保文件格式与模板一致
                  </div>
                </Form.Item>

                {/* 显示解析结果 */}
                {uploadedFile && (
                  <Form.Item label="解析结果">
                    <div style={{ 
                      padding: 12, 
                      backgroundColor: '#f5f5f5', 
                      borderRadius: 6,
                      fontSize: '14px'
                    }}>
                      <div>📁 已上传文件: {uploadedFile.name}</div>
                      <div>✅ 数据: {parsedData.length} 条</div>
                    </div>
                  </Form.Item>
                )}
              </Form>
            </Modal>
          </div>
    );
} 