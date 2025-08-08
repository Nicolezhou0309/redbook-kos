import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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

// 获取IP地址的函数
const getIPAddress = async (domain) => {
  log(colors.blue, `🔍 获取域名 ${domain} 的IP地址...\n`);
  
  try {
    // 使用nslookup
    log(colors.cyan, '1. 使用 nslookup 获取IP:');
    try {
      const { stdout: nslookupOutput } = await execAsync(`nslookup ${domain}`);
      console.log(nslookupOutput);
    } catch (error) {
      log(colors.red, `   ❌ nslookup失败: ${error.message}`);
    }
    
    // 使用dig
    log(colors.cyan, '\n2. 使用 dig 获取IP:');
    try {
      const { stdout: digOutput } = await execAsync(`dig ${domain} +short`);
      if (digOutput.trim()) {
        log(colors.green, '   ✅ IP地址:');
        digOutput.trim().split('\n').forEach((ip, index) => {
          if (ip) log(colors.green, `      ${index + 1}. ${ip}`);
        });
      } else {
        log(colors.yellow, '   ⚠️  没有找到IP地址');
      }
    } catch (error) {
      log(colors.red, `   ❌ dig失败: ${error.message}`);
    }
    
    // 使用ping获取IP
    log(colors.cyan, '\n3. 使用 ping 获取IP:');
    try {
      const { stdout: pingOutput } = await execAsync(`ping -c 1 ${domain}`);
      const ipMatch = pingOutput.match(/PING [^(]+\(([^)]+)\)/);
      if (ipMatch) {
        log(colors.green, `   ✅ Ping IP: ${ipMatch[1]}`);
      } else {
        log(colors.yellow, '   ⚠️  无法从ping输出中提取IP');
      }
    } catch (error) {
      log(colors.red, `   ❌ ping失败: ${error.message}`);
    }
    
    // 提供企业微信配置指导
    log(colors.cyan, '\n4. 企业微信IP白名单配置指导:');
    log(colors.yellow, '   📋 请将上述IP地址添加到企业微信IP白名单:');
    log(colors.yellow, '   1. 登录企业微信管理后台');
    log(colors.yellow, '   2. 进入"应用管理" -> "应用"');
    log(colors.yellow, '   3. 找到你的应用，点击"设置"');
    log(colors.yellow, '   4. 选择"开发者接口"');
    log(colors.yellow, '   5. 在"IP白名单"中添加上述IP地址');
    log(colors.yellow, '   6. 保存设置');
    
    // 提供测试命令
    log(colors.cyan, '\n5. 测试命令:');
    console.log(`
   💡 你可以使用以下命令测试企业微信API:
   
   # 测试Token API
   curl "https://${domain}/api/wecom/token?corpid=ww68a125fce698cb59&corpsecret=sXQeFCLDQJkwrX5lMWDzBTEIiHK1J7-a2e7chPyqYxY"
   
   # 测试CORS
   curl -X OPTIONS "https://${domain}/api/wecom/token" -H "Origin: https://${domain}"
   `);
    
  } catch (error) {
    log(colors.red, `❌ 获取IP地址失败: ${error.message}`);
  }
};

// 主函数
const main = async () => {
  const domain = process.argv[2];
  
  if (!domain) {
    log(colors.red, '❌ 请提供域名参数');
    log(colors.yellow, '   使用方法: node quick-ip-check.js your-app.vercel.app');
    process.exit(1);
  }
  
  await getIPAddress(domain);
  
  log(colors.blue, '\n🎯 完成！请根据上述IP地址配置企业微信白名单。');
};

// 运行主函数
main().catch(error => {
  log(colors.red, `❌ 脚本执行失败: ${error.message}`);
}); 