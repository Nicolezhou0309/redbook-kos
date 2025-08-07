import axios from 'axios';

async function testWeComCredentials() {
  const corpid = 'ww30ead8f4b3e9e84d';
  const corpsecret = 'ocrsCpRalvhbUSw9HVYrkFaoPZMIGh10VGDGl_hGbk';
  
  try {
    console.log('Testing WeChat Work credentials...');
    console.log('CorpId:', corpid);
    console.log('CorpSecret:', corpsecret);
    
    const response = await axios.get(
      `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${corpid}&corpsecret=${corpsecret}`
    );
    
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    
    if (response.data.errcode === 0) {
      console.log('✅ Credentials are valid!');
      console.log('Access token:', response.data.access_token);
    } else {
      console.log('❌ Credentials are invalid!');
      console.log('Error:', response.data.errmsg);
    }
  } catch (error) {
    console.error('❌ Error testing credentials:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testWeComCredentials(); 