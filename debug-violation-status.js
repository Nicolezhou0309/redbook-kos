// 调试违规状态数据脚本
const { createClient } = require('@supabase/supabase-js');

// 配置Supabase客户端（请根据实际情况修改）
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-key';

const supabase = createClient(supabaseUrl, supabaseKey);

// 检查数据库中的违规状态数据
async function checkViolationStatusData() {
  console.log('🔍 检查数据库中的违规状态数据...\n');
  
  try {
    // 获取所有员工的违规状态数据
    const { data: employees, error } = await supabase
      .from('employee_list')
      .select('id, employee_name, employee_uid, current_yellow_cards, current_red_cards, violation_status')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    console.log(`找到 ${employees.length} 个员工\n`);

    // 统计违规状态分布
    const statusCount = {
      normal: 0,
      yellow: 0,
      red: 0,
      null: 0,
      invalid: 0
    };

    console.log('=== 违规状态详细数据 ===');
    employees.forEach((emp, index) => {
      const status = emp.violation_status;
      const yellowCards = emp.current_yellow_cards || 0;
      const redCards = emp.current_red_cards || 0;
      
      console.log(`${index + 1}. ${emp.employee_name} (${emp.employee_uid}):`);
      console.log(`   - violation_status: ${status}`);
      console.log(`   - current_yellow_cards: ${yellowCards}`);
      console.log(`   - current_red_cards: ${redCards}`);
      
      // 统计状态分布
      if (!status) {
        statusCount.null++;
      } else if (status === 'normal') {
        statusCount.normal++;
      } else if (status === 'yellow') {
        statusCount.yellow++;
      } else if (status === 'red') {
        statusCount.red++;
      } else {
        statusCount.invalid++;
        console.log(`   ⚠️  无效状态: ${status}`);
      }
      
      // 检查数据一致性
      if (status === 'red' && redCards === 0) {
        console.log(`   ⚠️  红牌状态但红牌数量为0`);
      }
      if (status === 'yellow' && yellowCards === 0) {
        console.log(`   ⚠️  黄牌状态但黄牌数量为0`);
      }
      if (status === 'normal' && (yellowCards > 0 || redCards > 0)) {
        console.log(`   ⚠️  正常状态但有违规记录`);
      }
      
      console.log('');
    });

    console.log('=== 违规状态统计 ===');
    console.log(`正常状态: ${statusCount.normal} 人`);
    console.log(`黄牌状态: ${statusCount.yellow} 人`);
    console.log(`红牌状态: ${statusCount.red} 人`);
    console.log(`无状态记录: ${statusCount.null} 人`);
    console.log(`无效状态: ${statusCount.invalid} 人`);

    // 检查红牌状态的员工
    const redCardEmployees = employees.filter(emp => emp.violation_status === 'red');
    if (redCardEmployees.length > 0) {
      console.log('\n=== 红牌状态员工详情 ===');
      redCardEmployees.forEach(emp => {
        console.log(`${emp.employee_name}: 黄牌${emp.current_yellow_cards}张, 红牌${emp.current_red_cards}张`);
      });
    }

    // 检查黄牌状态的员工
    const yellowCardEmployees = employees.filter(emp => emp.violation_status === 'yellow');
    if (yellowCardEmployees.length > 0) {
      console.log('\n=== 黄牌状态员工详情 ===');
      yellowCardEmployees.forEach(emp => {
        console.log(`${emp.employee_name}: 黄牌${emp.current_yellow_cards}张, 红牌${emp.current_red_cards}张`);
      });
    }

    return employees;
  } catch (error) {
    console.error('检查违规状态数据失败:', error);
    throw error;
  }
}

// 测试API返回的数据
async function testApiData() {
  console.log('\n🔍 测试API返回的数据...\n');
  
  try {
    // 测试红牌状态筛选
    console.log('=== 测试红牌状态筛选 ===');
    const { data: redEmployees, error: redError } = await supabase
      .from('employee_list')
      .select('id, employee_name, employee_uid, current_yellow_cards, current_red_cards, violation_status')
      .eq('violation_status', 'red');

    if (redError) {
      throw redError;
    }

    console.log(`数据库直接查询红牌状态: ${redEmployees.length} 人`);
    redEmployees.forEach(emp => {
      console.log(`- ${emp.employee_name}: ${emp.violation_status} (黄牌${emp.current_yellow_cards}张, 红牌${emp.current_red_cards}张)`);
    });

    // 测试黄牌状态筛选
    console.log('\n=== 测试黄牌状态筛选 ===');
    const { data: yellowEmployees, error: yellowError } = await supabase
      .from('employee_list')
      .select('id, employee_name, employee_uid, current_yellow_cards, current_red_cards, violation_status')
      .eq('violation_status', 'yellow');

    if (yellowError) {
      throw yellowError;
    }

    console.log(`数据库直接查询黄牌状态: ${yellowEmployees.length} 人`);
    yellowEmployees.forEach(emp => {
      console.log(`- ${emp.employee_name}: ${emp.violation_status} (黄牌${emp.current_yellow_cards}张, 红牌${emp.current_red_cards}张)`);
    });

  } catch (error) {
    console.error('测试API数据失败:', error);
    throw error;
  }
}

// 主函数
async function main() {
  try {
    await checkViolationStatusData();
    await testApiData();
    console.log('\n✅ 调试完成！');
  } catch (error) {
    console.error('❌ 调试失败:', error);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = {
  checkViolationStatusData,
  testApiData,
  main
};
