# 企业微信API测试指南

## 📋 测试结果总结

根据测试结果，当前企业微信配置存在以下问题：

### ❌ 发现的问题
1. **无效的凭证错误** (errcode: 40001)
2. **IP白名单可能未配置**
3. **应用密钥可能未启用**

### 🔧 解决方案

#### 1. 检查企业微信管理后台配置

请按以下步骤检查和修复配置：

1. **登录企业微信管理后台**
   - 访问：https://work.weixin.qq.com/wework_admin/
   - 使用管理员账号登录

2. **检查应用配置**
   - 进入"应用管理" -> "应用"
   - 找到对应的应用（应用ID: 1000110）
   - 点击应用名称进入详情页

3. **获取正确的配置信息**
   - **企业ID (corpid)**: 在"应用信息"页面查看
   - **应用密钥 (corpsecret)**: 点击"查看"按钮获取
   - **应用ID (agentid)**: 确认应用ID是否正确

4. **检查应用状态**
   - 确认应用已启用
   - 检查应用权限设置
   - 确认有发送消息的权限

5. **配置IP白名单**
   - 进入"应用管理" -> "应用" -> 应用详情
   - 找到"IP白名单"设置
   - 添加当前服务器IP: `114.86.91.106`

#### 2. 更新配置文件

选择以下任一方法更新配置：

**方法1: 直接修改测试脚本**
```javascript
// 编辑 test-wecom-updated.js 文件
const WECOM_CONFIG = {
  corpid: 'YOUR_CORRECT_CORPID',        // 替换为正确的企业ID
  corpsecret: 'YOUR_CORRECT_CORPSECRET', // 替换为正确的应用密钥
  agentid: 'YOUR_CORRECT_AGENTID',       // 替换为正确的应用ID
  baseUrl: 'http://localhost:3001'
};
```

**方法2: 使用环境变量**
```bash
# 创建 .env 文件
WECOM_CORPID=your_correct_corpid
WECOM_CORPSECRET=your_correct_corpsecret
WECOM_AGENTID=your_correct_agentid
```

#### 3. 运行测试

1. **启动代理服务器**
   ```bash
   node server.js
   ```

2. **运行测试脚本**
   ```bash
   node test-wecom-updated.js
   ```

## 📁 测试文件说明

### 已创建的测试文件

1. **`test-wecom-complete.js`** - 完整的测试脚本
   - 测试获取访问令牌
   - 测试发送文本消息
   - 测试发送卡片消息
   - 测试错误情况

2. **`wecom-diagnostic.js`** - 诊断脚本
   - 检查配置格式
   - 测试直接API调用
   - 检查代理服务器
   - 提供修复建议

3. **`test-wecom-updated.js`** - 更新后的测试脚本
   - 需要填入正确的配置信息
   - 简化的测试流程

4. **`update-wecom-config.js`** - 配置更新工具
   - 生成更新后的测试脚本
   - 提供配置更新指导

## 🔍 错误代码说明

| 错误代码 | 错误信息 | 解决方案 |
|---------|---------|---------|
| 40001 | invalid credential | 检查企业ID和应用密钥是否正确 |
| 40013 | invalid corpid | 检查企业ID是否正确 |
| 40018 | invalid agentid | 检查应用ID是否正确 |
| 41002 | corpid missing | 检查是否提供了企业ID参数 |
| 40014 | invalid access_token | 检查访问令牌是否有效 |

## 🚀 快速测试步骤

1. **获取正确配置**
   - 登录企业微信管理后台
   - 获取正确的企业ID、应用密钥、应用ID

2. **更新测试脚本**
   - 编辑 `test-wecom-updated.js`
   - 填入正确的配置信息

3. **启动服务器**
   ```bash
   node server.js
   ```

4. **运行测试**
   ```bash
   node test-wecom-updated.js
   ```

5. **检查结果**
   - 如果看到 "✅ 访问令牌获取成功！" 表示配置正确
   - 如果看到 "✅ 消息发送成功！" 表示功能正常

## 📞 获取帮助

如果遇到问题，请检查：

1. **网络连接** - 确保能访问企业微信API
2. **配置信息** - 确保企业ID、应用密钥、应用ID正确
3. **应用状态** - 确保应用已启用且有相应权限
4. **IP白名单** - 确保服务器IP在白名单中

## 📝 测试日志

最新的测试结果显示：
- ❌ 访问令牌获取失败: invalid credential
- ❌ 企业微信API返回错误代码 40001
- 💡 需要检查企业微信管理后台的配置信息

请根据上述指导更新配置后重新测试。 