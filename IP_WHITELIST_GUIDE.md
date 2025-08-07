# 企业微信IP白名单配置指南

## 问题原因
企业微信API有IP白名单限制，Vercel部署的服务器IP可能不在白名单中。

## 解决步骤

### 1. 获取Vercel IP地址
Vercel使用动态IP，但可以通过以下方式获取：

```bash
# 方法1：使用nslookup
nslookup your-app.vercel.app

# 方法2：使用dig
dig your-app.vercel.app

# 方法3：查看Vercel函数日志中的IP
```

### 2. 企业微信后台配置
1. 登录企业微信管理后台
2. 进入"应用管理" -> "应用"
3. 找到对应的应用
4. 点击"设置" -> "开发者接口"
5. 在"IP白名单"中添加Vercel的IP地址

### 3. 推荐的IP范围
如果无法获取具体IP，可以尝试添加以下范围：
- Vercel的已知IP段
- 或者临时允许所有IP（仅用于测试）

### 4. 验证配置
配置完成后，使用以下脚本测试：

```javascript
// test-ip-whitelist.js
const testIPWhitelist = async () => {
  try {
    const response = await fetch('https://qyapi.weixin.qq.com/cgi-bin/gettoken', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('IP白名单测试结果:', data);
    
    if (data.errcode === 0) {
      console.log('✅ IP白名单配置成功');
    } else {
      console.log('❌ IP白名单配置失败:', data.errmsg);
    }
  } catch (error) {
    console.error('测试失败:', error);
  }
};
```

## 注意事项
- IP白名单配置可能需要几分钟生效
- 建议先在测试环境验证
- 定期检查IP地址是否发生变化 