import axios from 'axios';

const CONFIG = {
  corpid: 'ww68a125fce698cb59',
  corpsecret: 'sXQeFCLDQJkwrX5lMWDzBTEIiHK1J7-a2e7chPyqYxY',
  agentid: '1000002'
};

// 测试不同的API端点
async function diagnoseAPI() {
  console.log('🔍 诊断API问题...\n');
  
  const tests = [
    {
      name: '直接企业微信API',
      url: 'https://qyapi.weixin.qq.com/cgi-bin/gettoken',
      method: 'GET',
      params: { corpid: CONFIG.corpid, corpsecret: CONFIG.corpsecret }
    },
    {
      name: '本地服务器API',
      url: 'http://localhost:3001/api/wecom/token',
      method: 'GET',
      params: { corpid: CONFIG.corpid, corpsecret: CONFIG.corpsecret }
    },
    {
      name: 'Vercel生产API',
      url: 'https://nicole.xin/api/wecom/token',
      method: 'GET',
      params: { corpid: CONFIG.corpid, corpsecret: CONFIG.corpsecret }
    },
    {
      name: 'Vercel简化API',
      url: 'https://nicole.xin/api/wecom/token-simple',
      method: 'GET',
      params: { corpid: CONFIG.corpid, corpsecret: CONFIG.corpsecret }
    }
  ];
  
  for (const test of tests) {
    try {
      console.log(`📡 测试: ${test.name}`);
      console.log(`URL: ${test.url}`);
      
      const response = await axios({
        method: test.method,
        url: test.url,
        params: test.params,
        timeout: 10000,
        headers: {
          'User-Agent': 'Diagnostic-Tool/1.0'
        }
      });
      
      console.log('✅ 状态码:', response.status);
      console.log('✅ 响应数据:', response.data);
      
    } catch (error) {
      console.log('❌ 错误:', error.response?.status || error.code);
      console.log('❌ 错误信息:', error.response?.data || error.message);
      
      if (error.response) {
        console.log('❌ 响应头:', error.response.headers);
      }
    }
    
    console.log('\n' + '-'.repeat(50) + '\n');
  }
}

// 测试网络连接
async function testNetworkConnectivity() {
  console.log('🌐 测试网络连接...\n');
  
  const endpoints = [
    'https://qyapi.weixin.qq.com',
    'https://nicole.xin',
    'http://localhost:3001'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(endpoint, { timeout: 5000 });
      console.log(`✅ ${endpoint}: ${response.status}`);
    } catch (error) {
      console.log(`❌ ${endpoint}: ${error.message}`);
    }
  }
}

// 检查Vercel部署状态
async function checkVercelDeployment() {
  console.log('\n🚀 检查Vercel部署状态...\n');
  
  try {
    // 测试健康检查端点
    const healthResponse = await axios.get('https://nicole.xin/api/wecom/test', { timeout: 5000 });
    console.log('✅ Vercel健康检查:', healthResponse.data);
  } catch (error) {
    console.log('❌ Vercel健康检查失败:', error.response?.data || error.message);
  }
}

// 主诊断函数
async function runDiagnosis() {
  console.log('🚀 开始API问题诊断...\n');
  
  await testNetworkConnectivity();
  await checkVercelDeployment();
  await diagnoseAPI();
  
  console.log('🏁 诊断完成！');
  console.log('\n💡 建议:');
  console.log('1. 如果Vercel API有问题，等待重新部署');
  console.log('2. 如果网络连接正常，检查API代码');
  console.log('3. 如果本地API正常，使用本地开发');
}

// 运行诊断
runDiagnosis().catch(console.error); 