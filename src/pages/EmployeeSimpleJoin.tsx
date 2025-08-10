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
import { downloadEmployeeSimpleJoinData as downloadExcelData, downloadWeeklyReportByCommunity, downloadWeeklyReportSplitFilesByCommunity } from '../utils/employeeExcelUtils'
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
  const [wecomPreviewVisible, setWecomPreviewVisible] = useState(false)
  const [, setWecomPreviewMessages] = useState<string[]>([])
  const [wecomHeader, setWecomHeader] = useState('')
  const [wecomLinkChunks, setWecomLinkChunks] = useState<string[]>([])
  const [wecomPreviewLoading, setWecomPreviewLoading] = useState(false)
  
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

  // 生成"违规状态"文本
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

        // 时间范围仅输出日期范围（忽略 remark）；无基础筛选日期时回退到黄牌日期范围
        let timeRangeText = '-'
        if (rec.time_range && rec.time_range.start_date && rec.time_range.end_date) {
          timeRangeText = `${rec.time_range.start_date} ~ ${rec.time_range.end_date}`
        } else if ((filters as any).start_date && (filters as any).end_date) {
          timeRangeText = `${(filters as any).start_date} ~ ${(filters as any).end_date}`
        } else if (yellowCardConditions.yellow_card_start_date && yellowCardConditions.yellow_card_end_date) {
          timeRangeText = `${yellowCardConditions.yellow_card_start_date} ~ ${yellowCardConditions.yellow_card_end_date}`
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

        // 时间范围仅输出日期范围（忽略 remark）；无基础筛选日期时回退到黄牌日期范围
        let timeRangeText = '-'
        if (rec.time_range && rec.time_range.start_date && rec.time_range.end_date) {
          timeRangeText = `${rec.time_range.start_date} ~ ${rec.time_range.end_date}`
        } else if ((filters as any).start_date && (filters as any).end_date) {
          timeRangeText = `${(filters as any).start_date} ~ ${(filters as any).end_date}`
        } else if (yellowCardConditions.yellow_card_start_date && yellowCardConditions.yellow_card_end_date) {
          timeRangeText = `${yellowCardConditions.yellow_card_start_date} ~ ${yellowCardConditions.yellow_card_end_date}`
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

  // 发送周报到企业微信（分社区：多链接 Markdown 消息）
  const handleSendWeeklyToWeCom = async () => {

    try {
      setSendingWeCom(true)

      // 名称处理：兼容页面文案与未匹配社区过滤
      const normalizeCommunityName = (name: string) => String(name || '').replace(/小红书专业号数据/g, '').trim()
      const isUnmatched = (name: string) => /未匹配/.test(String(name || ''))

      // 拉取全量数据，收集社区集合
      const fullResult = await downloadEmployeeSimpleJoinData(filters, sortField, sortOrder)
      if (!fullResult.success || !fullResult.data) {
        message.error(fullResult.error || '获取数据失败')
        return
      }

      // 花名册：姓名 -> 社区
      const roster = await employeeRosterApi.getAll()
      const nameToRoster = new Map<string, typeof roster[number]>()
      for (const r of roster) {
        if (r.employee_name) {
          const key = r.employee_name.trim()
          if (!nameToRoster.has(key)) nameToRoster.set(key, r)
        }
      }

      const communitySet = new Set<string>()
      for (const rec of fullResult.data) {
        const rosterMatch = nameToRoster.get((rec.employee_name || '').trim())
        const raw = rosterMatch?.community || '未匹配社区'
        const comm = normalizeCommunityName(raw)
        if (!comm || isUnmatched(comm)) continue
        communitySet.add(comm)
      }
      const communities = Array.from(communitySet)
      if (communities.length === 0) {
        message.info('没有可用的社区数据')
        return
      }

      // filters 携带黄牌设置
      const downloadFilters: any = { ...filters, yellow_card: { ...yellowCardConditions } }
      const filtersB64 = btoa(unescape(encodeURIComponent(JSON.stringify(downloadFilters))))

      const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/reports/weekly` : '/api/reports/weekly'
      const links = communities.map(comm => ({
        title: `${comm}小红书专业号数据`,
        url: `${baseUrl}?community=${encodeURIComponent(comm)}&filters=${encodeURIComponent(filtersB64)}&persist=1`
      }))

      // 统计每个社区：总账号数、本周违规数、违规率（仅统计当前筛选时间范围内的数据）
      type Stats = { total: number; violated: number }
      const statsByCommunity = new Map<string, Stats>()

      const inFilterRange = (rec: any): boolean => {
        const fs = (filters as any).start_date
        const fe = (filters as any).end_date
        if (!fs || !fe) return true
        const tr = (rec as any).time_range
        if (!tr || !tr.start_date || !tr.end_date) return false
        // 修复：与后端逻辑保持一致，检查时间范围是否完全包含筛选范围
        return tr.start_date <= fs && tr.end_date >= fe
      }

      const parseNumber = (v: any): number => {
        if (v == null) return 0
        if (typeof v === 'number') return v
        const s = String(v).replace('%', '').trim()
        const n = parseFloat(s)
        return Number.isFinite(n) ? n : 0
      }

      const isViolatedThisWeek = (rec: any): boolean => {
        if (!inFilterRange(rec)) return false
        const yc: any = yellowCardConditions || {}
        const hasYC = yc && (yc.yellow_card_timeout_rate != null || yc.yellow_card_notes_count != null || yc.yellow_card_min_private_message_leads != null)
        if (hasYC) {
          const timeoutRate = parseNumber(rec.rate_1hour_timeout)
          const leads = parseNumber((rec as any).total_private_message_leads ?? (rec as any).total_private_message_leads_kept)
          const publishedNotes = parseNumber(rec.published_notes_count)
          const cond1 = yc.yellow_card_timeout_rate != null && yc.yellow_card_min_private_message_leads != null
            ? (timeoutRate > parseNumber(yc.yellow_card_timeout_rate) && leads > parseNumber(yc.yellow_card_min_private_message_leads))
            : false
          const cond2 = yc.yellow_card_notes_count != null
            ? (publishedNotes < parseNumber(yc.yellow_card_notes_count))
            : false
          return cond1 || cond2
        }
        const y = Number((rec as any).current_yellow_cards || 0)
        const r = Number((rec as any).current_red_cards || 0)
        return (y > 0 || r > 0)
      }

      for (const rec of fullResult.data) {
        const rosterMatch2 = nameToRoster.get((rec.employee_name || '').trim())
        const raw2 = rosterMatch2?.community || '未匹配社区'
        const comm2 = normalizeCommunityName(raw2)
        if (!comm2 || isUnmatched(comm2)) continue
        if (!inFilterRange(rec)) continue
        if (!statsByCommunity.has(comm2)) statsByCommunity.set(comm2, { total: 0, violated: 0 })
        const s = statsByCommunity.get(comm2)!
        s.total += 1
        if (isViolatedThisWeek(rec)) s.violated += 1
      }

      // 组织文案：运营情况 + 下载链接
      const sortedComms = [...communities].sort((a, b) => a.localeCompare(b, 'zh-CN'))
      const overviewLines = sortedComms.map(comm => {
        const s = statsByCommunity.get(comm) || { total: 0, violated: 0 }
        const rate = s.total > 0 ? ((s.violated / s.total) * 100).toFixed(1) + '%' : '0%'
        return `${comm}：总账号数${s.total}个，违规${s.violated}个，违规率${rate}`
      }).join('\n')
      // 组装预览：可编辑头部 + 链接分段
      const chunkSize = 15
      const header = `本周小红书员工号运营情况：\n${overviewLines}`
      const linkChunks: string[] = []
      for (let i = 0; i < links.length; i += chunkSize) {
        const chunk = links.slice(i, i + chunkSize)
        const mdLines = chunk.map(({ title, url }) => `- [${title}](${url})`).join('\n')
        linkChunks.push(mdLines)
      }
      const messages = linkChunks.map(lines => `${header}\n\n周报数据下载：\n${lines}`)
      setWecomHeader(header)
      setWecomLinkChunks(linkChunks)
      setWecomPreviewMessages(messages)
      setWecomPreviewVisible(true)
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
      // 验证分页参数
      const validPage = Math.max(1, pagination?.current || 1)
      const validPageSize = [20, 50, 100].includes(pagination?.pageSize || 20) ? pagination.pageSize : 20
      
      // 添加详细的调试日志
      console.log('🚀 开始加载数据 ====================')
      console.log('🔍 筛选条件:', filters)
      console.log('📝 搜索查询:', searchQuery)
      console.log('📅 时间范围筛选:', timeRangeFilter)
      console.log('🔄 排序字段:', sortField, '排序方向:', sortOrder)
      console.log('📊 分页参数:', { page: validPage, pageSize: validPageSize })
      console.log('📊 当前分页状态:', pagination)
      
      const result = await getEmployeeSimpleJoinData(
        filters,
        sortField,
        sortOrder,
        { page: validPage, pageSize: validPageSize }
      )
      
      console.log('✅ API调用结果:', result)
      
      if (result.success) {
        // 确保数据是数组且每个元素都有必要的属性
        const safeData = (result.data || []).map((item: any, index: number) => {
          try {
            return {
              ...item,
              // 为每条记录生成一个真正唯一的内部ID，用于React key
              // 使用 index 确保即使数据完全相同也能区分
              _unique_id: `row_${index}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              // 保持原有的 employee_id，允许重复
              employee_id: item?.employee_id || `temp_${Date.now()}_${index}`,
              employee_uid: item?.employee_uid || `uid_${Date.now()}_${index}`,
              employee_name: item?.employee_name || '未知',
              status: item?.status || 'unknown',
              // 确保数值字段有默认值
              total_interactions: item?.total_interactions || 0,
              total_form_leads: item?.total_form_leads || 0,
              total_private_message_leads: item?.total_private_message_leads || 0,
              total_private_message_openings: item?.total_private_message_openings || 0,
              total_private_message_leads_kept: item?.total_private_message_leads_kept || 0,
              published_notes_count: item?.published_notes_count || 0,
              promoted_notes_count: item?.promoted_notes_count || 0,
              notes_promotion_cost: item?.notes_promotion_cost || 0,
              notes_exposure_count: item?.notes_exposure_count || 0,
              notes_click_count: item?.notes_click_count || 0,
              avg_response_time: item?.avg_response_time || 0,
              rate_1min_response: item?.rate_1min_response || '0%',
              rate_1hour_timeout: item?.rate_1hour_timeout || '0%'
            }
          } catch (itemError) {
            console.warn('处理数据项时出错:', itemError, item)
            return {
              _unique_id: `error_${index}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              employee_id: `error_${Date.now()}_${index}`,
              employee_uid: `error_uid_${Date.now()}_${index}`,
              employee_name: '数据错误',
              status: 'error'
            }
          }
        })

        // 允许 employee_id 重复，不进行去重处理
        const finalData = safeData
        
        console.log('📊 处理后的数据:', finalData)
        console.log('📊 数据总数:', result.total)
        
        // 更新数据和分页状态
        setData(finalData)
        setPagination(prev => ({
          ...prev,
          current: validPage,
          pageSize: validPageSize,
          total: result.total || 0
        }))
        
        // 数据加载后清除选择
        clearSelection()
        
        console.log('✅ 数据加载完成，共', finalData.length, '条记录')
      } else {
        console.error('❌ API调用失败:', result.error)
        message.error(result.error || '加载数据失败')
        setData([])
        setPagination(prev => ({ ...prev, total: 0 }))
        clearSelection()
      }
    } catch (error) {
      console.error('❌ 加载数据时发生错误:', error)
      message.error('加载数据时发生错误')
      setData([])
      setPagination(prev => ({ ...prev, total: 0 }))
      clearSelection()
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

  // 当筛选条件或排序变化时，重置分页并加载数据
  useEffect(() => {
    console.log('🔍 filters 状态变化:', filters)
    console.log('📊 当前分页状态:', pagination)
    
    // 重置分页到第一页
    setPagination(prev => ({ ...prev, current: 1 }))
    
    // 延迟加载数据，确保分页状态已更新
    setTimeout(() => {
      loadData()
    }, 0)
  }, [filters, sortField, sortOrder])
  
  // 当分页变化时加载数据（仅用于手动分页操作）
  useEffect(() => {
    // 避免在初始化时重复加载
    if (pagination.current > 1 || pagination.pageSize !== 20) {
      loadData()
    }
  }, [pagination.current, pagination.pageSize])

  // 处理搜索
  const handleSearch = (value: string) => {
    const searchStartTime = Date.now()
    const trimmedValue = value ? value.trim() : ''
    
    console.log('🔍 开始搜索操作 ====================')
    console.log('📝 搜索输入值:', value)
    console.log('🧹 清理后搜索值:', trimmedValue)
    console.log('⏰ 搜索开始时间:', new Date(searchStartTime).toLocaleString())
    console.log('📊 当前筛选条件:', filters)
    
    // 先更新搜索查询状态
    setSearchQuery(trimmedValue)
    
    // 更新筛选条件 - 统一使用 filter_employee_name 字段
    const newFilters = { ...filters }
    if (trimmedValue) {
      newFilters.filter_employee_name = trimmedValue
      // 清除旧的 search_query 字段，避免冲突
      delete newFilters.search_query
    } else {
      delete newFilters.filter_employee_name
    }
    
    console.log('🔄 新的筛选条件:', newFilters)
    
    // 应用新的筛选条件
    setFilters(newFilters)
    
    // 注意：分页重置现在由 useEffect 自动处理
    // 这样可以确保 filters 状态更新完成后再重置分页
    
    // 清除选择状态
    clearSelection()
  }

  // 处理时间范围筛选
  const handleTimeRangeChange = (dates: any) => {
    const filterStartTime = Date.now()
    
    console.log('📅 开始时间范围筛选操作 ====================')
    console.log('📅 选择的时间范围:', dates)
    console.log('⏰ 筛选开始时间:', new Date(filterStartTime).toLocaleString())
    console.log('📊 当前筛选条件:', filters)
    
    // 先更新时间范围状态
    setTimeRangeFilter(dates)
    
    // 更新筛选条件
    const newFilters = { ...filters }
    if (dates && dates[0] && dates[1]) {
      const startDate = dates[0].format('YYYY-MM-DD')
      const endDate = dates[1].format('YYYY-MM-DD')
      newFilters.start_date = startDate
      newFilters.end_date = endDate
    } else {
      delete newFilters.start_date
      delete newFilters.end_date
    }
    
    
    // 应用新的筛选条件
    setFilters(newFilters)
    
    // 注意：分页重置现在由 useEffect 自动处理
    
    // 清除选择状态
    clearSelection()
    
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
    const filterStartTime = Date.now()
    
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
      const startDate = values.yellow_card_date_range[0]?.format('YYYY-MM-DD')
      const endDate = values.yellow_card_date_range[1]?.format('YYYY-MM-DD')
      newFilters.yellow_card_start_date = startDate
      newFilters.yellow_card_end_date = endDate
    }


    // 先更新筛选条件
    setFilters(newFilters)
    
    // 重置分页到第一页
    setPagination(prev => ({ ...prev, current: 1 }))
    
    // 清除选择状态
    clearSelection()
    // 关闭弹窗
    setYellowCardModalVisible(false)
    
    // 显示成功消息
    message.success('黄牌筛选条件已应用')
    
    // 注意：不要在这里直接调用 loadData()，让 useEffect 自动处理
  }

  // 应用筛选并保存设置
  const handleApplyYellowCardFilterAndSave = async (values: any) => {
    // 先保存设置
    await handleSaveYellowCardConditions(values)
    // 再应用筛选
    handleApplyYellowCardFilter(values)
  }

  // 状态同步检查函数（用于调试）
  const logCurrentState = () => {
    console.log('=== 当前状态检查 ===')
    console.log('筛选条件:', filters)
    console.log('搜索查询:', searchQuery)
    console.log('时间范围:', timeRangeFilter)
    console.log('黄牌条件:', yellowCardConditions)
    console.log('排序字段:', sortField, '排序方向:', sortOrder)
    console.log('分页状态:', pagination)
    console.log('数据条数:', data.length)
    console.log('选择状态:', { selectedRowKeys, selectedRows: selectedRows.length })
    console.log('==================')
  }

  // 处理筛选
  const handleFilter = (values: any) => {
    const filterStartTime = Date.now()
    
    console.log('🔍 开始应用通用筛选条件 ====================')
    console.log('📝 筛选表单值:', values)
    console.log('⏰ 筛选开始时间:', new Date(filterStartTime).toLocaleString())
    console.log('📊 当前筛选条件:', filters)
    
    const newFilters: SimpleJoinFilterParams = {}
    
    // 基础筛选
    if (values.filter_employee_name) {
      newFilters.filter_employee_name = values.filter_employee_name
    }
    if (values.filter_employee_uid) {
      newFilters.filter_employee_uid = values.filter_employee_uid
    }
    if (values.filter_xiaohongshu_nickname) {
      newFilters.filter_xiaohongshu_nickname = values.filter_xiaohongshu_nickname
    }
    if (values.filter_region) {
      newFilters.filter_region = values.filter_region
    }
    if (values.filter_status) {
      newFilters.filter_status = values.filter_status
    }
    if (values.time_range_remark) {
      newFilters.time_range_remark = values.time_range_remark
    }
    if (values.date_range) {
      const startDate = values.date_range[0]?.format('YYYY-MM-DD')
      const endDate = values.date_range[1]?.format('YYYY-MM-DD')
      newFilters.start_date = startDate
      newFilters.end_date = endDate
    }

    // 数值范围筛选
    if (values.min_interactions !== undefined) {
      newFilters.min_interactions = values.min_interactions
    }
    if (values.max_interactions !== undefined) {
      newFilters.max_interactions = values.max_interactions
    }
    if (values.min_form_leads !== undefined) {
      newFilters.min_form_leads = values.min_form_leads
    }
    if (values.max_form_leads !== undefined) {
      newFilters.max_form_leads = values.max_form_leads
    }
    if (values.min_private_message_leads !== undefined) {
      newFilters.min_private_message_leads = values.min_private_message_leads
    }
    if (values.max_private_message_leads !== undefined) {
      newFilters.max_private_message_leads = values.max_private_message_leads
    }
    if (values.min_private_message_openings !== undefined) {
      newFilters.min_private_message_openings = values.min_private_message_openings
    }
    if (values.max_private_message_openings !== undefined) {
      newFilters.max_private_message_openings = values.max_private_message_openings
    }
    if (values.min_private_message_leads_kept !== undefined) {
      newFilters.min_private_message_leads_kept = values.min_private_message_leads_kept
    }
    if (values.max_private_message_leads_kept !== undefined) {
      newFilters.max_private_message_leads_kept = values.max_private_message_leads_kept
    }
    if (values.min_notes_exposure_count !== undefined) {
      newFilters.min_notes_exposure_count = values.min_notes_exposure_count
    }
    if (values.max_notes_exposure_count !== undefined) {
      newFilters.max_notes_exposure_count = values.max_notes_exposure_count
    }
    if (values.min_notes_click_count !== undefined) {
      newFilters.min_notes_click_count = values.min_notes_click_count
    }
    if (values.max_notes_click_count !== undefined) {
      newFilters.max_notes_click_count = values.max_notes_click_count
    }
    if (values.min_published_notes_count !== undefined) {
      newFilters.min_published_notes_count = values.min_published_notes_count
    }
    if (values.max_published_notes_count !== undefined) {
      newFilters.max_published_notes_count = values.max_published_notes_count
    }
    if (values.min_promoted_notes_count !== undefined) {
      newFilters.min_promoted_notes_count = values.min_promoted_notes_count
    }
    if (values.max_promoted_notes_count !== undefined) {
      newFilters.max_promoted_notes_count = values.max_promoted_notes_count
    }
    if (values.min_notes_promotion_cost !== undefined) {
      newFilters.min_notes_promotion_cost = values.min_notes_promotion_cost
    }
    if (values.max_notes_promotion_cost !== undefined) {
      newFilters.max_notes_promotion_cost = values.max_notes_promotion_cost
    }

    // 响应时间筛选
    if (values.min_response_time !== undefined) {
      newFilters.min_response_time = values.min_response_time
    }
    if (values.max_response_time !== undefined) {
      newFilters.max_response_time = values.max_response_time
    }
    if (values.min_user_rating !== undefined) {
      newFilters.min_user_rating = values.min_user_rating
    }
    if (values.max_user_rating !== undefined) {
      newFilters.max_user_rating = values.max_user_rating
    }
    if (values.min_score_15s_response !== undefined) {
      newFilters.min_score_15s_response = values.min_score_15s_response
    }
    if (values.max_score_15s_response !== undefined) {
      newFilters.max_score_15s_response = values.max_score_15s_response
    }
    if (values.min_score_30s_response !== undefined) {
      newFilters.min_score_30s_response = values.min_score_30s_response
    }
    if (values.max_score_30s_response !== undefined) {
      newFilters.max_score_30s_response = values.max_score_30s_response
    }
    if (values.min_score_1min_response !== undefined) {
      newFilters.min_score_1min_response = values.min_score_1min_response
    }
    if (values.max_score_1min_response !== undefined) {
      newFilters.max_score_1min_response = values.max_score_1min_response
    }
    if (values.min_score_1hour_timeout !== undefined) {
      newFilters.min_score_1hour_timeout = values.min_score_1hour_timeout
    }
    if (values.max_score_1hour_timeout !== undefined) {
      newFilters.max_score_1hour_timeout = values.max_score_1hour_timeout
      console.log('✅ 添加最大1小时超时评分筛选:', values.max_score_1hour_timeout)
    }
    if (values.min_score_avg_response_time !== undefined) {
      newFilters.min_score_avg_response_time = values.min_score_avg_response_time
      console.log('✅ 添加最小平均响应时间评分筛选:', values.min_score_avg_response_time)
    }
    if (values.max_score_avg_response_time !== undefined) {
      newFilters.max_score_avg_response_time = values.max_score_avg_response_time
      console.log('✅ 添加最大平均响应时间评分筛选:', values.max_score_avg_response_time)
    }

    // 先更新筛选条件
    setFilters(newFilters)
    
    // 重置分页到第一页
    setPagination(prev => ({ ...prev, current: 1 }))
    
    // 清除选择状态
    clearSelection()
    // 关闭弹窗
    setFilterModalVisible(false)
    // 显示成功消息
    message.success('筛选条件已应用')

    // 注意：不要在这里直接调用 loadData()，让 useEffect 自动处理
  }

  // 处理表格变化
  const handleTableChange = (_pagination: any, _filters: any, sorter: any) => {
    if (sorter.field) {
      const sortStartTime = Date.now()
      const newSortField = sorter.field
      const newSortOrder = sorter.order === 'ascend' ? 'asc' : 'desc'

      setSortField(newSortField)
      setSortOrder(newSortOrder)
    }
  }

  // 处理分页变化
  const handlePaginationChange = (page: number, pageSize: number) => {
    const paginationStartTime = Date.now()

    try {
      // 验证分页参数
      const validPage = Math.max(1, page || 1)
      const validPageSize = [20, 50, 100].includes(pageSize) ? pageSize : 20

      // 更新分页状态
      setPagination(prev => ({
        ...prev,
        current: validPage,
        pageSize: validPageSize
      }))
      // 清除选择状态，避免数据不匹配
      clearSelection()
    } catch (error) {
      console.error('分页切换时出错:', error)
      message.error('分页切换失败，请重试')
    }
  }

  // 重置筛选
  const resetFilters = () => {
    const resetStartTime = Date.now()
    // 清除所有筛选条件，黄牌判断条件独立管理
    setFilters({})
    setSearchQuery('')
    setTimeRangeFilter(null)
    setSortField('employee_name')
    setSortOrder('asc')
    
    // 重置分页到第一页
    setPagination(prev => ({ ...prev, current: 1 }))
    
    // 清除选择状态
    clearSelection()
    // 重置筛选表单（添加安全检查）
    try {
      if (form && typeof form.resetFields === 'function') {
        form.resetFields()
      }
    } catch (error) {
      console.warn('重置表单字段时出错:', error)
    }

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
          // 使用与表格 rowKey 相同的逻辑生成选择键
          const allKeys = data.map((record) => {
            if (record?._unique_id) {
              return record._unique_id
            }
            // 如果 _unique_id 不存在，使用组合字段生成唯一key
            const fallbackKey = `${record?.employee_id || 'unknown'}_${record?.employee_uid || 'unknown'}_${Math.random().toString(36).substr(2, 9)}`
            console.warn('记录缺少 _unique_id，使用备选方案:', record, '生成key:', fallbackKey)
            return fallbackKey
          })
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
          sorter: (a: any, b: any) => {
            const aVal = a?.employee_name || ''
            const bVal = b?.employee_name || ''
            return aVal.localeCompare(bVal)
          },
          fixed: 'left',
          render: (text: string) => <div>{text}</div>
        },
        {
          title: '状态',
          dataIndex: 'status',
          key: 'status',
          width: 70,
          sorter: (a: any, b: any) => {
            const aVal = a?.status || ''
            const bVal = b?.status || ''
            return aVal.localeCompare(bVal)
          },
          fixed: 'left',
          render: (text: string) => (
            <Tag color={text === 'active' ? 'green' : 'red'} style={{ textAlign: 'center', display: 'inline-block' }}>{text}</Tag>
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
                <Tag color={yellowCardStatus.color} style={{ display: 'inline-block', textAlign: 'center' }}>
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
          sorter: (a: any, b: any) => {
            const aVal = a?.xiaohongshu_nickname || ''
            const bVal = b?.xiaohongshu_nickname || ''
            return aVal.localeCompare(bVal)
          },
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
          sorter: (a: any, b: any) => {
            const aVal = a?.xiaohongshu_account_id || ''
            const bVal = b?.xiaohongshu_account_id || ''
            return aVal.localeCompare(bVal)
          },
          render: (text: string) => <div style={{ fontSize: '12px', color: '#666' }}>{text}</div>
        },
        {
          title: '激活时间',
          dataIndex: 'activation_time',
          key: 'activation_time',
          width: 120,
          sorter: (a: any, b: any) => {
            const aVal = a?.activation_time ? new Date(a.activation_time).getTime() : 0
            const bVal = b?.activation_time ? new Date(b.activation_time).getTime() : 0
            return aVal - bVal
          },
          render: (text: string) => text ? new Date(text).toLocaleDateString() : '-'
        },
        {
          title: '互动时间范围',
          dataIndex: 'time_range',
          key: 'time_range',
          width: 150,
          render: (timeRange: any) => {
            if (!timeRange) return '-'
            
            const hasRemark = Boolean(timeRange.remark && timeRange.remark.trim() !== '')
            const hasDates = Boolean(timeRange.start_date && timeRange.end_date)

            if (hasRemark && hasDates) {
              const startDate = new Date(timeRange.start_date).toLocaleDateString()
              const endDate = new Date(timeRange.end_date).toLocaleDateString()
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                  <Tooltip title={`${timeRange.remark}\n开始: ${timeRange.start_date}\n结束: ${timeRange.end_date}`}>
                    <Tag color="blue">{timeRange.remark}</Tag>
                  </Tooltip>
                  <Tooltip title={`开始: ${timeRange.start_date}\n结束: ${timeRange.end_date}`}>
                    <Tag color="blue">{startDate} ~ {endDate}</Tag>
                  </Tooltip>
                </div>
              )
            }

            if (hasRemark) {
              return (
                <Tooltip title={`${timeRange.remark}${hasDates ? `\n开始: ${timeRange.start_date}\n结束: ${timeRange.end_date}` : ''}`}>
                  <Tag color="blue">{timeRange.remark}</Tag>
                </Tooltip>
              )
            }

            if (hasDates) {
              const startDate = new Date(timeRange.start_date).toLocaleDateString()
              const endDate = new Date(timeRange.end_date).toLocaleDateString()
              return (
                <Tooltip title={`开始: ${timeRange.start_date}\n结束: ${timeRange.end_date}`}>
                  <Tag color="blue">{startDate} ~ {endDate}</Tag>
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
          sorter: (a: any, b: any) => {
            const aVal = a?.total_interactions || 0
            const bVal = b?.total_interactions || 0
            return aVal - bVal
          },
          render: (value: number) => <div>{value}</div>
        },
        {
          title: '表单留资',
          dataIndex: 'total_form_leads',
          key: 'total_form_leads',
          width: 100,
          sorter: (a: any, b: any) => {
            const aVal = a?.total_form_leads || 0
            const bVal = b?.total_form_leads || 0
            return aVal - bVal
          },
          render: (value: number) => <div>{value}</div>
        },
        {
          title: '私信进线',
          dataIndex: 'total_private_message_leads',
          key: 'total_private_message_leads',
          width: 100,
          sorter: (a: any, b: any) => {
            const aVal = a?.total_private_message_leads || 0
            const bVal = b?.total_private_message_leads || 0
            return aVal - bVal
          },
          render: (value: number) => <div>{value || 0}</div>
        },
        {
          title: '私信开口',
          dataIndex: 'total_private_message_openings',
          key: 'total_private_message_openings',
          width: 100,
          sorter: (a: any, b: any) => {
            const aVal = a?.total_private_message_openings || 0
            const bVal = b?.total_private_message_openings || 0
            return aVal - bVal
          },
          render: (value: number) => <div>{value}</div>
        },
        {
          title: '私信留资',
          dataIndex: 'total_private_message_leads_kept',
          key: 'total_private_message_leads_kept',
          width: 100,
          sorter: (a: any, b: any) => {
            const aVal = a?.total_private_message_leads_kept || 0
            const bVal = b?.total_private_message_leads_kept || 0
            return aVal - bVal
          },
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
          sorter: (a: any, b: any) => {
            const aVal = a?.published_notes_count || 0
            const bVal = b?.published_notes_count || 0
            return aVal - bVal
          },
          render: (value: number) => <div>{value}</div>
        },
        {
          title: '推广笔记',
          dataIndex: 'promoted_notes_count',
          key: 'promoted_notes_count',
          width: 100,
          sorter: (a: any, b: any) => {
            const aVal = a?.promoted_notes_count || 0
            const bVal = b?.promoted_notes_count || 0
            return aVal - bVal
          },
          render: (value: number) => <div>{value}</div>
        },
        {
          title: '推广费用',
          dataIndex: 'notes_promotion_cost',
          key: 'notes_promotion_cost',
          width: 100,
          sorter: (a: any, b: any) => {
            const aVal = a?.notes_promotion_cost || 0
            const bVal = b?.notes_promotion_cost || 0
            return aVal - bVal
          },
          render: (value: number) => <div>¥{value?.toFixed(2) || '0.00'}</div>
        },
        {
          title: '笔记曝光',
          dataIndex: 'notes_exposure_count',
          key: 'notes_exposure_count',
          width: 100,
          sorter: (a: any, b: any) => {
            const aVal = a?.notes_exposure_count || 0
            const bVal = b?.notes_exposure_count || 0
            return aVal - bVal
          },
          render: (value: number) => <div>{value}</div>
        },
        {
          title: '笔记点击',
          dataIndex: 'notes_click_count',
          key: 'notes_click_count',
          width: 100,
          sorter: (a: any, b: any) => {
            const aVal = a?.notes_click_count || 0
            const bVal = b?.notes_click_count || 0
            return aVal - bVal
          },
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
          sorter: (a: any, b: any) => {
            const aVal = a?.avg_response_time || 0
            const bVal = b?.avg_response_time || 0
            return aVal - bVal
          },
          render: (value: number) => <div>{value?.toFixed(1) || '0'}秒</div>
        },
        {
          title: '1分钟响应率',
          dataIndex: 'rate_1min_response',
          key: 'rate_1min_response',
          width: 100,
          sorter: (a: any, b: any) => {
            const aVal = parseFloat(a?.rate_1min_response?.replace('%', '') || '0')
            const bVal = parseFloat(b?.rate_1min_response?.replace('%', '') || '0')
            return aVal - bVal
          },
          render: (text: string) => <div>{text}</div>
        },
        {
          title: '1小时超时率',
          dataIndex: 'rate_1hour_timeout',
          key: 'rate_1hour_timeout',
          width: 100,
          sorter: (a: any, b: any) => {
            const aVal = parseFloat(a?.rate_1hour_timeout?.replace('%', '') || '0')
            const bVal = parseFloat(b?.rate_1hour_timeout?.replace('%', '') || '0')
            return aVal - bVal
          },
          render: (text: string) => <div>{text}</div>
        },
        {
          title: '响应时间范围',
          dataIndex: 'response_time_range',
          key: 'response_time_range',
          width: 150,
          render: (responseTimeRange: any) => {
            if (!responseTimeRange) return '-'
            
            const hasRemark = Boolean(responseTimeRange.remark && responseTimeRange.remark.trim() !== '')
            const hasDates = Boolean(responseTimeRange.start_date && responseTimeRange.end_date)

            if (hasRemark && hasDates) {
              const startDate = new Date(responseTimeRange.start_date).toLocaleDateString()
              const endDate = new Date(responseTimeRange.end_date).toLocaleDateString()
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                  <Tooltip title={`${responseTimeRange.remark}\n开始: ${responseTimeRange.start_date}\n结束: ${responseTimeRange.end_date}`}>
                    <Tag color="orange">{responseTimeRange.remark}</Tag>
                  </Tooltip>
                  <Tooltip title={`开始: ${responseTimeRange.start_date}\n结束: ${responseTimeRange.end_date}`}>
                    <Tag color="orange">{startDate} ~ {endDate}</Tag>
                  </Tooltip>
                </div>
              )
            }

            if (hasRemark) {
              return (
                <Tooltip title={`${responseTimeRange.remark}${hasDates ? `\n开始: ${responseTimeRange.start_date}\n结束: ${responseTimeRange.end_date}` : ''}`}>
                  <Tag color="orange">{responseTimeRange.remark}</Tag>
                </Tooltip>
              )
            }

            if (hasDates) {
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
                {/* 调试按钮 - 仅在开发环境显示 */}
                {process.env.NODE_ENV === 'development' && (
                  <Button 
                    type="dashed" 
                    size="small"
                    onClick={logCurrentState}
                    title="检查当前状态（开发调试用）"
                  >
                    状态检查
                  </Button>
                )}
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
          dataSource={data || []}
          rowKey={(record) => {
            try {
              // 优先使用生成的唯一内部ID作为行键
              if (record?._unique_id) {
                return record._unique_id
              }
              // 如果 _unique_id 不存在，使用组合字段生成唯一key
              const fallbackKey = `${record?.employee_id || 'unknown'}_${record?.employee_uid || 'unknown'}_${Math.random().toString(36).substr(2, 9)}`
              console.warn('记录缺少 _unique_id，使用备选方案:', record, '生成key:', fallbackKey)
              return fallbackKey
            } catch (error) {
              console.warn('生成行键时出错:', error, record)
              return `error_${Math.random().toString(36).substr(2, 9)}`
            }
          }}
          loading={loading}
          size="small"
          pagination={false}
          onChange={handleTableChange}
          scroll={{ x: 2900, y: 600 }}
          sticky={{ offsetHeader: 0 }}
          rowSelection={rowSelection}
          locale={{
            emptyText: '暂无数据',
            triggerDesc: '点击降序',
            triggerAsc: '点击升序',
            cancelSort: '取消排序'
          }}
        />

        {/* 分页 */}
        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <Pagination
            current={pagination?.current || 1}
            pageSize={pagination?.pageSize || 20}
            total={pagination?.total || 0}
            showSizeChanger
            showQuickJumper
            pageSizeOptions={['20', '50', '100']}
            showTotal={(total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`}
            onChange={handlePaginationChange}
            onShowSizeChange={handlePaginationChange}
          />
        </div>
      </Card>

      {/* 企业微信发送前预览弹窗 */}
      <Modal
        title="发送到企业微信 - 二次确认"
        open={wecomPreviewVisible}
        onCancel={() => setWecomPreviewVisible(false)}
        onOk={async () => {
          if (wecomPreviewLoading) return
      const SEND_URL = `/api/wecom/webhook-send`
          try {
            setWecomPreviewLoading(true)
            let sent = 0
            // 发送时，用当前 header 与每段链接组合，确保用户编辑后的头部生效
            const messagesToSend = wecomLinkChunks.map(lines => `${wecomHeader}\n\n周报数据下载：\n${lines}`)
            for (const content of messagesToSend) {
              const sendResp = await fetch(SEND_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
              // key 从服务端环境变量"社区员工号周报wehook"读取
              body: JSON.stringify({ msgtype: 'markdown', markdown: { content } })
              })
              if (!sendResp.ok) continue
              const sendData = await sendResp.json()
              if (sendData.errcode === 0) sent++
            }
            setWecomPreviewVisible(false)
            if (sent > 0) message.success(`企业微信已发送 ${sent} 条消息（共 ${wecomLinkChunks.length} 条）`)
            else message.error('发送失败，请检查Webhook配置')
          } catch (e) {
            console.error(e)
            message.error('发送到企业微信失败')
          } finally {
            setWecomPreviewLoading(false)
          }
        }}
        okText={wecomPreviewLoading ? '发送中...' : '确认发送'}
        okButtonProps={{ loading: wecomPreviewLoading }}
        width={800}
      >
        <div style={{ maxHeight: 420, overflow: 'auto' }}>
          <div style={{ marginBottom: 12, color: '#999' }}>可编辑以下"统计概览"部分；下方链接列表不支持编辑。</div>
          <Input.TextArea
            value={wecomHeader}
            onChange={(e) => setWecomHeader(e.target.value)}
            autoSize={{ minRows: 4, maxRows: 8 }}
            style={{ fontFamily: 'monospace' }}
          />
          {wecomLinkChunks.map((lines, idx) => (
            <div key={idx} style={{ marginTop: 16 }}>
              <div style={{ color: '#999', marginBottom: 6 }}>第 {idx + 1} 条消息 - 链接预览</div>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: 13 }}>{`周报数据下载：\n${lines}`}</pre>
            </div>
          ))}
          {wecomLinkChunks.length === 0 && <div>暂无内容</div>}
        </div>
      </Modal>

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
            // 确保搜索查询和筛选表单同步
            filter_employee_name: filters.filter_employee_name || searchQuery,
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
          rowKey={(record) => record.id || `note_${record.note_id || Math.random()}`}
          loading={notesLoading}
          size="small"
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
        styles={{ body: { height: '80vh', padding: 0 } }}
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