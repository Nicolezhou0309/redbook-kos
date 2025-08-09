import { createHash } from 'node:crypto'

export default async function handler(req, res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*')
    if (req.method === 'OPTIONS') return res.status(200).end()
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

    const communityRaw = String(req.query.community || '').trim()
    const split = String(req.query.split || '').toLowerCase() === '1' || String(req.query.split || '').toLowerCase() === 'true'
    const normalizeCommunityName = (name) => {
      const n = String(name || '').replace(/小红书专业号数据/g, '').trim()
      return n
    }
    const isUnmatched = (name) => /未匹配/.test(String(name || ''))
    const community = normalizeCommunityName(communityRaw) // 为空表示不过滤社区
    const debug = String(req.query.debug || '').toLowerCase() === '1' || String(req.query.debug || '').toLowerCase() === 'true'
    const maxParam = parseInt(String(req.query.max || '').trim(), 10)
    const pageSizeOverride = Number.isFinite(maxParam) && maxParam > 0 ? Math.min(maxParam, 5000) : undefined
    const filtersB64 = (req.query.filters || '')

    const filters = filtersB64 ? JSON.parse(Buffer.from(filtersB64, 'base64').toString('utf-8')) : {}

    const safe = (s) => String(s).replace(/[\\/:*?"<>|\n\r]/g, ' ').slice(0, 80)
    const toAsciiSlug = (s) => {
      return String(s)
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '') // 兼容重音
        .replace(/[^\x00-\x7F]/g, '') // 去除非 ASCII
        .replace(/[^A-Za-z0-9._-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80) || 'file'
    }
    const buildFileNameDisplay = (comm, filters) => {
      const datePart = (filters && filters.start_date && filters.end_date)
        ? `${filters.start_date}_${filters.end_date}`
        : new Date().toISOString().slice(0, 10)
      const nameComm = comm && comm.trim() !== '' ? safe(comm) : '全部'
      return `小红书员工号周报_${nameComm}_${datePart}.xlsx`
    }
    const buildObjectKey = (comm, filters) => {
      const datePart = (filters && filters.start_date && filters.end_date)
        ? `${filters.start_date}_${filters.end_date}`
        : new Date().toISOString().slice(0, 10)
      const nameComm = comm && comm.trim() !== '' ? comm : 'all'
      let namePart = toAsciiSlug(nameComm)
      if (!namePart) {
        const hash8 = createHash('sha1').update(String(nameComm), 'utf8').digest('hex').slice(0, 8)
        namePart = `c${hash8}`
      }
      return `weekly/xhsygh_${namePart}_${datePart}.xlsx`
    }

    // debug: 直接返回一个极简 Excel（同样使用优化后的文件名）
    if (debug) {
      const { default: ExcelJS } = await import('exceljs')
      const workbook = new ExcelJS.Workbook()
      const sheet = workbook.addWorksheet('周报')
      sheet.columns = [
        { header: '当前使用人', key: 'user', width: 14 },
        { header: '组长', key: 'manager', width: 12 }
      ]
      sheet.addRow({ user: '示例', manager: '张三' })
      const buffer = await workbook.xlsx.writeBuffer()
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(buildFileNameDisplay(community, {}))}"`)
      return res.status(200).send(Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer))
    }

    // 创建服务端 Supabase 客户端
    const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return res.status(500).json({ error: 'Missing SUPABASE_URL or service/anon key env' })
    }
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseSrv = createClient(SUPABASE_URL, SERVICE_KEY)

    const rpcParams = {
      search_query: filters.search_query || null,
      filter_employee_name: filters.filter_employee_name || null,
      filter_employee_uid: filters.filter_employee_uid || null,
      filter_xiaohongshu_nickname: filters.filter_xiaohongshu_nickname || null,
      filter_region: filters.filter_region || null,
      filter_status: filters.filter_status || null,
      time_range_remark: filters.time_range_remark || null,
      start_date: filters.start_date || null,
      end_date: filters.end_date || null,
      min_interactions: filters.min_interactions || null,
      max_interactions: filters.max_interactions || null,
      min_form_leads: filters.min_form_leads || null,
      max_form_leads: filters.max_form_leads || null,
      min_private_message_leads: filters.min_private_message_leads || null,
      max_private_message_leads: filters.max_private_message_leads || null,
      min_private_message_openings: filters.min_private_message_openings || null,
      max_private_message_openings: filters.max_private_message_openings || null,
      min_private_message_leads_kept: filters.min_private_message_leads_kept || null,
      max_private_message_leads_kept: filters.max_private_message_leads_kept || null,
      min_notes_exposure_count: filters.min_notes_exposure_count || null,
      max_notes_exposure_count: filters.max_notes_exposure_count || null,
      min_notes_click_count: filters.min_notes_click_count || null,
      max_notes_click_count: filters.max_notes_click_count || null,
      min_published_notes_count: filters.min_published_notes_count || null,
      max_published_notes_count: filters.max_published_notes_count || null,
      min_promoted_notes_count: filters.min_promoted_notes_count || null,
      max_promoted_notes_count: filters.max_promoted_notes_count || null,
      min_notes_promotion_cost: filters.min_notes_promotion_cost || null,
      max_notes_promotion_cost: filters.max_notes_promotion_cost || null,
      min_response_time: filters.min_response_time || null,
      max_response_time: filters.max_response_time || null,
      min_user_rating: filters.min_user_rating || null,
      max_user_rating: filters.max_user_rating || null,
      min_score_15s_response: filters.min_score_15s_response || null,
      max_score_15s_response: filters.max_score_15s_response || null,
      min_score_30s_response: filters.min_score_30s_response || null,
      max_score_30s_response: filters.max_score_30s_response || null,
      min_score_1min_response: filters.min_score_1min_response || null,
      max_score_1min_response: filters.max_score_1min_response || null,
      min_score_1hour_timeout: filters.min_score_1hour_timeout || null,
      max_score_1hour_timeout: filters.max_score_1hour_timeout || null,
      yellow_card_timeout_rate: filters.yellow_card_timeout_rate || null,
      yellow_card_notes_count: filters.yellow_card_notes_count || null,
      yellow_card_min_private_message_leads: filters.yellow_card_min_private_message_leads || null,
      yellow_card_start_date: filters.yellow_card_start_date || null,
      yellow_card_end_date: filters.yellow_card_end_date || null,
      sort_by: 'employee_name',
      sort_direction: 'asc',
      page_number: 1,
      page_size: pageSizeOverride || 10000,
    }

    const { data: joinData, error: joinErr } = await supabaseSrv.rpc('get_employee_join_data', rpcParams)
    if (joinErr) {
      return res.status(500).json({ error: `RPC失败: ${joinErr.message}` })
    }
    const allRows = Array.isArray(joinData) ? [...joinData] : []
    if (allRows.length > 0 && allRows[allRows.length - 1] && allRows[allRows.length - 1].total_count) allRows.pop()

    const { data: rosterData, error: rosterErr } = await supabaseSrv
      .from('employee_roster')
      .select('employee_name, manager, community')
    if (rosterErr) return res.status(500).json({ error: `花名册获取失败: ${rosterErr.message}` })
    const nameToRoster = new Map()
    for (const r of (rosterData || [])) {
      if (r.employee_name) {
        const key = String(r.employee_name).trim()
        if (!nameToRoster.has(key)) nameToRoster.set(key, r)
      }
    }

    const weeklyRows = allRows
      .map((rec) => {
        const rosterMatch = nameToRoster.get(String(rec.employee_name || '').trim())
        const manager = (rosterMatch && rosterMatch.manager) || ''
        const comm = (rosterMatch && rosterMatch.community) || '未匹配社区'

        let timeRangeText = '-'
        if (rec && rec.time_range) {
          const tr = rec.time_range
          if (tr.remark && String(tr.remark).trim() !== '') timeRangeText = tr.remark
          else if (tr.start_date && tr.end_date) timeRangeText = `${tr.start_date} ~ ${tr.end_date}`
        }
        const oneHourRate = (rec && rec.rate_1hour_timeout) || ''

        return {
          '当前使用人': rec.employee_name || '',
          '组长': manager,
          '社区': comm,
          '时间范围': timeRangeText,
          '1小时回复率': oneHourRate,
          '留资量': (rec && rec.total_private_message_leads_kept) || 0,
          '开口量': (rec && rec.total_private_message_openings) || 0,
          '发布量': (rec && rec.published_notes_count) || 0,
          '笔记曝光': (rec && rec.notes_exposure_count) || 0,
          '笔记点击': (rec && rec.notes_click_count) || 0,
          '违规状态': '',
        }
      })
      // 永久排除未匹配社区；若指定 community，则只保留该社区
      .filter((r) => r['社区'] && !isUnmatched(r['社区']) && (!community || r['社区'] === community))

    if (!weeklyRows.length) {
      return res.status(404).json({ error: '无该社区数据或均为未匹配社区，未返回记录' })
    }

    // split=1：按社区分文件导出（打包为 zip 返回）
    if (split) {
      const groups = new Map()
      for (const r of weeklyRows) {
        const comm = String(r['社区']).trim()
        if (!groups.has(comm)) groups.set(comm, [])
        groups.get(comm).push(r)
      }
      const { default: ExcelJS } = await import('exceljs')
      const { default: JSZip } = await import('jszip')
      const zip = new JSZip()
      for (const [comm, rows] of groups.entries()) {
        const wb = new ExcelJS.Workbook()
        const sh = wb.addWorksheet('周报')
        sh.columns = [
          { header: '当前使用人', key: 'user', width: 14 },
          { header: '组长', key: 'manager', width: 12 },
          { header: '社区', key: 'community', width: 12 },
          { header: '时间范围', key: 'range', width: 20 },
          { header: '1小时回复率', key: 'oneHourRate', width: 14 },
          { header: '留资量', key: 'leadsKept', width: 10 },
          { header: '开口量', key: 'openings', width: 10 },
          { header: '发布量', key: 'published', width: 10 },
          { header: '笔记曝光', key: 'exposure', width: 12 },
          { header: '笔记点击', key: 'clicks', width: 12 },
          { header: '违规状态', key: 'violation', width: 12 },
        ]
        for (const r of rows) {
          sh.addRow({
            user: r['当前使用人'] || '',
            manager: r['组长'] || '',
            community: r['社区'] || '',
            range: r['时间范围'] || '',
            oneHourRate: r['1小时回复率'] ?? r['1小时超时率'] ?? '',
            leadsKept: r['留资量'] ?? 0,
            openings: r['开口量'] ?? 0,
            published: r['发布量'] ?? 0,
            exposure: r['笔记曝光'] ?? 0,
            clicks: r['笔记点击'] ?? 0,
            violation: r['违规状态'] || '',
          })
        }
        const buf = await wb.xlsx.writeBuffer()
        zip.file(buildFileNameDisplay(comm, filters), Buffer.isBuffer(buf) ? buf : Buffer.from(buf))
      }
      const zipName = `员工周报_分社区_${(filters && filters.start_date && filters.end_date) ? `${filters.start_date}_${filters.end_date}` : new Date().toISOString().slice(0, 10)}.zip`
      const zipBuf = await zip.generateAsync({ type: 'nodebuffer' })
      res.setHeader('Content-Type', 'application/zip')
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(zipName)}"`)
      return res.status(200).send(zipBuf)
    }

    // 常规：单文件导出（全部或指定社区）
    const { default: ExcelJS } = await import('exceljs')
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('周报')
    sheet.columns = [
      { header: '当前使用人', key: 'user', width: 14 },
      { header: '组长', key: 'manager', width: 12 },
      { header: '社区', key: 'community', width: 12 },
      { header: '时间范围', key: 'range', width: 20 },
      { header: '1小时回复率', key: 'oneHourRate', width: 14 },
      { header: '留资量', key: 'leadsKept', width: 10 },
      { header: '开口量', key: 'openings', width: 10 },
      { header: '发布量', key: 'published', width: 10 },
      { header: '笔记曝光', key: 'exposure', width: 12 },
      { header: '笔记点击', key: 'clicks', width: 12 },
      { header: '违规状态', key: 'violation', width: 12 },
    ]
    for (const r of weeklyRows) {
      sheet.addRow({
        user: r['当前使用人'] || '',
        manager: r['组长'] || '',
        community: r['社区'] || '',
        range: r['时间范围'] || '',
        oneHourRate: r['1小时回复率'] ?? r['1小时超时率'] ?? '',
        leadsKept: r['留资量'] ?? 0,
        openings: r['开口量'] ?? 0,
        published: r['发布量'] ?? 0,
        exposure: r['笔记曝光'] ?? 0,
        clicks: r['笔记点击'] ?? 0,
        violation: r['违规状态'] || '',
      })
    }

    const persist = String(req.query.persist || '').toLowerCase() === '1' || String(req.query.persist || '').toLowerCase() === 'true'
    if (!persist) {
      const buffer = await workbook.xlsx.writeBuffer()
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(buildFileNameDisplay(community, filters))}"`)
      return res.status(200).send(Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer))
    }

    // 上传到 Supabase Storage
    const bucket = process.env.REPORTS_BUCKET || 'weekly-reports'
    try { await supabaseSrv.storage.createBucket(bucket, { public: true }) } catch {}
    const objectName = buildObjectKey(community, filters)
    const path = objectName

    const buffer = await workbook.xlsx.writeBuffer()
    const uploadRes = await supabaseSrv.storage.from(bucket).upload(path, Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer), {
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      upsert: true,
    })
    if (uploadRes.error) {
      return res.status(500).json({ error: `Upload failed: ${uploadRes.error.message}` })
    }

    let url = null
    try {
      const { data, error } = await supabaseSrv.storage.from(bucket).createSignedUrl(path, 60 * 60 * 24 * 7)
      if (error) throw error
      url = (data && data.signedUrl) || null
    } catch (_) {
      const { data } = supabaseSrv.storage.from(bucket).getPublicUrl(path)
      url = (data && data.publicUrl) || null
    }
    if (!url) return res.status(500).json({ error: 'Failed to generate download URL' })

    res.status(302).setHeader('Location', url)
    return res.end()
  } catch (e) {
    console.error('[weekly.js] error:', e)
    return res.status(500).json({ error: e instanceof Error ? e.message : 'Unknown error' })
  }
}


