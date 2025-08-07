import axios from 'axios';

// 测试基本API
async function testBasicAPI() {
  console.log('🔍 测试基本API...\n');
  
  const tests = [
    {
      name: '基本JavaScript API',
      url: 'https://nicole.xin/api/basic',
      method: 'GET'
    },
    {
      name: '测试API',
      url: 'https://nicole.xin/api/test',
      method: 'GET'
    },
    {
      name: 'Hello API',
      url: 'https://nicole.xin/api/hello',
      method: 'GET'
    }
  ];
  
  for (const test of tests) {
    console.log(`📋 测试: ${test.name}`);
    try {
      const response = await axios({
        method: test.method,
        url: test.url,
        timeout: 10000
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

testBasicAPI(); 