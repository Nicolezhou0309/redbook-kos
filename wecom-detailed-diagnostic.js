import axios from 'axios';

// 测试颜色输出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
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

// 详细诊断函数
const detailedDiagnostic = async () => {
  log(colors.magenta, '🔍 企业微信详细诊断报告\n');
  
  // 1. 配置分析
  log(colors.cyan, '1. 配置信息分析');
  log(colors.yellow, `   企业ID: ${CURRENT_CONFIG.corpid}`);
  log(colors.yellow, `   应用密钥: ${CURRENT_CONFIG.corpsecret}`);
  log(colors.yellow, `   应用ID: ${CURRENT_CONFIG.agentid}`);
  
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
  
  // 2. 网络连接测试
  log(colors.cyan, '\n2. 网络连接测试');
  try {
    const response = await axios.get('https://qyapi.weixin.qq.com/cgi-bin/gettoken', {
      params: {
        corpid: 'test',
        corpsecret: 'test'
      },
      timeout: 5000
    });
    log(colors.green, '   ✅ 企业微信API服务器可访问');
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      log(colors.red, '   ❌ 网络连接超时');
    } else {
      log(colors.green, '   ✅ 企业微信API服务器可访问');
    }
  }
  
  // 3. 错误代码分析
  log(colors.cyan, '\n3. 错误代码分析');
  log(colors.yellow, '   当前错误: errcode 40001 - invalid credential');
  log(colors.blue, '   可能的原因:');
  log(colors.blue, '   1. 企业ID不正确');
  log(colors.blue, '   2. 应用密钥不正确');
  log(colors.blue, '   3. 应用密钥未启用');
  log(colors.blue, '   4. IP白名单限制');
  log(colors.blue, '   5. 应用权限不足');
  
  // 4. 解决方案
  log(colors.cyan, '\n4. 解决方案');
  log(colors.magenta, '   🔧 立即检查步骤:');
  log(colors.yellow, '   1. 登录企业微信管理后台: https://work.weixin.qq.com/wework_admin/');
  log(colors.yellow, '   2. 进入"应用管理" -> "应用"');
  log(colors.yellow, '   3. 找到应用ID为 1000110 的应用');
  log(colors.yellow, '   4. 点击应用名称进入详情页');
  log(colors.yellow, '   5. 检查以下信息:');
  
  log(colors.blue, '      📋 应用信息检查清单:');
  log(colors.blue, '      □ 企业ID是否与配置一致');
  log(colors.blue, '      □ 应用密钥是否正确');
  log(colors.blue, '      □ 应用ID是否为1000110');
  log(colors.blue, '      □ 应用是否已启用');
  log(colors.blue, '      □ 应用是否有发送消息权限');
  log(colors.blue, '      □ IP白名单是否包含当前IP');
  
  // 5. IP白名单配置
  log(colors.cyan, '\n5. IP白名单配置');
  log(colors.yellow, '   当前服务器IP: 114.86.91.106');
  log(colors.blue, '   配置步骤:');
  log(colors.blue, '   1. 进入应用详情页');
  log(colors.blue, '   2. 找到"IP白名单"设置');
  log(colors.blue, '   3. 添加IP: 114.86.91.106');
  log(colors.blue, '   4. 保存设置');
  
  // 6. 测试不同配置
  log(colors.cyan, '\n6. 测试建议');
  log(colors.yellow, '   建议测试以下配置组合:');
  
  const testConfigs = [
    {
      name: '当前配置',
      corpid: CURRENT_CONFIG.corpid,
      corpsecret: CURRENT_CONFIG.corpsecret,
      agentid: CURRENT_CONFIG.agentid
    },
    {
      name: '备用配置1',
      corpid: CURRENT_CONFIG.corpid,
      corpsecret: CURRENT_CONFIG.corpsecret,
      agentid: '1000002' // 默认应用ID
    },
    {
      name: '备用配置2',
      corpid: CURRENT_CONFIG.corpid,
      corpsecret: CURRENT_CONFIG.corpsecret,
      agentid: '1000003' // 另一个常见应用ID
    }
  ];
  
  for (const config of testConfigs) {
    log(colors.blue, `   ${config.name}:`);
    log(colors.blue, `     企业ID: ${config.corpid}`);
    log(colors.blue, `     应用密钥: ${config.corpsecret.substring(0, 8)}...`);
    log(colors.blue, `     应用ID: ${config.agentid}`);
  }
  
  // 7. 生成测试脚本
  log(colors.cyan, '\n7. 生成测试脚本');
  const testScript = `import axios from 'axios';

// 测试配置
const testConfigs = [
  {
    name: '当前配置',
    corpid: '${CURRENT_CONFIG.corpid}',
    corpsecret: '${CURRENT_CONFIG.corpsecret}',
    agentid: '${CURRENT_CONFIG.agentid}'
  },
  {
    name: '备用配置1',
    corpid: '${CURRENT_CONFIG.corpid}',
    corpsecret: '${CURRENT_CONFIG.corpsecret}',
    agentid: '1000002'
  },
  {
    name: '备用配置2',
    corpid: '${CURRENT_CONFIG.corpid}',
    corpsecret: '${CURRENT_CONFIG.corpsecret}',
    agentid: '1000003'
  }
];

const testConfig = async (config) => {
  console.log(\`\\n🧪 测试配置: \${config.name}\`);
  
  try {
    const response = await axios.get('https://qyapi.weixin.qq.com/cgi-bin/gettoken', {
      params: {
        corpid: config.corpid,
        corpsecret: config.corpsecret
      }
    });
    
    console.log('响应:', response.data);
    
    if (response.data.errcode === 0) {
      console.log('✅ 配置正确！');
      return response.data.access_token;
    } else {
      console.log(\`❌ 配置错误: \${response.data.errmsg}\`);
      return null;
    }
  } catch (error) {
    console.log(\`❌ 请求失败: \${error.message}\`);
    return null;
  }
};

// 测试所有配置
const runAllTests = async () => {
  for (const config of testConfigs) {
    await testConfig(config);
  }
};

runAllTests();
`;

  // 写入测试脚本
  const fs = await import('fs');
  fs.writeFileSync('test-all-configs.js', testScript);
  log(colors.green, '   ✅ 已生成测试脚本: test-all-configs.js');
  
  // 8. 联系支持
  log(colors.cyan, '\n8. 获取帮助');
  log(colors.yellow, '   如果问题持续存在，请:');
  log(colors.blue, '   1. 联系企业微信技术支持');
  log(colors.blue, '   2. 检查企业微信官方文档');
  log(colors.blue, '   3. 确认企业微信账号状态');
  
  log(colors.magenta, '\n🎯 诊断完成！请根据上述建议检查和修复配置。');
};

// 运行详细诊断
detailedDiagnostic().catch(error => {
  log(colors.red, `❌ 诊断失败: ${error.message}`);
}); 