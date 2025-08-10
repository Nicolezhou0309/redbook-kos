import { createClient } from '@supabase/supabase-js'

// 数据库连接配置
const supabaseUrl = 'https://nemmkwzijaaadrzwrtyg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lbW1rd3ppamFhYWRyendydHlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzOTk1MTksImV4cCI6MjA2OTk3NTUxOX0.alaL5ekLNXE1c499utZpzvhB2Ix0y9q5bLlXCHJGS-s'

// 创建Supabase客户端
const supabase = createClient(supabaseUrl, supabaseKey)

// 测试搜索员工姓名"任菲菲"
async function testSearchRenFeiFei() {
  console.log('🔍 开始测试搜索员工姓名: 任菲菲')
  console.log('=' * 50)
  
  try {
    // 方法1: 使用get_employee_join_data函数搜索
    console.log('📋 方法1: 使用get_employee_join_data函数搜索')
    const { data: functionResult, error: functionError } = await supabase.rpc('get_employee_join_data', {
      search_query: '任菲菲',
      filter_employee_name: '任菲菲',
      page_number: 1,
      page_size: 20
    })
    
    if (functionError) {
      console.error('❌ 函数调用失败:', functionError)
    } else {
      console.log('✅ 函数调用成功')
      console.log('📊 返回数据条数:', functionResult?.length || 0)
      if (functionResult && functionResult.length > 0) {
        console.log('📋 第一条数据:')
        console.log(JSON.stringify(functionResult[0], null, 2))
      }
    }
    
    console.log('\n' + '=' * 50)
    
    // 方法2: 直接查询employee_list表
    console.log('📋 方法2: 直接查询employee_list表')
    const { data: directResult, error: directError } = await supabase
      .from('employee_list')
      .select('*')
      .ilike('employee_name', '%任菲菲%')
      .limit(5)
    
    if (directError) {
      console.error('❌ 直接查询失败:', directError)
    } else {
      console.log('✅ 直接查询成功')
      console.log('📊 找到员工数:', directResult?.length || 0)
      if (directResult && directResult.length > 0) {
        console.log('📋 员工信息:')
        directResult.forEach((emp, index) => {
          console.log(`${index + 1}. ID: ${emp.id}, 姓名: ${emp.employee_name}, UID: ${emp.employee_uid}, 状态: ${emp.status}`)
        })
      }
    }
    
    console.log('\n' + '=' * 50)
    
    // 方法3: 模糊搜索所有相关表
    console.log('📋 方法3: 模糊搜索所有相关表')
    
    // 搜索employee_list表
    const { data: listResult } = await supabase
      .from('employee_list')
      .select('employee_name, employee_uid, status')
      .ilike('employee_name', '%任菲菲%')
    
    // 搜索employee_leads_data表
    const { data: leadsResult } = await supabase
      .from('employee_leads_data')
      .select('account_id, xiaohongshu_nickname, region')
      .ilike('xiaohongshu_nickname', '%任菲菲%')
    
    console.log('📊 employee_list表结果:', listResult?.length || 0)
    console.log('📊 employee_leads_data表结果:', leadsResult?.length || 0)
    
    if (listResult && listResult.length > 0) {
      console.log('📋 employee_list表数据:')
      listResult.forEach(emp => console.log(`- ${emp.employee_name} (${emp.employee_uid})`))
    }
    
    if (leadsResult && leadsResult.length > 0) {
      console.log('📋 employee_leads_data表数据:')
      leadsResult.forEach(lead => console.log(`- ${lead.xiaohongshu_nickname} (${lead.account_id})`))
    }
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error)
  }
}

// 测试数据库连接
async function testConnection() {
  console.log('🔌 测试数据库连接...')
  
  try {
    const { data, error } = await supabase
      .from('employee_list')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ 连接失败:', error.message)
      return false
    }
    
    console.log('✅ 数据库连接成功')
    return true
  } catch (error) {
    console.error('❌ 连接异常:', error.message)
    return false
  }
}

// 主函数
async function main() {
  console.log('🚀 开始测试员工搜索功能')
  console.log('📅 测试时间:', new Date().toLocaleString())
  console.log('🌐 数据库URL:', supabaseUrl)
  console.log('')
  
  // 先测试连接
  const isConnected = await testConnection()
  if (!isConnected) {
    console.log('❌ 数据库连接失败，终止测试')
    return
  }
  
  console.log('')
  
  // 执行搜索测试
  await testSearchRenFeiFei()
  
  console.log('')
  console.log('🏁 测试完成')
}

// 运行测试
main().catch(console.error)
