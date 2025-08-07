export default async function handler(req, res) {
  console.log('Token API (JS) called with method:', req.method);
  console.log('Token API (JS) called with URL:', req.url);

  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', 'https://nicole.xin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request (JS)');
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    console.log('Method not allowed (JS):', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { corpid, corpsecret } = req.query;
    console.log('Received query parameters (JS):', { corpid, corpsecret });

    if (!corpid || !corpsecret) {
      console.log('Missing parameters (JS)');
      return res.status(400).json({ error: 'Missing corpid or corpsecret' });
    }

    // 返回一个测试响应
    const response = {
      errcode: 0,
      access_token: 'test_token_js_' + Date.now(),
      expires_in: 7200,
      message: 'API is working - JavaScript version'
    };
    
    console.log('Sending response (JS):', response);
    res.json(response);

  } catch (error) {
    console.error('API错误 (JS):', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 