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

// 当前配置
const CURRENT_CONFIG = {
  corpid: 'ww30ead8f4b3e9e84d',
  corpsecret: 'ocrsCpRalvhbUSw9HVYrkFaoPZMIGh10VGDGl_hGbk',
  agentid: '1000110'
};

// 诊断函数
const diagnoseWeComConfig = async () => {
  log(colors.blue, '🔍 企业微信配置诊断开始...\n');
  
  // 1. 检查配置格式
  log(colors.cyan, '1. 检查配置格式...');
  log(colors.yellow, `   企业ID (corpid): ${CURRENT_CONFIG.corpid}`);
  log(colors.yellow, `   应用密钥 (corpsecret): ${CURRENT_CONFIG.corpsecret.substring(0, 8)}...`);
  log(colors.yellow, `   应用ID (agentid): ${CURRENT_CONFIG.agentid}`);
  
  // 检查corpid格式
  if (CURRENT_CONFIG.corpid.startsWith('ww') && CURRENT_CONFIG.corpid.length >= 18) {
    log(colors.green, '   ✅ 企业ID格式正确');
  } else {
    log(colors.red, '   ❌ 企业ID格式可能不正确');
  }
  
  // 检查corpsecret格式
  if (CURRENT_CONFIG.corpsecret.length >= 32) {
    log(colors.green, '   ✅ 应用密钥长度正常');
  } else {
    log(colors.red, '   ❌ 应用密钥长度可能不正确');
  }
  
  // 2. 测试直接API调用
  log(colors.cyan, '\n2. 测试直接API调用...');
  try {
    const response = await axios.get('https://qyapi.weixin.qq.com/cgi-bin/gettoken', {
      params: {
        corpid: CURRENT_CONFIG.corpid,
        corpsecret: CURRENT_CONFIG.corpsecret
      }
    });
    
    console.log('   响应数据:', response.data);
    
    if (response.data.errcode === 0) {
      log(colors.green, '   ✅ 直接API调用成功！');
      log(colors.green, `   ✅ 获取到访问令牌: ${response.data.access_token.substring(0, 20)}...`);
    } else {
      log(colors.red, `   ❌ API调用失败: ${response.data.errmsg}`);
      
      // 分析错误原因
      switch (response.data.errcode) {
        case 40001:
          log(colors.red, '   💡 错误原因: 无效的凭证');
          log(colors.yellow, '   🔧 解决方案:');
          log(colors.yellow, '      1. 检查企业ID和应用密钥是否正确');
          log(colors.yellow, '      2. 确认应用密钥是否已启用');
          log(colors.yellow, '      3. 检查IP白名单设置');
          break;
        case 40013:
          log(colors.red, '   💡 错误原因: 无效的企业ID');
          log(colors.yellow, '   🔧 解决方案: 检查企业ID是否正确');
          break;
        case 40018:
          log(colors.red, '   💡 错误原因: 无效的应用密钥');
          log(colors.yellow, '   🔧 解决方案: 检查应用密钥是否正确');
          break;
        default:
          log(colors.red, `   💡 未知错误代码: ${response.data.errcode}`);
      }
    }
  } catch (error) {
    log(colors.red, `   ❌ 网络请求失败: ${error.message}`);
  }
  
  // 3. 检查代理服务器
  log(colors.cyan, '\n3. 检查代理服务器...');
  try {
    const response = await axios.get('http://localhost:3001/api/wecom/token', {
      params: {
        corpid: CURRENT_CONFIG.corpid,
        corpsecret: CURRENT_CONFIG.corpsecret
      }
    });
    
    console.log('   代理响应:', response.data);
    
    if (response.data.errcode === 0) {
      log(colors.green, '   ✅ 代理服务器工作正常');
    } else {
      log(colors.red, `   ❌ 代理服务器返回错误: ${response.data.errmsg}`);
    }
  } catch (error) {
    log(colors.red, `   ❌ 代理服务器连接失败: ${error.message}`);
    log(colors.yellow, '   💡 请确保代理服务器正在运行 (node server.js)');
  }
  
  // 4. 提供修复建议
  log(colors.cyan, '\n4. 修复建议...');
  log(colors.yellow, '   📋 请按以下步骤检查和修复:');
  log(colors.yellow, '   1. 登录企业微信管理后台');
  log(colors.yellow, '   2. 进入"应用管理" -> "应用"');
  log(colors.yellow, '   3. 找到对应的应用，检查以下信息:');
  log(colors.yellow, '      - 企业ID (corpid)');
  log(colors.yellow, '      - 应用密钥 (corpsecret)');
  log(colors.yellow, '      - 应用ID (agentid)');
  log(colors.yellow, '   4. 检查应用是否已启用');
  log(colors.yellow, '   5. 检查IP白名单设置');
  log(colors.yellow, '   6. 确认应用有发送消息的权限');
  
  // 5. 生成测试配置
  log(colors.cyan, '\n5. 生成测试配置...');
  log(colors.blue, '   请将以下配置更新到您的应用中:');
  console.log(`
// 更新后的配置示例
const UPDATED_CONFIG = {
  corpid: 'YOUR_CORRECT_CORPID',
  corpsecret: 'YOUR_CORRECT_CORPSECRET',
  agentid: 'YOUR_CORRECT_AGENTID'
};

// 测试脚本
const testConfig = async () => {
  const response = await axios.get('https://qyapi.weixin.qq.com/cgi-bin/gettoken', {
    params: {
      corpid: UPDATED_CONFIG.corpid,
      corpsecret: UPDATED_CONFIG.corpsecret
    }
  });
  
  if (response.data.errcode === 0) {
    console.log('✅ 配置正确！');
    return response.data.access_token;
  } else {
    console.log('❌ 配置错误:', response.data.errmsg);
    return null;
  }
};
  `);
  
  log(colors.blue, '\n🎯 诊断完成！请根据上述建议修复配置。');
};

// 运行诊断
diagnoseWeComConfig().catch(error => {
  log(colors.red, `❌ 诊断失败: ${error.message}`);
}); 