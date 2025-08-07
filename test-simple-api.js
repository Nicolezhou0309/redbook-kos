import axios from 'axios';

// 测试简化后的API
async function testSimpleAPI() {
  console.log('🔍 测试简化后的API...\n');
  
  const tests = [
    {
      name: '基本测试API',
      url: 'https://nicole.xin/api/test',
      method: 'GET'
    },
    {
      name: '简化企业微信Token API',
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
  
  console.log('🎯 测试完成！');
}

testSimpleAPI(); 