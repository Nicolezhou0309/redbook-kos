import axios from 'axios';

// 基于成功示例的企业微信配置
const WECOM_CONFIG = {
  corpid: 'ww68a125fce698cb59',  // 从成功示例中获取
  corpsecret: 'sXQeFCLDQJkwrX5lMWDzBTEIiHK1J7-a2e7chPyqYxY',  // 从成功示例中获取
  agentid: '1000110',  // 保持原有的应用ID
  baseUrl: 'http://localhost:3001'
};

// 测试颜色输出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

const log = (color, message) => {
  console.log(`${color}${message}${colors.reset}`);
};

// 测试直接API调用
const testDirectAPI = async () => {
  log(colors.blue, '\n🌐 测试直接API调用...');
  
  try {
    const response = await axios.get('https://qyapi.weixin.qq.com/cgi-bin/gettoken', {
      params: {
        corpid: WECOM_CONFIG.corpid,
        corpsecret: WECOM_CONFIG.corpsecret
      }
    });
    
    console.log('直接API响应:', response.data);
    
    if (response.data.errcode === 0) {
      log(colors.green, '✅ 直接API调用成功！');
      log(colors.green, `✅ 获取到访问令牌: ${response.data.access_token.substring(0, 20)}...`);
      log(colors.green, `✅ 令牌有效期: ${response.data.expires_in}秒`);
      return response.data.access_token;
    } else {
      log(colors.red, `❌ 直接API调用失败: ${response.data.errmsg}`);
      return null;
    }
  } catch (error) {
    log(colors.red, `❌ 直接API请求失败: ${error.message}`);
    return null;
  }
};

// 测试通过代理获取令牌
const testProxyAPI = async () => {
  log(colors.blue, '\n🔑 测试通过代理获取访问令牌...');
  
  try {
    const response = await axios.get(`${WECOM_CONFIG.baseUrl}/api/wecom/token`, {
      params: {
        corpid: WECOM_CONFIG.corpid,
        corpsecret: WECOM_CONFIG.corpsecret
      }
    });
    
    console.log('代理响应:', response.data);
    
    if (response.data.errcode === 0) {
      log(colors.green, '✅ 代理API调用成功！');
      log(colors.green, `✅ 获取到访问令牌: ${response.data.access_token.substring(0, 20)}...`);
      return response.data.access_token;
    } else {
      log(colors.red, `❌ 代理API调用失败: ${response.data.errmsg}`);
      return null;
    }
  } catch (error) {
    log(colors.red, `❌ 代理请求失败: ${error.message}`);
    return null;
  }
};

// 测试发送文本消息
const testSendTextMessage = async (accessToken) => {
  log(colors.blue, '\n📝 测试发送文本消息...');
  
  try {
    const message = {
      access_token: accessToken,
      agentid: WECOM_CONFIG.agentid,
      touser: '@all',
      msgtype: 'text',
      text: { 
        content: `🧪 企业微信测试消息\n时间: ${new Date().toLocaleString()}\n使用有效配置测试成功！` 
      }
    };
    
    const response = await axios.post(`${WECOM_CONFIG.baseUrl}/api/wecom/send`, message);
    
    console.log('消息响应:', response.data);
    
    if (response.data.errcode === 0) {
      log(colors.green, '✅ 文本消息发送成功！');
      return true;
    } else {
      log(colors.red, `❌ 文本消息发送失败: ${response.data.errmsg}`);
      return false;
    }
  } catch (error) {
    log(colors.red, `❌ 请求失败: ${error.message}`);
    return false;
  }
};

// 测试发送卡片消息
const testSendCardMessage = async (accessToken) => {
  log(colors.blue, '\n📋 测试发送卡片消息...');
  
  try {
    const message = {
      access_token: accessToken,
      agentid: WECOM_CONFIG.agentid,
      touser: '@all',
      msgtype: 'textcard',
      textcard: {
        title: '企业微信配置测试通知',
        description: `测试时间: ${new Date().toLocaleString()}\n配置信息:\n企业ID: ${WECOM_CONFIG.corpid}\n应用ID: ${WECOM_CONFIG.agentid}\n状态: 配置有效`,
        url: 'https://work.weixin.qq.com/',
        btntxt: '查看详情'
      }
    };
    
    const response = await axios.post(`${WECOM_CONFIG.baseUrl}/api/wecom/send`, message);
    
    console.log('卡片消息响应:', response.data);
    
    if (response.data.errcode === 0) {
      log(colors.green, '✅ 卡片消息发送成功！');
      return true;
    } else {
      log(colors.red, `❌ 卡片消息发送失败: ${response.data.errmsg}`);
      return false;
    }
  } catch (error) {
    log(colors.red, `❌ 请求失败: ${error.message}`);
    return false;
  }
};

// 测试URL验证
const testURLValidation = async () => {
  log(colors.blue, '\n🔗 测试URL验证...');
  
  const testURL = `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${WECOM_CONFIG.corpid}&corpsecret=${WECOM_CONFIG.corpsecret}`;
  log(colors.yellow, `测试URL: ${testURL}`);
  
  try {
    const response = await axios.get(testURL);
    console.log('URL测试响应:', response.data);
    
    if (response.data.errcode === 0) {
      log(colors.green, '✅ URL验证成功！');
      return true;
    } else {
      log(colors.red, `❌ URL验证失败: ${response.data.errmsg}`);
      return false;
    }
  } catch (error) {
    log(colors.red, `❌ URL验证请求失败: ${error.message}`);
    return false;
  }
};

// 主测试函数
const runAllTests = async () => {
  log(colors.blue, '🚀 开始企业微信有效配置测试...');
  log(colors.yellow, `企业ID: ${WECOM_CONFIG.corpid}`);
  log(colors.yellow, `应用密钥: ${WECOM_CONFIG.corpsecret.substring(0, 8)}...`);
  log(colors.yellow, `应用ID: ${WECOM_CONFIG.agentid}`);
  log(colors.yellow, `测试服务器: ${WECOM_CONFIG.baseUrl}`);
  
  // 测试URL验证
  await testURLValidation();
  
  // 测试直接API调用
  const directToken = await testDirectAPI();
  
  // 测试通过代理获取令牌
  const proxyToken = await testProxyAPI();
  
  if (proxyToken) {
    // 测试发送消息
    await testSendTextMessage(proxyToken);
    await testSendCardMessage(proxyToken);
  }
  
  // 总结测试结果
  log(colors.cyan, '\n📊 测试结果总结:');
  if (directToken) {
    log(colors.green, '✅ 直接API调用: 成功');
  } else {
    log(colors.red, '❌ 直接API调用: 失败');
  }
  
  if (proxyToken) {
    log(colors.green, '✅ 代理API调用: 成功');
  } else {
    log(colors.red, '❌ 代理API调用: 失败');
  }
  
  log(colors.blue, '\n🎉 测试完成！');
};

// 运行测试
runAllTests().catch(error => {
  log(colors.red, `❌ 测试运行失败: ${error.message}`);
}); 