import axios from 'axios';

const testWeComConfig = async () => {
  console.log('🧪 测试企业微信配置...');
  
  try {
    // 测试获取访问令牌
    console.log('1. 测试获取访问令牌...');
    const tokenResponse = await axios.get('http://localhost:3001/api/wecom/token', {
      params: {
        corpid: 'ww30ead8f4b3e9e84d',
        corpsecret: 'ocrsCpRalvhbUSw9HVYrkFaoPZMIGh10VGDGl_hGbk'
      }
    });
    
    console.log('令牌响应:', tokenResponse.data);
    
    if (tokenResponse.data.errcode === 0) {
      console.log('✅ 访问令牌获取成功！');
      
      // 测试发送消息
      console.log('2. 测试发送消息...');
      const messageResponse = await axios.post('http://localhost:3001/api/wecom/send', {
        access_token: tokenResponse.data.access_token,
        agentid: '1000110',
        touser: '@all',
        msgtype: 'text',
        text: { content: '这是一条测试消息' }
      });
      
      console.log('消息响应:', messageResponse.data);
      
      if (messageResponse.data.errcode === 0) {
        console.log('✅ 消息发送成功！');
      } else {
        console.log('❌ 消息发送失败:', messageResponse.data.errmsg);
      }
    } else {
      console.log('❌ 访问令牌获取失败:', tokenResponse.data.errmsg);
    }
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
};

testWeComConfig();
