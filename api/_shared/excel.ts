import * as XLSX from 'xlsx'
import dayjs from 'dayjs'

export function buildWeeklyReportOneFile(
  weeklyRows: Array<Record<string, any>>,
  options?: { start_date?: string; end_date?: string }
): { fileName: string; arrayBuffer: ArrayBuffer } {
  const groups = new Map<string, Record<string, any>[]>()
  for (const row of weeklyRows) {
    const community = (row['社区'] && String(row['社区']).trim()) || '未匹配社区'
    if (!groups.has(community)) groups.set(community, [])
    groups.get(community)!.push(row)
  }

  // 仅生成单工作表（调用方在传入时已经筛选出某社区）
  const workbook = XLSX.utils.book_new()
  const orderedRows = weeklyRows.map((r) => ({
    '当前使用人': r['当前使用人'] || '',
    '组长': r['组长'] || '',
    '社区': r['社区'] || '',
    '时间范围': r['时间范围'] || '',
    '1小时回复率': r['1小时回复率'] ?? r['1小时超时率'] ?? '',
    '留资量': r['留资量'] ?? 0,
    '开口量': r['开口量'] ?? 0,
    '发布量': r['发布量'] ?? 0,
    '笔记曝光': r['笔记曝光'] ?? 0,
    '笔记点击': r['笔记点击'] ?? 0,
    '违规状态': r['违规状态'] || '',
  }))

  const worksheet = XLSX.utils.json_to_sheet(orderedRows)
  worksheet['!cols'] = [
    { wch: 14 },
    { wch: 12 },
    { wch: 12 },
    { wch: 20 },
    { wch: 14 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
  ]
  XLSX.utils.book_append_sheet(workbook, worksheet, '周报')

  let fileName = `员工周报_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}`
  if (options?.start_date && options?.end_date) fileName += `_${options.start_date}_${options.end_date}`
  fileName += '.xlsx'

  const arrayBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  return { fileName, arrayBuffer }
}


