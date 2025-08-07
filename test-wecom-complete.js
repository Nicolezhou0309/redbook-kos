import axios from 'axios';

// 企业微信配置
const WECOM_CONFIG = {
  corpid: 'ww30ead8f4b3e9e84d',
  corpsecret: 'ocrsCpRalvhbUSw9HVYrkFaoPZMIGh10VGDGl_hGbk',
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
  log(colors.blue, '\n🔑 测试获取企业微信访问令牌...');
  
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
        content: `🧪 企业微信测试消息\n时间: ${new Date().toLocaleString()}\n这是一条自动化测试消息` 
      }
    };
    
    const response = await axios.post(`${WECOM_CONFIG.baseUrl}/api/wecom/send`, message);
    
    console.log('响应数据:', response.data);
    
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
        title: '企业微信测试通知',
        description: `测试时间: ${new Date().toLocaleString()}\n这是一条测试卡片消息，用于验证企业微信API连接是否正常。`,
        url: 'https://work.weixin.qq.com/',
        btntxt: '查看详情'
      }
    };
    
    const response = await axios.post(`${WECOM_CONFIG.baseUrl}/api/wecom/send`, message);
    
    console.log('响应数据:', response.data);
    
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

// 测试发送图片消息
const testSendImageMessage = async (accessToken) => {
  log(colors.blue, '\n🖼️ 测试发送图片消息...');
  
  try {
    const message = {
      access_token: accessToken,
      agentid: WECOM_CONFIG.agentid,
      touser: '@all',
      msgtype: 'image',
      image: {
        media_id: 'MEDIA_ID' // 需要先上传图片获取media_id
      }
    };
    
    const response = await axios.post(`${WECOM_CONFIG.baseUrl}/api/wecom/send`, message);
    
    console.log('响应数据:', response.data);
    
    if (response.data.errcode === 0) {
      log(colors.green, '✅ 图片消息发送成功！');
      return true;
    } else {
      log(colors.yellow, `⚠️ 图片消息发送失败 (可能需要media_id): ${response.data.errmsg}`);
      return false;
    }
  } catch (error) {
    log(colors.red, `❌ 请求失败: ${error.message}`);
    return false;
  }
};

// 测试错误情况
const testErrorCases = async () => {
  log(colors.blue, '\n🚫 测试错误情况...');
  
  // 测试缺少参数
  try {
    log(colors.yellow, '测试缺少corpid参数...');
    const response = await axios.get(`${WECOM_CONFIG.baseUrl}/api/wecom/token`, {
      params: { corpsecret: WECOM_CONFIG.corpsecret }
    });
    console.log('响应:', response.data);
  } catch (error) {
    log(colors.red, `错误响应: ${error.response?.data?.error || error.message}`);
  }
  
  // 测试无效的access_token
  try {
    log(colors.yellow, '测试无效的access_token...');
    const response = await axios.post(`${WECOM_CONFIG.baseUrl}/api/wecom/send`, {
      access_token: 'invalid_token',
      agentid: WECOM_CONFIG.agentid,
      touser: '@all',
      msgtype: 'text',
      text: { content: '测试无效token' }
    });
    console.log('响应:', response.data);
  } catch (error) {
    log(colors.red, `错误响应: ${error.response?.data?.error || error.message}`);
  }
};

// 主测试函数
const runAllTests = async () => {
  log(colors.blue, '🚀 开始企业微信API测试...');
  log(colors.yellow, `企业ID: ${WECOM_CONFIG.corpid}`);
  log(colors.yellow, `应用ID: ${WECOM_CONFIG.agentid}`);
  log(colors.yellow, `测试服务器: ${WECOM_CONFIG.baseUrl}`);
  
  // 测试获取令牌
  const accessToken = await testGetToken();
  
  if (accessToken) {
    // 测试发送消息
    await testSendTextMessage(accessToken);
    await testSendCardMessage(accessToken);
    await testSendImageMessage(accessToken);
  }
  
  // 测试错误情况
  await testErrorCases();
  
  log(colors.blue, '\n🎉 测试完成！');
};

// 运行测试
runAllTests().catch(error => {
  log(colors.red, `❌ 测试运行失败: ${error.message}`);
}); 