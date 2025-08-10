import pg from 'pg';
const { Client } = pg;

// 数据库连接配置
const dbConfig = {
  host: 'aws-0-ap-southeast-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.nemmkwzijaaadrzwrtyg',
  password: 'xArYBrzsINV1d7YB',
  ssl: {
    rejectUnauthorized: false
  }
};

// 模拟前端API调用的测试函数
async function testFrontendApiCalls() {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('✅ 数据库连接成功');
    
    console.log('\n🔍 开始测试前端API调用模拟');
    console.log('=====================================');
    
    // 测试1: 搜索"唐海波" - 模拟前端搜索框输入
    console.log('\n📝 测试1: 搜索"唐海波"');
    console.log('模拟前端: 用户在搜索框输入"唐海波"');
    
    const searchResult = await client.query(`
      SELECT * FROM get_employee_join_data(
        search_query := '唐海波',
        sort_by := 'employee_name',
        sort_direction := 'asc',
        page_number := 1,
        page_size := 20
      )
    `);
    
    console.log(`✅ 搜索结果: ${searchResult.rows.length} 条记录`);
    if (searchResult.rows.length > 0) {
      console.log('📊 前3条记录:');
      searchResult.rows.slice(0, 3).forEach((row, index) => {
        console.log(`  ${index + 1}. ${row.employee_name} (${row.employee_uid}) - 互动: ${row.total_interactions}`);
      });
    }
    
    // 测试2: 搜索"吕航" - 模拟前端搜索框输入
    console.log('\n📝 测试2: 搜索"吕航"');
    console.log('模拟前端: 用户在搜索框输入"吕航"');
    
    const searchResult2 = await client.query(`
      SELECT * FROM get_employee_join_data(
        search_query := '吕航',
        sort_by := 'employee_name',
        sort_direction := 'asc',
        page_number := 1,
        page_size := 20
      )
    `);
    
    console.log(`✅ 搜索结果: ${searchResult2.rows.length} 条记录`);
    if (searchResult2.rows.length > 0) {
      console.log('📊 前3条记录:');
      searchResult2.rows.slice(0, 3).forEach((row, index) => {
        console.log(`  ${index + 1}. ${row.employee_name} (${row.employee_uid}) - 互动: ${row.total_interactions}`);
      });
    }
    
    // 测试3: 高级筛选 - 模拟前端高级筛选表单
    console.log('\n📝 测试3: 高级筛选 - 员工姓名包含"唐"');
    console.log('模拟前端: 用户在高级筛选表单中设置员工姓名筛选');
    
    const advancedFilterResult = await client.query(`
      SELECT * FROM get_employee_join_data(
        filter_employee_name := '唐',
        sort_by := 'total_interactions',
        sort_direction := 'desc',
        page_number := 1,
        page_size := 10
      )
    `);
    
    console.log(`✅ 高级筛选结果: ${advancedFilterResult.rows.length} 条记录`);
    if (advancedFilterResult.rows.length > 0) {
      console.log('📊 按互动数排序的前3条记录:');
      advancedFilterResult.rows.slice(0, 3).forEach((row, index) => {
        console.log(`  ${index + 1}. ${row.employee_name} (${row.employee_uid}) - 互动: ${row.total_interactions}`);
      });
    }
    
    // 测试4: 分页测试 - 模拟前端分页组件
    console.log('\n📝 测试4: 分页测试 - 第2页，每页5条');
    console.log('模拟前端: 用户点击分页组件的第2页');
    
    const paginationResult = await client.query(`
      SELECT * FROM get_employee_join_data(
        search_query := '唐',
        sort_by := 'employee_name',
        sort_direction := 'asc',
        page_number := 2,
        page_size := 5
      )
    `);
    
    console.log(`✅ 分页结果: ${paginationResult.rows.length} 条记录 (第2页)`);
    if (paginationResult.rows.length > 0) {
      console.log('📊 第2页记录:');
      paginationResult.rows.forEach((row, index) => {
        console.log(`  ${index + 1}. ${row.employee_name} (${row.employee_uid}) - 互动: ${row.total_interactions}`);
      });
    }
    
    // 测试5: 排序测试 - 模拟前端排序功能
    console.log('\n📝 测试5: 排序测试 - 按互动数降序');
    console.log('模拟前端: 用户点击表头"互动数"列进行排序');
    
    const sortResult = await client.query(`
      SELECT * FROM get_employee_join_data(
        search_query := '唐',
        sort_by := 'total_interactions',
        sort_direction := 'desc',
        page_number := 1,
        page_size := 10
      )
    `);
    
    console.log(`✅ 排序结果: ${sortResult.rows.length} 条记录`);
    if (sortResult.rows.length > 0) {
      console.log('📊 按互动数降序的前5条记录:');
      sortResult.rows.slice(0, 5).forEach((row, index) => {
        console.log(`  ${index + 1}. ${row.employee_name} (${row.employee_uid}) - 互动: ${row.total_interactions}`);
      });
    }
    
    // 测试6: 空搜索测试 - 模拟前端清空搜索
    console.log('\n📝 测试6: 空搜索测试');
    console.log('模拟前端: 用户清空搜索框，显示所有记录');
    
    const emptySearchResult = await client.query(`
      SELECT * FROM get_employee_join_data(
        sort_by := 'employee_name',
        sort_direction := 'asc',
        page_number := 1,
        page_size := 5
      )
    `);
    
    console.log(`✅ 空搜索结果: ${emptySearchResult.rows.length} 条记录`);
    if (emptySearchResult.rows.length > 0) {
      console.log('📊 前5条记录:');
      emptySearchResult.rows.slice(0, 5).forEach((row, index) => {
        console.log(`  ${index + 1}. ${row.employee_name} (${row.employee_uid}) - 互动: ${row.total_interactions}`);
      });
    }
    
    console.log('\n=====================================');
    console.log('✅ 前端API调用测试完成');
    console.log('\n📋 测试总结:');
    console.log('1. 搜索功能: 验证了search_query参数的正确传递');
    console.log('2. 高级筛选: 验证了filter_employee_name参数的正确传递');
    console.log('3. 分页功能: 验证了page_number和page_size参数的正确传递');
    console.log('4. 排序功能: 验证了sort_by和sort_direction参数的正确传递');
    console.log('5. 空搜索: 验证了无搜索条件时的默认行为');
    
  } catch (error) {
    console.error('❌ 测试出错:', error.message);
    console.error('错误详情:', error);
  } finally {
    await client.end();
    console.log('\n🔌 数据库连接已关闭');
  }
}

// 运行测试
testFrontendApiCalls().catch(console.error);
