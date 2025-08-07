# 员工管理表头筛选功能

## 功能概述

为员工管理页面增加了表头筛选功能，用户可以通过点击表头的筛选图标来筛选数据，提高数据查找和管理的效率。

## 新增功能

### 1. 表头筛选器

#### 员工姓名筛选
- 支持文本搜索筛选
- 点击表头筛选图标输入关键词
- 支持模糊匹配（不区分大小写）

#### 员工UID筛选
- 支持文本搜索筛选
- 点击表头筛选图标输入关键词
- 支持模糊匹配（不区分大小写）

#### 状态筛选
- 下拉选择筛选
- 自动获取当前数据中的所有状态选项
- 支持多选筛选

#### 持有周期筛选
- 下拉选择筛选
- 预设选项：
  - 未开通
  - 1-30天
  - 31-90天
  - 91-180天
  - 181-365天
  - 365天以上

#### 违规状态筛选
- 下拉选择筛选
- 预设选项：
  - 正常
  - 黄牌
  - 红牌

### 2. 筛选控制

#### 筛选状态显示
- 当有筛选条件时，在表格上方显示"当前筛选"提示
- 提供清除筛选和清除排序按钮

#### 筛选图标
- 有筛选条件时，筛选图标显示为蓝色
- 无筛选条件时，筛选图标显示为默认颜色

### 3. 分页适配

- 筛选后的数据会重新计算分页
- 分页信息会显示筛选后的总记录数
- 保持原有的分页功能

## 技术实现

### 状态管理
```typescript
// 表头筛选相关状态
const [filteredInfo, setFilteredInfo] = useState<Record<string, any>>({});
const [sortedInfo, setSortedInfo] = useState<Record<string, any>>({});
```

### 筛选逻辑
```typescript
// 获取筛选后的数据
const getFilteredData = () => {
  let filteredData = [...data];

  // 状态筛选
  if (filteredInfo.status && filteredInfo.status.length > 0) {
    filteredData = filteredData.filter(item => 
      item.status && filteredInfo.status.includes(item.status)
    );
  }

  // 违规状态筛选
  if (filteredInfo.violation_status && filteredInfo.violation_status.length > 0) {
    filteredData = filteredData.filter(item => {
      if (!item.violation_status) {
        return filteredInfo.violation_status.includes('normal');
      }
      return filteredInfo.violation_status.includes(item.violation_status.status);
    });
  }

  // 持有周期筛选
  if (filteredInfo.holding_period && filteredInfo.holding_period.length > 0) {
    filteredData = filteredData.filter(item => {
      const details = getHoldingPeriodDetails(item.activation_time);
      const days = details.days;
      
      // 根据不同的周期范围进行筛选
      if (filteredInfo.holding_period.includes('not_activated')) {
        return !item.activation_time;
      }
      if (filteredInfo.holding_period.includes('1_30')) {
        return days >= 1 && days <= 30;
      }
      // ... 其他周期范围
    });
  }

  return filteredData;
};
```

### 表格列配置
```typescript
// 示例：状态列配置
{
  title: '状态',
  dataIndex: 'status',
  key: 'status',
  width: 100,
  filters: getStatusOptions(), // 动态获取状态选项
  filteredValue: filteredInfo.status || null,
  onFilter: (value: any, record: EmployeeListData) => 
    record.status === String(value),
  filterIcon: (filtered: boolean) => (
    <FilterOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
  ),
  render: (status: string) => {
    // 渲染逻辑
  },
}
```

## 使用方法

### 1. 文本筛选
1. 点击员工姓名或员工UID列的表头筛选图标
2. 在弹出的输入框中输入关键词
3. 按回车或点击筛选按钮确认

### 2. 下拉筛选
1. 点击状态、持有周期或违规状态列的表头筛选图标
2. 在弹出的下拉菜单中选择筛选条件
3. 支持多选筛选

### 3. 清除筛选
1. 当有筛选条件时，表格上方会显示"当前筛选"区域
2. 点击"清除筛选"按钮清除所有筛选条件
3. 点击"清除排序"按钮清除排序条件

## 注意事项

1. **性能考虑**：筛选是在前端进行的，适用于数据量不大的情况
2. **数据同步**：筛选不会影响原始数据，只影响显示
3. **分页适配**：筛选后的数据会重新计算分页信息
4. **搜索兼容**：表头筛选与顶部搜索功能可以同时使用

## 未来优化

1. **后端筛选**：对于大数据量，可以考虑将筛选逻辑移到后端
2. **筛选历史**：可以添加筛选条件的保存和恢复功能
3. **高级筛选**：可以添加日期范围筛选、数值范围筛选等
4. **筛选导出**：可以添加将筛选结果导出为Excel的功能 