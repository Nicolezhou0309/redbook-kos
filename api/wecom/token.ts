import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

const handler = async (req: VercelRequest, res: VercelResponse) => {
  console.log('Token API called with method:', req.method);
  console.log('Token API called with URL:', req.url);
  console.log('Token API called with headers:', req.headers);

  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    console.log('Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { corpid, corpsecret } = req.query;
    console.log('Received query parameters:', { corpid, corpsecret });

    if (!corpid || !corpsecret) {
      console.log('Missing parameters');
      return res.status(400).json({ error: 'Missing corpid or corpsecret' });
    }

    // 调用企业微信API获取真实token
    const response = await axios.get('https://qyapi.weixin.qq.com/cgi-bin/gettoken', {
      params: { corpid, corpsecret }
    });

    console.log('WeChat API response:', response.data);
    res.json(response.data);

  } catch (error) {
    console.error('API错误:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

module.exports = handler;