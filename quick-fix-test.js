import axios from 'axios';

// 快速测试修复效果
async function quickTest() {
  console.log('🚀 快速测试企业微信API修复效果...\n');
  
  const tests = [
    {
      name: '基本API测试',
      url: 'https://nicole.xin/api/hello',
      method: 'GET'
    },
    {
      name: '企业微信Token测试',
      url: 'https://nicole.xin/api/wecom/token?corpid=ww30ead8f4b3e9e84d&corpsecret=ocrsCpRalvhbUSw9HVYrkFaoPZMIGh10VGDGl_hGbk',
      method: 'GET'
    }
  ];
  
  for (const test of tests) {
    console.log(`📋 测试: ${test.name}`);
    try {
      const response = await axios({
        method: test.method,
        url: test.url,
        timeout: 10000,
        headers: {
          'Origin': 'https://nicole.xin'
        }
      });
      
      console.log(`✅ 成功 (${response.status}):`, response.data);
    } catch (error) {
      console.log(`❌ 失败:`, {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
    }
    console.log('');
  }
  
  console.log('🎯 测试完成！如果看到成功响应，说明修复有效。');
  console.log('💡 如果仍有错误，请检查Vercel部署状态并重新部署。');
}

quickTest(); 