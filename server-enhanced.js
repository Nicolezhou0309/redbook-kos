import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
const PORT = 3001;

// 中间件
app.use(cors({
  origin: ['http://localhost:5173', 'https://nicole.xin', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// 请求日志中间件
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', req.body);
  }
  if (req.query && Object.keys(req.query).length > 0) {
    console.log('Query:', req.query);
  }
  next();
});

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    server: 'Enhanced WeCom Proxy Server',
    version: '1.0.0'
  });
});

// 测试端点
app.get('/api/wecom/test', (req, res) => {
  res.json({
    success: true,
    message: '本地服务器正常工作',
    timestamp: new Date().toISOString(),
    endpoint: '/api/wecom/test'
  });
});

// 企业微信Token API代理
app.get('/api/wecom/token', async (req, res) => {
  try {
    const { corpid, corpsecret } = req.query;
    console.log('🔍 获取企业微信Token');
    console.log('CorpId:', corpid);
    console.log('CorpSecret:', corpsecret ? `${corpsecret.substring(0, 10)}...` : '未提供');

    if (!corpid || !corpsecret) {
      console.log('❌ 缺少必要参数');
      return res.status(400).json({ 
        errcode: 40001, 
        errmsg: 'Missing corpid or corpsecret' 
      });
    }

    console.log('📡 调用企业微信API...');
    const response = await axios.get('https://qyapi.weixin.qq.com/cgi-bin/gettoken', {
      params: { corpid, corpsecret },
      timeout: 10000
    });

    console.log('✅ 企业微信API响应:', response.data);
    res.json(response.data);

  } catch (error) {
    console.error('❌ Token API错误:', error.response?.data || error.message);
    
    if (error.response) {
      // 企业微信API返回的错误
      res.status(200).json(error.response.data);
    } else {
      // 网络或其他错误
      res.status(500).json({ 
        errcode: 50001,
        errmsg: error.message || 'Network error'
      });
    }
  }
});

// 企业微信Send API代理
app.post('/api/wecom/send', async (req, res) => {
  try {
    const { access_token, ...messageData } = req.body;
    console.log('🔍 发送企业微信消息');
    console.log('Access Token:', access_token ? `${access_token.substring(0, 10)}...` : '未提供');
    console.log('Message Data:', messageData);

    if (!access_token) {
      console.log('❌ 缺少access_token');
      return res.status(400).json({ 
        errcode: 40001, 
        errmsg: 'Missing access_token' 
      });
    }

    console.log('📡 调用企业微信发送API...');
    const response = await axios.post(
      `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${access_token}`,
      messageData,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000
      }
    );

    console.log('✅ 企业微信发送API响应:', response.data);
    res.json(response.data);

  } catch (error) {
    console.error('❌ Send API错误:', error.response?.data || error.message);
    
    if (error.response) {
      // 企业微信API返回的错误
      res.status(200).json(error.response.data);
    } else {
      // 网络或其他错误
      res.status(500).json({ 
        errcode: 50001,
        errmsg: error.message || 'Network error'
      });
    }
  }
});

// 模拟Token API（用于测试）
app.get('/api/wecom/token-mock', (req, res) => {
  console.log('🧪 返回模拟Token响应');
  res.json({
    errcode: 0,
    access_token: 'mock_token_' + Date.now(),
    expires_in: 7200
  });
});

// 模拟Send API（用于测试）
app.post('/api/wecom/send-mock', (req, res) => {
  console.log('🧪 返回模拟发送响应');
  res.json({
    errcode: 0,
    errmsg: 'ok'
  });
});

// 错误处理中间件
app.use((error, req, res, next) => {
  console.error('❌ 服务器错误:', error);
  res.status(500).json({
    errcode: 50000,
    errmsg: 'Internal server error',
    details: error.message
  });
});

// 404处理
app.use('*', (req, res) => {
  console.log('❌ 404 Not Found:', req.originalUrl);
  res.status(404).json({
    errcode: 40400,
    errmsg: 'Endpoint not found',
    path: req.originalUrl
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log('🚀 增强版企业微信代理服务器已启动');
  console.log(`📍 地址: http://localhost:${PORT}`);
  console.log('📋 可用端点:');
  console.log('   GET  /health                    - 健康检查');
  console.log('   GET  /api/wecom/test           - 测试端点');
  console.log('   GET  /api/wecom/token          - 获取Token');
  console.log('   POST /api/wecom/send           - 发送消息');
  console.log('   GET  /api/wecom/token-mock     - 模拟Token');
  console.log('   POST /api/wecom/send-mock      - 模拟发送');
  console.log('');
  console.log('🔧 测试命令:');
  console.log(`   curl http://localhost:${PORT}/health`);
  console.log(`   curl http://localhost:${PORT}/api/wecom/test`);
  console.log('');
}); 