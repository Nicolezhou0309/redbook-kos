import axios from 'axios';

// 测试企业微信API连接
async function testWeComAPI() {
  const baseUrl = 'https://nicole.xin/api/wecom';
  const corpid = 'ww30ead8f4b3e9e84d';
  const corpsecret = 'ocrsCpRalvhbUSw9HVYrkFaoPZMIGh10VGDGl_hGbk';

  try {
    console.log('🔍 测试企业微信API连接...');
    
    // 测试token接口
    console.log('\n1. 测试获取访问令牌...');
    const tokenResponse = await axios.get(`${baseUrl}/token`, {
      params: { corpid, corpsecret },
      headers: {
        'Origin': 'https://nicole.xin'
      }
    });
    
    console.log('✅ Token API响应:', tokenResponse.data);
    
    if (tokenResponse.data.errcode === 0) {
      const accessToken = tokenResponse.data.access_token;
      
      // 测试发送消息接口
      console.log('\n2. 测试发送消息...');
      const messageResponse = await axios.post(`${baseUrl}/send`, {
        access_token: accessToken,
        agentid: '1000110',
        touser: '@all',
        msgtype: 'text',
        text: { content: '这是一条测试消息' }
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://nicole.xin'
        }
      });
      
      console.log('✅ Send API响应:', messageResponse.data);
    }
    
  } catch (error) {
    console.error('❌ API测试失败:', error.response?.data || error.message);
    console.error('状态码:', error.response?.status);
    console.error('响应头:', error.response?.headers);
  }
}

// 运行测试
testWeComAPI(); 