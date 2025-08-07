import axios from 'axios';

// 测试配置
const config = {
  corpid: 'ww30ead8f4b3e9e84d',
  corpsecret: 'ocrsCpRalvhbUSw9HVYrkFaoPZMIGh10VGDGl_hGbk',
  agentid: '1000110'
};

// 测试token API
async function testTokenAPI() {
  try {
    console.log('🔍 测试Token API...');
    
    // 测试本地开发服务器
    const localResponse = await axios.get('http://localhost:3001/api/wecom/token', {
      params: {
        corpid: config.corpid,
        corpsecret: config.corpsecret
      }
    });
    
    console.log('✅ 本地服务器Token API响应:', localResponse.data);
    
    // 测试Vercel部署的API
    const vercelResponse = await axios.get('https://nicole.xin/api/wecom/token', {
      params: {
        corpid: config.corpid,
        corpsecret: config.corpsecret
      }
    });
    
    console.log('✅ Vercel Token API响应:', vercelResponse.data);
    
    return vercelResponse.data.access_token;
  } catch (error) {
    console.error('❌ Token API测试失败:', error.response?.data || error.message);
    return null;
  }
}

// 测试send API
async function testSendAPI(accessToken) {
  if (!accessToken) {
    console.log('⚠️ 跳过Send API测试，因为没有有效的access_token');
    return;
  }
  
  try {
    console.log('🔍 测试Send API...');
    
    const messageData = {
      touser: '@all',
      msgtype: 'text',
      text: {
        content: `🧪 测试消息 - ${new Date().toLocaleString('zh-CN')}`
      }
    };
    
    // 测试本地开发服务器
    const localResponse = await axios.post('http://localhost:3001/api/wecom/send', {
      access_token: accessToken,
      agentid: config.agentid,
      ...messageData
    });
    
    console.log('✅ 本地服务器Send API响应:', localResponse.data);
    
    // 测试Vercel部署的API
    const vercelResponse = await axios.post('https://nicole.xin/api/wecom/send', {
      access_token: accessToken,
      agentid: config.agentid,
      ...messageData
    });
    
    console.log('✅ Vercel Send API响应:', vercelResponse.data);
    
  } catch (error) {
    console.error('❌ Send API测试失败:', error.response?.data || error.message);
  }
}

// 主测试函数
async function runTests() {
  console.log('🚀 开始企业微信API测试...\n');
  
  const accessToken = await testTokenAPI();
  console.log('\n' + '='.repeat(50) + '\n');
  
  await testSendAPI(accessToken);
  
  console.log('\n🏁 测试完成！');
}

// 运行测试
runTests().catch(console.error); 