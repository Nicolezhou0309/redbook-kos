import { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Tag, Space, Button, Input, Modal, Form, App, Upload, DatePicker, Dropdown } from 'antd';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import * as XLSX from 'xlsx';

// 设置 dayjs 中文环境
dayjs.locale('zh-cn');
import { 
  PlusOutlined, 
  UserOutlined,
  ClockCircleOutlined,
  StarOutlined,
  UploadOutlined,
  DownloadOutlined,
  SearchOutlined,
  DeleteOutlined
} from '@ant-design/icons';

import { employeeApi } from '../lib/employeeApi';


// 定义类型
interface EmployeeResponseData {
  id: string;
  employee_name: string;
  employee_uid: string;
  score_15s_response: number;
  score_30s_response: number;
  score_1min_response: number;
  score_1hour_timeout: number;
  score_avg_response_time: number;
  rate_15s_response: string;
  rate_30s_response: string;
  rate_1min_response: string;
  rate_1hour_timeout: string;
  avg_response_time: number;
  user_rating_score: number;
  time_range: {
    start_date: string;
    end_date: string;
    remark: string;
  };
  created_at: string;
  updated_at: string;
}

interface EmployeeResponseDataForm {
  employee_name: string;
  employee_uid: string;
  score_15s_response: number;
  score_30s_response: number;
  score_1min_response: number;
  score_1hour_timeout: number;
  score_avg_response_time: number;
  rate_15s_response: string;
  rate_30s_response: string;
  rate_1min_response: string;
  rate_1hour_timeout: string;
  avg_response_time: number;
  user_rating_score: number;
  time_range: {
    start_date: string;
    end_date: string;
    remark: string;
  };
}

interface ImportData {
  employee_name: string;
  employee_uid: string;
  score_15s_response: number;
  score_30s_response: number;
  score_1min_response: number;
  score_1hour_timeout: number;
  score_avg_response_time: number;
  rate_15s_response: string;
  rate_30s_response: string;
  rate_1min_response: string;
  rate_1hour_timeout: string;
  avg_response_time: number;
  user_rating_score: number;
}


