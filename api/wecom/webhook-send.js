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
    // 支持从环境变量读取（推荐仅在服务端配置）：
    // - WECOM_WEEKLY_WEBHOOK           原始 key（推荐）
    // - WECOM_WEEKLY_WEBHOOK_KEY       兼容旧名：原始 key
    // - WECOM_WEEKLY_WEBHOOK_URL       完整 webhook URL（含 https://...send?key=xxx）
    const envWebhook = process.env.WECOM_WEEKLY_WEBHOOK || process.env.WECOM_WEEKLY_WEBHOOK_KEY || process.env.WECOM_WEEKLY_WEBHOOK_URL || ''
    const { key: bodyKey, url: bodyUrl, ...rest } = body

    let sendUrl = ''
    if (envWebhook && /^https?:\/\//i.test(envWebhook)) {
      sendUrl = envWebhook
    } else if (bodyUrl && /^https?:\/\//i.test(bodyUrl)) {
      sendUrl = bodyUrl
    } else {
      const key = (envWebhook && String(envWebhook).trim() !== '') ? String(envWebhook).trim() : (bodyKey || '').trim()
      if (!key) return res.status(400).json({ error: 'Missing webhook key or url (set WECOM_WEEKLY_WEBHOOK / WECOM_WEEKLY_WEBHOOK_URL, 或兼容 body.key/url)' })
      sendUrl = `https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=${encodeURIComponent(key)}`
    }
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


