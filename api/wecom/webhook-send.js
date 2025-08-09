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
    const { key, ...rest } = body
    if (!key) return res.status(400).json({ error: 'Missing key' })

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


