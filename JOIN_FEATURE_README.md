# 员工数据关联分析功能

## 功能概述

本功能实现了 `employee_response_data`（员工回复数据表）和 `employee_leads_data`（员工线索明细表）的关联查询，提供了完整的数据分析和管理功能。

## 核心特性

### 🔗 数据关联
- **基于员工姓名和时间范围**：通过 `employee_name` 和 `time_range` 字段关联两个表
- **LEFT JOIN**：确保所有员工回复数据都能显示，即使没有对应的线索数据
- **数据完整性**：保留两个表的所有字段信息

### 🔍 多维度筛选
- **员工筛选**：按员工姓名多选筛选
- **地区筛选**：按地区多选筛选
- **时间范围筛选**：按时间范围多选筛选
- **标签筛选**：按标签多选筛选
- **数值范围筛选**：
  - 15秒回复率范围
  - 30秒回复率范围
  - 1分钟回复率范围
  - 用户评分范围
  - 平均回复时间范围
  - 总互动数范围
  - 表单留资数范围
  - 发布笔记数范围
  - 推广笔记数范围
  - 推广费用范围

### 📊 数据统计
- **总员工数**：当前筛选条件下的员工总数
- **平均回复率**：15秒、30秒、1分钟回复率的平均值
- **平均用户评分**：用户评分的平均值
- **总互动数**：所有员工的总互动数
- **总表单留资**：所有员工的总表单留资数
- **总推广费用**：所有员工的总推广费用

### 📋 表格功能
- **排序**：支持所有字段的升序/降序排序
- **分页**：支持自定义页面大小和快速跳转
- **数据展示**：
  - 员工基本信息（姓名、UID、小红书账号）
  - 回复表现（各时间段回复率、平均回复时间、用户评分）
  - 业务数据（互动数、留资数、笔记数、推广费用）
  - 数据脱敏（手机号、微信号等敏感信息自动脱敏）

## 技术实现

### 数据库层面

#### 1. 视图创建
```sql
CREATE OR REPLACE VIEW employee_join_view AS
SELECT 
    er.id,
    er.employee_name,
    er.employee_uid,
    -- 员工回复数据字段
    er.score_15s_response,
    er.score_30s_response,
    er.score_1min_response,
    er.score_1hour_timeout,
    er.score_avg_response_time,
    er.rate_15s_response,
    er.rate_30s_response,
    er.rate_1min_response,
    er.rate_1hour_timeout,
    er.avg_response_time,
    er.user_rating_score,
    er.time_range,
    er.created_at,
    er.updated_at,
    -- 员工线索数据字段
    el.id as leads_id,
    el.xiaohongshu_account_id,
    el.xiaohongshu_nickname,
    el.account_id,
    el.region,
    el.tags,
    el.activation_time,
    el.published_notes_count,
    el.promoted_notes_count,
    el.notes_promotion_cost,
    el.total_interactions,
    el.total_form_leads,
    el.total_private_message_leads,
    el.total_private_message_openings,
    el.total_private_message_leads_kept,
    el.notes_exposure_count,
    el.notes_click_count,
    el.time_range as leads_time_range,
    el.created_at as leads_created_at,
    el.updated_at as leads_updated_at
FROM employee_response_data er
LEFT JOIN employee_leads_data el ON er.employee_name = el.employee_name 
    AND er.time_range = el.time_range->>'remark';
```

#### 2. 索引优化
```sql
-- 为视图创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_employee_join_view_employee_name ON employee_join_view(employee_name);
CREATE INDEX IF NOT EXISTS idx_employee_join_view_time_range ON employee_join_view(time_range);
CREATE INDEX IF NOT EXISTS idx_employee_join_view_region ON employee_join_view(region);
CREATE INDEX IF NOT EXISTS idx_employee_join_view_created_at ON employee_join_view(created_at);
CREATE INDEX IF NOT EXISTS idx_employee_join_view_name_time ON employee_join_view(employee_name, time_range);
```

### API层面

#### 1. 主要函数
- `getEmployeeJoinData()`: 获取关联数据，支持筛选、排序、分页
- `getFilterOptions()`: 获取筛选选项（员工姓名、地区、时间范围、标签）
- `getJoinDataStats()`: 获取统计数据

