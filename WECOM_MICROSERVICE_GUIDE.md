# 企业微信微服务部署指南

## 架构概述

本项目采用混合架构：
- **Supabase**: 主要后端服务（数据库、认证、实时功能）
- **自建微服务**: 专门处理企业微信相关功能

## 优势分析

### 继续使用Supabase的优势
- ✅ 快速开发和部署
- ✅ 内置认证和权限管理
- ✅ 实时数据库功能
- ✅ 自动API生成
- ✅ 成本效益高

### 自建企业微信微服务的原因
- 🔒 敏感配置安全存储（企业微信密钥）
- 🔄 跨应用复用（多个应用共享同一套企业微信服务）
- 🛡️ 更好的安全控制
- 📊 统一的日志和监控
- 🔧 更灵活的API设计

## 部署步骤

### 1. 企业微信微服务部署

#### 1.1 准备环境
```bash
# 进入微服务目录
cd wecom-service

# 安装依赖
npm install

# 复制环境变量文件
cp env.example .env
```

#### 1.2 配置环境变量
编辑 `.env` 文件：
```env
# 服务器配置
PORT=3001
NODE_ENV=production

# 企业微信配置
WECOM_CORPID=your_corpid_here
WECOM_CORPSECRET=your_corpsecret_here
WECOM_AGENTID=your_agentid_here
WECOM_REDIRECT_URI=https://your-domain.com/auth/callback

# Redis配置
REDIS_URL=redis://your-redis-server:6379

# JWT密钥
JWT_SECRET=your_secure_jwt_secret_here

# 允许的域名
ALLOWED_ORIGINS=https://your-frontend-domain.com

# 日志级别
LOG_LEVEL=info
```

#### 1.3 部署到服务器
```bash
# 构建项目
npm run build

# 启动服务
npm start
```

#### 1.4 使用PM2管理进程
```bash
# 安装PM2
npm install -g pm2

# 启动服务
pm2 start src/index.js --name wecom-service

# 设置开机自启
pm2 startup
pm2 save
```

### 2. 前端配置

#### 2.1 更新环境变量
在项目根目录的 `.env.local` 中添加：
```env
VITE_WECOM_SERVICE_URL=https://your-wecom-service-domain.com
```

#### 2.2 更新前端代码
使用新的微服务客户端替换原有的企业微信API调用：

```typescript
// 替换原有的 wecomApi.ts 调用
import { wecomNotification, wecomAuth } from './lib/wecomMicroService';

// 发送通知
await wecomNotification.sendSystemNotification('系统维护通知');

// 企业微信登录
const loginUrl = await wecomAuth.getLoginUrl('/dashboard');
```

## 跨应用复用方案

### 1. 多应用配置
为不同应用创建不同的配置：

```typescript
// 应用A的配置
const appAClient = new WeComMicroServiceClient('https://wecom-service.example.com');
appAClient.setToken('app-a-token');

// 应用B的配置
const appBClient = new WeComMicroServiceClient('https://wecom-service.example.com');
appBClient.setToken('app-b-token');
```

### 2. 统一管理
创建一个统一的企业微信服务管理平台：

```typescript
// 统一服务管理器
class WeComServiceManager {
  private services: Map<string, WeComMicroServiceClient> = new Map();

  registerApp(appId: string, config: WeComConfig) {
    const client = new WeComMicroServiceClient(config.baseUrl);
    client.setToken(config.token);
    this.services.set(appId, client);
  }

  getService(appId: string) {
    return this.services.get(appId);
  }

  async sendNotificationToAllApps(message: string) {
    const results = [];
    for (const [appId, client] of this.services) {
      try {
        const result = await client.sendTextMessage(message);
        results.push({ appId, success: true, result });
      } catch (error) {
        results.push({ appId, success: false, error: error.message });
      }
    }
    return results;
  }
}
```

## 安全考虑

### 1. 密钥管理
- 使用环境变量存储敏感信息
- 定期轮换企业微信密钥
- 使用密钥管理服务（如AWS KMS、Azure Key Vault）

### 2. 访问控制
- 实现JWT认证
- 设置IP白名单
- 使用HTTPS加密传输

### 3. 监控和日志
- 记录所有API调用
- 监控服务健康状态
- 设置告警机制

## API接口文档

### 通知相关接口

#### 发送文本消息
```http
POST /api/wecom/send/text
Content-Type: application/json

{
  "content": "消息内容",
  "touser": "@all"
}
```

#### 发送Markdown消息
```http
POST /api/wecom/send/markdown
Content-Type: application/json

{
  "content": "**粗体文本**",
  "touser": "userid1|userid2"
}
```

### 认证相关接口

#### 获取登录URL
```http
GET /api/wecom/auth/url?state=redirect_url
```

#### 处理授权回调
```http
POST /api/wecom/auth/callback
Content-Type: application/json

{
  "code": "授权码"
}
```

## 故障排除

### 常见问题

1. **连接超时**
   - 检查网络连接
   - 验证企业微信API配置
   - 检查IP白名单设置

2. **认证失败**
   - 验证corpid和corpsecret
   - 检查应用权限设置
   - 确认agentid配置

3. **消息发送失败**
   - 检查用户ID格式
   - 验证消息内容长度
   - 确认应用可见范围

### 调试工具
```bash
# 测试连接
curl -X GET https://your-service.com/api/wecom/test

# 查看日志
pm2 logs wecom-service

# 监控服务状态
pm2 monit
```

## 性能优化

### 1. 缓存策略
- 使用Redis缓存access_token
- 实现消息去重机制
- 批量发送优化

### 2. 负载均衡
- 使用Nginx反向代理
- 配置多个服务实例
- 实现健康检查

### 3. 监控指标
- API响应时间
- 消息发送成功率
- 服务可用性

## 成本分析

### Supabase成本
- 免费层：50MB数据库，2GB带宽
- 付费层：$25/月起，包含更多功能

### 自建微服务成本
- 服务器：$5-20/月
- Redis：$5-15/月
- 域名和SSL：$10-20/年

**总成本估算：$15-50/月**（取决于规模和需求）

## 总结

采用混合架构的优势：
1. **安全性**：敏感配置集中管理
2. **可扩展性**：支持多应用复用
3. **成本效益**：Supabase免费层 + 轻量级微服务
4. **灵活性**：可根据需求调整架构
5. **维护性**：统一的日志和监控

这种方案既保持了Supabase的便利性，又解决了企业微信功能的安全和复用问题。 