export default function EmployeeData() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<EmployeeResponseData[]>([]);
  const [searchText, setSearchText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<EmployeeResponseData | null>(null);
  const [form] = Form.useForm();
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState<[string, string] | null>(null);
  const [selectedRemark, setSelectedRemark] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<EmployeeResponseDataForm[]>([]);
  const [duplicates, setDuplicates] = useState<string[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);


  // 加载数据
  const loadData = async () => {
    try {
      setLoading(true);
      const employeeData = await employeeApi.getAllEmployeeData();
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
    item.employee_uid.toLowerCase().includes(searchText.toLowerCase())
  );

  // 处理添加/编辑
  const handleAddEdit = (record?: EmployeeResponseData) => {
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

      const formData: EmployeeResponseDataForm = {
        ...values,
        time_range: timeRangeValue
      };

      if (editingRecord) {
        await employeeApi.updateEmployeeData(editingRecord.id, formData);
        message.success('更新成功');
      } else {
        await employeeApi.createEmployeeData(formData);
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
      await employeeApi.deleteEmployeeData(id);
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
      await employeeApi.batchDeleteEmployeeData(selectedRowKeys);
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



  // 处理文件上传
  const handleFileUpload = async (file: File) => {
    try {
      setImportLoading(true);
      
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
        return;
      }

      if (dataArray.length < 2) {
        message.error('文件内容为空或格式不正确');
        return;
      }

      const headers = dataArray[0];
      const duplicatesList: string[] = [];
      const newData: EmployeeResponseDataForm[] = [];

      // 解析数据
      for (let i = 1; i < dataArray.length; i++) {
        const row = dataArray[i];
        if (!row || row.length < headers.length) continue;

        const data: ImportData = {
          employee_name: String(row[0] || ''),
          employee_uid: String(row[1] || ''),
          score_15s_response: parseFloat(String(row[2])) || 0,
          score_30s_response: parseFloat(String(row[3])) || 0,
          score_1min_response: parseFloat(String(row[4])) || 0,
          score_1hour_timeout: parseFloat(String(row[5])) || 0,
          score_avg_response_time: parseFloat(String(row[6])) || 0,
          rate_15s_response: String(row[7] || '0%'),
          rate_30s_response: String(row[8] || '0%'),
          rate_1min_response: String(row[9] || '0%'),
          rate_1hour_timeout: String(row[10] || '0%'),
          avg_response_time: parseFloat(String(row[11])) || 0,
          user_rating_score: parseFloat(String(row[12])) || 0,
        };

        // 检查数据是否重复（备注为空时不进行查重）
        const remark = selectedRemark || '';
        const exists = remark ? await employeeApi.checkEmployeeDataExists(data.employee_uid, remark) : false;
        if (exists) {
          duplicatesList.push(data.employee_name);
        } else {
          newData.push({
            ...data,
            time_range: {
              start_date: selectedDateRange?.[0] || '',
              end_date: selectedDateRange?.[1] || '',
              remark: selectedRemark || ''
            }
          });
        }
      }

      if (newData.length === 0) {
        message.warning('没有新的数据需要导入');
        return;
      }

      // 保存解析的数据和重复数据
      setParsedData(newData);
      setDuplicates(duplicatesList);
      setUploadedFile(file);
      
      message.success(`文件解析完成，共 ${newData.length} 条新数据，${duplicatesList.length} 条重复数据`);
      
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
      await employeeApi.batchCreateEmployeeData(parsedData);
      
      message.success(`成功导入 ${parsedData.length} 条数据`);
      if (duplicates.length > 0) {
        message.warning(`跳过 ${duplicates.length} 条重复数据: ${duplicates.join(', ')}`);
      }
      
      setImportModalVisible(false);
      setParsedData([]);
      setDuplicates([]);
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
    link.href = '/员工号分析20250805.csv';
    link.download = '员工数据导入模板.csv';
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
      ['员工号名称', '员工号UID', '15秒首响率得分', '30秒回复率得分', '1分钟回复率得分', '1小时超时回复率得分', '平均回复时长得分', '15秒首响率', '30秒回复率', '1分钟回复率', '1小时超时回复率', '平均回复时长', '用户评价得分'],
      ['一只可爱猪', '5645f9e3a40e183ce5605896', 3.9, 0.8, 0.9, 2.5, 0.0, '33.33%', '7.81%', '7.81%', '68.75%', 175.16, 0.0],
      ['小熊宝饼干', '5c47d06a0000000011022bf6', 0.0, 0.0, 0.0, 0.0, 0.0, '0.0%', '0.0%', '0.0%', '0.0%', 0.0, 0.0],
      ['微领地青年社区', '60692d700000000001009221', 4.7, 4.6, 4.8, 5.0, 4.6, '94.36%', '94.5%', '97.18%', '0.84%', 0.55, 4.0],
    ];
    
    // 创建工作表
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    
    // 设置列宽
    const colWidths = [
      { wch: 15 }, // 员工号名称
      { wch: 25 }, // 员工号UID
      { wch: 12 }, // 15秒首响率得分
      { wch: 12 }, // 30秒回复率得分
      { wch: 12 }, // 1分钟回复率得分
      { wch: 15 }, // 1小时超时回复率得分
      { wch: 12 }, // 平均回复时长得分
      { wch: 12 }, // 15秒首响率
      { wch: 12 }, // 30秒回复率
      { wch: 12 }, // 1分钟回复率
      { wch: 12 }, // 1小时超时回复率
      { wch: 12 }, // 平均回复时长
      { wch: 12 }, // 用户评价得分
    ];
    worksheet['!cols'] = colWidths;
    
    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(workbook, worksheet, '员工数据');
    
    // 生成Excel文件并下载
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = '员工数据导入模板.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const columns = [
    {
      title: '员工姓名',
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
      title: '15秒响应率',
      dataIndex: 'rate_15s_response',
      key: 'rate_15s_response',
      width: 100,
      render: (text: string) => (
        <Tag color={parseFloat(text) >= 80 ? 'green' : parseFloat(text) >= 60 ? 'orange' : 'red'}>
          {text}
        </Tag>
      ),
    },
    {
      title: '30秒响应率',
      dataIndex: 'rate_30s_response',
      key: 'rate_30s_response',
      width: 100,
      render: (text: string) => (
        <Tag color={parseFloat(text) >= 80 ? 'green' : parseFloat(text) >= 60 ? 'orange' : 'red'}>
          {text}
        </Tag>
      ),
    },
    {
      title: '1分钟响应率',
      dataIndex: 'rate_1min_response',
      key: 'rate_1min_response',
      width: 100,
      render: (text: string) => (
        <Tag color={parseFloat(text) >= 80 ? 'green' : parseFloat(text) >= 60 ? 'orange' : 'red'}>
          {text}
        </Tag>
      ),
    },
    {
      title: '1小时超时率',
      dataIndex: 'rate_1hour_timeout',
      key: 'rate_1hour_timeout',
      width: 100,
      render: (text: string) => (
        <Tag color={parseFloat(text) <= 5 ? 'green' : parseFloat(text) <= 10 ? 'orange' : 'red'}>
          {text}
        </Tag>
      ),
    },
    {
      title: '平均响应时间',
      dataIndex: 'avg_response_time',
      key: 'avg_response_time',
      width: 120,
      render: (value: number) => (
        <Space>
          <ClockCircleOutlined />
          {value.toFixed(2)}s
        </Space>
      ),
    },
    {
      title: '用户评分',
      dataIndex: 'user_rating_score',
      key: 'user_rating_score',
      width: 80,
      render: (value: number) => (
        <Space>
          <StarOutlined />
          {value.toFixed(1)}
        </Space>
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
      fixed: 'right' as const,
      render: (_: any, record: EmployeeResponseData) => (
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
                content: `确定要删除员工 "${record.employee_name}" 的数据吗？`,
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
                  placeholder="搜索员工姓名或UID..."
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
              title={editingRecord ? '编辑员工数据' : '添加员工数据'}
              open={modalVisible}
              onCancel={() => {
                setModalVisible(false);
                form.resetFields();
              }}
              footer={null}
              width={800}
            >
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSave}
                initialValues={{
                  rate_15s_response: '0%',
                  rate_30s_response: '0%',
                  rate_1min_response: '0%',
                  rate_1hour_timeout: '0%',
                  avg_response_time: 0,
                  user_rating_score: 0,
                  time_range: {
                    start_date: '',
                    end_date: '',
                    remark: ''
                  }
                }}
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="employee_name"
                      label="员工姓名"
                      rules={[{ required: true, message: '请输入员工姓名' }]}
                    >
                      <Input placeholder="请输入员工姓名" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="employee_uid"
                      label="员工UID"
                      rules={[{ required: true, message: '请输入员工UID' }]}
                    >
                      <Input placeholder="请输入员工UID" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={6}>
                    <Form.Item
                      name="rate_15s_response"
                      label="15秒响应率"
                    >
                      <Input placeholder="0%" />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item
                      name="rate_30s_response"
                      label="30秒响应率"
                    >
                      <Input placeholder="0%" />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item
                      name="rate_1min_response"
                      label="1分钟响应率"
                    >
                      <Input placeholder="0%" />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item
                      name="rate_1hour_timeout"
                      label="1小时超时率"
                    >
                      <Input placeholder="0%" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item
                      name="avg_response_time"
                      label="平均响应时间(秒)"
                    >
                      <Input type="number" placeholder="0" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="user_rating_score"
                      label="用户评分"
                    >
                      <Input type="number" placeholder="0-5" />
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
              <p>确定要删除选中的 <strong>{selectedRowKeys.length}</strong> 条数据吗？</p>
              <p style={{ color: '#ff4d4f', fontSize: '14px' }}>
                此操作不可恢复，请谨慎操作！
              </p>
            </Modal>

            {/* 批量导入模态框 */}
            <Modal
              title="批量导入员工数据"
              open={importModalVisible}
              onCancel={() => {
                setImportModalVisible(false);
                setSelectedDateRange(null);
                setSelectedRemark('');
                setParsedData([]);
                setDuplicates([]);
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
                    setDuplicates([]);
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
                      <div>✅ 新数据: {parsedData.length} 条</div>
                      {duplicates.length > 0 && (
                        <div style={{ color: '#faad14' }}>
                          ⚠️ 重复数据: {duplicates.length} 条 ({duplicates.join(', ')})
                        </div>
                      )}
                    </div>
                  </Form.Item>
                )}
              </Form>
            </Modal>
          </div>
    );
} 