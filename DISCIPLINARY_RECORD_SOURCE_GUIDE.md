# 违规记录来源功能使用指南

## 概述

优化后的违规记录表增加了完整的记录来源跟踪功能，可以准确记录每条违规记录的创建来源，包括时间范围、原始表名、数据ID等关键信息。

## 核心功能

### 1. 记录来源字段

| 字段名 | 类型 | 说明 | 示例值 |
|--------|------|------|--------|
| `source_type` | text | 来源类型 | 'manual', 'import', 'auto' |
| `source_table` | text | 原始数据表名 | 'employee_response_data' |
| `source_record_id` | uuid | 原始记录ID | 原始数据的UUID |
| `source_time_range` | jsonb | 数据时间范围 | '{"start": "2024-01-01", "end": "2024-01-31"}' |
| `source_batch_id` | text | 批量导入批次ID | 'batch_001' |
| `source_file_name` | text | 导入文件名 | 'employee_data_202401.xlsx' |
| `source_import_time` | timestamp | 导入时间 | 2024-01-15 10:30:00 |
| `source_metadata` | jsonb | 额外来源信息 | {"employee_uid": "xxx", "generation_rule": "auto"} |

### 2. 来源类型说明

- **manual**: 手动录入的违规记录
- **import**: 通过批量导入创建的违规记录
- **auto**: 系统自动生成的违规记录

### 3. 记录来源说明

#### 来源类型
- **manual**: 手动录入的违规记录
- **import**: 通过批量导入创建的违规记录  
- **auto**: 系统自动生成的违规记录

#### 时间范围格式
时间范围使用JSONB格式存储，例如：
```json
{
  "start": "2024-01-01",
  "end": "2024-01-31"
}
```

## 使用方法

### 1. 手动创建违规记录

```sql
INSERT INTO public.disciplinary_record (
  employee_name,
  reason,
  type,
  source_type,
  source_table,
  source_metadata
) VALUES (
  '张三',
  '工作态度不端正',
  'attitude_violation',
  'manual',
  NULL,
  jsonb_build_object('created_by', 'admin', 'note', '手动录入')
);
```

### 2. 批量导入时创建违规记录

```sql
INSERT INTO public.disciplinary_record (
  employee_name,
  reason,
  type,
  source_type,
  source_table,
  source_time_range,
  source_batch_id,
  source_file_name,
  source_import_time,
  source_metadata
) VALUES (
  '李四',
  '响应时间过长',
  'performance_violation',
  'import',
  'employee_response_data',
  '2024-01-01 to 2024-01-31',
  'batch_001',
  'employee_data_202401.xlsx',
  NOW(),
  jsonb_build_object('employee_uid', 'EMP001', 'import_session', 'session_001')
);
```

### 3. 创建带来源信息的违规记录

```sql
-- 手动创建违规记录
INSERT INTO public.disciplinary_record (
  employee_name,
  reason,
  type,
  source_type,
  source_table,
  source_time_range,
  source_metadata
) VALUES (
  '张三',
  '响应时间过长',
  'performance_violation',
  'manual',
  'employee_response_data',
  '{"start": "2024-01-01", "end": "2024-01-31"}',
  '{"employee_uid": "EMP001", "note": "手动录入"}'
);

-- 批量导入时创建违规记录
INSERT INTO public.disciplinary_record (
  employee_name,
  reason,
  type,
  source_type,
  source_table,
  source_time_range,
  source_batch_id,
  source_file_name,
  source_import_time,
  source_metadata
) VALUES (
  '李四',
  '响应时间过长',
  'performance_violation',
  'import',
  'employee_response_data',
  '{"start": "2024-01-01", "end": "2024-01-31"}',
  'batch_001',
  'employee_data_202401.xlsx',
  NOW(),
  '{"employee_uid": "EMP002", "import_session": "session_001"}'
);
```

### 4. 查询违规记录

#### 按来源类型查询

```sql
-- 查询所有自动生成的违规记录
SELECT * FROM public.disciplinary_record WHERE source_type = 'auto';

-- 查询所有手动录入的违规记录
SELECT * FROM public.disciplinary_record WHERE source_type = 'manual';

-- 查询所有批量导入的违规记录
SELECT * FROM public.disciplinary_record WHERE source_type = 'import';
```

#### 按数据源查询

