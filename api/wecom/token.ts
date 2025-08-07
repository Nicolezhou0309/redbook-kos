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

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { corpid, corpsecret } = req.query;

    if (!corpid || !corpsecret) {
      return res.status(400).json({ error: 'Missing corpid or corpsecret' });
    }

    const response = await axios.get('https://qyapi.weixin.qq.com/cgi-bin/gettoken', {
      params: { corpid, corpsecret }
    });

    res.json(response.data);
  } catch (error) {
    console.error('获取企业微信访问令牌失败:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : '未知错误' 
    });
  }
}
