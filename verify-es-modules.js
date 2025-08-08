import fs from 'fs';
import path from 'path';

// 颜色输出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

const log = (color, message) => {
  console.log(`${color}${message}${colors.reset}`);
};

// 验证ES模块语法
const verifyESModules = () => {
  log(colors.blue, '🔍 验证ES模块语法...\n');
  
  const files = [
    'api/wecom/token.ts',
    'api/wecom/send.ts',
    'api/wecom/token-simple.ts',
    'api/wecom/send-simple.ts',
    'api/wecom/token-fixed.ts',
    'api/wecom/send-fixed.ts',
    'api/wecom/test.ts'
  ];
  
  let allValid = true;
  
  files.forEach(file => {
    try {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        const hasModuleExports = content.includes('module.exports');
        const hasRequire = content.includes('require(');
        const hasExportDefault = content.includes('export default');
        const hasImport = content.includes('import ');
        
        log(colors.cyan, `${file}:`);
        log(hasModuleExports ? colors.red : colors.green, `  - module.exports: ${hasModuleExports ? '❌' : '✅'}`);
        log(hasRequire ? colors.red : colors.green, `  - require(): ${hasRequire ? '❌' : '✅'}`);
        log(hasExportDefault ? colors.green : colors.red, `  - export default: ${hasExportDefault ? '✅' : '❌'}`);
        log(hasImport ? colors.green : colors.red, `  - import: ${hasImport ? '✅' : '❌'}`);
        
        if (hasModuleExports || hasRequire) {
          allValid = false;
        }
        
        console.log('');
      } else {
        log(colors.yellow, `⚠️  ${file}: 文件不存在`);
        allValid = false;
      }
    } catch (error) {
      log(colors.red, `❌ 验证 ${file} 失败: ${error.message}`);
      allValid = false;
    }
  });
  
  if (allValid) {
    log(colors.green, '🎉 所有文件都使用正确的ES模块语法！');
  } else {
    log(colors.red, '❌ 发现ES模块语法问题，请修复后重新验证。');
  }
  
  return allValid;
};

// 检查TypeScript编译
const checkTypeScriptCompilation = async () => {
  log(colors.blue, '\n🔍 检查TypeScript编译...');
  
  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    const result = await execAsync('npx tsc --noEmit --project tsconfig.api.json');
    log(colors.green, '✅ TypeScript编译检查通过');
    return true;
  } catch (error) {
    log(colors.red, `❌ TypeScript编译检查失败: ${error.message}`);
    return false;
  }
};

// 生成部署检查清单
const generateDeploymentChecklist = () => {
  log(colors.blue, '\n📋 部署检查清单:');
  log(colors.yellow, '1. 代码修复:');
  log(colors.green, '   ✅ 所有API文件使用ES模块语法');
  log(colors.green, '   ✅ 移除了module.exports');
  log(colors.green, '   ✅ 使用export default');
  
  log(colors.yellow, '\n2. 提交代码:');
  console.log(`
   git add .
   git commit -m "修复ES模块语法错误 - 解决Vercel部署问题"
   git push origin main
  `);
  
  log(colors.yellow, '\n3. 验证部署:');
  console.log(`
   # 等待Vercel自动部署完成
   # 检查Vercel函数日志
   # 测试API端点
   curl https://your-app.vercel.app/api/wecom/token?corpid=test&corpsecret=test
  `);
  
  log(colors.yellow, '\n4. 企业微信配置:');
  console.log(`
   # 获取Vercel IP地址
   node quick-ip-check.js your-app.vercel.app
   
   # 配置企业微信IP白名单
   # 测试企业微信API连接
  `);
};

// 主函数
const main = async () => {
  const isValid = verifyESModules();
  
  if (isValid) {
    const tsValid = await checkTypeScriptCompilation();
    if (tsValid) {
      generateDeploymentChecklist();
    }
  } else {
    log(colors.red, '\n❌ 请先修复ES模块语法问题，然后重新运行验证。');
  }
};

// 运行验证
main().catch(error => {
  log(colors.red, `❌ 验证失败: ${error.message}`);
}); 