#### 2. 类型定义
```typescript
interface EmployeeJoinData {
  // 员工回复数据字段
  id: string
  employee_name: string
  employee_uid: string
  score_15s_response: number
  // ... 其他字段
  
  // 员工线索数据字段
  leads_id?: string
  xiaohongshu_account_id?: string
  region?: string
  // ... 其他字段
}

interface JoinFilterParams {
  employee_names?: string[]
  regions?: string[]
  time_ranges?: string[]
  tags?: string[]
  min_score_15s_response?: number
  max_score_15s_response?: number
  // ... 其他筛选参数
}
```

### 前端层面

#### 1. 页面组件
- `EmployeeJoin.tsx`: 主要的关联数据展示页面
- 统计卡片：显示关键指标
- 快速筛选：常用筛选条件
- 数据表格：支持排序和分页
- 高级筛选：详细的筛选选项

#### 2. 功能特性
- **响应式设计**：适配不同屏幕尺寸
- **数据脱敏**：自动处理敏感信息
- **加载状态**：友好的加载提示
- **错误处理**：完善的错误提示
- **数据导出**：支持数据导出功能

## 使用方法

### 1. 访问页面
访问 `/employee-join` 路由即可进入员工数据关联分析页面。

### 2. 基础筛选
使用页面顶部的快速筛选器：
- 选择员工姓名
- 选择地区
- 选择时间范围
- 搜索小红书账号

### 3. 高级筛选
点击"高级筛选"按钮，在弹窗中设置详细的筛选条件：
- 多选筛选：员工姓名、地区、时间范围、标签
- 数值范围：各种指标的数值范围筛选

### 4. 数据排序
点击表格列标题进行排序：
- 支持升序/降序排序
- 支持所有字段排序

### 5. 分页浏览
使用页面底部的分页控件：
- 自定义页面大小
- 快速跳转到指定页面
- 显示总记录数

## 数据安全

### 敏感信息处理
- **手机号脱敏**：显示前4位和后3位，中间用****代替
- **微信号脱敏**：显示前2位和后2位，中间用**代替
- **小红书账号脱敏**：显示前4位和后3位，中间用****代替

### 数据权限
- 只读访问：所有用户只能查看数据，不能修改
- 数据验证：前端和后端双重数据验证
- 错误处理：完善的错误提示和处理机制

## 性能优化

### 1. 数据库优化
- 使用视图简化复杂查询
- 创建合适的索引提高查询速度
- 使用LEFT JOIN确保数据完整性

### 2. 前端优化
- 分页加载减少数据传输
- 防抖处理避免频繁请求
- 缓存筛选选项减少重复请求

### 3. API优化
- 支持条件查询减少数据传输
- 使用count查询获取总数
- 错误处理和重试机制

## 测试验证

### 1. 功能测试
运行测试脚本验证所有功能：
```typescript
import { runAllTests } from './utils/testJoinApi'
await runAllTests()
```

### 2. 数据完整性测试
- 检查必需字段是否存在
- 验证数据范围是否合理
- 确认关联关系是否正确

### 3. 性能测试
- 测试大数据量下的查询性能
- 验证筛选和排序的响应速度
- 检查内存使用情况

## 扩展功能

### 1. 数据导出
- 支持Excel格式导出
- 支持CSV格式导出
- 支持自定义字段导出

### 2. 数据可视化
- 添加图表展示
- 支持趋势分析
- 提供数据对比功能

### 3. 实时更新
- 支持数据实时刷新
- 添加数据变更通知
- 提供数据同步功能

## 故障排除

### 常见问题

1. **数据加载失败**
   - 检查数据库连接
   - 验证表结构是否正确
   - 确认视图是否创建成功

2. **筛选功能异常**
   - 检查筛选参数格式
   - 验证数据库查询语句
   - 确认字段名称是否正确

3. **性能问题**
   - 检查数据库索引
   - 优化查询语句
   - 考虑数据分页

### 调试工具
- 使用浏览器开发者工具查看网络请求
- 检查控制台错误信息
- 使用测试脚本验证功能

## 更新日志

### v1.0.0 (2024-01-XX)
- 初始版本发布
- 实现基础的关联查询功能
- 支持筛选、排序、分页
- 添加数据统计功能
- 实现敏感信息脱敏 