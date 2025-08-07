# 红黄牌记录管理功能

## 功能概述

红黄牌记录管理功能用于记录和管理员工的违纪行为，包括红牌和黄牌记录。该功能提供了完整的CRUD操作，支持搜索、筛选和统计分析。

## 数据库表结构

```sql
create table public.disciplinary_record (
  id uuid not null default gen_random_uuid (),
  employee_name text not null,
  reason text not null,
  created_at timestamp with time zone not null default now(),
  constraint disciplinary_record_pkey primary key (id)
) TABLESPACE pg_default;
```

## 功能特性

### 1. 数据管理
- **添加记录**: 支持添加新的红黄牌记录（员工姓名从employee_list表中选择）
- **编辑记录**: 支持修改现有记录
- **删除记录**: 支持删除记录（带确认提示）
- **批量操作**: 支持批量创建记录

### 2. 搜索和筛选
- **员工姓名搜索**: 支持按员工姓名模糊搜索
- **时间范围筛选**: 支持按创建时间范围筛选
- **重置功能**: 一键重置所有筛选条件

### 3. 数据展示
- **表格展示**: 使用Ant Design Table组件展示数据
- **分页功能**: 支持分页显示，可调整每页显示数量
- **排序功能**: 支持按创建时间排序
- **文本省略**: 长文本自动省略并支持悬停查看完整内容

### 4. 统计分析
- **总记录数**: 显示系统中的总红黄牌记录数
- **涉及员工数**: 显示被记录红黄牌的员工总数
- **本月记录**: 显示当前月份的红黄牌记录数
- **上月记录**: 显示上个月的红黄牌记录数

## 页面结构

### 主要组件
- `DisciplinaryRecord.tsx`: 主页面组件
- `disciplinaryRecordApi.ts`: API接口封装
- `employeeListApi.ts`: 员工列表API接口
- 类型定义: 在 `employee.ts` 中添加了相关类型

### 页面布局
1. **标题区域**: 显示"红黄牌记录管理"标题
2. **统计卡片**: 显示关键统计数据
3. **搜索区域**: 提供搜索和筛选功能
4. **数据表格**: 展示红黄牌记录列表
5. **操作模态框**: 用于添加和编辑记录

## API接口

### 主要方法
- `getAllDisciplinaryRecords()`: 获取所有记录
- `getDisciplinaryRecordsByEmployeeName()`: 按员工姓名搜索
- `getDisciplinaryRecordsByTimeRange()`: 按时间范围筛选
- `createDisciplinaryRecord()`: 创建新记录
- `updateDisciplinaryRecord()`: 更新记录
- `deleteDisciplinaryRecord()`: 删除记录
- `getStatistics()`: 获取统计信息

### 数据验证
- 员工姓名: 必填，从employee_list表中选择
- 红黄牌原因: 必填，最大500字符

## 使用说明

### 访问页面
1. 登录系统后，在左侧菜单中点击"红黄牌记录"
2. 页面将显示所有红黄牌记录

### 添加记录
1. 点击"添加红黄牌记录"按钮
2. 在弹出的模态框中填写员工姓名和红黄牌原因
3. 点击"添加"按钮保存

### 编辑记录
1. 在表格中找到要编辑的记录
2. 点击"编辑"按钮
3. 在弹出的模态框中修改信息
4. 点击"更新"按钮保存

### 删除记录
1. 在表格中找到要删除的记录
2. 点击"删除"按钮
3. 在确认对话框中点击"确定"

### 搜索和筛选
1. 在搜索框中输入员工姓名进行搜索
2. 使用日期选择器选择时间范围进行筛选
3. 点击"搜索"按钮执行搜索
4. 点击"重置"按钮清除所有筛选条件

## 技术实现

### 前端技术栈
- React 18 + TypeScript
- Ant Design 5.x
- React Router DOM
- Day.js (日期处理)

### 后端技术栈
- Supabase (PostgreSQL)
- Row Level Security (RLS)

### 状态管理
- React Hooks (useState, useEffect)
- 本地状态管理

## 注意事项

1. **数据安全**: 所有操作都需要用户登录验证
2. **输入验证**: 前端和后端都有数据验证
3. **错误处理**: 完善的错误处理和用户提示
4. **响应式设计**: 支持不同屏幕尺寸
5. **性能优化**: 使用分页和虚拟滚动优化大数据量显示

## 未来扩展

1. **导出功能**: 支持导出Excel或PDF格式
2. **图表统计**: 添加更多可视化图表
3. **批量操作**: 支持批量编辑和删除
4. **通知功能**: 重要记录变更时发送通知
5. **权限管理**: 细粒度的操作权限控制 