import fs from 'fs';

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

// 有效的企业微信配置
const VALID_CONFIG = {
  corpid: 'ww68a125fce698cb59',
  corpsecret: 'sXQeFCLDQJkwrX5lMWDzBTEIiHK1J7-a2e7chPyqYxY',
  agentid: '1000110'
};

// 更新配置文件
const updateConfigFiles = () => {
  log(colors.blue, '🔧 更新企业微信配置...\n');
  
  // 1. 更新测试脚本
  log(colors.cyan, '1. 更新测试脚本...');
  const updatedTestScript = `import axios from 'axios';

// 有效的企业微信配置
const WECOM_CONFIG = {
  corpid: '${VALID_CONFIG.corpid}',
  corpsecret: '${VALID_CONFIG.corpsecret}',
  agentid: '${VALID_CONFIG.agentid}',
  baseUrl: 'http://localhost:3001'
};

// 测试颜色输出
const colors = {
  green: '\\x1b[32m',
  red: '\\x1b[31m',
  yellow: '\\x1b[33m',
  blue: '\\x1b[34m',
  reset: '\\x1b[0m'
};

const log = (color, message) => {
  console.log(\`\${color}\${message}\${colors.reset}\`);
};

// 测试获取访问令牌
const testGetToken = async () => {
  log(colors.blue, '🔑 测试获取企业微信访问令牌...');
  
  try {
    const response = await axios.get(\`\${WECOM_CONFIG.baseUrl}/api/wecom/token\`, {
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
      log(colors.red, \`❌ 访问令牌获取失败: \${response.data.errmsg}\`);
      return null;
    }
  } catch (error) {
    log(colors.red, \`❌ 请求失败: \${error.message}\`);
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
        content: \`🧪 企业微信测试消息\\n时间: \${new Date().toLocaleString()}\\n配置已更新！\` 
      }
    };
    
    const response = await axios.post(\`\${WECOM_CONFIG.baseUrl}/api/wecom/send\`, message);
    
    console.log('响应数据:', response.data);
    
    if (response.data.errcode === 0) {
      log(colors.green, '✅ 消息发送成功！');
      return true;
    } else {
      log(colors.red, \`❌ 消息发送失败: \${response.data.errmsg}\`);
      return false;
    }
  } catch (error) {
    log(colors.red, \`❌ 请求失败: \${error.message}\`);
    return false;
  }
};

// 主测试函数
const runTest = async () => {
  log(colors.blue, '🚀 开始企业微信API测试...');
  log(colors.yellow, \`企业ID: \${WECOM_CONFIG.corpid}\`);
  log(colors.yellow, \`应用ID: \${WECOM_CONFIG.agentid}\`);
  
  const accessToken = await testGetToken();
  
  if (accessToken) {
    await testSendMessage(accessToken);
  }
  
  log(colors.blue, '\\n🎉 测试完成！');
};

// 运行测试
runTest().catch(error => {
  log(colors.red, \`❌ 测试运行失败: \${error.message}\`);
});
`;

  fs.writeFileSync('test-wecom-final.js', updatedTestScript);
  log(colors.green, '✅ 已更新 test-wecom-final.js');
  
  // 2. 更新环境变量文件
  log(colors.cyan, '\n2. 更新环境变量文件...');
  const envContent = `# 企业微信配置
WECOM_CORPID=${VALID_CONFIG.corpid}
WECOM_CORPSECRET=${VALID_CONFIG.corpsecret}
WECOM_AGENTID=${VALID_CONFIG.agentid}

# Supabase配置
VITE_SUPABASE_URL=https://nemmkwzijaaadrzwrtyg.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lbW1rd3ppamFhYWRyendydHlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzOTk1MTksImV4cCI6MjA2OTk3NTUxOX0.alaL5ekLNXE1c499utZpzvhB2Ix0y9q5bLlXCHJGS-s
`;

  fs.writeFileSync('.env', envContent);
  log(colors.green, '✅ 已更新 .env 文件');
  
  // 3. 更新API文件
  log(colors.cyan, '\n3. 更新API配置文件...');
  const apiConfigContent = `// 企业微信API配置
export const WECOM_CONFIG = {
  corpid: '${VALID_CONFIG.corpid}',
  corpsecret: '${VALID_CONFIG.corpsecret}',
  agentid: '${VALID_CONFIG.agentid}'
};

// 获取访问令牌
export const getWeComToken = async () => {
  try {
    const response = await fetch(\`/api/wecom/token?corpid=\${WECOM_CONFIG.corpid}&corpsecret=\${WECOM_CONFIG.corpsecret}\`);
    const data = await response.json();
    
    if (data.errcode === 0) {
      return data.access_token;
    } else {
      throw new Error(data.errmsg);
    }
  } catch (error) {
    console.error('获取企业微信令牌失败:', error);
    throw error;
  }
};

// 发送消息
export const sendWeComMessage = async (accessToken, message) => {
  try {
    const response = await fetch('/api/wecom/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        access_token: accessToken,
        ...message
      })
    });
    
    const data = await response.json();
    
    if (data.errcode === 0) {
      return data;
    } else {
      throw new Error(data.errmsg);
    }
  } catch (error) {
    console.error('发送企业微信消息失败:', error);
    throw error;
  }
};
`;

  fs.writeFileSync('src/lib/wecomApi.ts', apiConfigContent);
  log(colors.green, '✅ 已更新 src/lib/wecomApi.ts');
  
  // 4. 创建使用示例
  log(colors.cyan, '\n4. 创建使用示例...');
  const usageExample = `// 企业微信API使用示例
import { getWeComToken, sendWeComMessage } from './src/lib/wecomApi';

// 使用示例
const sendTestMessage = async () => {
  try {
    // 1. 获取访问令牌
    const accessToken = await getWeComToken();
    console.log('获取到访问令牌:', accessToken);
    
    // 2. 发送文本消息
    const message = {
      agentid: '${VALID_CONFIG.agentid}',
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
`;

  fs.writeFileSync('wecom-usage-example.js', usageExample);
  log(colors.green, '✅ 已创建 wecom-usage-example.js');
  
  // 5. 显示配置信息
  log(colors.cyan, '\n📋 配置信息总结:');
  log(colors.yellow, `企业ID: ${VALID_CONFIG.corpid}`);
  log(colors.yellow, `应用密钥: ${VALID_CONFIG.corpsecret.substring(0, 8)}...`);
  log(colors.yellow, `应用ID: ${VALID_CONFIG.agentid}`);
  
  log(colors.cyan, '\n📁 已更新的文件:');
  log(colors.green, '✅ test-wecom-final.js - 最终测试脚本');
  log(colors.green, '✅ .env - 环境变量配置');
  log(colors.green, '✅ src/lib/wecomApi.ts - API配置文件');
  log(colors.green, '✅ wecom-usage-example.js - 使用示例');
  
  log(colors.cyan, '\n🚀 使用说明:');
  log(colors.yellow, '1. 启动服务器: node server.js');
  log(colors.yellow, '2. 运行测试: node test-wecom-final.js');
  log(colors.yellow, '3. 查看示例: node wecom-usage-example.js');
  
  log(colors.blue, '\n🎯 配置更新完成！企业微信API现在应该可以正常工作了。');
};

// 运行配置更新
updateConfigFiles(); 