import axios from 'axios';

// 诊断企业微信API问题
async function diagnoseWeComAPI() {
  const baseUrl = 'https://nicole.xin/api/wecom';
  
  console.log('🔍 开始诊断企业微信API问题...\n');
  
  // 1. 测试基本连接
  console.log('1. 测试基本连接...');
  try {
    const testResponse = await axios.get(`${baseUrl}/test`);
    console.log('✅ 基本连接成功:', testResponse.data);
  } catch (error) {
    console.error('❌ 基本连接失败:', error.response?.status, error.response?.data);
  }
  
  // 2. 测试token接口
  console.log('\n2. 测试token接口...');
  try {
    const tokenResponse = await axios.get(`${baseUrl}/token`, {
      params: {
        corpid: 'ww30ead8f4b3e9e84d',
        corpsecret: 'ocrsCpRalvhbUSw9HVYrkFaoPZMIGh10VGDGl_hGbk'
      }
    });
    console.log('✅ Token接口成功:', tokenResponse.data);
  } catch (error) {
    console.error('❌ Token接口失败:');
    console.error('   状态码:', error.response?.status);
    console.error('   错误信息:', error.response?.data);
    console.error('   响应头:', error.response?.headers);
  }
  
  // 3. 测试CORS
  console.log('\n3. 测试CORS配置...');
  try {
    const corsResponse = await axios.options(`${baseUrl}/token`, {
      headers: {
        'Origin': 'https://nicole.xin',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    console.log('✅ CORS预检成功:', corsResponse.status);
    console.log('   CORS头:', {
      'Access-Control-Allow-Origin': corsResponse.headers['access-control-allow-origin'],
      'Access-Control-Allow-Methods': corsResponse.headers['access-control-allow-methods'],
      'Access-Control-Allow-Headers': corsResponse.headers['access-control-allow-headers']
    });
  } catch (error) {
    console.error('❌ CORS预检失败:', error.response?.status, error.response?.data);
  }
  
  // 4. 检查网络连接
  console.log('\n4. 检查网络连接...');
  try {
    const pingResponse = await axios.get('https://nicole.xin', { timeout: 5000 });
    console.log('✅ 域名可访问:', pingResponse.status);
  } catch (error) {
    console.error('❌ 域名访问失败:', error.message);
  }
}

// 运行诊断
diagnoseWeComAPI(); 