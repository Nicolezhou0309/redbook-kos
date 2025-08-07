import axios from 'axios';

// 颜色输出
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

// 配置
const CONFIG = {
  corpid: 'ww68a125fce698cb59',
  corpsecret: 'sXQeFCLDQJkwrX5lMWDzBTEIiHK1J7-a2e7chPyqYxY',
  agentid: '1000002',
  // 替换为你的实际Vercel域名
  vercelDomain: 'your-app.vercel.app'
};

// 诊断函数
const diagnoseVercelWeCom = async () => {
  log(colors.blue, '🔍 Vercel企业微信部署问题诊断\n');
  
  // 1. 检查本地连接
  log(colors.cyan, '1. 检查本地企业微信连接...');
  try {
    const localResponse = await axios.get('https://qyapi.weixin.qq.com/cgi-bin/gettoken', {
      params: {
        corpid: CONFIG.corpid,
        corpsecret: CONFIG.corpsecret
      }
    });
    
    if (localResponse.data.errcode === 0) {
      log(colors.green, '   ✅ 本地直接API调用成功');
      log(colors.green, `   ✅ 获取到访问令牌: ${localResponse.data.access_token.substring(0, 20)}...`);
    } else {
      log(colors.red, `   ❌ 本地API调用失败: ${localResponse.data.errmsg}`);
    }
  } catch (error) {
    log(colors.red, `   ❌ 本地API调用异常: ${error.message}`);
  }
  
  // 2. 检查Vercel API端点
  log(colors.cyan, '\n2. 检查Vercel API端点...');
  try {
    const vercelTokenResponse = await axios.get(`https://${CONFIG.vercelDomain}/api/wecom/token`, {
      params: {
        corpid: CONFIG.corpid,
        corpsecret: CONFIG.corpsecret
      }
    });
    
    console.log('   Vercel Token API响应:', vercelTokenResponse.data);
    
    if (vercelTokenResponse.data.errcode === 0) {
      log(colors.green, '   ✅ Vercel Token API工作正常');
      
      // 测试发送消息
      log(colors.cyan, '\n3. 测试Vercel消息发送...');
      try {
        const vercelSendResponse = await axios.post(`https://${CONFIG.vercelDomain}/api/wecom/send`, {
          access_token: vercelTokenResponse.data.access_token,
          agentid: CONFIG.agentid,
          touser: '@all',
          msgtype: 'text',
          text: { content: '这是一条来自Vercel的测试消息' }
        });
        
        console.log('   Vercel Send API响应:', vercelSendResponse.data);
        
        if (vercelSendResponse.data.errcode === 0) {
          log(colors.green, '   ✅ Vercel消息发送成功');
        } else {
          log(colors.red, `   ❌ Vercel消息发送失败: ${vercelSendResponse.data.errmsg}`);
        }
      } catch (sendError) {
        log(colors.red, `   ❌ Vercel消息发送异常: ${sendError.message}`);
      }
    } else {
      log(colors.red, `   ❌ Vercel Token API失败: ${vercelTokenResponse.data.errmsg}`);
    }
  } catch (error) {
    log(colors.red, `   ❌ Vercel API连接失败: ${error.message}`);
    
    if (error.code === 'ENOTFOUND') {
      log(colors.yellow, '   💡 请检查域名是否正确，或更新CONFIG.vercelDomain');
    } else if (error.response?.status === 404) {
      log(colors.yellow, '   💡 API端点不存在，请检查Vercel部署');
    } else if (error.response?.status === 500) {
      log(colors.yellow, '   💡 服务器内部错误，请检查Vercel函数日志');
    }
  }
  
  // 3. 检查CORS配置
  log(colors.cyan, '\n4. 检查CORS配置...');
  try {
    const corsResponse = await axios.options(`https://${CONFIG.vercelDomain}/api/wecom/token`);
    log(colors.green, '   ✅ CORS预检请求成功');
  } catch (error) {
    log(colors.red, `   ❌ CORS预检请求失败: ${error.message}`);
  }
  
  // 4. 提供解决方案
  log(colors.cyan, '\n5. 问题诊断和解决方案...');
  
  log(colors.yellow, '   📋 常见问题及解决方案:');
  log(colors.yellow, '   1. IP白名单问题:');
  log(colors.yellow, '      - 登录企业微信管理后台');
  log(colors.yellow, '      - 进入"应用管理" -> "应用"');
  log(colors.yellow, '      - 找到对应应用，点击"设置" -> "开发者接口"');
  log(colors.yellow, '      - 在"IP白名单"中添加Vercel的IP地址');
  
  log(colors.yellow, '\n   2. 域名配置问题:');
  log(colors.yellow, '      - 确保CONFIG.vercelDomain使用正确的域名');
  log(colors.yellow, '      - 检查Vercel部署是否成功');
  
  log(colors.yellow, '\n   3. API配置问题:');
  log(colors.yellow, '      - 检查企业微信应用的corpid、corpsecret、agentid');
  log(colors.yellow, '      - 确认应用已启用且有发送消息权限');
  
  log(colors.yellow, '\n   4. 网络连接问题:');
  log(colors.yellow, '      - 检查Vercel函数是否有网络访问限制');
  log(colors.yellow, '      - 确认企业微信API可以正常访问');
  
  // 5. 生成测试脚本
  log(colors.cyan, '\n6. 生成测试脚本...');
  console.log(`
// 测试脚本 - 请替换为你的实际域名
const testVercelWeCom = async () => {
  const domain = 'your-app.vercel.app'; // 替换为你的域名
  
  try {
    // 测试Token API
    const tokenResponse = await fetch(\`https://\${domain}/api/wecom/token?corpid=${CONFIG.corpid}&corpsecret=${CONFIG.corpsecret}\`);
    const tokenData = await tokenResponse.json();
    
    if (tokenData.errcode === 0) {
      console.log('✅ Token API成功');
      
      // 测试发送消息
      const sendResponse = await fetch(\`https://\${domain}/api/wecom/send\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: tokenData.access_token,
          agentid: '${CONFIG.agentid}',
          touser: '@all',
          msgtype: 'text',
          text: { content: '测试消息' }
        })
      });
      
      const sendData = await sendResponse.json();
      if (sendData.errcode === 0) {
        console.log('✅ 消息发送成功');
      } else {
        console.log('❌ 消息发送失败:', sendData.errmsg);
      }
    } else {
      console.log('❌ Token API失败:', tokenData.errmsg);
    }
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
};
  `);
  
  log(colors.blue, '\n🎯 诊断完成！请根据上述建议修复问题。');
};

// 运行诊断
diagnoseVercelWeCom().catch(error => {
  log(colors.red, `❌ 诊断失败: ${error.message}`);
}); 