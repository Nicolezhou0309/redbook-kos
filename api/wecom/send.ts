import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { access_token, ...message } = req.body;

    if (!access_token) {
      return res.status(400).json({ error: 'Missing access_token' });
    }

    const response = await axios.post(
      `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${access_token}`,
      message
    );

    res.json(response.data);
  } catch (error) {
    console.error('发送企业微信消息失败:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : '未知错误' 
    });
  }
}
