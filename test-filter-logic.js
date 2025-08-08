// 筛选逻辑测试脚本
console.log('🔍 筛选逻辑测试');

// 模拟筛选条件
const testCases = [
  {
    name: '空筛选条件',
    filteredInfo: {},
    expected: { hasFilters: false, violationStatus: null }
  },
  {
    name: '正常状态筛选',
    filteredInfo: { violation_status: ['normal'] },
    expected: { hasFilters: true, violationStatus: ['normal'], isMultiple: false }
  },
  {
    name: '黄牌状态筛选',
    filteredInfo: { violation_status: ['yellow'] },
    expected: { hasFilters: true, violationStatus: ['yellow'], isMultiple: false }
  },
  {
    name: '红牌状态筛选',
    filteredInfo: { violation_status: ['red'] },
    expected: { hasFilters: true, violationStatus: ['red'], isMultiple: false }
  },
  {
    name: '多选状态筛选',
    filteredInfo: { violation_status: ['normal', 'yellow'] },
    expected: { hasFilters: true, violationStatus: ['normal', 'yellow'], isMultiple: true }
  },
  {
    name: '混合筛选条件',
    filteredInfo: { 
      violation_status: ['red'], 
      status: ['正常'],
      holding_period: ['1_30']
    },
    expected: { hasFilters: true, violationStatus: ['red'], isMultiple: false }
  }
];

// 测试筛选逻辑
function testFilterLogic(filteredInfo) {
  const hasFilters = Object.keys(filteredInfo).length > 0;
  const violationStatus = filteredInfo.violation_status;
  const isMultiple = violationStatus && violationStatus.length > 1;
  
  return {
    hasFilters,
    violationStatus,
    isMultiple,
    violationStatusLength: violationStatus ? violationStatus.length : 0
  };
}

// 运行测试
console.log('开始测试筛选逻辑...\n');

testCases.forEach((testCase, index) => {
  console.log(`=== 测试 ${index + 1}: ${testCase.name} ===`);
  console.log('输入:', JSON.stringify(testCase.filteredInfo, null, 2));
  
  const result = testFilterLogic(testCase.filteredInfo);
  console.log('结果:', JSON.stringify(result, null, 2));
  
  // 验证结果
  const expected = testCase.expected;
  const passed = 
    result.hasFilters === expected.hasFilters &&
    JSON.stringify(result.violationStatus) === JSON.stringify(expected.violationStatus) &&
    result.isMultiple === (expected.isMultiple || false);
  
  console.log(`状态: ${passed ? '✅ 通过' : '❌ 失败'}\n`);
});

// 测试快速筛选按钮逻辑
console.log('=== 测试快速筛选按钮逻辑 ===');

function simulateQuickFilterClick(currentFilters, status) {
  const newFilters = { ...currentFilters };
  
  if (newFilters.violation_status?.includes(status)) {
    // 如果已存在，则移除
    newFilters.violation_status = newFilters.violation_status.filter(s => s !== status);
  } else {
    // 如果不存在，则添加
    newFilters.violation_status = [...(newFilters.violation_status || []), status];
  }
  
  return newFilters;
}

// 测试场景
const quickFilterTests = [
  {
    name: '从空状态添加黄牌',
    initial: {},
    action: 'yellow',
    expected: { violation_status: ['yellow'] }
  },
  {
    name: '从黄牌状态添加红牌',
    initial: { violation_status: ['yellow'] },
    action: 'red',
    expected: { violation_status: ['yellow', 'red'] }
  },
  {
    name: '从多选状态移除黄牌',
    initial: { violation_status: ['yellow', 'red'] },
    action: 'yellow',
    expected: { violation_status: ['red'] }
  },
  {
    name: '移除最后一个状态',
    initial: { violation_status: ['red'] },
    action: 'red',
    expected: { violation_status: [] }
  }
];

quickFilterTests.forEach((test, index) => {
  console.log(`\n--- 快速筛选测试 ${index + 1}: ${test.name} ---`);
  console.log('初始状态:', JSON.stringify(test.initial, null, 2));
  console.log('操作:', test.action);
  
  const result = simulateQuickFilterClick(test.initial, test.action);
  console.log('结果:', JSON.stringify(result, null, 2));
  
  const passed = JSON.stringify(result) === JSON.stringify(test.expected);
  console.log(`状态: ${passed ? '✅ 通过' : '❌ 失败'}`);
});

console.log('\n🎯 筛选逻辑测试完成！');
