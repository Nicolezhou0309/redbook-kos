import axios from 'axios';

// 企业微信配置接口
export interface WeComConfig {
  corpid: string;
  corpsecret: string;
  agentid: string;
}

// 消息类型
export interface WeComMessage {
  touser?: string;      // 用户ID，多个用逗号分隔
  toparty?: string;     // 部门ID，多个用逗号分隔
  totag?: string;       // 标签ID，多个用逗号分隔
  msgtype: 'text' | 'markdown' | 'image' | 'news';
  text?: {
    content: string;
  };
  markdown?: {
    content: string;
  };
  image?: {
    media_id: string;
  };
  news?: {
    articles: Array<{
      title: string;
      description: string;
      url: string;
      picurl?: string;
    }>;
  };
}

// 企业微信通知服务类
export class WeComNotificationService {
  private config: WeComConfig;
  private accessToken: string | null = null;
  private tokenExpireTime: number = 0;
  private baseUrl: string;

  constructor(config: WeComConfig) {
    this.config = config;
    // 根据环境选择API地址
    this.baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://your-vercel-domain.vercel.app/api/wecom'  // 部署后需要更新为实际域名
      : '/api/wecom';
  }

  // 获取访问令牌
  private async getAccessToken(): Promise<string> {
    const now = Date.now();
    
    // 如果令牌未过期，直接返回
    if (this.accessToken && now < this.tokenExpireTime) {
      return this.accessToken;
    }

    try {
      const response = await axios.get(`${this.baseUrl}/token`, {
        params: {
          corpid: this.config.corpid,
          corpsecret: this.config.corpsecret
        }
      });

      if (response.data.errcode === 0) {
        this.accessToken = response.data.access_token;
        this.tokenExpireTime = now + (response.data.expires_in - 300) * 1000; // 提前5分钟过期
        return this.accessToken;
      } else {
        throw new Error(`获取访问令牌失败: ${response.data.errmsg}`);
      }
    } catch (error) {
      console.error('获取企业微信访问令牌失败:', error);
      throw error;
    }
  }

  // 发送消息
  async sendMessage(message: WeComMessage): Promise<{ success: boolean; error?: string }> {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await axios.post(`${this.baseUrl}/send`, {
        access_token: accessToken,
        agentid: this.config.agentid,
        ...message
      });

      if (response.data.errcode === 0) {
        console.log('企业微信消息发送成功');
        return { success: true };
      } else {
        console.error('企业微信消息发送失败:', response.data.errmsg);
        return { success: false, error: response.data.errmsg };
      }
    } catch (error) {
      console.error('发送企业微信消息时出错:', error);
      return { success: false, error: error instanceof Error ? error.message : '未知错误' };
    }
  }

  // 发送文本消息
  async sendTextMessage(content: string, touser?: string): Promise<{ success: boolean; error?: string }> {
    return this.sendMessage({
      touser: touser || '@all',
      msgtype: 'text',
      text: { content }
    });
  }

  // 发送Markdown消息
  async sendMarkdownMessage(content: string, touser?: string): Promise<{ success: boolean; error?: string }> {
    return this.sendMessage({
      touser: touser || '@all',
      msgtype: 'markdown',
      markdown: { content }
    });
  }

  // 发送新闻消息
  async sendNewsMessage(articles: Array<{
    title: string;
    description: string;
    url: string;
    picurl?: string;
  }>, touser?: string): Promise<{ success: boolean; error?: string }> {
    return this.sendMessage({
      touser: touser || '@all',
      msgtype: 'news',
      news: { articles }
    });
  }

  // 给指定用户发送消息
  async sendToUser(userId: string, content: string, type: 'text' | 'markdown' = 'text'): Promise<{ success: boolean; error?: string }> {
    if (type === 'markdown') {
      return this.sendMarkdownMessage(content, userId);
    } else {
      return this.sendTextMessage(content, userId);
    }
  }

  // 给多个用户发送消息
  async sendToUsers(userIds: string[], content: string, type: 'text' | 'markdown' = 'text'): Promise<{ success: boolean; error?: string }> {
    const touser = userIds.join('|');
    if (type === 'markdown') {
      return this.sendMarkdownMessage(content, touser);
    } else {
      return this.sendTextMessage(content, touser);
    }
  }

  // 测试连接
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const accessToken = await this.getAccessToken();
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : '未知错误' };
    }
  }
}

// 创建通知服务实例
export const createWeComNotification = (config: WeComConfig) => {
  return new WeComNotificationService(config);
};

// 默认配置（使用提供的配置信息）
export const wecomNotification = createWeComNotification({
  corpid: 'ww30ead8f4b3e9e84d',
  corpsecret: 'ocrsCpRalvhbUSw9HVYrkFaoPZMIGh10VGDGl_hGbk',
  agentid: '1000110'
});
