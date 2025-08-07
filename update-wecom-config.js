import fs from 'fs';
import path from 'path';

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

// 当前配置
const CURRENT_CONFIG = {
  corpid: 'ww30ead8f4b3e9e84d',
  corpsecret: 'ocrsCpRalvhbUSw9HVYrkFaoPZMIGh10VGDGl_hGbk',
  agentid: '1000110'
};

// 更新配置函数
const updateWeComConfig = () => {
  log(colors.blue, '🔧 企业微信配置更新工具\n');
  
  log(colors.cyan, '📋 当前配置:');
  log(colors.yellow, `   企业ID: ${CURRENT_CONFIG.corpid}`);
  log(colors.yellow, `   应用密钥: ${CURRENT_CONFIG.corpsecret.substring(0, 8)}...`);
  log(colors.yellow, `   应用ID: ${CURRENT_CONFIG.agentid}`);
  
  log(colors.cyan, '\n📝 请按以下步骤获取正确的配置信息:');
  log(colors.yellow, '1. 登录企业微信管理后台: https://work.weixin.qq.com/wework_admin/');
  log(colors.yellow, '2. 进入"应用管理" -> "应用"');
  log(colors.yellow, '3. 找到您要使用的应用');
  log(colors.yellow, '4. 点击应用名称进入详情页');
  log(colors.yellow, '5. 在"应用信息"中获取以下信息:');
  log(colors.yellow, '   - 企业ID (corpid)');
  log(colors.yellow, '   - 应用密钥 (corpsecret)');
  log(colors.yellow, '   - 应用ID (agentid)');
  
  log(colors.cyan, '\n🔧 配置更新方法:');
  log(colors.yellow, '方法1: 直接修改测试脚本');
  log(colors.blue, '   编辑 test-wecom-complete.js 文件，更新 WECOM_CONFIG 对象');
  
  log(colors.yellow, '\n方法2: 创建环境变量文件');
  log(colors.blue, '   创建 .env 文件，添加以下内容:');
  console.log(`
# 企业微信配置
WECOM_CORPID=your_correct_corpid
WECOM_CORPSECRET=your_correct_corpsecret
WECOM_AGENTID=your_correct_agentid
  `);
  
  log(colors.yellow, '\n方法3: 使用配置对象');
  log(colors.blue, '   在您的应用代码中使用以下配置对象:');
  console.log(`
const wecomConfig = {
  corpid: process.env.WECOM_CORPID || 'your_correct_corpid',
  corpsecret: process.env.WECOM_CORPSECRET || 'your_correct_corpsecret',
  agentid: process.env.WECOM_AGENTID || 'your_correct_agentid'
};
  `);
  
  // 生成更新后的测试脚本
  log(colors.cyan, '\n📄 生成更新后的测试脚本...');
  const updatedTestScript = `import axios from 'axios';

// 更新后的企业微信配置 - 请填入正确的值
const WECOM_CONFIG = {
  corpid: 'YOUR_CORRECT_CORPID', // 请替换为正确的企业ID
  corpsecret: 'YOUR_CORRECT_CORPSECRET', // 请替换为正确的应用密钥
  agentid: 'YOUR_CORRECT_AGENTID', // 请替换为正确的应用ID
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
        content: \`🧪 企业微信测试消息\\n时间: \${new Date().toLocaleString()}\\n配置更新成功！\` 
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

  // 写入更新后的测试脚本
  fs.writeFileSync('test-wecom-updated.js', updatedTestScript);
  log(colors.green, '✅ 已生成更新后的测试脚本: test-wecom-updated.js');
  
  log(colors.cyan, '\n📋 使用说明:');
  log(colors.yellow, '1. 编辑 test-wecom-updated.js 文件');
  log(colors.yellow, '2. 将 YOUR_CORRECT_CORPID 替换为正确的企业ID');
  log(colors.yellow, '3. 将 YOUR_CORRECT_CORPSECRET 替换为正确的应用密钥');
  log(colors.yellow, '4. 将 YOUR_CORRECT_AGENTID 替换为正确的应用ID');
  log(colors.yellow, '5. 运行测试: node test-wecom-updated.js');
  
  log(colors.blue, '\n🎯 配置更新完成！请根据上述说明更新配置信息。');
};

// 运行配置更新
updateWeComConfig(); 