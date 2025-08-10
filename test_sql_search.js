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

async function testSearch() {
  const client = new Client(config)
  
  try {
    await client.connect()
    console.log('✅ 数据库连接成功')
    
    // 测试搜索"吕航"
    console.log('\n🔍 测试搜索: 吕航')
    const lvhangResult = await client.query(`
      SELECT 
        e.employee_name,
        e.employee_uid,
        eld.xiaohongshu_nickname,
        eld.region,
        eld.time_range,
        erd.time_range as response_time_range
      FROM public.employee_list e
      RIGHT JOIN public.employee_leads_data eld ON e.employee_uid = eld.account_id
      RIGHT JOIN public.employee_response_data erd ON (
        COALESCE(e.employee_uid, eld.account_id) = erd.employee_uid
        AND eld.time_range->>'start_date' = erd.time_range->>'start_date'
        AND eld.time_range->>'end_date' = erd.time_range->>'end_date'
      )
      WHERE (
        e.employee_name ILIKE '%吕航%' 
        OR e.employee_uid ILIKE '%吕航%' 
        OR eld.xiaohongshu_nickname ILIKE '%吕航%' 
        OR eld.region ILIKE '%吕航%'
      )
      ORDER BY e.employee_name ASC
    `)
    
    console.log(`📊 吕航搜索结果: ${lvhangResult.rows.length} 条记录`)
    lvhangResult.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.employee_name || 'N/A'} | ${row.employee_uid || 'N/A'} | ${row.xiaohongshu_nickname || 'N/A'} | ${row.region || 'N/A'}`)
      console.log(`     时间范围: ${JSON.stringify(row.time_range)}`)
      console.log(`     响应时间范围: ${JSON.stringify(row.response_time_range)}`)
    })
    
    // 测试搜索"唐海波"
    console.log('\n🔍 测试搜索: 唐海波')
    const tanghaiboResult = await client.query(`
      SELECT 
        e.employee_name,
        e.employee_uid,
        eld.xiaohongshu_nickname,
        eld.region,
        eld.time_range,
        erd.time_range as response_time_range
      FROM public.employee_list e
      RIGHT JOIN public.employee_leads_data eld ON e.employee_uid = eld.account_id
      RIGHT JOIN public.employee_response_data erd ON (
        COALESCE(e.employee_uid, eld.account_id) = erd.employee_uid
        AND eld.time_range->>'start_date' = erd.time_range->>'start_date'
        AND eld.time_range->>'end_date' = erd.time_range->>'end_date'
      )
      WHERE (
        e.employee_name ILIKE '%唐海波%' 
        OR e.employee_uid ILIKE '%唐海波%' 
        OR eld.xiaohongshu_nickname ILIKE '%唐海波%' 
        OR eld.region ILIKE '%唐海波%'
      )
      ORDER BY e.employee_name ASC
    `)
    
    console.log(`📊 唐海波搜索结果: ${tanghaiboResult.rows.length} 条记录`)
    tanghaiboResult.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.employee_name || 'N/A'} | ${row.employee_uid || 'N/A'} | ${row.xiaohongshu_nickname || 'N/A'} | ${row.region || 'N/A'}`)
      console.log(`     时间范围: ${JSON.stringify(row.time_range)}`)
      console.log(`     响应时间范围: ${JSON.stringify(row.response_time_range)}`)
    })
    
    // 测试使用数据库函数
    console.log('\n🔍 测试使用数据库函数 get_employee_join_data')
    
    const lvhangFunctionResult = await client.query(`
      SELECT * FROM get_employee_join_data('吕航')
    `)
    
    console.log(`📊 吕航函数搜索结果: ${lvhangFunctionResult.rows.length} 条记录`)
    
    const tanghaiboFunctionResult = await client.query(`
      SELECT * FROM get_employee_join_data('唐海波')
    `)
    
    console.log(`📊 唐海波函数搜索结果: ${tanghaiboFunctionResult.rows.length} 条记录`)
    
    // 检查原始数据表
    console.log('\n🔍 检查原始数据表')
    
    // 检查 employee_list 表
    const employeeListResult = await client.query(`
      SELECT employee_name, employee_uid FROM public.employee_list 
      WHERE employee_name ILIKE '%吕航%' OR employee_name ILIKE '%唐海波%'
    `)
    console.log(`📊 employee_list 表匹配记录: ${employeeListResult.rows.length} 条`)
    employeeListResult.rows.forEach(row => {
      console.log(`  ${row.employee_name} | ${row.employee_uid}`)
    })
    
    // 检查 employee_leads_data 表
    const leadsDataResult = await client.query(`
      SELECT account_id, xiaohongshu_nickname, region FROM public.employee_leads_data 
      WHERE xiaohongshu_nickname ILIKE '%吕航%' OR xiaohongshu_nickname ILIKE '%唐海波%'
    `)
    console.log(`📊 employee_leads_data 表匹配记录: ${leadsDataResult.rows.length} 条`)
    leadsDataResult.rows.forEach(row => {
      console.log(`  ${row.account_id} | ${row.xiaohongshu_nickname} | ${row.region}`)
    })
    
  } catch (error) {
    console.error('❌ 查询出错:', error)
  } finally {
    await client.end()
    console.log('\n✅ 数据库连接已关闭')
  }
}

// 运行测试
testSearch().catch(console.error)
