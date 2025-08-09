import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*')
    if (req.method === 'OPTIONS') return res.status(200).end()
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

    const simple = String(req.query.simple || '').toLowerCase() === '1'
    if (simple) {
      return res.status(200).json({ ok: true, now: new Date().toISOString() })
    }

    const { default: ExcelJS } = await import('exceljs')
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Sheet1')
    sheet.columns = [
      { header: 'A', key: 'a', width: 10 },
      { header: 'B', key: 'b', width: 10 }
    ]
    sheet.addRow({ a: 'hello', b: 'world' })
    const buffer = await workbook.xlsx.writeBuffer()

    const fileName = `debug_${Date.now()}.xlsx`
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`)
    return res.status(200).send(Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer))
  } catch (e) {
    console.error('[weekly_debug] error:', e)
    return res.status(500).json({ error: e instanceof Error ? e.message : 'Unknown error' })
  }
}


