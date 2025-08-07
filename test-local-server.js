import axios from 'axios';

const LOCAL_SERVER_URL = 'http://localhost:3001';
const TEST_CONFIG = {
  corpid: 'ww68a125fce698cb59',
  corpsecret: 'sXQeFCLDQJkwrX5lMWDzBTEIiHK1J7-a2e7chPyqYxY',
  agentid: '1000002'
};

// 测试服务器健康状态
async function testHealth() {
  try {
    console.log('🔍 测试服务器健康状态...');
    const response = await axios.get(`${LOCAL_SERVER_URL}/health`);
    console.log('✅ 服务器健康状态:', response.data);
    return true;
  } catch (error) {
    console.error('❌ 服务器健康检查失败:', error.message);
    return false;
  }
}

// 测试基本API端点
async function testBasicEndpoints() {
  try {
    console.log('🔍 测试基本API端点...');
    
    // 测试 /api/wecom/test
    const testResponse = await axios.get(`${LOCAL_SERVER_URL}/api/wecom/test`);
    console.log('✅ 测试端点响应:', testResponse.data);
    
    return true;
  } catch (error) {
    console.error('❌ 基本API测试失败:', error.message);
    return false;
  }
}

// 测试模拟Token API
async function testMockToken() {
  try {
    console.log('🔍 测试模拟Token API...');
    
    const response = await axios.get(`${LOCAL_SERVER_URL}/api/wecom/token-mock`);
    console.log('✅ 模拟Token响应:', response.data);
    
    return response.data.access_token;
  } catch (error) {
    console.error('❌ 模拟Token测试失败:', error.message);
    return null;
  }
}

// 测试真实Token API
async function testRealToken() {
  try {
    console.log('🔍 测试真实Token API...');
    
    const response = await axios.get(`${LOCAL_SERVER_URL}/api/wecom/token`, {
      params: {
        corpid: TEST_CONFIG.corpid,
        corpsecret: TEST_CONFIG.corpsecret
      }
    });
    
    console.log('✅ 真实Token响应:', response.data);
    
    if (response.data.errcode === 0) {
      return response.data.access_token;
    } else {
      console.log('⚠️ Token获取失败:', response.data.errmsg);
      return null;
    }
  } catch (error) {
    console.error('❌ 真实Token测试失败:', error.response?.data || error.message);
    return null;
  }
}

// 测试模拟发送API
async function testMockSend() {
  try {
    console.log('🔍 测试模拟发送API...');
    
    const mockToken = await testMockToken();
    if (!mockToken) {
      console.log('⚠️ 跳过模拟发送测试，没有Token');
      return false;
    }
    
    const response = await axios.post(`${LOCAL_SERVER_URL}/api/wecom/send-mock`, {
      access_token: mockToken,
      agentid: TEST_CONFIG.agentid,
      touser: '@all',
      msgtype: 'text',
      text: { content: '🧪 模拟测试消息' }
    });
    
    console.log('✅ 模拟发送响应:', response.data);
    return true;
  } catch (error) {
    console.error('❌ 模拟发送测试失败:', error.response?.data || error.message);
    return false;
  }
}

// 测试真实发送API
async function testRealSend(accessToken) {
  if (!accessToken) {
    console.log('⚠️ 跳过真实发送测试，没有有效的Token');
    return false;
  }
  
  try {
    console.log('🔍 测试真实发送API...');
    
    const response = await axios.post(`${LOCAL_SERVER_URL}/api/wecom/send`, {
      access_token: accessToken,
      agentid: TEST_CONFIG.agentid,
      touser: '@all',
      msgtype: 'text',
      text: { content: `🧪 真实测试消息 - ${new Date().toLocaleString('zh-CN')}` }
    });
    
    console.log('✅ 真实发送响应:', response.data);
    
    if (response.data.errcode === 0) {
      return true;
    } else {
      console.log('⚠️ 发送失败:', response.data.errmsg);
      return false;
    }
  } catch (error) {
    console.error('❌ 真实发送测试失败:', error.response?.data || error.message);
    return false;
  }
}

// 测试前端代理配置
async function testFrontendProxy() {
  try {
    console.log('🔍 测试前端代理配置...');
    
    // 模拟前端请求
    const response = await axios.get(`${LOCAL_SERVER_URL}/api/wecom/token`, {
      params: {
        corpid: TEST_CONFIG.corpid,
        corpsecret: TEST_CONFIG.corpsecret
      },
      headers: {
        'Origin': 'http://localhost:5173',
        'Referer': 'http://localhost:5173/'
      }
    });
    
    console.log('✅ 前端代理测试成功');
    return true;
  } catch (error) {
    console.error('❌ 前端代理测试失败:', error.response?.data || error.message);
    return false;
  }
}

// 主测试函数
async function runLocalTests() {
  console.log('🚀 开始本地服务器测试...\n');
  
  const results = {
    health: await testHealth(),
    basic: await testBasicEndpoints(),
    mockToken: await testMockToken(),
    realToken: await testRealToken(),
    mockSend: await testMockSend(),
    frontendProxy: await testFrontendProxy()
  };
  
  // 测试真实发送（如果有真实Token）
  if (results.realToken) {
    results.realSend = await testRealSend(results.realToken);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 测试结果汇总:');
  console.log('='.repeat(60));
  
  Object.entries(results).forEach(([test, result]) => {
    const status = result ? '✅' : '❌';
    console.log(`${status} ${test}: ${result ? '通过' : '失败'}`);
  });
  
  console.log('\n🎯 建议:');
  if (!results.health) {
    console.log('- 请确保本地服务器正在运行: node server-enhanced.js');
  }
  if (!results.realToken) {
    console.log('- 企业微信凭证可能无效，请检查配置');
  }
  if (results.mockToken && results.mockSend) {
    console.log('- 模拟API工作正常，可以用于开发测试');
  }
  
  console.log('\n🏁 本地测试完成！');
}

// 运行测试
runLocalTests().catch(console.error); 