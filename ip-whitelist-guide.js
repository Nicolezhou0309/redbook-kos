import axios from 'axios';

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

// 获取当前IP地址
const getCurrentIP = async () => {
  log(colors.blue, '🌐 获取当前服务器IP地址...');
  
  try {
    const response = await axios.get('https://api.ipify.org?format=json');
    const ip = response.data.ip;
    log(colors.green, `✅ 当前公网IP: ${ip}`);
    return ip;
  } catch (error) {
    log(colors.red, `❌ 获取IP失败: ${error.message}`);
    return null;
  }
};

// 获取企业微信API看到的IP
const getWeComIP = async () => {
  log(colors.blue, '\n🔍 获取企业微信API看到的IP地址...');
  
  try {
    const response = await axios.get('https://qyapi.weixin.qq.com/cgi-bin/gettoken', {
      params: {
        corpid: 'ww68a125fce698cb59',
        corpsecret: 'sXQeFCLDQJkwrX5lMWDzBTEIiHK1J7-a2e7chPyqYxY'
      }
    });
    
    // 从错误信息中提取IP
    if (response.data.errcode === 60020) {
      const ipMatch = response.data.errmsg.match(/from ip: ([0-9.]+)/);
      if (ipMatch) {
        const ip = ipMatch[1];
        log(colors.green, `✅ 企业微信API看到的IP: ${ip}`);
        return ip;
      }
    }
    
    log(colors.yellow, '⚠️ 无法从API响应中获取IP');
    return null;
  } catch (error) {
    log(colors.red, `❌ 获取企业微信IP失败: ${error.message}`);
    return null;
  }
};

// 显示IP白名单配置指南
const showIPWhitelistGuide = (currentIP, wecomIP) => {
  log(colors.blue, '\n📋 IP白名单配置指南');
  
  log(colors.cyan, '\n🔧 配置步骤:');
  log(colors.yellow, '1. 登录企业微信管理后台');
  log(colors.yellow, '   https://work.weixin.qq.com/wework_admin/');
  log(colors.yellow, '2. 进入"应用管理" → "应用"');
  log(colors.yellow, '3. 找到应用ID: 1000002');
  log(colors.yellow, '4. 点击应用名称进入详情页');
  log(colors.yellow, '5. 找到"IP白名单"设置');
  log(colors.yellow, '6. 添加以下IP地址:');
  
  if (wecomIP) {
    log(colors.green, `   • ${wecomIP} (企业微信API看到的IP)`);
  }
  if (currentIP) {
    log(colors.green, `   • ${currentIP} (当前公网IP)`);
  }
  
  log(colors.yellow, '7. 点击"保存"按钮');
  
  log(colors.cyan, '\n💡 配置建议:');
  log(colors.yellow, '• 建议同时添加两个IP地址');
  log(colors.yellow, '• 如果只有一个IP，优先使用企业微信API看到的IP');
  log(colors.yellow, '• 配置后需要等待几分钟生效');
  
  log(colors.cyan, '\n⚠️ 注意事项:');
  log(colors.yellow, '• IP白名单是应用级别的设置');
  log(colors.yellow, '• 每个应用都需要单独配置');
  log(colors.yellow, '• 支持添加多个IP地址');
  log(colors.yellow, '• 配置错误会导致API调用失败');
  
  log(colors.cyan, '\n🔍 验证配置:');
  log(colors.yellow, '配置完成后，可以运行以下命令验证:');
  log(colors.blue, '   node test-wecom-new-agent-final.js');
  
  log(colors.blue, '\n🎯 IP白名单配置指南完成！');
};

// 主函数
const main = async () => {
  log(colors.blue, '🚀 开始IP白名单配置分析...\n');
  
  // 获取IP地址
  const currentIP = await getCurrentIP();
  const wecomIP = await getWeComIP();
  
  // 显示配置指南
  showIPWhitelistGuide(currentIP, wecomIP);
  
  // 创建配置脚本
  log(colors.cyan, '\n📄 生成配置脚本...');
  const configScript = `// IP白名单配置脚本
const IP_WHITELIST_CONFIG = {
  currentIP: '${currentIP || '未知'}',
  wecomIP: '${wecomIP || '未知'}',
  applicationID: '1000002',
  adminURL: 'https://work.weixin.qq.com/wework_admin/'
};

console.log('IP白名单配置信息:');
console.log('当前公网IP:', IP_WHITELIST_CONFIG.currentIP);
console.log('企业微信API IP:', IP_WHITELIST_CONFIG.wecomIP);
console.log('应用ID:', IP_WHITELIST_CONFIG.applicationID);
console.log('管理后台:', IP_WHITELIST_CONFIG.adminURL);
`;

  require('fs').writeFileSync('ip-whitelist-config.js', configScript);
  log(colors.green, '✅ 已生成 ip-whitelist-config.js');
};

// 运行主函数
main().catch(error => {
  log(colors.red, `❌ 执行失败: ${error.message}`);
}); 