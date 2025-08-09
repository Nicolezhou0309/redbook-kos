export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const body = req.body || {}
    // 支持从环境变量读取：社区员工号周报wehook（优先环境变量，其次 body.key 兼容老用法）
    const envKey = process.env.社区员工号周报wehook || process.env.WECOM_WEEKLY_WEBHOOK_KEY || ''
    const { key: bodyKey, ...rest } = body
    const key = (envKey && String(envKey).trim() !== '') ? envKey : (bodyKey || '')
    if (!key) return res.status(400).json({ error: 'Missing key (set 环境变量“社区员工号周报wehook” 或传 key)' })

    const sendUrl = `https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=${encodeURIComponent(key)}`
    const upstreamResp = await fetch(sendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rest)
    })
    const data = await upstreamResp.json()
    res.status(upstreamResp.status).json(data)
  } catch (error) {
    console.error('webhook-send error:', error)
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
  }
}


