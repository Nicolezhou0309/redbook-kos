// 违规状态筛选逻辑测试脚本
console.log('🔍 违规状态筛选逻辑测试');

// 模拟员工数据
const mockEmployees = [
  {
    id: '1',
    employee_name: '张三',
    employee_uid: 'zhang001',
    violation_status: {
      employeeId: '1',
      employeeName: '张三',
      currentYellowCards: 0,
      currentRedCards: 0,
      status: 'normal'
    }
  },
  {
    id: '2',
    employee_name: '李四',
    employee_uid: 'li002',
    violation_status: {
      employeeId: '2',
      employeeName: '李四',
      currentYellowCards: 1,
      currentRedCards: 0,
      status: 'yellow'
    }
  },
  {
    id: '3',
    employee_name: '王五',
    employee_uid: 'wang003',
    violation_status: {
      employeeId: '3',
      employeeName: '王五',
      currentYellowCards: 0,
      currentRedCards: 1,
      status: 'red'
    }
  },
  {
    id: '4',
    employee_name: '赵六',
    employee_uid: 'zhao004',
    violation_status: null
  }
];

// 筛选函数（模拟修复后的逻辑）
function filterByViolationStatus(employees, filterValue) {
  return employees.filter(employee => {
    const violationStatus = employee.violation_status;
    const filterValueStr = String(filterValue);
    
    if (!violationStatus) {
      return filterValueStr === 'normal';
    }
    
    switch (filterValueStr) {
      case 'normal':
        return violationStatus.status === 'normal';
      case 'yellow':
        return violationStatus.status === 'yellow';
      case 'red':
        return violationStatus.status === 'red';
      default:
        return false;
    }
  });
}

// 测试用例
const testCases = [
  {
    name: '筛选正常状态',
    filterValue: 'normal',
    expected: ['张三', '赵六'] // 张三状态正常，赵六无状态记录视为正常
  },
  {
    name: '筛选黄牌状态',
    filterValue: 'yellow',
    expected: ['李四']
  },
  {
    name: '筛选红牌状态',
    filterValue: 'red',
    expected: ['王五']
  },
  {
    name: '筛选无效状态',
    filterValue: 'invalid',
    expected: []
  }
];

// 运行测试
console.log('开始测试违规状态筛选逻辑...\n');

testCases.forEach((testCase, index) => {
  console.log(`=== 测试 ${index + 1}: ${testCase.name} ===`);
  console.log('筛选值:', testCase.filterValue);
  
  const result = filterByViolationStatus(mockEmployees, testCase.filterValue);
  const resultNames = result.map(emp => emp.employee_name);
  
  console.log('筛选结果:', resultNames);
  console.log('期望结果:', testCase.expected);
  
  const passed = JSON.stringify(resultNames.sort()) === JSON.stringify(testCase.expected.sort());
  console.log(`状态: ${passed ? '✅ 通过' : '❌ 失败'}\n`);
});

// 测试状态显示逻辑
console.log('=== 测试状态显示逻辑 ===');

function getStatusDisplayText(status) {
  if (!status) {
    return '正常';
  }
  
  if (status.status === 'red') {
    return `红牌 ${status.currentRedCards}张`;
  } else if (status.status === 'yellow') {
    return `黄牌 ${status.currentYellowCards}张`;
  } else {
    return '正常';
  }
}

function getStatusColor(status) {
  if (!status) {
    return 'green';
  }
  
  if (status.status === 'red') {
    return 'red';
  } else if (status.status === 'yellow') {
    return 'orange';
  } else {
    return 'green';
  }
}

mockEmployees.forEach(employee => {
  const displayText = getStatusDisplayText(employee.violation_status);
  const color = getStatusColor(employee.violation_status);
  console.log(`${employee.employee_name}: ${displayText} (${color})`);
});

console.log('\n🎯 违规状态筛选逻辑测试完成！');

// 验证筛选选项
console.log('\n=== 筛选选项验证 ===');
const filterOptions = [
  { text: '正常', value: 'normal' },
  { text: '黄牌', value: 'yellow' },
  { text: '红牌', value: 'red' }
];

console.log('筛选选项:');
filterOptions.forEach(option => {
  console.log(`- ${option.text} (${option.value})`);
});

console.log('\n✅ 所有测试完成！');
