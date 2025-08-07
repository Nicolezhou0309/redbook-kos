# 企业微信API问题修复指南

## 问题诊断结果

### 1. 企业微信凭证问题
- **错误代码**: 40001
- **错误信息**: invalid credential
- **原因**: 企业微信应用凭证无效或已过期

### 2. Vercel部署问题
- **错误**: 500 Internal Server Error
- **原因**: API函数可能未正确部署

## 解决方案

### 步骤1: 修复企业微信凭证

1. **登录企业微信管理后台**
   - 访问: https://work.weixin.qq.com/wework_admin/
   - 使用管理员账号登录

2. **检查应用配置**
   - 进入 "应用管理" -> "应用"
   - 找到应用ID为 `1000110` 的应用
   - 检查应用状态是否为"已启用"

3. **重新生成CorpSecret**
   - 点击应用详情
   - 找到"Secret"字段
   - 点击"重置"按钮生成新的Secret
   - 复制新的Secret值

4. **更新代码中的配置**
   ```typescript
   // 在 src/lib/wecomNotification.ts 中更新配置
   export const wecomNotification = createWeComNotification({
     corpid: 'ww30ead8f4b3e9e84d',
     corpsecret: '新的Secret值', // 更新这里
     agentid: '1000110'
   });
   ```

### 步骤2: 验证Vercel部署

1. **检查Vercel项目设置**
   - 登录 Vercel 控制台
   - 找到项目 `nicole.xin`
   - 检查部署状态

2. **重新部署API函数**
   ```bash
   # 在项目根目录执行
   vercel --prod
   ```

3. **测试API端点**
   - 访问: https://nicole.xin/api/wecom/test
   - 应该返回JSON响应

### 步骤3: 测试修复结果

1. **运行凭证验证脚本**
   ```bash
   node verify-wecom-credentials.js
   ```

2. **运行API测试脚本**
   ```bash
   node test-wecom-api.js
   ```

3. **前端测试**
   - 访问: https://nicole.xin/message-test
   - 测试消息发送功能

## 常见问题

### Q: 企业微信应用权限不足怎么办？
A: 检查应用是否有以下权限：
- 通讯录权限
- 发送消息权限
- 可见范围设置

### Q: Vercel部署失败怎么办？
A: 
1. 检查 `vercel.json` 配置
2. 确保API文件路径正确
3. 检查TypeScript编译错误

### Q: 前端仍然报404错误怎么办？
A:
1. 检查路由配置是否正确
2. 确保Vite代理配置正确
3. 清除浏览器缓存

## 验证清单

- [ ] 企业微信应用已启用
- [ ] CorpSecret已更新
- [ ] 代码中的配置已更新
- [ ] Vercel已重新部署
- [ ] API测试通过
- [ ] 前端功能正常

## 联系支持

如果问题仍然存在，请提供以下信息：
1. 企业微信应用截图
2. Vercel部署日志
3. 浏览器控制台错误信息
4. 网络请求详情 