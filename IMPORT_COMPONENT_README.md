# 数据导入组件使用指南

## 概述

本项目提供了数据导入组件，支持员工数据的批量导入功能。

## 组件列表

### UltimateImportModal - 终极导入组件
- 支持多文件上传
- 自动文件类型识别
- 进度条显示
- 数据预览功能
- 详细的导入结果
- 更好的错误处理
- 文件内容预览

## 使用方法

### 基础用法

```tsx
import UltimateImportModal from './components/UltimateImportModal';

const MyComponent = () => {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
      <Button onClick={() => setModalVisible(true)}>
        打开导入
      </Button>
      
      <UltimateImportModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSuccess={() => {
          console.log('导入成功');
          // 刷新数据列表
        }}
      />
    </>
  );
};
```

## 文件类型识别规则

### 员工回复率数据
- **文件名包含**: "员工" + "回复" 或 "employee" + "response"
- **文件格式**: Excel (.xlsx, .xls)
- **默认分类**: 如果文件名包含相关关键词，自动分类为员工数据

### 员工线索明细
- **文件名包含**: "线索"、"明细"、"leads"、"detail"
- **文件格式**: CSV (.csv)
- **默认分类**: CSV文件默认分类为线索数据

### 员工笔记数据
- **文件名包含**: "笔记"、"记录"、"notes"、"record"
- **文件格式**: Excel/CSV
- **分类**: 根据文件名关键词识别

### 自动识别规则
- `.xlsx/.xls` 文件 → 员工数据
- `.csv` 文件 → 线索数据
- 未知类型文件 → 员工数据（默认）

## 功能特性

### 1. 多文件上传
- 支持同时选择多个文件
- 支持拖拽上传
- 文件大小显示

### 2. 自动分类
- 根据文件名自动识别数据类型
- 显示文件类型标签
- 统计各类型文件数量

### 3. 进度显示
- 单个文件上传进度
- 总体导入进度
- 实时状态更新

### 4. 数据预览
- 预览文件前5行数据
- 显示列名和数据行数
- 表格形式展示

### 5. 错误处理
- 详细的错误信息显示
- 导入失败的文件标记
- 成功/失败统计

## API 接口

组件会自动调用以下API接口：

```tsx
// 员工数据导入
employeeApi.importEmployeeData(file)

// 线索数据导入
employeeLeadsApi.importLeadsData(file)

// 笔记数据导入
employeeNotesApi.importNotesData(file)
```

## 组件属性

### UltimateImportModal

| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| visible | boolean | 是 | 弹窗显示状态 |
| onClose | () => void | 是 | 关闭弹窗回调 |
| onSuccess | () => void | 否 | 导入成功回调 |

## 样式定制

组件使用 Ant Design 组件库，可以通过以下方式定制样式：

```tsx
// 自定义弹窗宽度
<UltimateImportModal
  visible={visible}
  onClose={onClose}
  style={{ width: 1000 }}
/>
```

## 注意事项

1. **文件格式支持**: 目前支持 Excel (.xlsx, .xls) 和 CSV (.csv) 格式
2. **文件大小**: 建议单个文件不超过 10MB
3. **编码格式**: CSV 文件建议使用 UTF-8 编码
4. **网络环境**: 大文件上传需要稳定的网络环境
5. **浏览器兼容**: 支持现代浏览器，建议使用 Chrome、Firefox、Safari

## 示例页面

查看 `src/pages/EmployeeSimpleJoin.tsx` 了解完整的使用示例。

## 故障排除

### 常见问题

1. **文件无法上传**
   - 检查文件格式是否支持
   - 检查文件大小是否超限
   - 检查网络连接

2. **文件类型识别错误**
   - 检查文件名是否包含相关关键词
   - 可以手动修改文件分类逻辑

3. **导入失败**
   - 检查文件内容格式是否正确
   - 查看控制台错误信息
   - 检查API接口是否正常

### 调试方法

```tsx
// 开启调试模式
console.log('文件列表:', fileList);
console.log('导入结果:', importResults);
```

## 更新日志

- v1.0.0: 基础导入功能
- v1.1.0: 添加高级导入组件
- v1.2.0: 添加数据预览功能
- v1.3.0: 优化错误处理和用户体验
- v2.0.0: 重构为UltimateImportModal，移除未使用的组件 