# Supabase函数使用示例

## 基础搜索函数

### 1. 获取搜索统计信息
```sql
SELECT * FROM get_search_stats();
```

### 2. 获取搜索建议
```sql
SELECT * FROM get_search_suggestions('张');
```

### 3. 获取数值范围
```sql
SELECT * FROM get_numeric_ranges();
```

### 4. 获取筛选选项
```sql
SELECT * FROM get_filter_options();
```

## 高级搜索函数

### 1. 员工高级搜索
```sql
-- 模糊搜索
SELECT * FROM search_employees_advanced(
  search_query := '张三',
  search_type := 'fuzzy',
  region := '北京',
  page_number := 1,
  page_size := 10
);

-- 精确搜索
SELECT * FROM search_employees_advanced(
  search_query := '张三',
  search_type := 'exact',
  employee_name := '张三',
  page_number := 1,
  page_size := 10
);

-- 语义搜索
SELECT * FROM search_employees_advanced(
  search_query := '优秀员工',
  search_type := 'semantic',
  min_interactions := 100,
  page_number := 1,
  page_size := 10
);
```

### 2. 员工绩效分析
```sql
SELECT * FROM get_employee_performance_analysis(
  time_range := '2024年',
  region := '北京',
  min_interactions := 50
);
```

### 3. 响应时间分析
```sql
SELECT * FROM get_response_time_analysis(
  time_range := '2024年',
  region := '上海'
);
```

### 4. 转化率分析
```sql
SELECT * FROM get_conversion_analysis(
  time_range := '2024年',
  region := '广州',
  min_form_leads := 10
);
```

### 5. 时间趋势分析（基础版）
```sql
SELECT * FROM get_time_trend_analysis(
  start_date := '2024-01-01',
  end_date := '2024-12-31',
  region := '北京'
);
```

## 数据分析和统计函数

### 1. 员工数据分析
```sql
SELECT * FROM get_employee_analytics(
  start_date := '2024-01-01',
  end_date := '2024-12-31',
  region_filter := '北京',
  status_filter := 'active'
);
```

### 2. 高级时间趋势分析
```sql
-- 按月分析
SELECT * FROM get_time_trend_analysis_advanced(
  time_period := 'month',
  start_date := '2024-01-01',
  end_date := '2024-12-31'
);

-- 按周分析
SELECT * FROM get_time_trend_analysis_advanced(
  time_period := 'week',
  start_date := '2024-01-01',
  end_date := '2024-12-31'
);

-- 按季度分析
SELECT * FROM get_time_trend_analysis_advanced(
  time_period := 'quarter',
  start_date := '2024-01-01',
  end_date := '2024-12-31'
);
```

### 3. 地区对比分析
```sql
SELECT * FROM get_region_comparison();
```

### 4. 性能评估
```sql
-- 使用默认权重
SELECT * FROM get_performance_evaluation();

-- 自定义权重
SELECT * FROM get_performance_evaluation(
  evaluation_criteria := '{"interactions_weight": 0.4, "response_time_weight": 0.3, "user_rating_weight": 0.3}'::jsonb
);
```

## 实用工具函数

### 1. 数据导出
```sql
-- 导出JSON格式
SELECT export_employee_data('json', '{"region": "北京", "status": "active"}'::jsonb);

-- 导出CSV格式
SELECT export_employee_data('csv', '{"region": "北京", "status": "active"}'::jsonb);
```

### 2. 数据清理
```sql
-- 模拟清理孤立数据
SELECT * FROM cleanup_employee_data('orphaned', TRUE);

-- 实际清理重复数据
SELECT * FROM cleanup_employee_data('duplicates', FALSE);

-- 清理无效数据
SELECT * FROM cleanup_employee_data('invalid', FALSE);
```

### 3. 数据验证
```sql
SELECT * FROM validate_employee_data();
```

### 4. 数据同步
```sql
SELECT * FROM sync_employee_data();
```

### 5. 数据库性能监控
```sql
SELECT * FROM get_database_performance();
```

### 6. 数据备份
```sql
SELECT * FROM backup_employee_data('backup_20241201');
```

## 常用查询组合

### 1. 获取活跃员工统计
```sql
-- 获取统计信息
SELECT * FROM get_search_stats();

-- 获取筛选选项
SELECT * FROM get_filter_options();

-- 搜索活跃员工
SELECT * FROM search_employees_advanced(
  is_active := TRUE,
  sort_by := 'total_interactions',
  sort_direction := 'desc',
  page_size := 20
);
```

### 2. 地区绩效对比
```sql
-- 获取地区对比
SELECT * FROM get_region_comparison();

-- 获取各地区绩效分析
SELECT * FROM get_employee_performance_analysis(
  region := '北京'
);
SELECT * FROM get_employee_performance_analysis(
  region := '上海'
);
```

### 3. 时间趋势监控
```sql
-- 获取月度趋势
SELECT * FROM get_time_trend_analysis_advanced(
  time_period := 'month',
  start_date := '2024-01-01',
  end_date := '2024-12-31'
);

-- 获取员工分析
SELECT * FROM get_employee_analytics(
  start_date := '2024-01-01',
  end_date := '2024-12-31'
);
```

## 错误处理示例

### 1. 处理空结果
```sql
-- 使用COALESCE处理空值
SELECT 
  COALESCE((SELECT * FROM get_search_stats()), '{}'::jsonb) as stats,
  COALESCE((SELECT * FROM get_filter_options()), '{}'::jsonb) as options;
```

### 2. 参数验证
```sql
-- 确保参数有效
SELECT * FROM search_employees_advanced(
  search_query := NULL,  -- 允许空值
  page_size := GREATEST(1, LEAST(100, 50)),  -- 限制范围
  sort_direction := CASE 
    WHEN 'asc' IN ('asc', 'desc') THEN 'asc' 
    ELSE 'asc' 
  END
);
```

## 性能优化建议

### 1. 使用适当的索引
```sql
-- 检查索引使用情况
SELECT * FROM get_database_performance();
```

### 2. 分页查询
```sql
-- 使用分页避免大量数据查询
SELECT * FROM search_employees_advanced(
  page_number := 1,
  page_size := 20
);
```

### 3. 缓存常用查询
```sql
-- 缓存统计信息
SELECT * FROM get_search_stats();
SELECT * FROM get_filter_options();
```

## 注意事项

1. **权限控制**：所有函数都使用 `SECURITY DEFINER`，确保在正确的权限下执行
2. **参数验证**：函数内部包含参数验证，但仍建议在应用层进行验证
3. **错误处理**：所有函数都包含异常处理，会返回有意义的错误信息
4. **性能考虑**：大数据量查询时建议使用分页和适当的筛选条件
5. **数据一致性**：在修改数据前建议先备份 