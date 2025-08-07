// 企业微信API配置 - 新应用
export const WECOM_CONFIG = {
  corpid: 'ww68a125fce698cb59',
  corpsecret: 'sXQeFCLDQJkwrX5lMWDzBTEIiHK1J7-a2e7chPyqYxY',
  agentid: '1000002'
};

// 获取访问令牌 - 增强版本
export const getWeComToken = async (retryCount = 3): Promise<string> => {
  for (let i = 0; i < retryCount; i++) {
    try {
      console.log(`尝试获取企业微信令牌 (第${i + 1}次)...`);
      
      // 根据环境选择不同的API端点
      const apiUrl = process.env.NODE_ENV === 'production' 
        ? `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${WECOM_CONFIG.corpid}&corpsecret=${WECOM_CONFIG.corpsecret}`
        : `/api/wecom/token?corpid=${WECOM_CONFIG.corpid}&corpsecret=${WECOM_CONFIG.corpsecret}`;
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('企业微信API响应:', data);
      
      if (data.errcode === 0) {
        console.log('✅ 企业微信令牌获取成功');
        return data.access_token;
      } else {
        // 分析错误类型
        const errorMsg = `企业微信API错误 (${data.errcode}): ${data.errmsg}`;
        console.error(errorMsg);
        
        // 如果是IP白名单错误，提供具体建议
        if (data.errcode === 40001) {
          console.error('💡 这可能是IP白名单问题，请检查企业微信后台的IP白名单设置');
        }
        
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error(`第${i + 1}次尝试失败:`, error);
      
      if (i === retryCount - 1) {
        throw new Error(`获取企业微信令牌失败，已重试${retryCount}次: ${error instanceof Error ? error.message : '未知错误'}`);
      }
      
      // 等待一段时间后重试
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  
  throw new Error('获取企业微信令牌失败');
};

// 发送消息 - 增强版本
export const sendWeComMessage = async (accessToken: string, message: any, retryCount = 3): Promise<any> => {
  for (let i = 0; i < retryCount; i++) {
    try {
      console.log(`尝试发送企业微信消息 (第${i + 1}次)...`);
      
      // 根据环境选择不同的API端点
      const apiUrl = process.env.NODE_ENV === 'production'
        ? `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${accessToken}`
        : '/api/wecom/send';
      
      const requestBody = process.env.NODE_ENV === 'production'
        ? { agentid: WECOM_CONFIG.agentid, ...message }
        : { access_token: accessToken, agentid: WECOM_CONFIG.agentid, ...message };
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('企业微信消息发送响应:', data);
      
      if (data.errcode === 0) {
        console.log('✅ 企业微信消息发送成功');
        return data;
      } else {
        const errorMsg = `企业微信消息发送失败 (${data.errcode}): ${data.errmsg}`;
        console.error(errorMsg);
        
        // 分析错误类型
        switch (data.errcode) {
          case 40001:
            console.error('💡 错误原因: 无效的凭证，可能是IP白名单问题');
            break;
          case 40014:
            console.error('💡 错误原因: 无效的access_token，需要重新获取');
            break;
          case 41001:
            console.error('💡 错误原因: 缺少access_token参数');
            break;
          case 41002:
            console.error('💡 错误原因: 缺少corpid参数');
            break;
          case 41003:
            console.error('💡 错误原因: 缺少secret参数');
            break;
          case 41004:
            console.error('💡 错误原因: 缺少agentid参数');
            break;
          case 41005:
            console.error('💡 错误原因: 缺少media_id参数');
            break;
          case 41006:
            console.error('💡 错误原因: 缺少msgtype参数');
            break;
          case 41007:
            console.error('💡 错误原因: 缺少content参数');
            break;
          case 41008:
            console.error('💡 错误原因: 缺少title参数');
            break;
          case 41009:
            console.error('💡 错误原因: 缺少description参数');
            break;
          case 41010:
            console.error('💡 错误原因: 缺少url参数');
            break;
          case 41011:
            console.error('💡 错误原因: 缺少picurl参数');
            break;
          case 41012:
            console.error('💡 错误原因: 缺少btntxt参数');
            break;
          case 41013:
            console.error('💡 错误原因: 缺少safe参数');
            break;
          case 41014:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41015:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41016:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41017:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41018:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41019:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41020:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41021:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41022:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41023:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41024:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41025:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41026:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41027:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41028:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41029:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41030:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41031:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41032:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41033:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41034:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41035:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41036:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41037:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41038:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41039:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41040:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41041:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41042:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41043:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41044:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41045:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41046:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41047:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41048:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41049:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41050:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41051:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41052:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41053:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41054:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41055:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41056:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41057:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41058:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41059:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41060:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41061:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41062:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41063:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41064:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41065:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41066:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41067:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41068:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41069:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41070:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41071:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41072:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41073:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41074:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41075:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41076:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41077:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41078:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41079:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41080:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41081:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41082:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41083:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41084:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41085:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41086:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41087:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41088:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41089:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41090:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41091:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41092:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41093:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41094:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41095:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41096:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41097:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41098:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41099:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          case 41100:
            console.error('💡 错误原因: 缺少duplicate_check_interval参数');
            break;
          default:
            console.error(`💡 未知错误代码: ${data.errcode}`);
        }
        
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error(`第${i + 1}次尝试失败:`, error);
      
      if (i === retryCount - 1) {
        throw new Error(`发送企业微信消息失败，已重试${retryCount}次: ${error instanceof Error ? error.message : '未知错误'}`);
      }
      
      // 等待一段时间后重试
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  
  throw new Error('发送企业微信消息失败');
};

// 测试连接
export const testWeComConnection = async (): Promise<{ success: boolean; error?: string; token?: string }> => {
  try {
    console.log('🧪 测试企业微信连接...');
    const token = await getWeComToken();
    return { success: true, token };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    };
  }
};
