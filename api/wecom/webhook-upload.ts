import type { VercelRequest, VercelResponse } from '@vercel/node'
import FormData from 'form-data'
import axios from 'axios'

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

    // 使用 Node 版 form-data 构造 multipart，避免边缘运行时不支持 Blob 的问题
    const formData = new FormData()
    formData.append('media', arrayBuffer, { filename: fileName, contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })

    const uploadUrl = `https://qyapi.weixin.qq.com/cgi-bin/webhook/upload_media?key=${encodeURIComponent(key)}&type=file`
    const upstreamResp = await axios.post(uploadUrl, formData as any, { headers: (formData as any).getHeaders?.() })
    res.status(200).json(upstreamResp.data)
  } catch (error) {
    console.error('webhook-upload 代理失败:', error)
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
  }
}


