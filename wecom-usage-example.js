// 企业微信API使用示例
import { getWeComToken, sendWeComMessage } from './src/lib/wecomApi';

// 使用示例
const sendTestMessage = async () => {
  try {
    // 1. 获取访问令牌
    const accessToken = await getWeComToken();
    console.log('获取到访问令牌:', accessToken);
    
    // 2. 发送文本消息
    const message = {
      agentid: '1000110',
      touser: '@all',
      msgtype: 'text',
      text: {
        content: '这是一条测试消息'
      }
    };
    
    const result = await sendWeComMessage(accessToken, message);
    console.log('消息发送成功:', result);
    
  } catch (error) {
    console.error('发送消息失败:', error);
  }
};

// 运行示例
sendTestMessage();
