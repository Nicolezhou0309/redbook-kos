import { useEffect, useMemo, useState } from 'react'
import { Card, Table, Row, Col, Space, Button, Input, Modal, Form, DatePicker, App, Upload, Tag, Dropdown } from 'antd'
import {
  PlusOutlined,
  UploadOutlined,
  DownloadOutlined,
  DeleteOutlined,
  SearchOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import * as XLSX from 'xlsx'
import { employeeRosterApi, type EmployeeRoster, type EmployeeRosterForm } from '../lib/employeeRosterApi'

export default function EmployeeRosterPage() {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<EmployeeRoster[]>([])
  const [searchText, setSearchText] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<EmployeeRoster | null>(null)
  const [form] = Form.useForm<EmployeeRosterForm>()
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
  const [importing, setImporting] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const list = await employeeRosterApi.getAll()
      setData(list)
    } catch (e: any) {
      message.error(e?.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const q = searchText.trim().toLowerCase()
    if (!q) return data
    return data.filter(r =>
      r.employee_name?.toLowerCase().includes(q) ||
      r.employee_uid?.toLowerCase().includes(q) ||
      r.area?.toLowerCase().includes(q) ||
      r.community?.toLowerCase().includes(q) ||
      r.department?.toLowerCase().includes(q)
    )
  }, [data, searchText])

  const openAdd = (record?: EmployeeRoster) => {
    setEditing(record || null)
    if (record) {
      form.setFieldsValue({
        employee_name: record.employee_name,
        employee_uid: record.employee_uid,
        area: record.area,
        community: record.community,
        department: record.department,
        manager: record.manager,
        phone: record.phone,
        email: record.email,
        hire_date: record.hire_date ? dayjs(record.hire_date) : null,
        hire_period: record.hire_period,
        status: record.status,
        remark: record.remark,
        extra_data: record.extra_data,
        source_file_name: record.source_file_name,
      } as any)
    } else {
      form.resetFields()
    }
    setShowAdvanced(false)
    setModalOpen(true)
  }

  const onSave = async (values: any) => {
    try {
      const payload: EmployeeRosterForm = {
        ...values,
        hire_date: values.hire_date ? dayjs(values.hire_date).format('YYYY-MM-DD') : null
      }
      if (editing) {
        await employeeRosterApi.update(editing.id, payload)
        message.success('更新成功')
      } else {
        await employeeRosterApi.create(payload)
        message.success('创建成功')
      }
      setModalOpen(false)
      form.resetFields()
      load()
    } catch (e: any) {
      message.error(e?.message || '保存失败')
    }
  }

  const onDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        try {
          await employeeRosterApi.delete(id)
          message.success('删除成功')
          load()
        } catch (e: any) {
          message.error(e?.message || '删除失败')
        }
      }
    })
  }

  const onBatchDelete = () => {
    if (selectedRowKeys.length === 0) return
    Modal.confirm({
      title: `确认批量删除 ${selectedRowKeys.length} 条记录？`,
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        try {
          await employeeRosterApi.batchDelete(selectedRowKeys)
          message.success('批量删除成功')
          setSelectedRowKeys([])
          load()
        } catch (e: any) {
          message.error(e?.message || '批量删除失败')
        }
      }
    })
  }

  // 解析 Excel：从 public/员工花名册.xlsx 模板读取列
  const parseExcelFile = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const ws = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 })
    if (rows.length < 2) throw new Error('Excel 内容为空或缺少表头')

    const headers = (rows[0] as string[]).map(h => String(h).trim())
    const idx = (name: string) => headers.findIndex(h => h === name)

    const iName = idx('姓名') >= 0 ? idx('姓名') : idx('员工姓名')
    if (iName < 0) throw new Error('缺少必填列：姓名')

    const iUid = idx('员工UID') >= 0 ? idx('员工UID') : idx('UID')
    const iDept = idx('部门')
    const iPos = idx('岗位') >= 0 ? idx('岗位') : idx('职务')
    const iPhone = idx('电话') >= 0 ? idx('电话') : idx('手机号')
    const iEmail = idx('邮箱')
    const iHire = idx('入职日期')
    const iStatus = idx('状态')
    const iRemark = idx('备注')

    const list: EmployeeRosterForm[] = []
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r]
      if (!row || row.every(c => c == null || String(c).trim() === '')) continue
      const rec: EmployeeRosterForm = {
        employee_name: String(row[iName] ?? '').trim(),
        employee_uid: iUid >= 0 && row[iUid] != null ? String(row[iUid]).trim() : null,
        department: iDept >= 0 ? (row[iDept] ? String(row[iDept]).trim() : null) : null,
        position: iPos >= 0 ? (row[iPos] ? String(row[iPos]).trim() : null) : null,
        phone: iPhone >= 0 ? (row[iPhone] ? String(row[iPhone]).trim() : null) : null,
        email: iEmail >= 0 ? (row[iEmail] ? String(row[iEmail]).trim() : null) : null,
        hire_date: iHire >= 0 && row[iHire] ? dayjs(row[iHire]).isValid() ? dayjs(row[iHire]).format('YYYY-MM-DD') : null : null,
        status: iStatus >= 0 ? (row[iStatus] ? String(row[iStatus]).trim() : null) : null,
        remark: iRemark >= 0 ? (row[iRemark] ? String(row[iRemark]).trim() : null) : null,
        extra_data: {},
        source_file_name: file.name
      }
      if (!rec.employee_name) continue
      list.push(rec)
    }
    if (list.length === 0) throw new Error('没有有效数据行')
    return list
  }

  const handleImport = async (file: File) => {
    try {
      setImporting(true)
      const records = await parseExcelFile(file)
      const inserted = await employeeRosterApi.batchUpsert(records)
      message.success(`导入成功：${inserted.length} 条`)
      load()
    } catch (e: any) {
      message.error(e?.message || '导入失败')
    } finally {
      setImporting(false)
    }
    return false
  }

  const handleDownloadTemplate = () => {
    // 若已有模板在 public/员工花名册.xlsx，直接触发下载
    const a = document.createElement('a')
    a.href = '/员工花名册.xlsx'
    a.download = '员工花名册模板.xlsx'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  // 已移除：从 public 直接导入按钮与逻辑

  const columns = [
    { title: '姓名', dataIndex: 'employee_name', key: 'employee_name', width: 140 },
    // 隐藏：UID、岗位、电话、邮箱、入职周期、状态、备注
    // { title: 'UID', dataIndex: 'employee_uid', key: 'employee_uid', width: 160 },
    { title: '片区', dataIndex: 'area', key: 'area', width: 120 },
    { title: '社区', dataIndex: 'community', key: 'community', width: 160 },
    { title: '部门', dataIndex: 'department', key: 'department', width: 140 },
    // { title: '岗位', dataIndex: 'position', key: 'position', width: 140 },
    { title: '直线经理', dataIndex: 'manager', key: 'manager', width: 120 },
    // { title: '电话', dataIndex: 'phone', key: 'phone', width: 140 },
    // { title: '邮箱', dataIndex: 'email', key: 'email', width: 180 },
    { title: '入职日期', dataIndex: 'hire_date', key: 'hire_date', width: 120, render: (v: string) => v || '-' },
    // { title: '入职周期', dataIndex: 'hire_period', key: 'hire_period', width: 120 },
    // { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (v: string) => v ? <Tag color={v === '在职' ? 'green' : v === '试用' ? 'orange' : 'default'}>{v}</Tag> : '-' },
    // { title: '备注', dataIndex: 'remark', key: 'remark', ellipsis: true },
    {
      title: '操作', key: 'action', width: 140, fixed: 'right' as const,
      render: (_: any, record: EmployeeRoster) => (
        <Space>
          <Button type="link" size="small" onClick={() => openAdd(record)}>编辑</Button>
          <Button type="link" size="small" danger onClick={() => onDelete(record.id)}>删除</Button>
        </Space>
      )
    }
  ]

  return (
    <div>
      <Card>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col flex="auto">
            <Input
              placeholder="搜索姓名/UID/片区/社区/部门..."
              prefix={<SearchOutlined />}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ maxWidth: 320 }}
            />
          </Col>
          <Col>
            <Space>
              <Button icon={<PlusOutlined />} size="small" onClick={() => openAdd()}>新增</Button>
              <Upload
                accept=".xlsx,.xls"
                beforeUpload={(file) => handleImport(file)}
                showUploadList={false}
              >
                <Button icon={<UploadOutlined />} size="small">导入Excel</Button>
              </Upload>
              {/* 从public导入按钮已移除 */}
              {selectedRowKeys.length > 0 && (
                <Button danger icon={<DeleteOutlined />} size="small" onClick={onBatchDelete}>
                  批量删除 ({selectedRowKeys.length})
                </Button>
              )}
              <Dropdown
                menu={{
                  items: [
                    {
                      key: 'download-template',
                      icon: <DownloadOutlined />,
                      label: '下载Excel模板',
                      onClick: handleDownloadTemplate
                    }
                  ]
                }}
                placement="bottomRight"
              >
                <Button type="link" icon={<DownloadOutlined />} size="small">下载模板</Button>
              </Dropdown>
            </Space>
          </Col>
        </Row>

        <Table
          rowKey="id"
          columns={columns as any}
          dataSource={filtered}
          loading={loading || importing}
          scroll={{ x: 'max-content' }}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys as string[]),
            preserveSelectedRowKeys: true
          }}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
          }}
          size="small"
        />
      </Card>

      <Modal
        title={editing ? '编辑人员' : '新增人员'}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields() }}
        footer={null}
        width={720}
      >
        <Form form={form} layout="vertical" onFinish={onSave}>
          {/* 关键字段（与列表展示一致） */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="employee_name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
                <Input placeholder="姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="hire_date" label="入职日期">
                <DatePicker style={{ width: '100%' }} placeholder="选择入职日期" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="area" label="片区">
                <Input placeholder="片区" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="community" label="社区">
                <Input placeholder="社区" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="department" label="部门">
                <Input placeholder="部门" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="manager" label="直线经理">
                <Input placeholder="直线经理" />
              </Form.Item>
            </Col>
            <Col span={16}>
              <div style={{ display: 'flex', height: '100%', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                <Button type="link" onClick={() => setShowAdvanced(v => !v)}>
                  {showAdvanced ? '收起更多字段' : '展开更多字段'}
                </Button>
              </div>
            </Col>
          </Row>

          {/* 更多字段（默认收起） */}
          {showAdvanced && (
            <>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="employee_uid" label="员工UID">
                    <Input placeholder="员工UID（用于去重/更新，可选）" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="hire_period" label="入职周期">
                    <Input placeholder="入职周期（文本，可选）" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="phone" label="电话">
                    <Input placeholder="电话（可选）" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="email" label="邮箱">
                    <Input placeholder="邮箱（可选）" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="status" label="状态">
                    <Input placeholder="在职/离职/试用（可选）" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="remark" label="备注">
                    <Input placeholder="备注（可选）" />
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}

          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => { setModalOpen(false); form.resetFields() }}>取消</Button>
              <Button type="primary" htmlType="submit">保存</Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  )
}


