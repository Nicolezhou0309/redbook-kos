import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', 'https://nicole.xin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

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

    console.log('请求企业微信API:', { corpid, corpsecret: '***' });

    const response = await axios.get('https://qyapi.weixin.qq.com/cgi-bin/gettoken', {
      params: { corpid, corpsecret },
      timeout: 10000
    });

    console.log('企业微信API响应:', response.data);
    res.json(response.data);
  } catch (error) {
    console.error('获取企业微信访问令牌失败:', error);
    
    if (axios.isAxiosError(error)) {
      res.status(500).json({ 
        error: '企业微信API请求失败',
        details: error.message,
        status: error.response?.status
      });
    } else {
      res.status(500).json({ 
        error: '未知错误',
        details: error instanceof Error ? error.message : '未知错误'
      });
    }
  }
}
