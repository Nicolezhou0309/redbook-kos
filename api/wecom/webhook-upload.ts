import type { VercelRequest, VercelResponse } from '@vercel/node'

// 通过服务器代理上传文件到企业微信群机器人，避免浏览器CORS
// 请求体(JSON)：{ key: string, fileName: string, contentBase64: string }
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
    const { key, fileName, contentBase64 } = req.body || {}
    if (!key || !fileName || !contentBase64) {
      res.status(400).json({ error: 'Missing key, fileName or contentBase64' })
      return
    }

    const arrayBuffer = Buffer.from(contentBase64, 'base64')

    // 使用 Node18 全局 FormData/Blob + fetch 转发
    const formData = new FormData()
    const blob = new Blob([arrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    formData.append('media', blob, fileName)

    const uploadUrl = `https://qyapi.weixin.qq.com/cgi-bin/webhook/upload_media?key=${encodeURIComponent(key)}&type=file`
    const upstreamResp = await fetch(uploadUrl, {
      method: 'POST',
      body: formData as any
    })
    const upstreamData = await upstreamResp.json()

    res.status(upstreamResp.status).json(upstreamData)
  } catch (error) {
    console.error('webhook-upload 代理失败:', error)
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
  }
}


