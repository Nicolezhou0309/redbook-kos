import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

// 企业微信配置
const WECOM_CONFIG = {
  corpid: 'ww68a125fce698cb59',
  corpsecret: 'sXQeFCLDQJkwrX5lMWDzBTEIiHK1J7-a2e7chPyqYxY',
  agentid: '1000002'
};

const handler = async (req: VercelRequest, res: VercelResponse) => {
  console.log('WeCom Proxy API called with method:', req.method);
  console.log('WeCom Proxy API called with URL:', req.url);
  console.log('WeCom Proxy API called with headers:', req.headers);

  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    res.status(200).end();
    return;
  }

  try {
    const { action } = req.query;
    console.log('Action requested:', action);

    switch (action) {
      case 'getToken':
        await handleGetToken(req, res);
        break;
      case 'sendMessage':
        await handleSendMessage(req, res);
        break;
      case 'testConnection':
        await handleTestConnection(req, res);
        break;
      default:
        res.status(400).json({ error: 'Invalid action. Supported actions: getToken, sendMessage, testConnection' });
    }
  } catch (error) {
    console.error('WeCom Proxy API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// 获取访问令牌
async function handleGetToken(req: VercelRequest, res: VercelResponse) {
  try {
    console.log('Getting WeCom token...');
    
    const response = await axios.get('https://qyapi.weixin.qq.com/cgi-bin/gettoken', {
      params: {
        corpid: WECOM_CONFIG.corpid,
        corpsecret: WECOM_CONFIG.corpsecret
      }
    });

    console.log('WeCom token response:', response.data);
    
    if (response.data.errcode === 0) {
      res.json({
        success: true,
        access_token: response.data.access_token,
        expires_in: response.data.expires_in
      });
    } else {
      res.status(400).json({
        success: false,
        error: `WeCom API error (${response.data.errcode}): ${response.data.errmsg}`
      });
    }
  } catch (error) {
    console.error('Get token error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// 发送消息
async function handleSendMessage(req: VercelRequest, res: VercelResponse) {
  try {
    const { access_token, message } = req.body;
    
    if (!access_token) {
      return res.status(400).json({ error: 'Missing access_token' });
    }
    
    if (!message) {
      return res.status(400).json({ error: 'Missing message' });
    }

    console.log('Sending WeCom message:', message);

    const response = await axios.post(
      `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${access_token}`,
      {
        agentid: WECOM_CONFIG.agentid,
        ...message
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('WeCom send message response:', response.data);
    
    if (response.data.errcode === 0) {
      res.json({
        success: true,
        msgid: response.data.msgid
      });
    } else {
      res.status(400).json({
        success: false,
        error: `WeCom API error (${response.data.errcode}): ${response.data.errmsg}`
      });
    }
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// 测试连接
async function handleTestConnection(req: VercelRequest, res: VercelResponse) {
  try {
    console.log('Testing WeCom connection...');
    
    const response = await axios.get('https://qyapi.weixin.qq.com/cgi-bin/gettoken', {
      params: {
        corpid: WECOM_CONFIG.corpid,
        corpsecret: WECOM_CONFIG.corpsecret
      }
    });

    if (response.data.errcode === 0) {
      res.json({
        success: true,
        message: 'WeCom connection successful',
        access_token: response.data.access_token
      });
    } else {
      res.json({
        success: false,
        error: `WeCom connection failed (${response.data.errcode}): ${response.data.errmsg}`
      });
    }
  } catch (error) {
    console.error('Test connection error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export default handler; 