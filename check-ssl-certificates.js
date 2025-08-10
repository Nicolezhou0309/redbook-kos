#!/usr/bin/env node

import https from 'https';
import http from 'http';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

const log = (color, message) => {
  console.log(`${color}${message}${colors.reset}`);
};

// 检查SSL证书
const checkSSLCertificate = (hostname, port = 443) => {
  return new Promise((resolve) => {
    const options = {
      hostname,
      port,
      method: 'GET',
      path: '/',
      rejectUnauthorized: false, // 允许自签名证书
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      const cert = res.socket.getPeerCertificate();
      
      if (cert && Object.keys(cert).length > 0) {
        resolve({
          success: true,
          statusCode: res.statusCode,
          certificate: cert,
          headers: res.headers
        });
      } else {
        resolve({
          success: false,
          error: '无法获取SSL证书信息'
        });
      }
    });

    req.on('error', (error) => {
      resolve({
        success: false,
        error: error.message
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        success: false,
        error: '请求超时'
      });
    });

    req.setTimeout(10000);
    req.end();
  });
};

// 检查HTTP连接
const checkHTTPConnection = (hostname, port = 80) => {
  return new Promise((resolve) => {
    const options = {
      hostname,
      port,
      method: 'GET',
      path: '/',
      timeout: 10000
    };

    const req = http.request(options, (res) => {
      resolve({
        success: true,
        statusCode: res.statusCode,
        headers: res.headers
      });
    });

    req.on('error', (error) => {
      resolve({
        success: false,
        error: error.message
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        success: false,
        error: '请求超时'
      });
    });

    req.setTimeout(10000);
    req.end();
  });
};

// 检查本地Python环境
const checkPythonEnvironment = () => {
  try {
    log(colors.blue, '🔍 检查Python环境...');
    
    // 检查Python版本
    const pythonVersion = execSync('python3 --version', { encoding: 'utf8' }).trim();
    log(colors.green, `✅ Python版本: ${pythonVersion}`);
    
    // 检查pip
    const pipVersion = execSync('pip3 --version', { encoding: 'utf8' }).trim();
    log(colors.green, `✅ pip版本: ${pipVersion}`);
    
    // 检查关键包
    const packages = ['httpx', 'requests', 'urllib3', 'ssl'];
    for (const pkg of packages) {
      try {
        execSync(`python3 -c "import ${pkg}; print('${pkg}可用')"`, { stdio: 'pipe' });
        log(colors.green, `✅ ${pkg}包可用`);
      } catch {
        log(colors.yellow, `⚠️ ${pkg}包不可用`);
      }
    }
    
    return true;
  } catch (error) {
    log(colors.red, `❌ Python环境检查失败: ${error.message}`);
    return false;
  }
};



// 检查网络连接
const checkNetworkConnections = async () => {
  log(colors.blue, '\n🔍 检查网络连接...');
  
  const testUrls = [
    { name: '企业微信API', url: 'https://qyapi.weixin.qq.com' },
    { name: '本地服务器', url: 'http://localhost:3001' },
    { name: 'Vercel部署', url: 'https://nicole.xin' }
  ];
  
  for (const test of testUrls) {
    try {
      if (test.url.startsWith('https://')) {
        const result = await checkSSLCertificate(new URL(test.url).hostname);
        if (result.success) {
          log(colors.green, `✅ ${test.name}: HTTPS连接正常 (状态码: ${result.statusCode})`);
          
          // 显示证书信息
          if (result.certificate) {
            const cert = result.certificate;
            log(colors.cyan, `   📜 证书信息:`);
            log(colors.cyan, `      - 颁发者: ${cert.issuer?.CN || '未知'}`);
            log(colors.cyan, `      - 主题: ${cert.subject?.CN || '未知'}`);
            log(colors.cyan, `      - 有效期: ${cert.valid_from} 至 ${cert.valid_to}`);
            log(colors.cyan, `      - 序列号: ${cert.serialNumber || '未知'}`);
          }
        } else {
          log(colors.red, `❌ ${test.name}: HTTPS连接失败 - ${result.error}`);
        }
      } else {
        const result = await checkHTTPConnection(new URL(test.url).hostname, new URL(test.url).port || 80);
        if (result.success) {
          log(colors.green, `✅ ${test.name}: HTTP连接正常 (状态码: ${result.statusCode})`);
        } else {
          log(colors.red, `❌ ${test.name}: HTTP连接失败 - ${result.error}`);
        }
      }
    } catch (error) {
      log(colors.red, `❌ ${test.name}: 检查失败 - ${error.message}`);
    }
  }
};

