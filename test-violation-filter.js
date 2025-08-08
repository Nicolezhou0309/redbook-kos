// 违规状态筛选功能测试脚本
const { createClient } = require('@supabase/supabase-js');

// 配置Supabase客户端（请根据实际情况修改）
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-key';

const supabase = createClient(supabaseUrl, supabaseKey);

// 测试获取员工违规状态
async function testGetEmployeeViolationStatuses() {
  console.log('🔍 测试获取员工违规状态...');
  
  try {
    // 获取所有员工
    const { data: employees, error: employeesError } = await supabase
      .from('employee_list')
      .select('id, employee_name, employee_uid')
      .limit(10);

    if (employeesError) {
      throw employeesError;
    }

    console.log(`找到 ${employees.length} 个员工`);

    if (employees.length === 0) {
      console.log('没有员工数据，跳过测试');
      return;
    }

    // 获取违规状态
    const employeeIds = employees.map(emp => emp.id);
    const { data: violationStatuses, error: statusError } = await supabase
      .from('employee_list')
      .select('id, employee_name, current_yellow_cards, current_red_cards, violation_status')
      .in('id', employeeIds);

    if (statusError) {
      throw statusError;
    }

    console.log('违规状态统计:');
    const statusCount = {
      normal: 0,
      yellow: 0,
      red: 0,
      null: 0
    };

    violationStatuses.forEach(emp => {
      const status = emp.violation_status || 'normal';
      statusCount[status] = (statusCount[status] || 0) + 1;
    });

    console.log(`- 正常状态: ${statusCount.normal} 人`);
    console.log(`- 黄牌状态: ${statusCount.yellow} 人`);
    console.log(`- 红牌状态: ${statusCount.red} 人`);
    console.log(`- 无状态记录: ${statusCount.null} 人`);

    return { employees, violationStatuses, statusCount };
  } catch (error) {
    console.error('测试失败:', error);
    throw error;
  }
}

// 测试违规状态筛选
async function testViolationStatusFilter(status) {
  console.log(`🔍 测试 ${status} 状态筛选...`);
  
  try {
    // 获取所有员工
    const { data: employees, error: employeesError } = await supabase
      .from('employee_list')
      .select('id, employee_name, employee_uid')
      .order('created_at', { ascending: false });

    if (employeesError) {
      throw employeesError;
    }

    // 获取违规状态
    const employeeIds = employees.map(emp => emp.id);
    const { data: violationStatuses, error: statusError } = await supabase
      .from('employee_list')
      .select('id, employee_name, current_yellow_cards, current_red_cards, violation_status')
      .in('id', employeeIds);

    if (statusError) {
      throw statusError;
    }

    // 筛选指定状态的员工
    const filteredEmployees = employees.filter(emp => {
      const violationStatus = violationStatuses.find(vs => vs.id === emp.id);
      const currentStatus = violationStatus ? violationStatus.violation_status : 'normal';
      return currentStatus === status;
    });

    console.log(`筛选结果: 找到 ${filteredEmployees.length} 个 ${status} 状态的员工`);
    
    if (filteredEmployees.length > 0) {
      console.log('前5个员工:');
      filteredEmployees.slice(0, 5).forEach(emp => {
        const violationStatus = violationStatuses.find(vs => vs.id === emp.id);
        console.log(`- ${emp.employee_name} (${emp.employee_uid}): 黄牌${violationStatus?.current_yellow_cards || 0}张, 红牌${violationStatus?.current_red_cards || 0}张`);
      });
    }

    return filteredEmployees;
  } catch (error) {
    console.error(`测试 ${status} 状态筛选失败:`, error);
    throw error;
  }
}

// 测试多选违规状态筛选
async function testMultipleViolationStatusFilter(statuses) {
  console.log(`🔍 测试多选状态筛选: ${statuses.join(', ')}...`);
  
  try {
    // 获取所有员工
    const { data: employees, error: employeesError } = await supabase
      .from('employee_list')
      .select('id, employee_name, employee_uid')
      .order('created_at', { ascending: false });

    if (employeesError) {
      throw employeesError;
    }

    // 获取违规状态
    const employeeIds = employees.map(emp => emp.id);
    const { data: violationStatuses, error: statusError } = await supabase
      .from('employee_list')
      .select('id, employee_name, current_yellow_cards, current_red_cards, violation_status')
      .in('id', employeeIds);

    if (statusError) {
      throw statusError;
    }

    // 筛选指定状态的员工
    const filteredEmployees = employees.filter(emp => {
      const violationStatus = violationStatuses.find(vs => vs.id === emp.id);
      const currentStatus = violationStatus ? violationStatus.violation_status : 'normal';
      return statuses.includes(currentStatus);
    });

    console.log(`筛选结果: 找到 ${filteredEmployees.length} 个符合条件的员工`);
    
    // 按状态分组显示
    const groupedByStatus = {};
    statuses.forEach(status => {
      groupedByStatus[status] = [];
    });

    filteredEmployees.forEach(emp => {
      const violationStatus = violationStatuses.find(vs => vs.id === emp.id);
      const currentStatus = violationStatus ? violationStatus.violation_status : 'normal';
      if (groupedByStatus[currentStatus]) {
        groupedByStatus[currentStatus].push(emp);
      }
    });

    Object.keys(groupedByStatus).forEach(status => {
      console.log(`- ${status} 状态: ${groupedByStatus[status].length} 人`);
    });

    return filteredEmployees;
  } catch (error) {
    console.error(`测试多选状态筛选失败:`, error);
    throw error;
  }
}

// 主测试函数
async function runTests() {
  console.log('🚀 开始违规状态筛选功能测试...\n');

  try {
    // 测试1: 获取员工违规状态
    console.log('=== 测试1: 获取员工违规状态 ===');
    await testGetEmployeeViolationStatuses();
    console.log('');

    // 测试2: 测试正常状态筛选
    console.log('=== 测试2: 正常状态筛选 ===');
    await testViolationStatusFilter('normal');
    console.log('');

    // 测试3: 测试黄牌状态筛选
    console.log('=== 测试3: 黄牌状态筛选 ===');
    await testViolationStatusFilter('yellow');
    console.log('');

    // 测试4: 测试红牌状态筛选
    console.log('=== 测试4: 红牌状态筛选 ===');
    await testViolationStatusFilter('red');
    console.log('');

    // 测试5: 测试多选状态筛选
    console.log('=== 测试5: 多选状态筛选 ===');
    await testMultipleViolationStatusFilter(['normal', 'yellow']);
    console.log('');

    console.log('✅ 所有测试完成！');
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  runTests();
}

module.exports = {
  testGetEmployeeViolationStatuses,
  testViolationStatusFilter,
  testMultipleViolationStatusFilter,
  runTests
};
