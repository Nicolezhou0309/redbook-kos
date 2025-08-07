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

// 检查域名状态
const checkDomainStatus = async (domain) => {
  log(colors.blue, `\n🔍 检查域名: ${domain}`);
  
  try {
    // 检查HTTPS连接
    const httpsResponse = await axios.get(`https://${domain}`, {
      timeout: 5000,
      validateStatus: () => true
    });
    
    log(colors.green, `✅ HTTPS连接正常 (状态码: ${httpsResponse.status})`);
    
    // 检查SSL证书
    if (httpsResponse.status === 200) {
      log(colors.green, '✅ SSL证书有效');
    }
    
  } catch (error) {
    log(colors.red, `❌ HTTPS连接失败: ${error.message}`);
  }
  
  // 检查ICP备案（模拟）
  log(colors.yellow, '⚠️ ICP备案状态需要手动查询');
  log(colors.yellow, '   请访问: https://beian.miit.gov.cn/');
};

// 检查多个域名
const checkMultipleDomains = async () => {
  log(colors.blue, '🚀 开始检查域名状态...\n');
  
  const domains = [
    'localhost:3001',
    'your-domain.com',  // 替换为您的域名
    'work.weixin.qq.com'
  ];
  
  for (const domain of domains) {
    await checkDomainStatus(domain);
  }
  
  log(colors.cyan, '\n📋 企业微信可信域名配置建议:');
  log(colors.yellow, '1. 域名必须已完成ICP备案');
  log(colors.yellow, '2. 必须使用HTTPS协议');
  log(colors.yellow, '3. SSL证书必须有效');
  log(colors.yellow, '4. 域名所有权必须明确');
  
  log(colors.cyan, '\n🔧 配置步骤:');
  log(colors.yellow, '1. 登录企业微信管理后台');
  log(colors.yellow, '2. 进入"应用管理" → 选择应用');
  log(colors.yellow, '3. 找到"可信域名"设置');
  log(colors.yellow, '4. 添加已备案的HTTPS域名');
  log(colors.yellow, '5. 保存配置');
  
  log(colors.cyan, '\n💡 替代方案:');
  log(colors.yellow, '• 使用已备案的第三方域名');
  log(colors.yellow, '• 使用企业微信官方域名');
  log(colors.yellow, '• 申请ICP备案');
  
  log(colors.blue, '\n🎯 域名检查完成！');
};

// 运行检查
checkMultipleDomains().catch(error => {
  log(colors.red, `❌ 检查失败: ${error.message}`);
}); 