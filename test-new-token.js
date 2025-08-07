import axios from 'axios';

const testNewToken = async () => {
  console.log('🧪 测试新的访问令牌...');
  
  const accessToken = '2bp1iKN8ohedAhJIbiAm-choVACb9zg_L-5d1Gv2MdhMTdpcWuZ1OaG_SfdCrOJGI0D9GVF8tHBuAeTCaiKD_WXZpPBSPrsx9U1c3t2Ym9qiWLmcf4LcAoUbAKdc4-mXxM_iFznz4VAcmwBGAKs0fw-Bh4n6n6L6c-IXLe7T2rXpuxgIlToua180QFn0xG6xR35OgUfaNYLex_vv1NiwFg';
  
  try {
    // 测试发送消息
    console.log('1. 测试发送消息...');
    const messageResponse = await axios.post('http://localhost:3001/api/wecom/send', {
      access_token: accessToken,
      agentid: '1000110',
      touser: '@all',
      msgtype: 'text',
      text: { content: '这是一条测试消息 - 来自本地服务器测试' }
    });
    
    console.log('消息响应:', messageResponse.data);
    
    if (messageResponse.data.errcode === 0) {
      console.log('✅ 消息发送成功！');
    } else {
      console.log('❌ 消息发送失败:', messageResponse.data.errmsg);
    }
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
};

testNewToken();
