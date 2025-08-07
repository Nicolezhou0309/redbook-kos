import axios from 'axios';

// 测试不同的企业微信配置
const testConfigs = [
  {
    name: '新配置',
    corpid: 'ww68a125fce698cb59',
    corpsecret: 'sXQeFCLDQJkwrX5lMWDzBTEIiHK1J7-a2e7chPyqYxY'
  },
  {
    name: '旧配置（备用）',
    corpid: 'ww30ead8f4b3e9e84d',
    corpsecret: 'ocrsCpRalvhbUSw9HVYrkFaoPZMIGh10VGDGl_hGbk'
  }
];

async function testWeChatCredentials() {
  console.log('🔍 验证企业微信凭证...\n');
  
  for (const config of testConfigs) {
    try {
      console.log(`📋 测试配置: ${config.name}`);
      console.log(`CorpId: ${config.corpid}`);
      console.log(`CorpSecret: ${config.corpsecret.substring(0, 10)}...`);
      
      const response = await axios.get('https://qyapi.weixin.qq.com/cgi-bin/gettoken', {
        params: {
          corpid: config.corpid,
          corpsecret: config.corpsecret
        }
      });
      
      console.log('✅ 响应:', response.data);
      
      if (response.data.errcode === 0) {
        console.log('🎉 凭证有效！');
        return config;
      } else {
        console.log(`❌ 凭证无效: ${response.data.errmsg}`);
      }
      
    } catch (error) {
      console.error(`❌ 请求失败:`, error.response?.data || error.message);
    }
    
    console.log('\n' + '-'.repeat(50) + '\n');
  }
  
  return null;
}

// 检查企业微信应用配置
async function checkWeChatAppConfig() {
  console.log('🔍 检查企业微信应用配置...\n');
  
  console.log('请检查以下配置：');
  console.log('1. 登录企业微信管理后台');
  console.log('2. 进入"应用管理" -> "应用"');
  console.log('3. 找到你的应用（AgentId: 1000110）');
  console.log('4. 检查以下信息：');
  console.log('   - 应用是否已启用');
  console.log('   - 应用权限是否正确');
  console.log('   - CorpSecret是否是最新的');
  console.log('   - 应用可见范围是否正确');
  console.log('5. 如果CorpSecret已过期，请重新生成');
}

async function main() {
  const validConfig = await testWeChatCredentials();
  
  if (!validConfig) {
    console.log('\n⚠️ 所有配置都无效，请检查企业微信应用配置');
    await checkWeChatAppConfig();
  } else {
    console.log('\n✅ 找到有效配置:', validConfig.name);
  }
}

main().catch(console.error); 