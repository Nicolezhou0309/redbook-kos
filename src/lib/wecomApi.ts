// 企业微信API配置 - 新应用
export const WECOM_CONFIG = {
  corpid: 'ww68a125fce698cb59',
  corpsecret: 'sXQeFCLDQJkwrX5lMWDzBTEIiHK1J7-a2e7chPyqYxY',
  agentid: '1000002'
};

// 获取访问令牌
export const getWeComToken = async () => {
  try {
    const response = await fetch(`/api/wecom/token?corpid=${WECOM_CONFIG.corpid}&corpsecret=${WECOM_CONFIG.corpsecret}`);
    const data = await response.json();
    
    if (data.errcode === 0) {
      return data.access_token;
    } else {
      throw new Error(data.errmsg);
    }
  } catch (error) {
    console.error('获取企业微信令牌失败:', error);
    throw error;
  }
};

// 发送消息
export const sendWeComMessage = async (accessToken, message) => {
  try {
    const response = await fetch('/api/wecom/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        access_token: accessToken,
        ...message
      })
    });
    
    const data = await response.json();
    
    if (data.errcode === 0) {
      return data;
    } else {
      throw new Error(data.errmsg);
    }
  } catch (error) {
    console.error('发送企业微信消息失败:', error);
    throw error;
  }
};
