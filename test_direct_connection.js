import pg from 'pg'
const { Client } = pg

// 数据库连接配置
const connectionString = 'postgresql://postgres.nemmkwzijaaadrzwrtyg:[xArYBrzsINV1d7YB]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres'

// 创建数据库客户端
const client = new Client({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
})

// 测试搜索员工姓名"任菲菲"
async function testSearchRenFeiFei() {
  console.log('🔍 开始测试搜索员工姓名: 任菲菲')
  console.log('=' * 50)
  
  try {
    // 方法1: 使用get_employee_join_data函数搜索
    console.log('📋 方法1: 使用get_employee_join_data函数搜索')
    const functionQuery = `
      SELECT * FROM get_employee_join_data(
        search_query := $1,
        filter_employee_name := $2,
        page_number := $3,
        page_size := $4
      )
    `
    
    const functionResult = await client.query(functionQuery, ['任菲菲', '任菲菲', 1, 20])
    console.log('✅ 函数调用成功')
    console.log('📊 返回数据条数:', functionResult.rows.length)
    
    if (functionResult.rows.length > 0) {
      console.log('📋 第一条数据:')
      console.log(JSON.stringify(functionResult.rows[0], null, 2))
    }
    
    console.log('\n' + '=' * 50)
    
    // 方法2: 直接查询employee_list表
    console.log('📋 方法2: 直接查询employee_list表')
    const directQuery = `
      SELECT id, employee_name, employee_uid, status, created_at 
      FROM employee_list 
      WHERE employee_name ILIKE $1 
      LIMIT 5
    `
    
    const directResult = await client.query(directQuery, ['%任菲菲%'])
    console.log('✅ 直接查询成功')
    console.log('📊 找到员工数:', directResult.rows.length)
    
    if (directResult.rows.length > 0) {
      console.log('📋 员工信息:')
      directResult.rows.forEach((emp, index) => {
        console.log(`${index + 1}. ID: ${emp.id}, 姓名: ${emp.employee_name}, UID: ${emp.employee_uid}, 状态: ${emp.status}`)
      })
    }
    
    console.log('\n' + '=' * 50)
    
    // 方法3: 模糊搜索所有相关表
    console.log('📋 方法3: 模糊搜索所有相关表')
    
    // 搜索employee_list表
    const listQuery = `
      SELECT employee_name, employee_uid, status 
      FROM employee_list 
      WHERE employee_name ILIKE $1
    `
    const listResult = await client.query(listQuery, ['%任菲菲%'])
    
    // 搜索employee_leads_data表
    const leadsQuery = `
      SELECT account_id, xiaohongshu_nickname, region 
      FROM employee_leads_data 
      WHERE xiaohongshu_nickname ILIKE $1
    `
    const leadsResult = await client.query(leadsQuery, ['%任菲菲%'])
    
    console.log('📊 employee_list表结果:', listResult.rows.length)
    console.log('📊 employee_leads_data表结果:', leadsResult.rows.length)
    
    if (listResult.rows.length > 0) {
      console.log('📋 employee_list表数据:')
      listResult.rows.forEach(emp => console.log(`- ${emp.employee_name} (${emp.employee_uid})`))
    }
    
    if (leadsResult.rows.length > 0) {
      console.log('📋 employee_leads_data表数据:')
      leadsResult.rows.forEach(lead => console.log(`- ${lead.xiaohongshu_nickname} (${lead.account_id})`))
    }
    
    // 方法4: 测试JOIN查询
    console.log('\n' + '=' * 50)
    console.log('📋 方法4: 测试JOIN查询（模拟get_employee_join_data函数）')
    
    const joinQuery = `
      SELECT 
        e.id as employee_id,
        e.employee_name,
        e.employee_uid,
        e.status,
        e.created_at,
        eld.id as leads_id,
        eld.xiaohongshu_account_id,
        eld.xiaohongshu_nickname,
        eld.region,
        eld.total_interactions,
        eld.total_form_leads,
        eld.total_private_message_leads
      FROM employee_list e
      RIGHT JOIN employee_leads_data eld ON e.employee_uid = eld.account_id
      WHERE e.employee_name ILIKE $1
      LIMIT 5
    `
    
    const joinResult = await client.query(joinQuery, ['%任菲菲%'])
    console.log('✅ JOIN查询成功')
    console.log('📊 JOIN结果数:', joinResult.rows.length)
    
    if (joinResult.rows.length > 0) {
      console.log('📋 JOIN查询结果:')
      joinResult.rows.forEach((row, index) => {
        console.log(`${index + 1}. ${row.employee_name} - 互动数: ${row.total_interactions}, 表单线索: ${row.total_form_leads}`)
      })
    }
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error)
  }
}

// 测试数据库连接
async function testConnection() {
  console.log('🔌 测试数据库连接...')
  
  try {
    const result = await client.query('SELECT NOW() as current_time, version() as db_version')
    console.log('✅ 数据库连接成功')
    console.log('🕐 当前时间:', result.rows[0].current_time)
    console.log('🗄️ 数据库版本:', result.rows[0].db_version.split('\n')[0])
    return true
  } catch (error) {
    console.error('❌ 连接失败:', error.message)
    return false
  }
}

// 主函数
async function main() {
  console.log('🚀 开始测试员工搜索功能')
  console.log('📅 测试时间:', new Date().toLocaleString())
  console.log('🌐 数据库连接:', connectionString.split('@')[1])
  console.log('')
  
  try {
    // 连接数据库
    await client.connect()
    
    // 先测试连接
    const isConnected = await testConnection()
    if (!isConnected) {
      console.log('❌ 数据库连接失败，终止测试')
      return
    }
    
    console.log('')
    
    // 执行搜索测试
    await testSearchRenFeiFei()
    
  } catch (error) {
    console.error('❌ 主程序错误:', error)
  } finally {
    // 关闭连接
    await client.end()
    console.log('')
    console.log('🏁 测试完成，数据库连接已关闭')
  }
}

// 运行测试
main().catch(console.error)
