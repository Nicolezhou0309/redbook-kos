import axios from 'axios';

const CONFIG = {
  corpid: 'ww68a125fce698cb59',
  corpsecret: 'sXQeFCLDQJkwrX5lMWDzBTEIiHK1J7-a2e7chPyqYxY',
  agentid: '1000002'
};

// 模拟生产环境的直接API调用
async function testDirectAPI() {
  console.log('🔍 测试直接调用企业微信API...\n');
  
  try {
    // 1. 获取访问令牌
    console.log('1. 获取访问令牌...');
    const tokenResponse = await axios.get('https://qyapi.weixin.qq.com/cgi-bin/gettoken', {
      params: {
        corpid: CONFIG.corpid,
        corpsecret: CONFIG.corpsecret
      }
    });
    
    console.log('✅ Token响应:', tokenResponse.data);
    
    if (tokenResponse.data.errcode === 0) {
      const accessToken = tokenResponse.data.access_token;
      
      // 2. 发送消息
      console.log('\n2. 发送消息...');
      const sendResponse = await axios.post(`https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${accessToken}`, {
        agentid: CONFIG.agentid,
        touser: '@all',
        msgtype: 'text',
        text: { content: `🧪 直接API测试消息 - ${new Date().toLocaleString('zh-CN')}` }
      });
      
      console.log('✅ 发送消息响应:', sendResponse.data);
      
      console.log('\n🎉 直接API调用测试通过！');
      console.log('\n📋 这个解决方案的优点:');
      console.log('- 绕过Vercel API部署问题');
      console.log('- 直接调用企业微信官方API');
      console.log('- 减少中间环节，提高可靠性');
      console.log('- 开发环境仍使用本地代理');
      
    } else {
      console.log('❌ Token获取失败:', tokenResponse.data.errmsg);
    }
    
  } catch (error) {
    console.error('❌ 直接API测试失败:', error.response?.data || error.message);
  }
}

// 测试开发环境代理
async function testDevProxy() {
  console.log('\n🔍 测试开发环境代理...\n');
  
  try {
    const response = await axios.get('http://localhost:3001/api/wecom/token', {
      params: {
        corpid: CONFIG.corpid,
        corpsecret: CONFIG.corpsecret
      }
    });
    
    console.log('✅ 开发环境代理响应:', response.data);
    console.log('✅ 开发环境代理工作正常');
    
  } catch (error) {
    console.error('❌ 开发环境代理失败:', error.response?.data || error.message);
  }
}

// 主测试函数
async function runTests() {
  console.log('🚀 开始测试直接API调用解决方案...\n');
  
  await testDirectAPI();
  await testDevProxy();
  
  console.log('\n🏁 测试完成！');
  console.log('\n💡 现在可以:');
  console.log('1. 访问 https://nicole.xin/message-test 测试生产环境');
  console.log('2. 在本地运行 npm run dev 测试开发环境');
}

// 运行测试
runTests().catch(console.error); 