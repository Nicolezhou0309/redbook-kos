// 企业微信微服务客户端
export class WeComMicroServiceClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = process.env.VITE_WECOM_SERVICE_URL || 'http://localhost:3001') {
    this.baseUrl = baseUrl;
  }

  // 设置认证token
  setToken(token: string) {
    this.token = token;
  }

  // 通用请求方法
  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}/api/wecom${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // 测试连接
  async testConnection() {
    return this.request('/test');
  }

  // 发送文本消息
  async sendTextMessage(content: string, touser: string = '@all') {
    return this.request('/send/text', {
      method: 'POST',
      body: JSON.stringify({ content, touser }),
    });
  }

  // 发送Markdown消息
  async sendMarkdownMessage(content: string, touser: string = '@all') {
    return this.request('/send/markdown', {
      method: 'POST',
      body: JSON.stringify({ content, touser }),
    });
  }

  // 发送自定义消息
  async sendMessage(message: any) {
    return this.request('/send/message', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  // 批量发送消息
  async sendBatchMessages(messages: any[]) {
    return this.request('/send/batch', {
      method: 'POST',
      body: JSON.stringify({ messages }),
    });
  }

  // 获取登录URL
  async getAuthUrl(state?: string) {
    const params = state ? `?state=${encodeURIComponent(state)}` : '';
    return this.request(`/auth/url${params}`);
  }

  // 处理授权回调
  async handleAuthCallback(code: string) {
    return this.request('/auth/callback', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  // 获取用户详情
  async getUserDetail(userid: string) {
    return this.request(`/user/${userid}`);
  }
}

// 创建默认实例
export const wecomMicroService = new WeComMicroServiceClient();

// 通知服务类
export class WeComNotificationService {
  private client: WeComMicroServiceClient;

  constructor(client: WeComMicroServiceClient = wecomMicroService) {
    this.client = client;
  }

  // 发送通知
  async sendNotification(content: string, type: 'text' | 'markdown' = 'text', touser: string = '@all') {
    try {
      if (type === 'markdown') {
        return await this.client.sendMarkdownMessage(content, touser);
      } else {
        return await this.client.sendTextMessage(content, touser);
      }
    } catch (error) {
      console.error('发送通知失败:', error);
      throw error;
    }
  }

  // 发送系统通知
  async sendSystemNotification(message: string, touser: string = '@all') {
    const content = `🔔 系统通知\n\n${message}`;
    return this.sendNotification(content, 'text', touser);
  }

  // 发送错误通知
  async sendErrorNotification(error: string, touser: string = '@all') {
    const content = `❌ 错误通知\n\n${error}`;
    return this.sendNotification(content, 'text', touser);
  }

  // 发送成功通知
  async sendSuccessNotification(message: string, touser: string = '@all') {
    const content = `✅ 成功通知\n\n${message}`;
    return this.sendNotification(content, 'text', touser);
  }

  // 发送数据导入通知
  async sendDataImportNotification(result: any, touser: string = '@all') {
    const content = `📊 数据导入结果\n\n` +
      `- 总记录数: ${result.total || 0}\n` +
      `- 成功导入: ${result.success || 0}\n` +
      `- 失败记录: ${result.failed || 0}\n` +
      `- 导入时间: ${new Date().toLocaleString()}`;
    
    return this.sendNotification(content, 'markdown', touser);
  }
}

// 认证服务类
export class WeComAuthService {
  private client: WeComMicroServiceClient;

  constructor(client: WeComMicroServiceClient = wecomMicroService) {
    this.client = client;
  }

  // 获取登录URL
  async getLoginUrl(redirectUrl?: string) {
    const state = redirectUrl ? encodeURIComponent(redirectUrl) : '';
    const result = await this.client.getAuthUrl(state);
    return result.authUrl;
  }

  // 处理登录回调
  async handleLoginCallback(code: string) {
    const result = await this.client.handleAuthCallback(code);
    
    if (result.success && result.userid) {
      // 获取用户详细信息
      const userDetail = await this.client.getUserDetail(result.userid);
      
      if (userDetail.success) {
        return {
          success: true,
          user: userDetail.user,
          userid: result.userid
        };
      }
    }
    
    return { success: false, error: result.error };
  }

  // 验证用户权限
  async validateUser(userid: string) {
    try {
      const result = await this.client.getUserDetail(userid);
      return result.success;
    } catch (error) {
      return false;
    }
  }
}

// 导出默认实例
export const wecomNotification = new WeComNotificationService();
export const wecomAuth = new WeComAuthService(); 