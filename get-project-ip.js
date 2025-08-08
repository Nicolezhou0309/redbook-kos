import axios from 'axios';
import dns from 'dns';
import { promisify } from 'util';

const resolve4 = promisify(dns.resolve4);
const resolve6 = promisify(dns.resolve6);

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

// 获取项目IP地址的函数
const getProjectIP = async (domain) => {
  log(colors.blue, `🔍 正在获取域名 ${domain} 的IP地址...\n`);
  
  try {
    // 方法1: 使用DNS解析
    log(colors.cyan, '1. 使用DNS解析获取IP地址...');
    
    try {
      const ipv4Addresses = await resolve4(domain);
      log(colors.green, `   ✅ IPv4地址:`);
      ipv4Addresses.forEach((ip, index) => {
        log(colors.green, `      ${index + 1}. ${ip}`);
      });
    } catch (error) {
      log(colors.yellow, `   ⚠️  IPv4解析失败: ${error.message}`);
    }
    
    try {
      const ipv6Addresses = await resolve6(domain);
      log(colors.green, `   ✅ IPv6地址:`);
      ipv6Addresses.forEach((ip, index) => {
        log(colors.green, `      ${index + 1}. ${ip}`);
      });
    } catch (error) {
      log(colors.yellow, `   ⚠️  IPv6解析失败: ${error.message}`);
    }
    
    // 方法2: 使用在线服务获取IP
    log(colors.cyan, '\n2. 使用在线服务获取IP地址...');
    try {
      const response = await axios.get(`https://dns.google/resolve?name=${domain}&type=A`);
      if (response.data.Answer) {
        log(colors.green, '   ✅ Google DNS解析结果:');
        response.data.Answer.forEach((answer, index) => {
          log(colors.green, `      ${index + 1}. ${answer.data}`);
        });
      }
    } catch (error) {
      log(colors.red, `   ❌ Google DNS查询失败: ${error.message}`);
    }
    
    // 方法3: 检查Vercel函数日志中的IP
    log(colors.cyan, '\n3. 检查Vercel函数日志...');
    log(colors.yellow, '   📋 请按以下步骤查看Vercel函数日志:');
    log(colors.yellow, '   1. 登录Vercel仪表板 (https://vercel.com/dashboard)');
    log(colors.yellow, '   2. 选择你的项目');
    log(colors.yellow, '   3. 点击"Functions"标签');
    log(colors.yellow, '   4. 找到 /api/wecom/token 函数');
    log(colors.yellow, '   5. 点击查看日志，寻找请求的IP地址');
    
    // 方法4: 使用curl命令
    log(colors.cyan, '\n4. 使用命令行工具...');
    console.log(`
   💡 你也可以使用以下命令手动获取IP:
   
   # 使用nslookup
   nslookup ${domain}
   
   # 使用dig
   dig ${domain}
   
   # 使用host
   host ${domain}
   
   # 使用ping (会显示IP)
   ping ${domain}
   `);
    
    // 方法5: 提供企业微信配置建议
    log(colors.cyan, '\n5. 企业微信IP白名单配置建议...');
    log(colors.yellow, '   📋 获取到IP地址后，请按以下步骤配置:');
    log(colors.yellow, '   1. 登录企业微信管理后台');
    log(colors.yellow, '   2. 进入"应用管理" -> "应用"');
    log(colors.yellow, '   3. 找到你的应用，点击"设置"');
    log(colors.yellow, '   4. 选择"开发者接口"');
    log(colors.yellow, '   5. 在"IP白名单"中添加上述IP地址');
    log(colors.yellow, '   6. 保存设置');
    
    // 方法6: 提供测试脚本
    log(colors.cyan, '\n6. 生成测试脚本...');
    console.log(`
// 测试企业微信API连接
const testWeComConnection = async () => {
  const domain = '${domain}';
  
  try {
    console.log('🧪 测试企业微信API连接...');
    
    // 测试Token API
    const tokenResponse = await fetch(\`https://\${domain}/api/wecom/token?corpid=ww68a125fce698cb59&corpsecret=sXQeFCLDQJkwrX5lMWDzBTEIiHK1J7-a2e7chPyqYxY\`);
    const tokenData = await tokenResponse.json();
    
    console.log('Token API响应:', tokenData);
    
    if (tokenData.errcode === 0) {
      console.log('✅ Token API成功');
      
      // 测试发送消息
      const sendResponse = await fetch(\`https://\${domain}/api/wecom/send\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: tokenData.access_token,
          agentid: '1000002',
          touser: '@all',
          msgtype: 'text',
          text: { content: '测试消息' }
        })
      });
      
      const sendData = await sendResponse.json();
      console.log('Send API响应:', sendData);
      
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

// 运行测试
testWeComConnection();
   `);
    
  } catch (error) {
    log(colors.red, `❌ 获取IP地址失败: ${error.message}`);
  }
};

// 主函数
const main = async () => {
  // 从命令行参数获取域名，如果没有提供则使用默认值
  const domain = process.argv[2] || 'your-app.vercel.app';
  
  if (domain === 'your-app.vercel.app') {
    log(colors.yellow, '⚠️  请提供你的实际Vercel域名');
    log(colors.yellow, '   使用方法: node get-project-ip.js your-app.vercel.app');
    log(colors.yellow, '   或者直接修改脚本中的默认域名');
    console.log('');
  }
  
  await getProjectIP(domain);
  
  log(colors.blue, '\n🎯 完成！请根据上述信息配置企业微信IP白名单。');
};

// 运行主函数
main().catch(error => {
  log(colors.red, `❌ 脚本执行失败: ${error.message}`);
}); 