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

// 修复ES模块语法
const fixESModules = async () => {
  log(colors.blue, '🔧 修复ES模块语法...\n');
  
  const apiDir = './api/wecom';
  const files = [
    'token.ts',
    'send.ts',
    'token-simple.ts',
    'send-simple.ts',
    'token-fixed.ts',
    'send-fixed.ts',
    'test.ts'
  ];
  
  let fixedCount = 0;
  
  for (const file of files) {
    const filePath = path.join(apiDir, file);
    
    try {
      if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        
        // 检查并修复 module.exports
        if (content.includes('module.exports = handler;')) {
          content = content.replace('module.exports = handler;', 'export default handler;');
          modified = true;
          log(colors.green, `✅ 修复 ${file}: module.exports -> export default`);
        }
        
        // 检查并修复 require 语句
        if (content.includes('const axios = require(')) {
          content = content.replace('const axios = require(\'axios\');', 'import axios from \'axios\';');
          modified = true;
          log(colors.green, `✅ 修复 ${file}: require -> import`);
        }
        
        // 检查并修复 VercelRequest, VercelResponse 导入
        if (content.includes('const { VercelRequest, VercelResponse } = require(')) {
          content = content.replace(
            'const { VercelRequest, VercelResponse } = require(\'@vercel/node\');',
            'import type { VercelRequest, VercelResponse } from \'@vercel/node\';'
          );
          modified = true;
          log(colors.green, `✅ 修复 ${file}: require types -> import type`);
        }
        
        if (modified) {
          fs.writeFileSync(filePath, content, 'utf8');
          fixedCount++;
        } else {
          log(colors.cyan, `ℹ️  ${file}: 无需修复`);
        }
      } else {
        log(colors.yellow, `⚠️  ${file}: 文件不存在`);
      }
    } catch (error) {
      log(colors.red, `❌ 修复 ${file} 失败: ${error.message}`);
    }
  }
  
  log(colors.blue, `\n🎯 修复完成！共修复了 ${fixedCount} 个文件。`);
  
  // 生成验证脚本
  log(colors.cyan, '\n📋 验证修复结果...');
  console.log(`
// 验证脚本
const verifyESModules = () => {
  const files = [
    'api/wecom/token.ts',
    'api/wecom/send.ts',
    'api/wecom/token-simple.ts',
    'api/wecom/send-simple.ts',
    'api/wecom/token-fixed.ts',
    'api/wecom/send-fixed.ts',
    'api/wecom/test.ts'
  ];
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const hasModuleExports = content.includes('module.exports');
    const hasRequire = content.includes('require(');
    const hasExportDefault = content.includes('export default');
    const hasImport = content.includes('import ');
    
    console.log(\`\${file}:\`);
    console.log(\`  - module.exports: \${hasModuleExports ? '❌' : '✅'}\`);
    console.log(\`  - require(): \${hasRequire ? '❌' : '✅'}\`);
    console.log(\`  - export default: \${hasExportDefault ? '✅' : '❌'}\`);
    console.log(\`  - import: \${hasImport ? '✅' : '❌'}\`);
    console.log('');
  });
};
  `);
  
  // 提供部署建议
  log(colors.cyan, '\n📋 部署建议:');
  log(colors.yellow, '1. 提交修复后的代码:');
  console.log(`
   git add .
   git commit -m "修复ES模块语法错误"
   git push origin main
  `);
  
  log(colors.yellow, '2. 重新部署到Vercel:');
  console.log(`
   # Vercel会自动重新部署
   # 或者手动触发部署
  `);
  
  log(colors.yellow, '3. 验证部署:');
  console.log(`
   # 检查Vercel函数日志
   # 测试API端点
   curl https://your-app.vercel.app/api/wecom/token?corpid=test&corpsecret=test
  `);
};

// 运行修复
fixESModules().catch(error => {
  log(colors.red, `❌ 修复失败: ${error.message}`);
}); 