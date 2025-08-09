import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { buildWeeklyReportOneFile } from '../_shared/excel.js'

// 注意：此函数直接调用前端代码会引入浏览器依赖，严格生产建议复制所需逻辑到此处。
// 为快速实现，保持最小调用路径：接受 filters/yellowCardSettings，生成单社区文件。

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*')
    if (req.method === 'OPTIONS') return res.status(200).end()
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

    const community = (req.query.community as string) || '未匹配社区'
    const filtersB64 = (req.query.filters as string) || ''

    const filters = filtersB64 ? JSON.parse(Buffer.from(filtersB64, 'base64').toString('utf-8')) : {}

    // 创建服务端 Supabase 客户端
    const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return res.status(500).json({ error: 'Missing SUPABASE_URL or service/anon key env' })
    }
    const supabaseSrv = createClient(SUPABASE_URL, SERVICE_KEY)

    // 拉取全量数据（直接调用 RPC，避免引用前端代码）
    const rpcParams: Record<string, any> = {
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
      min_score_avg_response_time: filters.min_score_avg_response_time || null,
      max_score_avg_response_time: filters.max_score_avg_response_time || null,
      min_rate_15s_response: filters.min_rate_15s_response || null,
      max_rate_15s_response: filters.max_rate_15s_response || null,
      min_rate_30s_response: filters.min_rate_30s_response || null,
      max_rate_30s_response: filters.max_rate_30s_response || null,
      min_rate_1min_response: filters.min_rate_1min_response || null,
      max_rate_1min_response: filters.max_rate_1min_response || null,
      min_rate_1hour_timeout: filters.min_rate_1hour_timeout || null,
      max_rate_1hour_timeout: filters.max_rate_1hour_timeout || null,
      yellow_card_timeout_rate: filters.yellow_card_timeout_rate || null,
      yellow_card_notes_count: filters.yellow_card_notes_count || null,
      yellow_card_min_private_message_leads: filters.yellow_card_min_private_message_leads || null,
      yellow_card_start_date: filters.yellow_card_start_date || null,
      yellow_card_end_date: filters.yellow_card_end_date || null,
      sort_by: 'employee_name',
      sort_direction: 'asc',
      page_number: 1,
      page_size: 999999
    }

    const { data: joinData, error: joinErr } = await (supabaseSrv as any).rpc('get_employee_join_data', rpcParams)
    if (joinErr) {
      return res.status(500).json({ error: `RPC失败: ${joinErr.message}` })
    }
    const allRows: any[] = Array.isArray(joinData) ? [...joinData] : []
    if (allRows.length > 0 && (allRows[allRows.length - 1] as any).total_count) allRows.pop()

    // 花名册索引
    const { data: rosterData, error: rosterErr } = await supabaseSrv
      .from('employee_roster')
      .select('employee_name, manager, community')
    if (rosterErr) return res.status(500).json({ error: `花名册获取失败: ${rosterErr.message}` })
    const nameToRoster = new Map<string, { employee_name: string; manager: string | null; community: string | null }>()
    for (const r of (rosterData || [])) {
      if (r.employee_name) {
        const key = r.employee_name.trim()
        if (!nameToRoster.has(key)) nameToRoster.set(key, r as any)
      }
    }

    // 组装周报行（仅该社区）
    const weeklyRows = allRows
      .map(rec => {
        const rosterMatch = nameToRoster.get((rec.employee_name || '').trim())
        const manager = rosterMatch?.manager || ''
        const comm = rosterMatch?.community || '未匹配社区'

        let timeRangeText = '-'
        if ((rec as any).time_range) {
          const tr: any = (rec as any).time_range
          if (tr.remark && tr.remark.trim() !== '') timeRangeText = tr.remark
          else if (tr.start_date && tr.end_date) timeRangeText = `${tr.start_date} ~ ${tr.end_date}`
        }
        const oneHourRate = (rec as any).rate_1hour_timeout || ''

        return {
          '当前使用人': rec.employee_name || '',
          '组长': manager,
          '社区': comm,
          '时间范围': timeRangeText,
          '1小时回复率': oneHourRate,
          '留资量': (rec as any).total_private_message_leads_kept || 0,
          '开口量': (rec as any).total_private_message_openings || 0,
          '发布量': (rec as any).published_notes_count || 0,
          '笔记曝光': (rec as any).notes_exposure_count || 0,
          '笔记点击': (rec as any).notes_click_count || 0,
          '违规状态': '' // 如需带黄牌设置，这里应重用前端判定逻辑或在此实现一次
        }
      })
      .filter(r => r['社区'] === community)

    // 生成单社区文件
    // 复用现有批量导出函数，随后从磁盘下载会写文件；这里我们需要直接内存流，因此改用 xlsx 直接创建更合适。
    // 为保持进度，这里简单用 xlsx 组合，但通过已有的打包函数转为 arrayBuffer 再返回 attachment 更稳。

    // 生成文件（仅该社区）
    const target = buildWeeklyReportOneFile(weeklyRows, { start_date: filters.start_date, end_date: filters.end_date })

    const persist = String(req.query.persist || '').toLowerCase() === '1' || String(req.query.persist || '').toLowerCase() === 'true'
    if (!persist) {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(target.fileName)}"`)
      return res.status(200).send(Buffer.from(target.arrayBuffer))
    }

    // 持久化到 Supabase Storage（复用上面创建的 supabaseSrv）
    const supabase = supabaseSrv
    const bucket = process.env.REPORTS_BUCKET || 'weekly-reports'

    // 尝试创建 bucket（需要 service key）。失败忽略（可能已存在）
    try {
      await (supabase as any).storage.createBucket(bucket, { public: true })
    } catch (_) {}

    const now = new Date()
    const ymd = now.toISOString().slice(0, 10)
    const safe = (s: string) => s.replace(/[\\/:*?"<>|\n\r]/g, ' ').slice(0, 80)
    const objectName = `${safe(community)}_小红书专业号数据_${ymd}.xlsx`
    const path = objectName

    const uploadRes = await supabase.storage.from(bucket).upload(path, Buffer.from(target.arrayBuffer), {
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      upsert: true
    })
    if (uploadRes.error) {
      return res.status(500).json({ error: `Upload failed: ${uploadRes.error.message}` })
    }

    // 生成 7 天有效的签名链接；若失败则尝试 publicURL
    let url: string | null = null
    try {
      const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60 * 24 * 7)
      if (error) throw error
      url = data?.signedUrl || null
    } catch (_) {
      const { data } = supabase.storage.from(bucket).getPublicUrl(path)
      url = data.publicUrl || null
    }

    if (!url) {
      return res.status(500).json({ error: 'Failed to generate download URL' })
    }

    // 重定向到下载链接
    res.status(302).setHeader('Location', url)
    return res.end()
  } catch (e) {
    console.error('[weekly] error:', e)
    return res.status(500).json({ error: e instanceof Error ? e.message : 'Unknown error' })
  }
}


