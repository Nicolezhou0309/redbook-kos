/*
  将 public/员工花名册.xlsx 解析为 /tmp/employee_roster_import.csv
  列映射：姓名/员工姓名 -> employee_name（必填）
          员工UID/UID -> employee_uid（可空）
          部门 -> department
          岗位/职务 -> position
          电话/手机号 -> phone
          邮箱 -> email
          入职日期 -> hire_date (YYYY-MM-DD)
          状态 -> status
          备注 -> remark
          source_file_name 自动写入文件名
*/
const fs = require('fs')
const path = require('path')
const XLSX = require('xlsx')
const dayjs = require('dayjs')

function main() {
  const projectRoot = path.resolve(__dirname, '..')
  const xlsxPath = path.resolve(projectRoot, 'public', '员工花名册.xlsx')
  if (!fs.existsSync(xlsxPath)) {
    console.error('未找到文件: ' + xlsxPath)
    process.exit(1)
  }

  const wb = XLSX.read(fs.readFileSync(xlsxPath))
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 })
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
  const idxDept = find(['部门'])
  const idxPos = find(['岗位', '职务'])
  const idxPhone = find(['电话', '手机号'])
  const idxEmail = find(['邮箱'])
  const idxHire = find(['入职日期'])
  const idxStatus = find(['状态'])
  const idxRemark = find(['备注'])

  const out = []
  out.push([
    'employee_name',
    'employee_uid',
    'department',
    'position',
    'phone',
    'email',
    'hire_date',
    'status',
    'remark',
    'source_file_name'
  ].join(','))

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r]
    if (!row || row.every(c => c == null || String(c).trim() === '')) continue
    const name = String(row[idxName] ?? '').trim()
    if (!name) continue

    const uid = idxUid >= 0 && row[idxUid] != null ? String(row[idxUid]).trim() : ''
    const dept = idxDept >= 0 && row[idxDept] != null ? String(row[idxDept]).trim() : ''
    const pos = idxPos >= 0 && row[idxPos] != null ? String(row[idxPos]).trim() : ''
    const phone = idxPhone >= 0 && row[idxPhone] != null ? String(row[idxPhone]).trim() : ''
    const email = idxEmail >= 0 && row[idxEmail] != null ? String(row[idxEmail]).trim() : ''
    let hire = ''
    if (idxHire >= 0 && row[idxHire]) {
      const d = dayjs(row[idxHire])
      hire = d.isValid() ? d.format('YYYY-MM-DD') : ''
    }
    const status = idxStatus >= 0 && row[idxStatus] != null ? String(row[idxStatus]).trim() : ''
    const remark = idxRemark >= 0 && row[idxRemark] != null ? String(row[idxRemark]).trim() : ''

    const esc = (s) => '"' + String(s).replace(/"/g, '""') + '"'
    out.push([
      esc(name),
      esc(uid),
      esc(dept),
      esc(pos),
      esc(phone),
      esc(email),
      esc(hire),
      esc(status),
      esc(remark),
      esc(path.basename(xlsxPath))
    ].join(','))
  }

  const outPath = '/tmp/employee_roster_import.csv'
  fs.writeFileSync(outPath, out.join('\n'))
  console.log('已生成:', outPath)
}

main()


