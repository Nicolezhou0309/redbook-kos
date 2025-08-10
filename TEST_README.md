# 员工搜索功能测试指南

## 概述
本测试用于验证员工数据宽表的搜索功能，特别是搜索员工姓名"任菲菲"的功能。

## 测试脚本

### 1. Supabase客户端测试 (test_search_renfeifei.js)
使用Supabase JavaScript客户端进行测试。

**安装依赖：**
```bash
npm install @supabase/supabase-js
```

**运行测试：**
```bash
node test_search_renfeifei.js
```

### 2. 直接PostgreSQL连接测试 (test_direct_connection.js)
使用原生PostgreSQL客户端直接连接数据库进行测试。

**安装依赖：**
```bash
npm install pg
```

**运行测试：**
```bash
node test_direct_connection.js
```

## 测试内容

### 方法1: 使用get_employee_join_data函数搜索
- 调用数据库函数 `get_employee_join_data`
- 传入搜索参数：`search_query = '任菲菲'`, `filter_employee_name = '任菲菲'`
- 验证函数返回结果

### 方法2: 直接查询employee_list表
- 直接查询 `employee_list` 表
- 使用 `ILIKE` 进行模糊搜索
- 验证基础员工信息

### 方法3: 模糊搜索所有相关表
- 搜索 `employee_list` 表
- 搜索 `employee_leads_data` 表
- 验证跨表搜索功能

### 方法4: 测试JOIN查询
- 模拟 `get_employee_join_data` 函数的JOIN逻辑
- 验证表关联查询的正确性

## 数据库连接信息
- **URL**: `postgresql://postgres.nemmkwzijaaadrzwrtyg:[xArYBrzsINV1d7YB]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`
- **数据库**: postgres
- **主机**: aws-0-ap-southeast-1.pooler.supabase.com
- **端口**: 5432

## 预期结果
1. 数据库连接成功
2. `get_employee_join_data` 函数正常执行
3. 能够找到员工"任菲菲"的相关信息
4. 返回完整的员工数据（包括线索数据和响应数据）

## 故障排除

### 连接问题
- 检查网络连接
- 验证数据库凭据
- 确认SSL设置

### 函数调用问题
- 检查 `get_employee_join_data` 函数是否存在
- 验证函数参数类型
- 查看数据库日志

### 数据问题
- 确认员工"任菲菲"在数据库中存在
- 检查表结构和数据完整性
- 验证JOIN条件

## 注意事项
- 测试完成后会自动关闭数据库连接
- 所有查询都使用参数化查询防止SQL注入
- 测试结果会详细输出到控制台
