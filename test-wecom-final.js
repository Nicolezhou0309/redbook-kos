import axios from 'axios';

// 有效的企业微信配置
const WECOM_CONFIG = {
  corpid: 'ww68a125fce698cb59',
  corpsecret: 'sXQeFCLDQJkwrX5lMWDzBTEIiHK1J7-a2e7chPyqYxY',
  agentid: '1000110',
  baseUrl: 'http://localhost:3001'
};

// 测试颜色输出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const log = (color, message) => {
  console.log(`${color}${message}${colors.reset}`);
};

// 测试获取访问令牌
const testGetToken = async () => {
  log(colors.blue, '🔑 测试获取企业微信访问令牌...');
  
  try {
    const response = await axios.get(`${WECOM_CONFIG.baseUrl}/api/wecom/token`, {
      params: {
        corpid: WECOM_CONFIG.corpid,
        corpsecret: WECOM_CONFIG.corpsecret
      }
    });
    
    console.log('响应数据:', response.data);
    
    if (response.data.errcode === 0) {
      log(colors.green, '✅ 访问令牌获取成功！');
      return response.data.access_token;
    } else {
      log(colors.red, `❌ 访问令牌获取失败: ${response.data.errmsg}`);
      return null;
    }
  } catch (error) {
    log(colors.red, `❌ 请求失败: ${error.message}`);
    return null;
  }
};

// 测试发送消息
const testSendMessage = async (accessToken) => {
  log(colors.blue, '📝 测试发送消息...');
  
  try {
    const message = {
      access_token: accessToken,
      agentid: WECOM_CONFIG.agentid,
      touser: '@all',
      msgtype: 'text',
      text: { 
        content: `🧪 企业微信测试消息\n时间: ${new Date().toLocaleString()}\n配置已更新！` 
      }
    };
    
    const response = await axios.post(`${WECOM_CONFIG.baseUrl}/api/wecom/send`, message);
    
    console.log('响应数据:', response.data);
    
    if (response.data.errcode === 0) {
      log(colors.green, '✅ 消息发送成功！');
      return true;
    } else {
      log(colors.red, `❌ 消息发送失败: ${response.data.errmsg}`);
      return false;
    }
  } catch (error) {
    log(colors.red, `❌ 请求失败: ${error.message}`);
    return false;
  }
};

// 主测试函数
const runTest = async () => {
  log(colors.blue, '🚀 开始企业微信API测试...');
  log(colors.yellow, `企业ID: ${WECOM_CONFIG.corpid}`);
  log(colors.yellow, `应用ID: ${WECOM_CONFIG.agentid}`);
  
  const accessToken = await testGetToken();
  
  if (accessToken) {
    await testSendMessage(accessToken);
  }
  
  log(colors.blue, '\n🎉 测试完成！');
};

// 运行测试
runTest().catch(error => {
  log(colors.red, `❌ 测试运行失败: ${error.message}`);
});
