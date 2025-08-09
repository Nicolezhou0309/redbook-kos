import React, { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import {
  Table,
  Card,
  Space,
  Button,
  Input,
  Select,
  Row,
  Col,
  Form,
  Modal,
  App,
  Pagination,
  Tag,
  Tooltip,
  InputNumber,
  Divider,
  DatePicker,
  Dropdown
} from 'antd'
import {
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined,
  EyeOutlined,
  MoreOutlined,
  DownloadOutlined,
  UploadOutlined
} from '@ant-design/icons'
import { 
  getEmployeeSimpleJoinData, 
  downloadEmployeeSimpleJoinData,
  getSimpleFilterOptions, 
  type EmployeeSimpleJoinData, 
  type SimpleJoinFilterParams, 
  type SortField, 
  type SortOrder 
} from '../lib/employeeSimpleJoinApi'
import { employeeNotesApi } from '../lib/employeeNotesApi'
import { disciplinaryRecordApi } from '../lib/disciplinaryRecordApi'
import type { EmployeeNotesData } from '../types/employee'
import type { DisciplinaryRecordForm } from '../types/employee'
import { downloadEmployeeSimpleJoinData as downloadExcelData, downloadWeeklyReportByCommunity, downloadWeeklyReportSplitFilesByCommunity, buildWeeklyReportFilesByCommunity } from '../utils/employeeExcelUtils'
import { employeeRosterApi } from '../lib/employeeRosterApi'
import UltimateImportModal from '../components/UltimateImportModal'

/**
 * 员工简化关联数据页面
 * 
 * 黄牌发放逻辑修复说明：
 * 1. 添加了完整的来源字段信息：
 *    - source_type: 'auto' (自动发放)
 *    - source_table: 'employee_simple_join' (来源表)
 *    - source_record_id: employee.employee_id (原始记录ID)
 *    - source_time_range: 包含黄牌判断时间范围和员工数据时间范围
 *    - source_batch_id: 批量发放批次ID
 *    - source_file_name: 'employee_simple_join_yellow_card'
 *    - source_import_time: 发放时间
 *    - source_metadata: 包含黄牌判断条件、员工数据、黄牌状态等详细信息
 * 
 * 2. 添加了employee_id字段，用于关联员工表
 * 
 * 3. 每条黄牌记录都包含完整的追溯信息，便于后续查询和分析
 */
const { Option } = Select
const { Search } = Input
const { RangePicker } = DatePicker

const EmployeeSimpleJoin: React.FC = () => {
  const { message } = App.useApp()
  const [data, setData] = useState<EmployeeSimpleJoinData[]>([])
  const [loading, setLoading] = useState(false)
  const [filterOptions, setFilterOptions] = useState<any>({})
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  })
  const [filters, setFilters] = useState<SimpleJoinFilterParams>({})
  const [yellowCardConditions, setYellowCardConditions] = useState<SimpleJoinFilterParams>({})
  const [sortField, setSortField] = useState<SortField>('employee_name')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [filterModalVisible, setFilterModalVisible] = useState(false)
  const [yellowCardModalVisible, setYellowCardModalVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [timeRangeFilter, setTimeRangeFilter] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null)
  const [form] = Form.useForm()
  const [yellowCardForm] = Form.useForm()
  const [notesModalVisible, setNotesModalVisible] = useState(false)
  const [selectedEmployeeNotes, setSelectedEmployeeNotes] = useState<EmployeeNotesData[]>([])
  const [notesLoading, setNotesLoading] = useState(false)
  const [iframeModalVisible, setIframeModalVisible] = useState(false)
  const [selectedNoteLink, setSelectedNoteLink] = useState('')
  const [, setSelectedNoteTitle] = useState('')
  
  // 选择状态管理
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [selectedRows, setSelectedRows] = useState<EmployeeSimpleJoinData[]>([])
  
  // 发放黄牌相关状态
  const [issuingYellowCard, setIssuingYellowCard] = useState(false)
  
  // 批量下载相关状态
  const [downloadModalVisible, setDownloadModalVisible] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [downloadForm] = Form.useForm()
  const [exportingWeekly, setExportingWeekly] = useState(false)
  const [exportingWeeklySplit, setExportingWeeklySplit] = useState(false)
  const [sendingWeCom, setSendingWeCom] = useState(false)
  
  // 批量上传相关状态
  const [importModalVisible, setImportModalVisible] = useState(false)
  
  // localStorage相关函数
  const YELLOW_CARD_STORAGE_KEY = 'employee_simple_join_yellow_card_filters'
  
  // 保存黄牌判断条件到localStorage
  const saveYellowCardConditions = (conditions: SimpleJoinFilterParams) => {
    try {
      localStorage.setItem(YELLOW_CARD_STORAGE_KEY, JSON.stringify(conditions))
    } catch (error) {
      console.error('保存黄牌判断条件失败:', error)
    }
  }
  
  // 从localStorage加载黄牌判断条件
  const loadYellowCardConditions = (): SimpleJoinFilterParams => {
    try {
      const saved = localStorage.getItem(YELLOW_CARD_STORAGE_KEY)
      return saved ? JSON.parse(saved) : {}
    } catch (error) {
      console.error('加载黄牌判断条件失败:', error)
      return {}
    }
  }
  
  // 清除保存的黄牌判断条件
  const clearYellowCardConditions = () => {
    try {
      localStorage.removeItem(YELLOW_CARD_STORAGE_KEY)
      setYellowCardConditions({})
      yellowCardForm.resetFields()
      message.success('已清除保存的黄牌判断条件')
    } catch (error) {
      message.error('清除失败')
    }
  }

  // 处理表格选择变化
  const handleTableSelectionChange = (newSelectedRowKeys: React.Key[], newSelectedRows: EmployeeSimpleJoinData[]) => {
    setSelectedRowKeys(newSelectedRowKeys)
    setSelectedRows(newSelectedRows)
  }

  // 清除选择
  const clearSelection = () => {
    setSelectedRowKeys([])
    setSelectedRows([])
  }

  // 批量下载数据
  const handleBatchDownload = async (values: any) => {
    setDownloading(true)
    try {
      // 构建下载筛选条件
      const downloadFilters: SimpleJoinFilterParams = {
        ...filters, // 继承当前筛选条件
        start_date: values.date_range?.[0]?.format('YYYY-MM-DD'),
        end_date: values.date_range?.[1]?.format('YYYY-MM-DD')
      }

      
      // 调用API获取数据
      const result = await downloadEmployeeSimpleJoinData(downloadFilters, sortField, sortOrder)
      
      if (result.success && result.data) {
        
        // 生成Excel文件
        const fileName = downloadExcelData(result.data, {
          start_date: downloadFilters.start_date,
          end_date: downloadFilters.end_date
        })
        
        message.success(`成功下载 ${result.data.length} 条数据到文件: ${fileName}`)
        
        setDownloadModalVisible(false)
        downloadForm.resetFields()
      } else {
        message.error(result.error || '下载数据失败')
      }
    } catch (error) {
      message.error('批量下载失败，请重试')
    } finally {
      setDownloading(false)
    }
  }

  // 发放黄牌
  const handleIssueYellowCard = async () => {
    if (selectedRows.length === 0) {
      message.warning('请先选择要发放黄牌的员工')
      return
    }

    // 检查是否设置了黄牌判断条件
    const hasYellowCardConditions = yellowCardConditions.yellow_card_timeout_rate !== undefined || 
                                   yellowCardConditions.yellow_card_notes_count !== undefined || 
                                   yellowCardConditions.yellow_card_min_private_message_leads !== undefined ||
                                   yellowCardConditions.yellow_card_start_date !== undefined ||
                                   yellowCardConditions.yellow_card_end_date !== undefined

    if (!hasYellowCardConditions) {
      message.warning('请先设置黄牌判断条件')
      return
    }

    setIssuingYellowCard(true)
    
    try {
      const recordsToCreate: DisciplinaryRecordForm[] = []
      const batchId = `yellow_card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const currentTime = new Date().toISOString()
      
      // 遍历选中的员工，判断黄牌状态并创建记录
      for (const employee of selectedRows) {
        const yellowCardStatus = getYellowCardStatus(employee)
        
        // 只对满足黄牌条件的员工创建记录
        if (yellowCardStatus.status !== 'normal' && yellowCardStatus.status !== 'not_set') {
          // 构建来源信息
          const sourceMetadata = {
            yellow_card_conditions: yellowCardConditions,
            employee_data: {
              employee_id: employee.employee_id,
              employee_uid: employee.employee_uid,
              xiaohongshu_nickname: employee.xiaohongshu_nickname,
              region: employee.region,
              status: employee.status,
              time_range: employee.time_range,
              response_time_range: employee.response_time_range
            },
            yellow_card_status: yellowCardStatus,
            trigger_time: currentTime
          }
          
          if (yellowCardStatus.status === 'both') {
            // 同时满足两个条件，创建两条记录
            const timeoutRecord: DisciplinaryRecordForm = {
              employee_name: employee.employee_name,
              reason: `黄牌-回复率超标: ${yellowCardStatus.reason}`,
              type: '回复率',
              employee_id: employee.employee_id,
              source_type: 'auto',
              source_table: 'employee_simple_join',
              source_record_id: employee.employee_id,
              source_time_range: {
                yellow_card_start_date: yellowCardConditions.yellow_card_start_date,
                yellow_card_end_date: yellowCardConditions.yellow_card_end_date,
                employee_time_range: employee.time_range,
                employee_response_time_range: employee.response_time_range
              },
              source_batch_id: batchId,
              source_file_name: 'employee_simple_join_yellow_card',
              source_import_time: currentTime,
              source_metadata: sourceMetadata
            }
            recordsToCreate.push(timeoutRecord)
            
            const notesRecord: DisciplinaryRecordForm = {
              employee_name: employee.employee_name,
              reason: `黄牌-发布量不足: ${yellowCardStatus.reason}`,
              type: '发布量',
              employee_id: employee.employee_id,
              source_type: 'auto',
              source_table: 'employee_simple_join',
              source_record_id: employee.employee_id,
              source_time_range: {
                yellow_card_start_date: yellowCardConditions.yellow_card_start_date,
                yellow_card_end_date: yellowCardConditions.yellow_card_end_date,
                employee_time_range: employee.time_range,
                employee_response_time_range: employee.response_time_range
              },
              source_batch_id: batchId,
              source_file_name: 'employee_simple_join_yellow_card',
              source_import_time: currentTime,
              source_metadata: sourceMetadata
            }
            recordsToCreate.push(notesRecord)
            
          } else if (yellowCardStatus.status === 'timeout') {
            // 只满足回复率超标条件
            const record: DisciplinaryRecordForm = {
              employee_name: employee.employee_name,
              reason: `黄牌-回复率超标: ${yellowCardStatus.reason}`,
              type: '回复率',
              employee_id: employee.employee_id,
              source_type: 'auto',
              source_table: 'employee_simple_join',
              source_record_id: employee.employee_id,
              source_time_range: {
                yellow_card_start_date: yellowCardConditions.yellow_card_start_date,
                yellow_card_end_date: yellowCardConditions.yellow_card_end_date,
                employee_time_range: employee.time_range,
                employee_response_time_range: employee.response_time_range
              },
              source_batch_id: batchId,
              source_file_name: 'employee_simple_join_yellow_card',
              source_import_time: currentTime,
              source_metadata: sourceMetadata
            }
            recordsToCreate.push(record)
          } else if (yellowCardStatus.status === 'notes') {
            // 只满足发布量不足条件
            const record: DisciplinaryRecordForm = {
              employee_name: employee.employee_name,
              reason: `黄牌-发布量不足: ${yellowCardStatus.reason}`,
              type: '发布量',
              employee_id: employee.employee_id,
              source_type: 'auto',
              source_table: 'employee_simple_join',
              source_record_id: employee.employee_id,
              source_time_range: {
                yellow_card_start_date: yellowCardConditions.yellow_card_start_date,
                yellow_card_end_date: yellowCardConditions.yellow_card_end_date,
                employee_time_range: employee.time_range,
                employee_response_time_range: employee.response_time_range
              },
              source_batch_id: batchId,
              source_file_name: 'employee_simple_join_yellow_card',
              source_import_time: currentTime,
              source_metadata: sourceMetadata
            }
            recordsToCreate.push(record)
          }
        }
      }

      if (recordsToCreate.length === 0) {
        message.info('选中的员工均不满足黄牌条件，无需发放黄牌')
        return
      }

      // 批量创建黄牌记录
      const createdRecords = await disciplinaryRecordApi.batchCreateDisciplinaryRecords(recordsToCreate)
      
      message.success(`成功发放 ${createdRecords.length} 条黄牌记录`)
      
      // 清除选择
      clearSelection()
      
    } catch (error) {
      message.error('发放黄牌失败，请重试')
    } finally {
      setIssuingYellowCard(false)
    }
  }

  // 生成“违规状态”文本
  const getViolationStatusText = (record: EmployeeSimpleJoinData) => {
    const yellowCardStatus = getYellowCardStatus(record)
    if (yellowCardStatus.status === 'not_set') return '未设置'
    if (yellowCardStatus.status === 'normal') return '正常'
    if (yellowCardStatus.status === 'both') return '回复率/发布量'
    if (yellowCardStatus.status === 'timeout') return '回复率'
    if (yellowCardStatus.status === 'notes') return '发布量'
    return '正常'
  }

  // 导出周报（按社区分表）
  const handleExportWeeklyByCommunity = async () => {
    try {
      setExportingWeekly(true)

      // 拉取当前筛选条件下的全量数据
      const fullResult = await downloadEmployeeSimpleJoinData(filters, sortField, sortOrder)
      if (!fullResult.success || !fullResult.data) {
        message.error(fullResult.error || '获取数据失败')
        return
      }

      // 加载花名册，用于匹配组长/社区
      const roster = await employeeRosterApi.getAll()
      // 建立员工姓名 -> roster 的索引（若同名，以第一个为准）
      const nameToRoster = new Map<string, typeof roster[number]>()
      for (const r of roster) {
        if (r.employee_name) {
          const key = r.employee_name.trim()
          if (!nameToRoster.has(key)) nameToRoster.set(key, r)
        }
      }

      // 组装周报行
      const weeklyRows = fullResult.data.map(rec => {
        const rosterMatch = nameToRoster.get((rec.employee_name || '').trim())
        const manager = rosterMatch?.manager || ''
        const community = rosterMatch?.community || '未匹配社区'

        // 时间范围（互动时间范围）
        let timeRangeText = '-'
        if (rec.time_range) {
          if (rec.time_range.remark && rec.time_range.remark.trim() !== '') {
            timeRangeText = rec.time_range.remark
          } else if (rec.time_range.start_date && rec.time_range.end_date) {
            timeRangeText = `${rec.time_range.start_date} ~ ${rec.time_range.end_date}`
          }
        }

        // 1小时回复率：取 rate_1hour_timeout 字段展示
        const oneHourRate = rec.rate_1hour_timeout || ''

        return {
          '当前使用人': rec.employee_name || '',
          '组长': manager,
          '社区': community,
          '时间范围': timeRangeText,
          '1小时回复率': oneHourRate,
          '留资量': rec.total_private_message_leads_kept || 0,
          '开口量': rec.total_private_message_openings || 0,
          '发布量': rec.published_notes_count || 0,
          '笔记曝光': rec.notes_exposure_count || 0,
          '笔记点击': rec.notes_click_count || 0,
          '违规状态': getViolationStatusText(rec)
        }
      })

      const fileName = downloadWeeklyReportByCommunity(weeklyRows, {
        start_date: filters.start_date,
        end_date: filters.end_date
      })

      message.success(`周报已导出：${fileName}`)
    } catch (e) {
      console.error(e)
      message.error('导出周报失败')
    } finally {
      setExportingWeekly(false)
    }
  }

  // 导出周报（每社区单文件-分表）
  const handleExportWeeklySplitFilesByCommunity = async () => {
    try {
      setExportingWeeklySplit(true)

      const fullResult = await downloadEmployeeSimpleJoinData(filters, sortField, sortOrder)
      if (!fullResult.success || !fullResult.data) {
        message.error(fullResult.error || '获取数据失败')
        return
      }

      const roster = await employeeRosterApi.getAll()
      const nameToRoster = new Map<string, typeof roster[number]>()
      for (const r of roster) {
        if (r.employee_name) {
          const key = r.employee_name.trim()
          if (!nameToRoster.has(key)) nameToRoster.set(key, r)
        }
      }

      const weeklyRows = fullResult.data.map(rec => {
        const rosterMatch = nameToRoster.get((rec.employee_name || '').trim())
        const manager = rosterMatch?.manager || ''
        const community = rosterMatch?.community || '未匹配社区'

        let timeRangeText = '-'
        if (rec.time_range) {
          if (rec.time_range.remark && rec.time_range.remark.trim() !== '') {
            timeRangeText = rec.time_range.remark
          } else if (rec.time_range.start_date && rec.time_range.end_date) {
            timeRangeText = `${rec.time_range.start_date} ~ ${rec.time_range.end_date}`
          }
        }

        const oneHourRate = rec.rate_1hour_timeout || ''

        return {
          '当前使用人': rec.employee_name || '',
          '组长': manager,
          '社区': community,
          '时间范围': timeRangeText,
          '1小时回复率': oneHourRate,
          '留资量': rec.total_private_message_leads_kept || 0,
          '开口量': rec.total_private_message_openings || 0,
          '发布量': rec.published_notes_count || 0,
          '笔记曝光': rec.notes_exposure_count || 0,
          '笔记点击': rec.notes_click_count || 0,
          '违规状态': getViolationStatusText(rec)
        }
      })

      const fileNames = downloadWeeklyReportSplitFilesByCommunity(weeklyRows, {
        start_date: filters.start_date,
        end_date: filters.end_date
      })
      message.success(`已导出 ${fileNames.length} 个社区周报文件`)
    } catch (e) {
      console.error(e)
      message.error('导出周报失败')
    } finally {
      setExportingWeeklySplit(false)
    }
  }

  // 发送周报到企业微信（分社区文件）
  const handleSendWeeklyToWeCom = async () => {
    const WEBHOOK_KEY = 'e9be8161-5ed4-48b2-9823-e17d896efed7'
    const UPLOAD_URL = `/api/wecom/webhook-upload`
    const SEND_URL = `/api/wecom/webhook-send`

    try {
      setSendingWeCom(true)

      // 拉取全量数据
      const fullResult = await downloadEmployeeSimpleJoinData(filters, sortField, sortOrder)
      if (!fullResult.success || !fullResult.data) {
        message.error(fullResult.error || '获取数据失败')
        return
      }

      // 花名册索引
      const roster = await employeeRosterApi.getAll()
      const nameToRoster = new Map<string, typeof roster[number]>()
      for (const r of roster) {
        if (r.employee_name) {
          const key = r.employee_name.trim()
          if (!nameToRoster.has(key)) nameToRoster.set(key, r)
        }
      }

      // 组装周报行
      const weeklyRows = fullResult.data.map(rec => {
        const rosterMatch = nameToRoster.get((rec.employee_name || '').trim())
        const manager = rosterMatch?.manager || ''
        const community = rosterMatch?.community || '未匹配社区'

        let timeRangeText = '-'
        if (rec.time_range) {
          if (rec.time_range.remark && rec.time_range.remark.trim() !== '') {
            timeRangeText = rec.time_range.remark
          } else if (rec.time_range.start_date && rec.time_range.end_date) {
            timeRangeText = `${rec.time_range.start_date} ~ ${rec.time_range.end_date}`
          }
        }

        const oneHourRate = rec.rate_1hour_timeout || ''

        return {
          '当前使用人': rec.employee_name || '',
          '组长': manager,
          '社区': community,
          '时间范围': timeRangeText,
          '1小时回复率': oneHourRate,
          '留资量': rec.total_private_message_leads_kept || 0,
          '开口量': rec.total_private_message_openings || 0,
          '发布量': rec.published_notes_count || 0,
          '笔记曝光': rec.notes_exposure_count || 0,
          '笔记点击': rec.notes_click_count || 0,
          '违规状态': getViolationStatusText(rec)
        }
      })

      // 构建内存文件
      const files = buildWeeklyReportFilesByCommunity(weeklyRows, {
        start_date: filters.start_date,
        end_date: filters.end_date
      })

      if (files.length === 0) {
        message.info('无可发送的数据')
        return
      }

      // 顺序上传与发送
      let successCount = 0
      for (const f of files) {
        // 通过API代理上传（改为真正的 multipart/form-data，更稳）
        const blob = new Blob([f.arrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        const fd = new FormData()
        fd.append('key', WEBHOOK_KEY)
        fd.append('media', blob, f.fileName)
        const upResp = await fetch(UPLOAD_URL, { method: 'POST', body: fd })
        if (!upResp.ok) {
          console.error('上传失败 HTTP:', upResp.status, upResp.statusText)
          continue
        }
        const upData = await upResp.json()
        if (upData.errcode !== 0 || !upData.media_id) {
          console.error('上传失败:', upData)
          continue
        }

        const sendResp = await fetch(SEND_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: WEBHOOK_KEY, media_id: upData.media_id })
        })
        if (!sendResp.ok) {
          console.error('发送失败 HTTP:', sendResp.status, sendResp.statusText)
          continue
        }
        const sendData = await sendResp.json()
        if (sendData.errcode === 0) {
          successCount++
        } else {
          console.error('发送失败:', sendData)
        }
      }

      if (successCount > 0) {
        message.success(`已发送 ${successCount}/${files.length} 个社区周报到企业微信`)
      } else {
        message.error('发送失败，请检查Webhook配置或浏览器网络限制')
      }
    } catch (e) {
      console.error(e)
      message.error('发送到企业微信失败')
    } finally {
      setSendingWeCom(false)
    }
  }

  // 检查是否可以发放黄牌
  const canIssueYellowCard = () => {
    // 检查是否有选中的记录
    if (selectedRows.length === 0) {
      return false
    }
    
    // 检查是否设置了黄牌判断条件
    const hasYellowCardConditions = yellowCardConditions.yellow_card_timeout_rate !== undefined || 
                                   yellowCardConditions.yellow_card_notes_count !== undefined || 
                                   yellowCardConditions.yellow_card_min_private_message_leads !== undefined ||
                                   yellowCardConditions.yellow_card_start_date !== undefined ||
                                   yellowCardConditions.yellow_card_end_date !== undefined
    
    return hasYellowCardConditions
  }

  // 加载数据
  const loadData = async () => {
    setLoading(true)
    try {
      const result = await getEmployeeSimpleJoinData(
        filters,
        sortField,
        sortOrder,
        { page: pagination.current, pageSize: pagination.pageSize }
      )
      
      if (result.success) {
        setData(result.data || [])
        setPagination(prev => ({
          ...prev,
          total: result.total || 0
        }))
        // 数据加载后清除选择
        clearSelection()
      } else {
        message.error(result.error || '加载数据失败')
      }
    } catch (error) {
      message.error('加载数据时发生错误')
    } finally {
      setLoading(false)
    }
  }

  // 处理导入成功回调
  const handleImportSuccess = () => {
    loadData()
  }

  // 加载筛选选项
  const loadFilterOptions = async () => {
    try {
      const result = await getSimpleFilterOptions()
      if (result.success) {
        setFilterOptions(result)
      }
    } catch (error) {
    }
  }

  useEffect(() => {
    loadFilterOptions()
    // 加载保存的黄牌判断条件
    const savedYellowCardConditions = loadYellowCardConditions()
    if (Object.keys(savedYellowCardConditions).length > 0) {
      setYellowCardConditions(savedYellowCardConditions)
    }
    loadData()
  }, [])

  useEffect(() => {
    loadData()
  }, [filters, sortField, sortOrder, pagination.current, pagination.pageSize])

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchQuery(value)
    setFilters(prev => ({
      ...prev,
      search_query: value || undefined
    }))
    setPagination(prev => ({ ...prev, current: 1 }))
  }

  // 处理时间范围筛选
  const handleTimeRangeChange = (dates: any) => {
    setTimeRangeFilter(dates)
    if (dates && dates[0] && dates[1]) {
      setFilters(prev => ({
        ...prev,
        start_date: dates[0].format('YYYY-MM-DD'),
        end_date: dates[1].format('YYYY-MM-DD')
      }))
    } else {
      setFilters(prev => {
        const newFilters = { ...prev }
        delete newFilters.start_date
        delete newFilters.end_date
        return newFilters
      })
    }
    setPagination(prev => ({ ...prev, current: 1 }))
  }

  // 保存黄牌判断条件
  const handleSaveYellowCardConditions = (values: any) => {
    const newConditions: SimpleJoinFilterParams = {}
    
    // 黄牌判断条件
    if (values.yellow_card_1min_timeout_rate !== undefined) {
      newConditions.yellow_card_timeout_rate = values.yellow_card_1min_timeout_rate
    }
    if (values.yellow_card_notes_count !== undefined) {
      newConditions.yellow_card_notes_count = values.yellow_card_notes_count
    }
    if (values.yellow_card_min_private_message_leads !== undefined) {
      newConditions.yellow_card_min_private_message_leads = values.yellow_card_min_private_message_leads
    }
    if (values.yellow_card_date_range) {
      newConditions.yellow_card_start_date = values.yellow_card_date_range[0]?.format('YYYY-MM-DD')
      newConditions.yellow_card_end_date = values.yellow_card_date_range[1]?.format('YYYY-MM-DD')
    }
    

    setYellowCardConditions(newConditions)
    
    // 保存黄牌判断条件到localStorage
    saveYellowCardConditions(newConditions)
    
    setYellowCardModalVisible(false)
    message.success('黄牌判断条件已保存')
  }

  // 应用黄牌筛选条件
  const handleApplyYellowCardFilter = (values: any) => {
    const newFilters: SimpleJoinFilterParams = {}
    
    // 黄牌筛选条件
    if (values.yellow_card_1min_timeout_rate !== undefined) {
      newFilters.yellow_card_timeout_rate = values.yellow_card_1min_timeout_rate
    }
    if (values.yellow_card_notes_count !== undefined) {
      newFilters.yellow_card_notes_count = values.yellow_card_notes_count
    }
    if (values.yellow_card_min_private_message_leads !== undefined) {
      newFilters.yellow_card_min_private_message_leads = values.yellow_card_min_private_message_leads
    }
    if (values.yellow_card_date_range) {
      newFilters.yellow_card_start_date = values.yellow_card_date_range[0]?.format('YYYY-MM-DD')
      newFilters.yellow_card_end_date = values.yellow_card_date_range[1]?.format('YYYY-MM-DD')
    }

    setFilters(newFilters)
    setPagination(prev => ({ ...prev, current: 1 }))
    
    setYellowCardModalVisible(false)
    message.success('黄牌筛选条件已应用')
  }

  // 应用筛选并保存设置
  const handleApplyYellowCardFilterAndSave = async (values: any) => {
    // 先保存设置
    await handleSaveYellowCardConditions(values)
    // 再应用筛选
    handleApplyYellowCardFilter(values)
  }

  // 处理筛选
  const handleFilter = (values: any) => {
    const newFilters: SimpleJoinFilterParams = {}
    
    // 基础筛选
    if (values.filter_employee_name) newFilters.filter_employee_name = values.filter_employee_name
    if (values.filter_employee_uid) newFilters.filter_employee_uid = values.filter_employee_uid
    if (values.filter_xiaohongshu_nickname) newFilters.filter_xiaohongshu_nickname = values.filter_xiaohongshu_nickname
    if (values.filter_region) newFilters.filter_region = values.filter_region
    if (values.filter_status) newFilters.filter_status = values.filter_status
    if (values.time_range_remark) newFilters.time_range_remark = values.time_range_remark
    if (values.date_range) {
      newFilters.start_date = values.date_range[0]?.format('YYYY-MM-DD')
      newFilters.end_date = values.date_range[1]?.format('YYYY-MM-DD')
    }

    // 数值范围筛选
    if (values.min_interactions !== undefined) newFilters.min_interactions = values.min_interactions
    if (values.max_interactions !== undefined) newFilters.max_interactions = values.max_interactions
    if (values.min_form_leads !== undefined) newFilters.min_form_leads = values.min_form_leads
    if (values.max_form_leads !== undefined) newFilters.max_form_leads = values.max_form_leads
    if (values.min_private_message_leads !== undefined) newFilters.min_private_message_leads = values.min_private_message_leads
    if (values.max_private_message_leads !== undefined) newFilters.max_private_message_leads = values.max_private_message_leads
    if (values.min_private_message_openings !== undefined) newFilters.min_private_message_openings = values.min_private_message_openings
    if (values.max_private_message_openings !== undefined) newFilters.max_private_message_openings = values.max_private_message_openings
    if (values.min_private_message_leads_kept !== undefined) newFilters.min_private_message_leads_kept = values.min_private_message_leads_kept
    if (values.max_private_message_leads_kept !== undefined) newFilters.max_private_message_leads_kept = values.max_private_message_leads_kept
    if (values.min_notes_exposure_count !== undefined) newFilters.min_notes_exposure_count = values.min_notes_exposure_count
    if (values.max_notes_exposure_count !== undefined) newFilters.max_notes_exposure_count = values.max_notes_exposure_count
    if (values.min_notes_click_count !== undefined) newFilters.min_notes_click_count = values.min_notes_click_count
    if (values.max_notes_click_count !== undefined) newFilters.max_notes_click_count = values.max_notes_click_count
    if (values.min_published_notes_count !== undefined) newFilters.min_published_notes_count = values.min_published_notes_count
    if (values.max_published_notes_count !== undefined) newFilters.max_published_notes_count = values.max_published_notes_count
    if (values.min_promoted_notes_count !== undefined) newFilters.min_promoted_notes_count = values.min_promoted_notes_count
    if (values.max_promoted_notes_count !== undefined) newFilters.max_promoted_notes_count = values.max_promoted_notes_count
    if (values.min_notes_promotion_cost !== undefined) newFilters.min_notes_promotion_cost = values.min_notes_promotion_cost
    if (values.max_notes_promotion_cost !== undefined) newFilters.max_notes_promotion_cost = values.max_notes_promotion_cost

    // 响应时间筛选
    if (values.min_response_time !== undefined) newFilters.min_response_time = values.min_response_time
    if (values.max_response_time !== undefined) newFilters.max_response_time = values.max_response_time
    if (values.min_user_rating !== undefined) newFilters.min_user_rating = values.min_user_rating
    if (values.max_user_rating !== undefined) newFilters.max_user_rating = values.max_user_rating
    if (values.min_score_15s_response !== undefined) newFilters.min_score_15s_response = values.min_score_15s_response
    if (values.max_score_15s_response !== undefined) newFilters.max_score_15s_response = values.max_score_15s_response
    if (values.min_score_30s_response !== undefined) newFilters.min_score_30s_response = values.min_score_30s_response
    if (values.max_score_30s_response !== undefined) newFilters.max_score_30s_response = values.max_score_30s_response
    if (values.min_score_1min_response !== undefined) newFilters.min_score_1min_response = values.min_score_1min_response
    if (values.max_score_1min_response !== undefined) newFilters.max_score_1min_response = values.max_score_1min_response
    if (values.min_score_1hour_timeout !== undefined) newFilters.min_score_1hour_timeout = values.min_score_1hour_timeout
    if (values.max_score_1hour_timeout !== undefined) newFilters.max_score_1hour_timeout = values.max_score_1hour_timeout
    if (values.min_score_avg_response_time !== undefined) newFilters.min_score_avg_response_time = values.min_score_avg_response_time
    if (values.max_score_avg_response_time !== undefined) newFilters.max_score_avg_response_time = values.max_score_avg_response_time



    setFilters(newFilters)
    setPagination(prev => ({ ...prev, current: 1 }))
    setFilterModalVisible(false)
    message.success('筛选条件已应用')
  }

  // 处理表格变化
  const handleTableChange = (_pagination: any, _filters: any, sorter: any) => {
    if (sorter.field) {
      setSortField(sorter.field)
      setSortOrder(sorter.order === 'ascend' ? 'asc' : 'desc')
    }
  }

  // 处理分页变化
  const handlePaginationChange = (page: number, pageSize: number) => {
    setPagination(prev => ({
      ...prev,
      current: page,
      pageSize
    }))
  }

  // 重置筛选
  const resetFilters = () => {
    // 清除所有筛选条件，黄牌判断条件独立管理
    setFilters({})
    setSearchQuery('')
    setSortField('employee_name')
    setSortOrder('asc')
    setPagination(prev => ({ ...prev, current: 1 }))
    
    // 重置筛选表单
    form.resetFields()

    message.success('已清除所有筛选条件')
  }

  // 查看笔记详情
  const handleViewNotes = async (record: EmployeeSimpleJoinData) => {
    setNotesLoading(true)
    try {
      const notes = await employeeNotesApi.getEmployeeNotesDataByCreatorId(record.employee_uid)
      setSelectedEmployeeNotes(notes)
      setNotesModalVisible(true)
    } catch (error) {
      message.error('获取笔记详情失败')
      console.error('获取笔记详情失败:', error)
    } finally {
      setNotesLoading(false)
    }
  }

  // 处理点击笔记链接
  const handleClickNoteLink = (noteLink: string, noteTitle: string) => {
    if (!noteLink) {
      message.warning('该笔记暂无链接')
      return
    }
    setSelectedNoteLink(noteLink)
    setSelectedNoteTitle(noteTitle)
    setIframeModalVisible(true)
  }

  // 判断黄牌状态
  const getYellowCardStatus = (record: EmployeeSimpleJoinData) => {
    // 检查是否有黄牌判断条件
    const hasYellowCardConditions = yellowCardConditions.yellow_card_timeout_rate !== undefined || 
                                   yellowCardConditions.yellow_card_notes_count !== undefined || 
                                   yellowCardConditions.yellow_card_min_private_message_leads !== undefined ||
                                   yellowCardConditions.yellow_card_start_date !== undefined ||
                                   yellowCardConditions.yellow_card_end_date !== undefined

    if (!hasYellowCardConditions) {
      return { status: 'not_set', label: '未设置', color: 'default' }
    }

    // 检查时间范围
    const isInTimeRange = () => {
      if (!yellowCardConditions.yellow_card_start_date && !yellowCardConditions.yellow_card_end_date) {
        return true // 没有设置时间范围，认为在范围内
      }
      
      const recordStartDate = record.time_range?.start_date
      const recordEndDate = record.time_range?.end_date
      
      if (!recordStartDate || !recordEndDate) {
        return false
      }
      
      const filterStart = yellowCardConditions.yellow_card_start_date
      const filterEnd = yellowCardConditions.yellow_card_end_date
      
      // 检查时间范围是否重叠
      if (filterStart && filterEnd) {
        return recordStartDate <= filterEnd && recordEndDate >= filterStart
      } else if (filterStart) {
        return recordEndDate >= filterStart
      } else if (filterEnd) {
        return recordStartDate <= filterEnd
      }
      
      return true
    }

    if (!isInTimeRange()) {
      return { status: 'normal', label: '正常', color: 'green' }
    }

    // 检查条件1：回复率超标 AND 私信进线数达标
    const checkCondition1 = () => {
      if (yellowCardConditions.yellow_card_timeout_rate === undefined || yellowCardConditions.yellow_card_min_private_message_leads === undefined) {
        return false
      }

      // 解析1小时超时回复率
      let timeoutRate = 0
      if (record.rate_1hour_timeout) {
        const rateStr = record.rate_1hour_timeout.replace('%', '')
        timeoutRate = parseFloat(rateStr) || 0
      }

      // 检查超时率是否超标 AND 私信进线数是否达标
      const isTimeoutRateExceeded = timeoutRate > yellowCardConditions.yellow_card_timeout_rate
      const isPrivateMessageLeadsSufficient = (record.total_private_message_leads || 0) > yellowCardConditions.yellow_card_min_private_message_leads

      return isTimeoutRateExceeded && isPrivateMessageLeadsSufficient
    }

    // 检查条件2：发布笔记数不足
    const checkCondition2 = () => {
      if (yellowCardConditions.yellow_card_notes_count === undefined) {
        return false
      }

      return (record.published_notes_count || 0) < yellowCardConditions.yellow_card_notes_count
    }

    // 判断黄牌状态
    const condition1Met = checkCondition1()
    const condition2Met = checkCondition2()

    if (condition1Met && condition2Met) {
      return { 
        status: 'both', 
        label: '回复率/发布量', 
        color: 'red',
        reason: '同时满足回复率超标和发布量不足条件'
      }
    } else if (condition1Met) {
      return { 
        status: 'timeout', 
        label: '回复率', 
        color: 'orange',
        reason: `1小时超时回复率${record.rate_1hour_timeout || '0%'} > ${yellowCardConditions.yellow_card_timeout_rate}% 且 私信进线数${record.total_private_message_leads || 0} > ${yellowCardConditions.yellow_card_min_private_message_leads}`
      }
    } else if (condition2Met) {
      return { 
        status: 'notes', 
        label: '发布量', 
        color: 'orange',
        reason: `发布笔记数${record.published_notes_count || 0} < ${yellowCardConditions.yellow_card_notes_count}`
      }
    } else {
      return { status: 'normal', label: '正常', color: 'green' }
    }
  }

  // 表格选择配置
  const rowSelection = {
    selectedRowKeys,
    onChange: handleTableSelectionChange,
    selections: [
      {
        key: 'all',
        text: '全选',
        onSelect: () => {
          const allKeys = data.map((record, index) => record.employee_id || `index_${index}`)
          setSelectedRowKeys(allKeys)
          setSelectedRows(data)
        }
      },
      {
        key: 'none',
        text: '取消全选',
        onSelect: () => {
          setSelectedRowKeys([])
          setSelectedRows([])
        }
      }
    ]
  }

  // 表格列定义 - 级联表头结构
  const columns = [
    {
      title: '员工基本信息',
      children: [
        {
          title: '员工姓名',
          dataIndex: 'employee_name',
          key: 'employee_name',
          width: 90,
          sorter: true,
          fixed: 'left',
          render: (text: string) => <div>{text}</div>
        },
        {
          title: '状态',
          dataIndex: 'status',
          key: 'status',
          width: 70,
          sorter: true,
          fixed: 'left',
          render: (text: string) => (
            <Tag color={text === 'active' ? 'green' : 'red'}>{text}</Tag>
          )
        },
        {
          title: '黄牌状态',
          key: 'yellow_card_status',
          width: 100,
          fixed: 'left',
          render: (_: any, record: EmployeeSimpleJoinData) => {
            const yellowCardStatus = getYellowCardStatus(record)
            return (
              <Tooltip title={yellowCardStatus.reason || yellowCardStatus.label}>
                <Tag color={yellowCardStatus.color}>
                  {yellowCardStatus.label}
                </Tag>
              </Tooltip>
            )
          }
        }
      ]
    },
    {
      title: '小红书账号信息',
      children: [
        {
          title: '昵称',
          dataIndex: 'xiaohongshu_nickname',
          key: 'xiaohongshu_nickname',
          width: 120,
          sorter: true,
          render: (text: string) => (
            <Tooltip title={text}>
              <div 
                style={{ 
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {text}
              </div>
            </Tooltip>
          )
        },
        {
          title: '账号ID',
          dataIndex: 'xiaohongshu_account_id',
          key: 'xiaohongshu_account_id',
          width: 120,
          sorter: true,
          render: (text: string) => <div style={{ fontSize: '12px', color: '#666' }}>{text}</div>
        },
        {
          title: '激活时间',
          dataIndex: 'activation_time',
          key: 'activation_time',
          width: 120,
          sorter: true,
          render: (text: string) => text ? new Date(text).toLocaleDateString() : '-'
        },
        {
          title: '互动时间范围',
          dataIndex: 'time_range',
          key: 'time_range',
          width: 150,
          render: (timeRange: any) => {
            if (!timeRange) return '-'
            
            // 如果有备注信息，显示备注
            if (timeRange.remark && timeRange.remark.trim() !== '') {
              return (
                <Tooltip title={`${timeRange.remark}\n开始: ${timeRange.start_date}\n结束: ${timeRange.end_date}`}>
                  <Tag color="blue">{timeRange.remark}</Tag>
                </Tooltip>
              )
            }
            
            // 如果没有备注但有日期范围，显示日期范围
            if (timeRange.start_date && timeRange.end_date) {
              const startDate = new Date(timeRange.start_date).toLocaleDateString()
              const endDate = new Date(timeRange.end_date).toLocaleDateString()
              return (
                <Tooltip title={`开始: ${timeRange.start_date}\n结束: ${timeRange.end_date}`}>
                  <Tag color="green">{startDate} ~ {endDate}</Tag>
                </Tooltip>
              )
            }
            
            return '-'
          }
        }
      ]
    },
    {
      title: '互动数据',
      children: [
        {
          title: '总互动数',
          dataIndex: 'total_interactions',
          key: 'total_interactions',
          width: 100,
          sorter: true,
          render: (value: number) => <div>{value}</div>
        },
        {
          title: '表单留资',
          dataIndex: 'total_form_leads',
          key: 'total_form_leads',
          width: 100,
          sorter: true,
          render: (value: number) => <div>{value}</div>
        },
        {
          title: '私信进线',
          dataIndex: 'total_private_message_leads',
          key: 'total_private_message_leads',
          width: 100,
          sorter: true,
          render: (value: number) => <div>{value}</div>
        },
        {
          title: '私信开口',
          dataIndex: 'total_private_message_openings',
          key: 'total_private_message_openings',
          width: 100,
          sorter: true,
          render: (value: number) => <div>{value}</div>
        },
        {
          title: '私信留资',
          dataIndex: 'total_private_message_leads_kept',
          key: 'total_private_message_leads_kept',
          width: 100,
          sorter: true,
          render: (value: number) => <div>{value}</div>
        }
      ]
    },
    {
      title: '笔记数据',
      children: [
        {
          title: '发布笔记',
          dataIndex: 'published_notes_count',
          key: 'published_notes_count',
          width: 100,
          sorter: true,
          render: (value: number) => <div>{value}</div>
        },
        {
          title: '推广笔记',
          dataIndex: 'promoted_notes_count',
          key: 'promoted_notes_count',
          width: 100,
          sorter: true,
          render: (value: number) => <div>{value}</div>
        },
        {
          title: '推广费用',
          dataIndex: 'notes_promotion_cost',
          key: 'notes_promotion_cost',
          width: 100,
          sorter: true,
          render: (value: number) => <div>¥{value?.toFixed(2) || '0.00'}</div>
        },
        {
          title: '笔记曝光',
          dataIndex: 'notes_exposure_count',
          key: 'notes_exposure_count',
          width: 100,
          sorter: true,
          render: (value: number) => <div>{value}</div>
        },
        {
          title: '笔记点击',
          dataIndex: 'notes_click_count',
          key: 'notes_click_count',
          width: 100,
          sorter: true,
          render: (value: number) => <div>{value}</div>
        }
      ]
    },
            {
          title: '响应数据',
          children: [
            {
              title: '平均响应时间',
              dataIndex: 'avg_response_time',
              key: 'avg_response_time',
              width: 120,
              sorter: true,
              render: (value: number) => <div>{value?.toFixed(1) || '0'}秒</div>
            },
            {
              title: '1分钟响应率',
              dataIndex: 'rate_1min_response',
              key: 'rate_1min_response',
              width: 100,
              sorter: true,
              render: (text: string) => <div>{text}</div>
            },
            {
              title: '1小时超时率',
              dataIndex: 'rate_1hour_timeout',
              key: 'rate_1hour_timeout',
              width: 100,
              sorter: true,
              render: (text: string) => <div>{text}</div>
            },
            {
              title: '响应时间范围',
              dataIndex: 'response_time_range',
              key: 'response_time_range',
              width: 150,
              render: (responseTimeRange: any) => {
                if (!responseTimeRange) return '-'
                
                // 如果有备注信息，显示备注
                if (responseTimeRange.remark && responseTimeRange.remark.trim() !== '') {
                  return (
                    <Tooltip title={`${responseTimeRange.remark}\n开始: ${responseTimeRange.start_date}\n结束: ${responseTimeRange.end_date}`}>
                      <Tag color="orange">{responseTimeRange.remark}</Tag>
                    </Tooltip>
                  )
                }
                
                // 如果没有备注但有日期范围，显示日期范围
                if (responseTimeRange.start_date && responseTimeRange.end_date) {
                  const startDate = new Date(responseTimeRange.start_date).toLocaleDateString()
                  const endDate = new Date(responseTimeRange.end_date).toLocaleDateString()
                  return (
                    <Tooltip title={`开始: ${responseTimeRange.start_date}\n结束: ${responseTimeRange.end_date}`}>
                      <Tag color="orange">{startDate} ~ {endDate}</Tag>
                    </Tooltip>
                  )
                }
                
                return '-'
              }
            }
          ]
        },

    {
      title: '操作',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (record: EmployeeSimpleJoinData) => (
        <Space>
          <Tooltip title="查看笔记详情">
            <Button 
              type="link" 
              icon={<EyeOutlined />} 
              size="small"
              loading={notesLoading}
              onClick={() => handleViewNotes(record)}
            >
              笔记详情
            </Button>
          </Tooltip>
        </Space>
      )
    }
  ]



  return (
    <div>
      <Card>
        {/* 搜索栏 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Search
              placeholder="搜索员工姓名、UID、小红书昵称、地区"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onSearch={handleSearch}
              enterButton={<SearchOutlined />}
            />
          </Col>
          <Col span={8}>
            <Space>
              <RangePicker
                value={timeRangeFilter}
                onChange={handleTimeRangeChange}
                placeholder={['开始日期', '结束日期']}
                format="YYYY-MM-DD"
                style={{ width: 240 }}
                allowClear
              />
            </Space>
          </Col>
          <Col span={8} style={{ textAlign: 'right' }}>
                          <Space>
                <Button 
                  icon={<FilterOutlined />} 
                  onClick={() => setFilterModalVisible(true)}
                >
                  高级筛选
                </Button>
                <Button icon={<ReloadOutlined />} onClick={resetFilters}>重置筛选</Button>
                <Dropdown
                  menu={{
                    items: [
                      {
                        key: 'download',
                        label: '批量下载',
                        icon: <DownloadOutlined />,
                        onClick: () => setDownloadModalVisible(true)
                      },
                      {
                        key: 'weekly_report',
                        label: (
                          <Tooltip title="根据页面筛选结果分社区导出，导出前请先检查数据">
                            <span>导出周报(整合版)</span>
                          </Tooltip>
                        ),
                        icon: <DownloadOutlined />,
                        onClick: handleExportWeeklyByCommunity,
                        disabled: exportingWeekly
                      },
                      {
                        key: 'weekly_report_split',
                        label: (
                          <Tooltip title="根据页面筛选结果分社区导出，导出前请先检查数据">
                            <span>导出周报(分社区版)</span>
                          </Tooltip>
                        ),
                        icon: <DownloadOutlined />,
                        onClick: handleExportWeeklySplitFilesByCommunity,
                        disabled: exportingWeeklySplit
                      },
                      {
                        key: 'send_wecom',
                        label: (
                          <Tooltip title="将分社区的周报文件上传并发送到企业微信群机器人">
                            <span>发送周报到企业微信(分社区)</span>
                          </Tooltip>
                        ),
                        icon: <DownloadOutlined />,
                        onClick: handleSendWeeklyToWeCom,
                        disabled: sendingWeCom
                      },
                      {
                        key: 'upload',
                        label: '批量上传',
                        icon: <UploadOutlined />,
                        onClick: () => setImportModalVisible(true)
                      }
                    ]
                  }}
                  placement="bottomRight"
                >
                  <Tooltip title="根据页面筛选结果分社区导出，导出前请先检查数据">
                    <Button icon={<MoreOutlined />} loading={exportingWeekly || exportingWeeklySplit}>
                    </Button>
                  </Tooltip>
                </Dropdown>
              </Space>
          </Col>
        </Row>

        {/* 黄牌操作区域 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={24}>
            <div style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space align="center">
                <span style={{ fontWeight: '500', color: '#333' }}>黄牌操作</span>
                <Button 
                  type="primary"
                  danger
                  disabled={!canIssueYellowCard()}
                  loading={issuingYellowCard}
                  onClick={handleIssueYellowCard}
                >
                  发放黄牌
                </Button>
                <Button 
                  onClick={() => setYellowCardModalVisible(true)}
                >
                  黄牌设置
                </Button>
                {selectedRows.length > 0 && (
                  <span style={{ color: '#666', fontSize: '12px' }}>
                    已选择 {selectedRows.length} 条记录
                  </span>
                )}
                {!canIssueYellowCard() && selectedRows.length === 0 && (
                  <span style={{ color: '#999', fontSize: '12px' }}>
                    请先选择员工
                  </span>
                )}
              </Space>
            </div>
          </Col>
        </Row>

        {/* 数据表格 */}
        <Table
          columns={columns as any}
          dataSource={data}
          rowKey={(record, index) => record.employee_id || `index_${index}`}
          loading={loading}
          pagination={false}
          onChange={handleTableChange}
          scroll={{ x: 2900, y: 600 }}
          sticky={{ offsetHeader: 0 }}
          rowSelection={rowSelection}
        />

        {/* 分页 */}
        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <Pagination
            current={pagination.current}
            pageSize={pagination.pageSize}
            total={pagination.total}
            showSizeChanger
            showQuickJumper
            showTotal={(total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`}
            onChange={handlePaginationChange}
            onShowSizeChange={handlePaginationChange}
          />
        </div>
      </Card>

      {/* 筛选弹窗 */}
      <Modal
        title="高级筛选"
        open={filterModalVisible}
        onCancel={() => setFilterModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFilter}
          key={JSON.stringify(filters)} // 强制重新渲染表单
          initialValues={{
            ...filters,
            date_range: filters.start_date && filters.end_date ? [
              dayjs(filters.start_date),
              dayjs(filters.end_date)
            ] : undefined
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="员工姓名" name="filter_employee_name">
                <Input placeholder="请输入员工姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="员工UID" name="filter_employee_uid">
                <Input placeholder="请输入员工UID" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="小红书昵称" name="filter_xiaohongshu_nickname">
                <Input placeholder="请输入小红书昵称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="地区" name="filter_region">
                <Select placeholder="请选择地区" allowClear>
                  {filterOptions.regions?.map((region: string) => (
                    <Option key={region} value={region}>{region}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="状态" name="filter_status">
                <Select placeholder="请选择状态" allowClear>
                  {filterOptions.statuses?.map((status: string) => (
                    <Option key={status} value={status}>{status}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="时间范围" name="date_range">
                <RangePicker 
                  placeholder={['开始日期', '结束日期']}
                  style={{ width: '100%' }}
                  format="YYYY-MM-DD"
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider>互动数据筛选</Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="总互动数范围">
                <Input.Group compact>
                  <Form.Item name="min_interactions" noStyle>
                    <InputNumber placeholder="最小值" style={{ width: '50%' }} />
                  </Form.Item>
                  <Form.Item name="max_interactions" noStyle>
                    <InputNumber placeholder="最大值" style={{ width: '50%' }} />
                  </Form.Item>
                </Input.Group>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="表单线索范围">
                <Input.Group compact>
                  <Form.Item name="min_form_leads" noStyle>
                    <InputNumber placeholder="最小值" style={{ width: '50%' }} />
                  </Form.Item>
                  <Form.Item name="max_form_leads" noStyle>
                    <InputNumber placeholder="最大值" style={{ width: '50%' }} />
                  </Form.Item>
                </Input.Group>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="私信进线范围">
                <Input.Group compact>
                  <Form.Item name="min_private_message_leads" noStyle>
                    <InputNumber placeholder="最小值" style={{ width: '50%' }} />
                  </Form.Item>
                  <Form.Item name="max_private_message_leads" noStyle>
                    <InputNumber placeholder="最大值" style={{ width: '50%' }} />
                  </Form.Item>
                </Input.Group>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="私信开启范围">
                <Input.Group compact>
                  <Form.Item name="min_private_message_openings" noStyle>
                    <InputNumber placeholder="最小值" style={{ width: '50%' }} />
                  </Form.Item>
                  <Form.Item name="max_private_message_openings" noStyle>
                    <InputNumber placeholder="最大值" style={{ width: '50%' }} />
                  </Form.Item>
                </Input.Group>
              </Form.Item>
            </Col>
          </Row>

          <Divider>笔记数据筛选</Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="发布笔记数范围">
                <Input.Group compact>
                  <Form.Item name="min_published_notes_count" noStyle>
                    <InputNumber placeholder="最小值" style={{ width: '50%' }} />
                  </Form.Item>
                  <Form.Item name="max_published_notes_count" noStyle>
                    <InputNumber placeholder="最大值" style={{ width: '50%' }} />
                  </Form.Item>
                </Input.Group>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="推广笔记数范围">
                <Input.Group compact>
                  <Form.Item name="min_promoted_notes_count" noStyle>
                    <InputNumber placeholder="最小值" style={{ width: '50%' }} />
                  </Form.Item>
                  <Form.Item name="max_promoted_notes_count" noStyle>
                    <InputNumber placeholder="最大值" style={{ width: '50%' }} />
                  </Form.Item>
                </Input.Group>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="推广费用范围">
                <Input.Group compact>
                  <Form.Item name="min_notes_promotion_cost" noStyle>
                    <InputNumber placeholder="最小值" style={{ width: '50%' }} />
                  </Form.Item>
                  <Form.Item name="max_notes_promotion_cost" noStyle>
                    <InputNumber placeholder="最大值" style={{ width: '50%' }} />
                  </Form.Item>
                </Input.Group>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="笔记曝光数范围">
                <Input.Group compact>
                  <Form.Item name="min_notes_exposure_count" noStyle>
                    <InputNumber placeholder="最小值" style={{ width: '50%' }} />
                  </Form.Item>
                  <Form.Item name="max_notes_exposure_count" noStyle>
                    <InputNumber placeholder="最大值" style={{ width: '50%' }} />
                  </Form.Item>
                </Input.Group>
              </Form.Item>
            </Col>
          </Row>

          <Divider>响应数据筛选</Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="平均响应时间范围(秒)">
                <Input.Group compact>
                  <Form.Item name="min_response_time" noStyle>
                    <InputNumber placeholder="最小值" style={{ width: '50%' }} />
                  </Form.Item>
                  <Form.Item name="max_response_time" noStyle>
                    <InputNumber placeholder="最大值" style={{ width: '50%' }} />
                  </Form.Item>
                </Input.Group>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="用户评分范围">
                <Input.Group compact>
                  <Form.Item name="min_user_rating" noStyle>
                    <InputNumber placeholder="最小值" style={{ width: '50%' }} />
                  </Form.Item>
                  <Form.Item name="max_user_rating" noStyle>
                    <InputNumber placeholder="最大值" style={{ width: '50%' }} />
                  </Form.Item>
                </Input.Group>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="15秒响应评分范围">
                <Input.Group compact>
                  <Form.Item name="min_score_15s_response" noStyle>
                    <InputNumber placeholder="最小值" style={{ width: '50%' }} />
                  </Form.Item>
                  <Form.Item name="max_score_15s_response" noStyle>
                    <InputNumber placeholder="最大值" style={{ width: '50%' }} />
                  </Form.Item>
                </Input.Group>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="30秒响应评分范围">
                <Input.Group compact>
                  <Form.Item name="min_score_30s_response" noStyle>
                    <InputNumber placeholder="最小值" style={{ width: '50%' }} />
                  </Form.Item>
                  <Form.Item name="max_score_30s_response" noStyle>
                    <InputNumber placeholder="最大值" style={{ width: '50%' }} />
                  </Form.Item>
                </Input.Group>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="1分钟响应评分范围">
                <Input.Group compact>
                  <Form.Item name="min_score_1min_response" noStyle>
                    <InputNumber placeholder="最小值" style={{ width: '50%' }} />
                  </Form.Item>
                  <Form.Item name="max_score_1min_response" noStyle>
                    <InputNumber placeholder="最大值" style={{ width: '50%' }} />
                  </Form.Item>
                </Input.Group>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="平均响应评分范围">
                <Input.Group compact>
                  <Form.Item name="min_score_avg_response_time" noStyle>
                    <InputNumber placeholder="最小值" style={{ width: '50%' }} />
                  </Form.Item>
                  <Form.Item name="max_score_avg_response_time" noStyle>
                    <InputNumber placeholder="最大值" style={{ width: '50%' }} />
                  </Form.Item>
                </Input.Group>
              </Form.Item>
            </Col>
          </Row>

                  <div style={{ textAlign: 'right', marginTop: 16 }}>
                    <Space>
                      <Button onClick={() => setFilterModalVisible(false)}>取消</Button>
                      <Button type="primary" htmlType="submit">应用筛选</Button>
                    </Space>
                  </div>
                </Form>
      </Modal>

      {/* 黄牌筛选弹窗 */}
      <Modal
        title="黄牌筛选"
        open={yellowCardModalVisible}
        onCancel={() => setYellowCardModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={yellowCardForm}
          layout="vertical"
          onFinish={handleSaveYellowCardConditions}
          initialValues={{
            yellow_card_1min_timeout_rate: yellowCardConditions.yellow_card_timeout_rate,
            yellow_card_notes_count: yellowCardConditions.yellow_card_notes_count,
            yellow_card_min_private_message_leads: yellowCardConditions.yellow_card_min_private_message_leads,
            yellow_card_date_range: yellowCardConditions.yellow_card_start_date && yellowCardConditions.yellow_card_end_date ? [
              dayjs(yellowCardConditions.yellow_card_start_date),
              dayjs(yellowCardConditions.yellow_card_end_date)
            ] : undefined
          }}
          key={JSON.stringify(filters)} // 强制重新渲染表单
        >
          <div style={{ marginBottom: 16, padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px', fontSize: '13px' }}>
            <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>筛选逻辑：时间范围 AND ((超时率超标 AND 私信进线数达标) OR 笔记数不足)</div>
            <div style={{ color: '#666' }}>筛选出在指定时间范围内，且满足以下任一条件的员工：</div>
            <div style={{ color: '#666', marginTop: '4px' }}>1. 1小时超时回复率大于设定值 AND 私信进线数大于设定值</div>
            <div style={{ color: '#666' }}>2. 发布笔记数小于设定值</div>
          </div>


          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="1小时超时回复率大于(%)">
                <Form.Item name="yellow_card_1min_timeout_rate" noStyle>
                  <InputNumber 
                    placeholder="请输入百分比" 
                    style={{ width: '100%' }} 
                    min={0}
                    max={100}
                    precision={2}
                    addonAfter="%"
                  />
                </Form.Item>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="私信进线数大于">
                <Form.Item name="yellow_card_min_private_message_leads" noStyle>
                  <InputNumber 
                    placeholder="请输入数量" 
                    style={{ width: '100%' }} 
                    min={0}
                  />
                </Form.Item>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="发布笔记数小于">
                <Form.Item name="yellow_card_notes_count" noStyle>
                  <InputNumber 
                    placeholder="请输入数量" 
                    style={{ width: '100%' }} 
                    min={0}
                  />
                </Form.Item>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="黄牌时间范围" name="yellow_card_date_range">
                <RangePicker 
                  placeholder={['开始日期', '结束日期']}
                  style={{ width: '100%' }}
                  format="YYYY-MM-DD"
                />
              </Form.Item>
            </Col>
          </Row>

          <div style={{ textAlign: 'right', marginTop: 16 }}>
            <Space>
              <Button onClick={() => yellowCardForm.validateFields().then(handleSaveYellowCardConditions)}>
                保存设置
              </Button>
              <Button 
                type="primary" 
                onClick={() => yellowCardForm.validateFields().then(handleApplyYellowCardFilterAndSave)}
              >
                应用筛选
              </Button>
              <Dropdown
                menu={{
                  items: [
                    {
                      key: 'clear',
                      label: '清除保存的设置',
                      danger: true,
                      onClick: clearYellowCardConditions
                    }
                  ]
                }}
                placement="bottomRight"
              >
                <Button icon={<MoreOutlined />} />
              </Dropdown>
            </Space>
          </div>
        </Form>
      </Modal>

      {/* 笔记详情弹窗 */}
      <Modal
        title="笔记详情"
        open={notesModalVisible}
        onCancel={() => setNotesModalVisible(false)}
        footer={null}
        width={1200}
      >
        <Table
          columns={[
            {
              title: '笔记标题',
              dataIndex: 'note_title',
              key: 'note_title',
              render: (text: string) => (
                <Tooltip title={text}>
                  <div 
                    style={{ 
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {text}
                  </div>
                </Tooltip>
              )
            },
            {
              title: '发布时间',
              dataIndex: 'publish_time',
              key: 'publish_time',
              width: 150,
              render: (text: string) => text ? new Date(text).toLocaleString() : '-'
            },

            {
              title: '创作者',
              dataIndex: 'creator_name',
              key: 'creator_name',
              width: 120
            },
            {
              title: '总曝光',
              dataIndex: 'total_exposure_count',
              key: 'total_exposure_count',
              width: 100
            },
            {
              title: '总阅读',
              dataIndex: 'total_read_count',
              key: 'total_read_count',
              width: 100
            },
            {
              title: '总互动',
              dataIndex: 'total_interaction_count',
              key: 'total_interaction_count',
              width: 100
            },
            {
              title: '点赞数',
              dataIndex: 'like_count',
              key: 'like_count',
              width: 80
            },
            {
              title: '评论数',
              dataIndex: 'comment_count',
              key: 'comment_count',
              width: 80
            },
            {
              title: '收藏数',
              dataIndex: 'collect_count',
              key: 'collect_count',
              width: 80
            },
            {
              title: '分享数',
              dataIndex: 'share_count',
              key: 'share_count',
              width: 80
            },
            {
              title: '私信咨询',
              dataIndex: 'private_message_consultations',
              key: 'private_message_consultations',
              width: 100
            },
            {
              title: '私信开口',
              dataIndex: 'private_message_openings',
              key: 'private_message_openings',
              width: 100
            },
            {
              title: '私信留资',
              dataIndex: 'private_message_leads',
              key: 'private_message_leads',
              width: 100
            },
            {
              title: '表单留资',
              dataIndex: 'form_submissions',
              key: 'form_submissions',
              width: 100
            },
            {
              title: '操作',
              key: 'actions',
              width: 100,
              fixed: 'right',
              render: (record: EmployeeNotesData) => (
                <Space>
                  <Tooltip title="查看笔记链接">
                    <Button 
                      type="link" 
                      size="small"
                      onClick={() => handleClickNoteLink(record.note_link || '', record.note_title || '')}
                    >
                      查看链接
                    </Button>
                  </Tooltip>
                </Space>
              )
            }
          ]}
          dataSource={selectedEmployeeNotes}
          rowKey={(record, index) => record.id || `note_index_${index}`}
          loading={notesLoading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
          }}
          scroll={{ x: 'max-content', y: 400 }}
        />
      </Modal>

      {/* iframe弹窗 */}
      <Modal
        open={iframeModalVisible}
        onCancel={() => setIframeModalVisible(false)}
        footer={null}
        width="90vw"
        style={{ top: 20 }}
        bodyStyle={{ height: '80vh', padding: 0 }}
      >
        <iframe
          src={selectedNoteLink}
          style={{
            width: '100%',
            height: '100%',
            border: 'none'
          }}
          title="笔记链接"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
        />
      </Modal>

      {/* 批量下载弹窗 */}
      <Modal
        title="批量下载数据"
        open={downloadModalVisible}
        onCancel={() => setDownloadModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          form={downloadForm}
          layout="vertical"
          onFinish={handleBatchDownload}
        >
          <div style={{ marginBottom: 16, padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px', fontSize: '13px' }}>
            <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>下载说明：</div>
            <div style={{ color: '#666' }}>1. 将继承当前页面的所有筛选条件</div>
            <div style={{ color: '#666' }}>2. 可选择额外的时间范围进行进一步筛选</div>
            <div style={{ color: '#666' }}>3. 下载的数据将包含所有字段信息</div>
            <div style={{ color: '#666' }}>4. 文件名将包含时间戳和时间范围信息</div>
          </div>

          <Form.Item 
            label="时间范围筛选（可选）" 
            name="date_range"
            help="如果不选择时间范围，将使用当前筛选条件中的时间范围"
          >
            <RangePicker 
              placeholder={['开始日期', '结束日期']}
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
            />
          </Form.Item>

          <div style={{ textAlign: 'right', marginTop: 16 }}>
            <Space>
              <Button onClick={() => setDownloadModalVisible(false)}>
                取消
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={downloading}
              >
                {downloading ? '下载中...' : '确认下载'}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      {/* 批量上传弹窗 */}
      <UltimateImportModal
        visible={importModalVisible}
        onClose={() => setImportModalVisible(false)}
        onSuccess={handleImportSuccess}
      />
    </div>
  )
}

export default EmployeeSimpleJoin 