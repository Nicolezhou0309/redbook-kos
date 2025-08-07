# 企业微信API部署指南

## 问题诊断

根据错误信息，主要问题是：
1. **404错误**：API端点不存在
2. **CORS错误**：跨域请求被阻止
3. **500错误**：服务器内部错误

## 修复步骤

### 1. 更新配置

已完成的修复：
- ✅ 更新了API域名配置（从占位符改为实际域名）
- ✅ 修复了CORS配置
- ✅ 更新了TypeScript配置
- ✅ 简化了Vercel配置

### 2. 重新部署

需要重新部署到Vercel以应用更改：

```bash
# 1. 提交更改
git add .
git commit -m "修复企业微信API配置"

# 2. 推送到GitHub
git push origin main

# 3. Vercel会自动重新部署
```

### 3. 验证部署

部署完成后，测试以下端点：

1. **基本测试**：
   ```
   GET https://nicole.xin/api/hello
   ```

2. **企业微信Token测试**：
   ```
   GET https://nicole.xin/api/wecom/token?corpid=ww30ead8f4b3e9e84d&corpsecret=ocrsCpRalvhbUSw9HVYrkFaoPZMIGh10VGDGl_hGbk
   ```

3. **CORS测试**：
   ```
   OPTIONS https://nicole.xin/api/wecom/token
   ```

### 4. 前端配置

确保前端代码使用正确的API地址：

```typescript
// 在 wecomNotification.ts 中
this.baseUrl = process.env.NODE_ENV === 'production' 
  ? 'https://nicole.xin/api/wecom'  // ✅ 已更新
  : '/api/wecom';
```

### 5. 常见问题解决

#### 如果仍然出现500错误：
1. 检查Vercel函数日志
2. 确保所有依赖都已安装
3. 验证TypeScript编译是否成功

#### 如果出现CORS错误：
1. 确认CORS头设置正确
2. 检查预检请求处理
3. 验证域名配置

#### 如果出现404错误：
1. 确认API文件路径正确
2. 检查Vercel函数配置
3. 验证部署是否成功

## 测试脚本

使用提供的测试脚本验证API：

```bash
node diagnose-wecom.js
```

## 监控和调试

1. **Vercel仪表板**：查看函数日志和错误
2. **浏览器开发者工具**：检查网络请求和响应
3. **API测试工具**：使用Postman或curl测试API

## 成功标志

当以下测试都通过时，说明修复成功：

1. ✅ 基本API端点可访问
2. ✅ 企业微信Token API返回正确响应
3. ✅ CORS预检请求成功
4. ✅ 前端可以正常调用API
5. ✅ 企业微信消息发送成功 