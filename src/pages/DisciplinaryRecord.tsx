import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Space, 
  Popconfirm, 
  Card, 
  Row, 
  Col, 
  Statistic,
  DatePicker,
  Select,
  Tag,
  Tooltip,
  Typography,
  Divider,
  App
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  ReloadOutlined,
  SearchOutlined,
  InfoCircleOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import { disciplinaryRecordApi } from '../lib/disciplinaryRecordApi';
import { employeeListApi, type EmployeeList } from '../lib/employeeListApi';
import type { DisciplinaryRecord, DisciplinaryRecordForm } from '../types/employee';
import dayjs from 'dayjs';

const { Text } = Typography;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

interface Statistics {
  totalRecords: number;
  employeeCount: number;
  employeeStats: Record<string, number>;
  monthlyStats: Record<string, number>;
}

const DisciplinaryRecord: React.FC = () => {
  const { message } = App.useApp();
  const [records, setRecords] = useState<DisciplinaryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DisciplinaryRecord | null>(null);
  const [form] = Form.useForm();
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [employees, setEmployees] = useState<EmployeeList[]>([]);
  const [employeeLoading, setEmployeeLoading] = useState(false);

  // 获取数据
  const fetchRecords = async () => {
    setLoading(true);
    try {
      let data: DisciplinaryRecord[] = [];
      
      if (dateRange && dateRange[0] && dateRange[1]) {
        data = await disciplinaryRecordApi.getDisciplinaryRecordsByTimeRange(dateRange[0], dateRange[1]);
      } else if (searchText && searchText.trim()) {
        data = await disciplinaryRecordApi.getDisciplinaryRecordsByEmployeeName(searchText.trim());
      } else {
        data = await disciplinaryRecordApi.getAllDisciplinaryRecords();
      }
      
      setRecords(data);
    } catch (error) {
      message.error('获取红黄牌记录失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 获取统计信息
  const fetchStatistics = async () => {
    try {
      const stats = await disciplinaryRecordApi.getStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('获取统计信息失败:', error);
    }
  };

  // 获取员工列表
  const fetchEmployees = async () => {
    setEmployeeLoading(true);
    try {
      const data = await employeeListApi.getAllEmployees();
      setEmployees(data);
    } catch (error) {
      console.error('获取员工列表失败:', error);
      message.error('获取员工列表失败');
    } finally {
      setEmployeeLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
    fetchStatistics();
    fetchEmployees();
  }, []);

  // 处理搜索
  const handleSearch = () => {
    fetchRecords();
  };

  // 处理重置
  const handleReset = () => {
    setSearchText('');
    setDateRange(null);
    fetchRecords();
  };

  // 打开添加模态框
  const showAddModal = () => {
    setEditingRecord(null);
    form.resetFields();
    setModalVisible(true);
  };

  // 打开编辑模态框
  const showEditModal = (record: DisciplinaryRecord) => {
    setEditingRecord(record);
    form.setFieldsValue({
      employee_name: record.employee_name,
      type: record.type,
      reason: record.reason,
      source_type: record.source_type || 'manual',
      source_table: record.source_table,
      source_metadata: record.source_metadata ? JSON.stringify(record.source_metadata, null, 2) : '',
    });
    setModalVisible(true);
  };

  // 处理表单提交
  const handleSubmit = async (values: DisciplinaryRecordForm) => {
    try {
      const formData = {
        ...values,
        source_type: values.source_type || 'manual',
        source_import_time: values.source_type === 'import' ? new Date().toISOString() : null,
        source_metadata: values.source_metadata ? JSON.parse(values.source_metadata) : null,
      };

      if (editingRecord) {
        await disciplinaryRecordApi.updateDisciplinaryRecord(editingRecord.id, formData);
        message.success('更新红黄牌记录成功');
      } else {
        await disciplinaryRecordApi.createDisciplinaryRecord(formData);
        message.success('添加红黄牌记录成功');
      }
      setModalVisible(false);
      fetchRecords();
      fetchStatistics();
    } catch (error) {
      message.error(editingRecord ? '更新红黄牌记录失败' : '添加红黄牌记录失败');
      console.error(error);
    }
  };

  // 删除记录
  const handleDelete = async (id: string) => {
    try {
      await disciplinaryRecordApi.deleteDisciplinaryRecord(id);
      message.success('删除红黄牌记录成功');
      fetchRecords();
      fetchStatistics();
    } catch (error) {
      message.error('删除红黄牌记录失败');
      console.error(error);
    }
  };

  // 下载数据
  const handleDownload = () => {
    if (records.length === 0) {
      message.warning('暂无数据可下载');
      return;
    }

    // 准备CSV数据
    const headers = [
      '员工姓名',
      '违规类型', 
      '违规原因',
      '来源类型',
      '来源表',
      '批次ID',
      '创建时间'
    ];

    const csvData = records.map(record => [
      record.employee_name,
      record.type || '',
      record.reason,
      getSourceTypeText(record.source_type),
      getSourceTableText(record.source_table),
      record.source_batch_id || '',
      dayjs(record.created_at).format('YYYY-MM-DD HH:mm:ss')
    ]);

    // 创建CSV内容
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // 创建并下载文件
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `红黄牌记录_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    message.success('数据下载成功');
  };

  // 获取来源类型标签颜色
  const getSourceTypeColor = (sourceType: string | null) => {
    switch (sourceType) {
      case 'manual': return 'blue';
      case 'import': return 'green';
      case 'auto': return 'orange';
      default: return 'default';
    }
  };

  // 获取来源类型显示文本
  const getSourceTypeText = (sourceType: string | null) => {
    switch (sourceType) {
      case 'manual': return '手动录入';
      case 'import': return '批量导入';
      case 'auto': return '自动生成';
      default: return '未知';
    }
  };

  // 获取来源表名显示文本
  const getSourceTableText = (sourceTable: string | null) => {
    switch (sourceTable) {
      case 'employee_response_data': return '员工响应数据';
      case 'employee_notes': return '员工笔记';
      case 'employee_leads': return '员工线索';
      case 'employee_list': return '员工列表';
      default: return sourceTable || '-';
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '员工姓名',
      dataIndex: 'employee_name',
      key: 'employee_name',
      width: 120,
    },
    {
      title: '违规类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (text: string | null) => {
        if (!text) return '-';
        const color = text === '回复率' ? 'orange' : text === '发布量' ? 'red' : 'default';
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '违规原因',
      dataIndex: 'reason',
      key: 'reason',
      width: 200,
      ellipsis: {
        showTitle: false,
      },
      render: (text: string) => (
        <Tooltip placement="topLeft" title={text}>
          <Text ellipsis style={{ width: '100%', maxWidth: '100%' }}>
            {text}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: '来源类型',
      dataIndex: 'source_type',
      key: 'source_type',
      width: 100,
      render: (text: string | null) => (
        <Tag color={getSourceTypeColor(text)}>
          {getSourceTypeText(text)}
        </Tag>
      ),
    },
    {
      title: '来源表',
      dataIndex: 'source_table',
      key: 'source_table',
      width: 120,
      render: (text: string | null) => (
        <Tooltip placement="topLeft" title={text}>
          <Text ellipsis style={{ width: '100%', maxWidth: '100%' }}>
            {getSourceTableText(text)}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: '批次ID',
      dataIndex: 'source_batch_id',
      key: 'source_batch_id',
      width: 150,
      render: (text: string | null) => {
        if (!text) return '-';
        return (
          <Tooltip placement="topLeft" title={text}>
            <Text ellipsis style={{ width: '100%', maxWidth: '100%', fontSize: '12px' }}>
              {text}
            </Text>
          </Tooltip>
        );
      },
    },
    {
      title: '来源详情',
      dataIndex: 'source_metadata',
      key: 'source_metadata',
      width: 100,
      render: (metadata: any) => {
        if (!metadata) return '-';
        return (
          <Tooltip 
            placement="topLeft" 
            title={
              <div>
                <div>触发时间: {metadata.trigger_time}</div>
                <div>黄牌条件: {JSON.stringify(metadata.yellow_card_conditions)}</div>
                <div>员工数据: {JSON.stringify(metadata.employee_data)}</div>
              </div>
            }
          >
            <Button type="link" size="small">
              查看详情
            </Button>
          </Tooltip>
        );
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm'),
      sorter: (a: DisciplinaryRecord, b: DisciplinaryRecord) => 
        dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right' as const,
      render: (_: any, record: DisciplinaryRecord) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => showEditModal(record)}
            title="编辑"
            size="small"
          />
          <Popconfirm
            title="确定要删除这条红黄牌记录吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              type="link" 
              danger 
              icon={<DeleteOutlined />}
              title="删除"
              size="small"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>

      {/* 统计卡片 */}
      {statistics && (
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="总记录数"
                value={statistics.totalRecords}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="涉及员工数"
                value={statistics.employeeCount}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="本月记录"
                value={statistics.monthlyStats[dayjs().format('YYYY-MM')] || 0}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="上月记录"
                value={statistics.monthlyStats[dayjs().subtract(1, 'month').format('YYYY-MM')] || 0}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 搜索和操作区域 */}
      <Card style={{ marginBottom: '16px' }}>
        <Row gutter={16} align="middle">
          <Col span={8}>
            <Input
              placeholder="搜索员工姓名"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={handleSearch}
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col span={8}>
            <RangePicker
              placeholder={['开始日期', '结束日期']}
              onChange={(dates) => {
                if (dates) {
                  setDateRange([
                    dates[0]!.format('YYYY-MM-DD'),
                    dates[1]!.format('YYYY-MM-DD')
                  ]);
                  // 自动搜索
                  setTimeout(() => fetchRecords(), 100);
                } else {
                  setDateRange(null);
                  // 自动搜索
                  setTimeout(() => fetchRecords(), 100);
                }
              }}
            />
          </Col>
          <Col span={8}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Space>
                <Button onClick={handleReset} icon={<ReloadOutlined />}>
                  重置
                </Button>
                <Button onClick={handleDownload} icon={<DownloadOutlined />}>
                  下载
                </Button>
                <Button type="primary" onClick={showAddModal} icon={<PlusOutlined />}>
                  添加记录
                </Button>
              </Space>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 数据表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={records}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
            defaultPageSize: 10,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* 添加/编辑模态框 */}
      <Modal
        title={editingRecord ? '编辑红黄牌记录' : '添加红黄牌记录'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            employee_name: '',
            type: '',
            reason: '',
            source_type: 'manual',
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="employee_name"
                label="员工姓名"
                rules={[
                  { required: true, message: '请选择员工姓名' },
                ]}
              >
                <Select
                  placeholder="请选择员工姓名"
                  loading={employeeLoading}
                  showSearch
                  filterOption={(input, option) =>
                    (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                  }
                  notFoundContent={employeeLoading ? <span>加载中...</span> : <span>暂无员工数据</span>}
                >
                  {employees.map(employee => (
                    <Select.Option key={employee.id} value={employee.employee_name}>
                      {employee.employee_name} ({employee.employee_uid})
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="type"
                label="违规类型"
                rules={[
                  { required: true, message: '请选择违规类型' },
                ]}
              >
                <Select placeholder="请选择违规类型">
                  <Select.Option value="回复率">回复率</Select.Option>
                  <Select.Option value="发布量">发布量</Select.Option>
                  <Select.Option value="其他">其他</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="reason"
            label="违规原因"
            rules={[
              { required: true, message: '请输入违规原因' },
              { max: 500, message: '违规原因长度不能超过500个字符' },
            ]}
          >
            <TextArea
              rows={4}
              placeholder="请输入违规原因"
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Divider orientation="left">来源信息</Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="source_type"
                label="来源类型"
              >
                <Select placeholder="请选择来源类型">
                  <Select.Option value="manual">手动录入</Select.Option>
                  <Select.Option value="import">批量导入</Select.Option>
                  <Select.Option value="auto">自动生成</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="source_table"
                label="来源表名"
              >
                <Select placeholder="请选择来源表名" allowClear>
                  <Select.Option value="employee_response_data">员工响应数据</Select.Option>
                  <Select.Option value="employee_notes">员工笔记</Select.Option>
                  <Select.Option value="employee_leads">员工线索</Select.Option>
                  <Select.Option value="employee_list">员工列表</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="source_metadata"
            label={
              <span>
                来源详细信息 
                <Tooltip title="JSON格式的额外信息，如员工UID、导入批次等">
                  <InfoCircleOutlined style={{ marginLeft: 4 }} />
                </Tooltip>
              </span>
            }
          >
            <TextArea
              rows={3}
              placeholder='{"employee_uid": "EMP001", "note": "手动录入"}'
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingRecord ? '更新' : '添加'}
              </Button>
              <Button onClick={() => setModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DisciplinaryRecord; 