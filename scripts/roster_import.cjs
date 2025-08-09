/* CommonJS 版本导入脚本 */
const fs = require('fs')
const path = require('path')
const XLSX = require('xlsx')
const dayjs = require('dayjs')

function excelSerialToISO(n) {
  // Excel(1900) 序列转 JS Date：序列 1 = 1899-12-31，通常基于 25569 差值
  if (typeof n !== 'number' || !isFinite(n)) return ''
  const epoch = (n - 25569) * 86400 * 1000
  const d = new Date(epoch)
  if (Number.isNaN(d.getTime())) return ''
  return dayjs(d).format('YYYY-MM-DD')
}

function normDateToISO(val) {
  if (!val && val !== 0) return ''
  if (val instanceof Date) {
    return dayjs(val).format('YYYY-MM-DD')
  }
  if (typeof val === 'number') {
    // 处理 Excel 日期序列
    const iso = excelSerialToISO(val)
    if (iso) return iso
  }
  // 尝试字符串解析
  const s = String(val).trim()
  if (!s) return ''
  const try1 = dayjs(s)
  if (try1.isValid()) return try1.format('YYYY-MM-DD')
  // 常见格式再试一次
  const try2 = dayjs(s, ['YYYY/M/D', 'YYYY-MM-DD', 'YYYY.MM.DD', 'M/D/YYYY'])
  if (try2.isValid()) return try2.format('YYYY-MM-DD')
  return ''
}

function main() {
  const projectRoot = path.resolve(__dirname, '..')
  const xlsxPath = path.resolve(projectRoot, 'public', '员工花名册.xlsx')
  if (!fs.existsSync(xlsxPath)) {
    console.error('未找到文件: ' + xlsxPath)
    process.exit(1)
  }

  const wb = XLSX.read(fs.readFileSync(xlsxPath), { cellDates: true })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true })
  if (!rows || rows.length < 2) {
    console.error('Excel 内容为空或缺少表头')
    process.exit(1)
  }

  const headers = rows[0].map(h => String(h || '').trim())
  const find = (names) => {
    for (const n of names) {
      const idx = headers.findIndex(h => h === n)
      if (idx >= 0) return idx
    }
    return -1
  }

  const idxName = find(['姓名', '员工姓名'])
  if (idxName < 0) {
    console.error('缺少必填列：姓名/员工姓名')
    process.exit(1)
  }
  const idxUid = find(['员工UID', 'UID'])
  const idxArea = find(['片区'])
  const idxCommunity = find(['社区'])
  const idxDept = find(['部门'])
  const idxPos = find(['岗位', '职务'])
  const idxManager = find(['直线经理'])
  const idxPhone = find(['电话', '手机号'])
  const idxEmail = find(['邮箱'])
  const idxHire = find(['入职日期'])
  const idxHirePeriod = find(['入职周期'])
  const idxStatus = find(['状态'])
  const idxRemark = find(['备注'])

  const out = []
  out.push([
    'employee_name',
    'employee_uid',
    'area',
    'community',
    'department',
    'position',
    'manager',
    'phone',
    'email',
    'hire_date',
    'hire_period',
    'status',
    'remark',
    'source_file_name',
    'extra_data'
  ].join(','))

  const q = (s) => '"' + String(s).replace(/"/g, '""') + '"'
  const qOrEmpty = (s) => (s === '' ? '' : q(s))

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r]
    if (!row || row.every(c => c == null || String(c).trim() === '')) continue

    const record = {}
    headers.forEach((h, i) => { record[h] = row[i] })

    const name = String(row[idxName] ?? '').trim()
    if (!name) continue

    const uid = idxUid >= 0 && row[idxUid] != null ? String(row[idxUid]).trim() : ''
    const area = idxArea >= 0 && row[idxArea] != null ? String(row[idxArea]).trim() : ''
    const community = idxCommunity >= 0 && row[idxCommunity] != null ? String(row[idxCommunity]).trim() : ''
    const dept = idxDept >= 0 && row[idxDept] != null ? String(row[idxDept]).trim() : ''
    const pos = idxPos >= 0 && row[idxPos] != null ? String(row[idxPos]).trim() : ''
    const manager = idxManager >= 0 && row[idxManager] != null ? String(row[idxManager]).trim() : ''
    const phone = idxPhone >= 0 && row[idxPhone] != null ? String(row[idxPhone]).trim() : ''
    const email = idxEmail >= 0 && row[idxEmail] != null ? String(row[idxEmail]).trim() : ''

    const hire = idxHire >= 0 ? normDateToISO(row[idxHire]) : ''
    const hirePeriod = idxHirePeriod >= 0 && row[idxHirePeriod] != null ? String(row[idxHirePeriod]).trim() : ''
    const status = idxStatus >= 0 && row[idxStatus] != null ? String(row[idxStatus]).trim() : ''
    const remark = idxRemark >= 0 && row[idxRemark] != null ? String(row[idxRemark]).trim() : ''

    const mappedSet = new Set(['姓名', '员工姓名', '员工UID', 'UID', '片区', '社区', '部门', '岗位', '职务', '直线经理', '电话', '手机号', '邮箱', '入职日期', '入职周期', '状态', '备注'])
    const extra = {}
    Object.entries(record).forEach(([k, v]) => {
      if (!mappedSet.has(k) && v != null && String(v).trim() !== '') {
        extra[k] = v
      }
    })

    const extraJson = JSON.stringify(extra)

    out.push([
      q(name),
      qOrEmpty(uid),
      qOrEmpty(area),
      qOrEmpty(community),
      qOrEmpty(dept),
      qOrEmpty(pos),
      qOrEmpty(manager),
      qOrEmpty(phone),
      qOrEmpty(email),
      qOrEmpty(hire),
      qOrEmpty(hirePeriod),
      qOrEmpty(status),
      qOrEmpty(remark),
      q(path.basename(xlsxPath)),
      q(extraJson)
    ].join(','))
  }

  const outPath = '/tmp/employee_roster_import.csv'
  fs.writeFileSync(outPath, out.join('\n'))
  console.log('已生成:', outPath)
}

main()
