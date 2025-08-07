import axios from 'axios';

// 新的企业微信配置
const NEW_CONFIG = {
  corpid: 'ww68a125fce698cb59',
  corpsecret: 'sXQeFCLDQJkwrX5lMWDzBTEIiHK1J7-a2e7chPyqYxY',
  agentid: '1000002'
};

// 测试新的配置
async function testNewConfig() {
  console.log('🔍 测试新的企业微信配置...\n');
  
  try {
    // 1. 直接测试企业微信API
    console.log('1. 直接测试企业微信API...');
    const directResponse = await axios.get('https://qyapi.weixin.qq.com/cgi-bin/gettoken', {
      params: {
        corpid: NEW_CONFIG.corpid,
        corpsecret: NEW_CONFIG.corpsecret
      }
    });
    
    console.log('✅ 直接API响应:', directResponse.data);
    
    if (directResponse.data.errcode === 0) {
      const accessToken = directResponse.data.access_token;
      
      // 2. 测试本地服务器
      console.log('\n2. 测试本地服务器...');
      const localResponse = await axios.get('http://localhost:3001/api/wecom/token', {
        params: {
          corpid: NEW_CONFIG.corpid,
          corpsecret: NEW_CONFIG.corpsecret
        }
      });
      
      console.log('✅ 本地服务器响应:', localResponse.data);
      
      // 3. 测试Vercel部署的API
      console.log('\n3. 测试Vercel API...');
      const vercelResponse = await axios.get('https://nicole.xin/api/wecom/token', {
        params: {
          corpid: NEW_CONFIG.corpid,
          corpsecret: NEW_CONFIG.corpsecret
        }
      });
      
      console.log('✅ Vercel API响应:', vercelResponse.data);
      
      // 4. 测试发送消息
      console.log('\n4. 测试发送消息...');
      const sendResponse = await axios.post('https://nicole.xin/api/wecom/send', {
        access_token: accessToken,
        agentid: NEW_CONFIG.agentid,
        touser: '@all',
        msgtype: 'text',
        text: { content: `🧪 新配置测试消息 - ${new Date().toLocaleString('zh-CN')}` }
      });
      
      console.log('✅ 发送消息响应:', sendResponse.data);
      
      console.log('\n🎉 所有测试通过！新配置工作正常。');
      
    } else {
      console.log('❌ Token获取失败:', directResponse.data.errmsg);
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
  }
}

// 运行测试
testNewConfig().catch(console.error); 