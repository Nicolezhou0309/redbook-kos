import pg from 'pg'
const { Client } = pg

// 数据库连接配置
const config = {
  host: 'aws-0-ap-southeast-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.nemmkwzijaaadrzwrtyg',
  password: 'xArYBrzsINV1d7YB',
  ssl: {
    rejectUnauthorized: false
  }
}

async function testLatestFunction() {
  const client = new Client(config)
  
  try {
    await client.connect()
    console.log('✅ 数据库连接成功')
    
    // 测试最新的 get_employee_join_data 函数
    console.log('\n🔍 测试最新的 get_employee_join_data 函数')
    
    // 测试搜索"吕航"
    console.log('\n📝 测试搜索: 吕航')
    const lvhangResult = await client.query(`
      SELECT * FROM get_employee_join_data('吕航')
    `)
    
    console.log(`📊 吕航搜索结果: ${lvhangResult.rows.length} 条记录`)
    lvhangResult.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.employee_name} | ${row.employee_uid} | ${row.xiaohongshu_nickname} | ${row.region}`)
      console.log(`     时间范围: ${JSON.stringify(row.time_range)}`)
      console.log(`     响应时间范围: ${JSON.stringify(row.response_time_range)}`)
    })
    
    // 测试搜索"唐海波"
    console.log('\n📝 测试搜索: 唐海波')
    const tanghaiboResult = await client.query(`
      SELECT * FROM get_employee_join_data('唐海波')
    `)
    
    console.log(`📊 唐海波搜索结果: ${tanghaiboResult.rows.length} 条记录`)
    tanghaiboResult.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.employee_name} | ${row.employee_uid} | ${row.xiaohongshu_nickname} | ${row.region}`)
      console.log(`     时间范围: ${JSON.stringify(row.time_range)}`)
      console.log(`     响应时间范围: ${JSON.stringify(row.response_time_range)}`)
    })
    
    // 测试空搜索（应该返回所有记录）
    console.log('\n📝 测试空搜索（返回所有记录）')
    const allResult = await client.query(`
      SELECT * FROM get_employee_join_data('')
    `)
    
    console.log(`📊 空搜索结果: ${allResult.rows.length} 条记录`)
    
    // 测试分页
    console.log('\n📝 测试分页功能')
    const page1Result = await client.query(`
      SELECT * FROM get_employee_join_data('', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 
        NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 
        NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 
        'employee_name', 'asc', 1, 5)
    `)
    
    console.log(`📊 第1页结果: ${page1Result.rows.length} 条记录`)
    page1Result.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.employee_name} | ${row.employee_uid}`)
    })
    
    // 测试排序
    console.log('\n📝 测试排序功能')
    const sortedResult = await client.query(`
      SELECT * FROM get_employee_join_data('', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 
        NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 
        NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 
        'total_interactions', 'desc', 1, 10)
    `)
    
    console.log(`📊 按互动数排序结果: ${sortedResult.rows.length} 条记录`)
    sortedResult.rows.slice(0, 5).forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.employee_name} | 互动数: ${row.total_interactions}`)
    })
    
  } catch (error) {
    console.error('❌ 查询出错:', error)
  } finally {
    await client.end()
    console.log('\n✅ 数据库连接已关闭')
  }
}

// 运行测试
testLatestFunction().catch(console.error)
