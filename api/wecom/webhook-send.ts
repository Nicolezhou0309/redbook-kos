import type { VercelRequest, VercelResponse } from '@vercel/node'
import axios from 'axios'

// 通过服务器代理发送文件消息到企业微信群机器人，避免浏览器CORS
// 请求体(JSON)：{ key: string, media_id: string }
export default async function handler(req: VercelRequest, res: VercelResponse) {
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
    const { key, media_id } = req.body || {}
    if (!key || !media_id) {
      res.status(400).json({ error: 'Missing key or media_id' })
      return
    }

    const sendUrl = `https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=${encodeURIComponent(key)}`
    const payload = {
      msgtype: 'file',
      file: { media_id }
    }

    const upstreamResp = await axios.post(sendUrl, payload, { headers: { 'Content-Type': 'application/json' } })
    res.status(200).json(upstreamResp.data)
  } catch (error) {
    console.error('webhook-send 代理失败:', error)
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
  }
}