// 检查SSL配置问题
const checkSSLIssues = () => {
  log(colors.blue, '\n🔍 检查SSL配置问题...');
  
  // 检查常见的SSL问题
  const commonIssues = [
    {
      name: '证书过期',
      description: 'SSL证书已过期或即将过期',
      solution: '联系证书颁发机构更新证书'
    },
    {
      name: '证书不匹配',
      description: '证书域名与访问域名不匹配',
      solution: '确保证书包含正确的域名或使用正确的域名访问'
    },
    {
      name: '证书链不完整',
      description: '缺少中间证书',
      solution: '安装完整的证书链'
    },
    {
      name: '自签名证书',
      description: '使用自签名证书导致浏览器警告',
      solution: '使用受信任的CA颁发的证书'
    },
    {
      name: 'TLS版本过低',
      description: '服务器只支持过时的TLS版本',
      solution: '升级到TLS 1.2或更高版本'
    }
  ];
  
  log(colors.yellow, '📋 常见SSL问题及解决方案:');
  commonIssues.forEach((issue, index) => {
    log(colors.cyan, `   ${index + 1}. ${issue.name}:`);
    log(colors.white, `      - 问题: ${issue.description}`);
    log(colors.white, `      - 解决: ${issue.solution}`);
  });
};



// 生成SSL配置建议
const generateSSLRecommendations = () => {
  log(colors.blue, '\n💡 SSL配置建议:');
  
  const recommendations = [
    {
      category: '系统配置',
      items: [
        '检查系统SSL配置',
        '设置适当的超时时间',
        '配置代理服务器的SSL设置',
        '添加证书验证选项'
      ]
    },
    {
      category: '应用配置',
      items: [
        '检查应用的SSL配置',
        '设置适当的证书验证策略',
        '处理SSL证书错误',
        '添加重试机制'
      ]
    },
    {
      category: '环境配置',
      items: [
        '确保Python环境支持SSL',
        '安装必要的SSL相关包',
        '配置系统证书存储',
        '设置环境变量'
      ]
    }
  ];
  
  recommendations.forEach(rec => {
    log(colors.cyan, `\n📁 ${rec.category}:`);
    rec.items.forEach(item => {
      log(colors.white, `   • ${item}`);
    });
  });
};

// 主函数
const main = async () => {
  log(colors.blue, '🚀 开始SSL证书检查...\n');
  
  try {
    // 1. 检查Python环境
    const pythonOk = checkPythonEnvironment();
    
    // 2. 检查网络连接
    await checkNetworkConnections();
    
    // 3. 检查SSL配置问题
    checkSSLIssues();
    
    // 4. 生成配置建议
    generateSSLRecommendations();
    
    // 总结
    log(colors.blue, '\n📊 检查总结:');
    log(colors.white, `   - Python环境: ${pythonOk ? '✅ 正常' : '❌ 异常'}`);
    
    if (pythonOk) {
      log(colors.green, '\n🎉 基础环境检查通过，SSL问题可能出现在网络配置或代码设置中');
    } else {
      log(colors.red, '\n⚠️ 基础环境存在问题，请先解决环境问题再检查SSL配置');
    }
    
  } catch (error) {
    log(colors.red, `\n❌ 检查过程中出现错误: ${error.message}`);
  }
  
  log(colors.blue, '\n🔍 SSL证书检查完成！');
};

// 运行主函数
main().catch(console.error);
