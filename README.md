# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## 项目功能

### 员工笔记数据管理系统

#### 核心功能
- **数据导入**: 支持Excel文件导入，自动解析和验证数据
- **数据管理**: 完整的CRUD操作，支持搜索和筛选
- **数据分析**: 提供数据统计和可视化分析
- **数据验证**: 多层次的数据质量检查和一致性验证

#### 优化后的数据解析和上传逻辑

##### 1. 数据解析优化
- **智能表头识别**: 自动识别Excel文件的级联表头结构
- **灵活字段映射**: 支持多种字段名称的自动映射
- **数值安全解析**: 确保数值字段正确解析，包括0值的处理
- **数据质量检查**: 自动检测数据完整性和有效性

##### 2. 数据验证功能
- **数据质量检查**: 检查必需字段、数值有效性等
- **数据清理和标准化**: 自动清理无效数据，标准化数据格式
- **数据一致性验证**: 比较Excel数据与数据库数据的一致性
- **错误报告**: 详细的错误信息和警告提示

##### 3. 上传逻辑优化
- **数据预处理**: 上传前自动清理和验证数据
- **重复数据处理**: 智能处理重复数据，支持更新或跳过
- **批量上传**: 支持批量数据上传，带进度跟踪
- **错误处理**: 完善的错误处理和恢复机制

##### 4. 数据一致性保证
- **数值字段处理**: 确保所有数值字段为数字类型，0值正确保存
- **字符串字段处理**: 确保字符串字段不为null
- **必需字段验证**: 自动生成缺失的必需字段
- **数据类型转换**: 自动转换数据类型，确保数据库兼容性

#### 技术特性
- **TypeScript**: 完整的类型安全
- **React 18**: 最新的React特性
- **Ant Design**: 现代化的UI组件
- **Supabase**: 强大的后端数据库服务
- **XLSX**: 高效的Excel文件处理

#### 数据验证工具
```typescript
// 数据质量检查
const qualityReport = checkDataQuality(data);

// 数据清理和标准化
const cleanedData = cleanAndStandardizeData(data);

// 数据一致性验证
const consistencyReport = validateDataConsistency(excelData, dbData);
```

#### 使用示例
```typescript
// 导入Excel文件
const handleFileUpload = async (file: File) => {
  const parsedData = await parseFileData(file);
  // 自动进行数据质量检查和清理
  const qualityReport = checkDataQuality(parsedData);
  const cleanedData = cleanAndStandardizeData(parsedData);
  
  // 上传数据
  for (const item of cleanedData) {
    await employeeNotesApi.createEmployeeNotesData(item);
  }
};
```

## 开发指南

### 环境设置
1. 安装依赖: `npm install`
2. 配置环境变量: 复制 `env.example` 为 `.env.local`
3. 启动开发服务器: `npm run dev`

### 数据库设置
1. 创建Supabase项目
2. 运行SQL脚本创建表结构
3. 配置环境变量中的数据库连接信息

### 测试功能
```typescript
// 测试优化后的数据解析和上传逻辑
import { testOptimizedDataProcessing } from './utils/testSupabase';
await testOptimizedDataProcessing();
```

## 扩展ESLint配置

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