```sql
-- 查询来自员工响应数据的违规记录
SELECT * FROM public.disciplinary_record WHERE source_table = 'employee_response_data';

-- 查询来自员工笔记数据的违规记录
SELECT * FROM public.disciplinary_record WHERE source_table = 'employee_notes';
```

#### 按时间范围查询

```sql
-- 查询特定时间范围的违规记录
SELECT * FROM public.disciplinary_record 
WHERE source_time_range = '{"start": "2024-01-01", "end": "2024-01-31"}';

-- 查询包含特定开始时间的记录
SELECT * FROM public.disciplinary_record 
WHERE source_time_range->>'start' = '2024-01-01';
```

#### 复杂查询示例

```sql
-- 查询特定来源类型和表名的记录
SELECT 
  employee_name,
  reason,
  type,
  source_type,
  source_table,
  source_time_range,
  created_at
FROM public.disciplinary_record
WHERE source_type = 'auto' 
  AND source_table = 'employee_response_data'
ORDER BY created_at DESC;
```

### 5. 启用自动触发器

如果需要在新数据导入时自动生成违规记录，可以启用触发器：

```sql
-- 启用触发器（谨慎使用，可能影响性能）
CREATE TRIGGER tr_employee_response_data_disciplinary
  AFTER INSERT ON employee_response_data
  FOR EACH ROW
  EXECUTE FUNCTION trigger_generate_disciplinary_records();
```

## 前端集成示例

### 1. 更新API调用

```typescript
// 创建违规记录时包含来源信息
const createDisciplinaryRecord = async (record: {
  employee_name: string;
  reason: string;
  type: string;
  source_type: 'manual' | 'import' | 'auto';
  source_table?: string;
  source_time_range?: string;
  source_batch_id?: string;
  source_file_name?: string;
  source_metadata?: any;
}) => {
  const { data, error } = await supabase
    .from('disciplinary_record')
    .insert({
      ...record,
      source_import_time: record.source_type === 'import' ? new Date().toISOString() : null
    });
  
  return { data, error };
};
```

### 2. 批量导入时自动生成违规记录

```typescript
// 在员工数据导入后自动生成违规记录
const generateViolationsFromImport = async (
  sourceTable: string,
  timeRange: string,
  batchId: string,
  fileName: string
) => {
  const { data, error } = await supabase.rpc(
    'generate_disciplinary_records_from_employee_data',
    {
      p_source_table: sourceTable,
      p_time_range: timeRange,
      p_batch_id: batchId,
      p_file_name: fileName
    }
  );
  
  return { data, error };
};
```

### 3. 查询违规记录来源

```typescript
// 查询特定来源的违规记录
const getViolationsBySource = async (params: {
  source_type?: string;
  source_table?: string;
  time_range?: string;
  batch_id?: string;
}) => {
  const { data, error } = await supabase.rpc(
    'get_disciplinary_records_by_source',
    {
      p_source_type: params.source_type || null,
      p_source_table: params.source_table || null,
      p_time_range: params.time_range || null,
      p_batch_id: params.batch_id || null
    }
  );
  
  return { data, error };
};
```

## 数据迁移

如果已有违规记录数据，可以按以下步骤迁移：

```sql
-- 1. 备份现有数据
CREATE TABLE disciplinary_record_backup AS SELECT * FROM disciplinary_record;

-- 2. 为现有记录添加来源信息
UPDATE public.disciplinary_record 
SET 
  source_type = 'manual',
  source_metadata = jsonb_build_object('migration_note', '从旧版本迁移')
WHERE source_type IS NULL;
```

## 性能优化

1. **索引优化**: 已为所有来源字段创建了索引
2. **批量处理**: 使用批量操作减少数据库交互
3. **触发器控制**: 触发器默认关闭，避免性能影响
4. **查询优化**: 提供专门的查询函数和视图

## 注意事项

1. **数据一致性**: 确保原始数据表存在且结构正确
2. **性能考虑**: 大量数据导入时建议分批处理
3. **触发器使用**: 谨慎使用自动触发器，可能影响导入性能
4. **数据备份**: 重要操作前请备份数据

## 扩展功能

可以通过 `source_metadata` 字段存储更多自定义信息：

```sql
-- 存储自定义来源信息
UPDATE public.disciplinary_record 
SET source_metadata = jsonb_build_object(
  'custom_field_1', 'value1',
  'custom_field_2', 'value2',
  'business_rule', 'custom_rule_001'
)
WHERE id = 'record_id';
``` 