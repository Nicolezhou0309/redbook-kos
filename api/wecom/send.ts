import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

const handler = async (req: VercelRequest, res: VercelResponse) => {
  console.log('Send API called with method:', req.method);
  console.log('Send API called with URL:', req.url);
  console.log('Send API called with body:', req.body);

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

  if (req.method !== 'POST') {
    console.log('Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { access_token, ...messageData } = req.body;

    if (!access_token) {
      console.log('Missing access_token');
      return res.status(400).json({ error: 'Missing access_token' });
    }

    console.log('Sending message to WeChat API:', messageData);

    const response = await axios.post(
      `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${access_token}`,
      messageData,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('WeChat API response:', response.data);
    res.json(response.data);
  } catch (error) {
    console.error('发送企业微信消息失败:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : '未知错误' 
    });
  }
};

export default handler;