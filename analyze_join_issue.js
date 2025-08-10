import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nemmkwzijaaadrzwrtyg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lbW1rd3ppamFhYWRyendydHlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzOTk1MTksImV4cCI6MjA2OTk3NTUxOX0.alaL5ekLNXE1c499utZpzvhB2Ix0y9q5bLlXCHJGS-s'

const supabase = createClient(supabaseUrl, supabaseKey)

async function analyzeJoinIssue() {
  console.log('🔍 分析 JOIN 问题...')
  
  try {
    // 1. 检查 employee_list 表中是否有"周璇"
    console.log('\n📋 检查 employee_list 表...')
    const { data: employeeListData, error: employeeListError } = await supabase
      .from('employee_list')
      .select('*')
      .ilike('employee_name', '%周璇%')
    
    if (employeeListError) {
      console.log('❌ 查询 employee_list 失败:', employeeListError.message)
    } else {
      console.log(`✅ employee_list 表找到 ${employeeListData?.length || 0} 条记录`)
      if (employeeListData && employeeListData.length > 0) {
        console.log('记录详情:', employeeListData)
      }
    }

    // 2. 检查 employee_leads_data 表中是否有相关记录
    console.log('\n📋 检查 employee_leads_data 表...')
    const { data: leadsData, error: leadsError } = await supabase
      .from('employee_leads_data')
      .select('*')
      .limit(5)
    
    if (leadsError) {
      console.log('❌ 查询 employee_leads_data 失败:', leadsError.message)
    } else {
      console.log(`✅ employee_leads_data 表找到 ${leadsData?.length || 0} 条记录`)
      if (leadsData && leadsData.length > 0) {
        console.log('前几条记录的结构:', leadsData.slice(0, 3).map(r => ({
          id: r.id,
          account_id: r.account_id,
          xiaohongshu_nickname: r.xiaohongshu_nickname,
          time_range: r.time_range
        })))
      }
    }

    // 3. 检查 employee_response_data 表中是否有相关记录
    console.log('\n📋 检查 employee_response_data 表...')
    const { data: responseData, error: responseError } = await supabase
      .from('employee_response_data')
      .select('*')
      .limit(5)
    
    if (responseError) {
      console.log('❌ 查询 employee_response_data 失败:', responseError.message)
    } else {
      console.log(`✅ employee_response_data 表找到 ${responseData?.length || 0} 条记录`)
      if (responseData && responseData.length > 0) {
        console.log('前几条记录的结构:', responseData.slice(0, 3).map(r => ({
          id: r.id,
          employee_uid: r.employee_uid,
          time_range: r.time_range
        })))
      }
    }

    // 4. 检查 employee_roster 表中的"周璇"记录
    console.log('\n📋 检查 employee_roster 表中的"周璇"...')
    const { data: rosterData, error: rosterError } = await supabase
      .from('employee_roster')
      .select('*')
      .ilike('employee_name', '%周璇%')
    
    if (rosterError) {
      console.log('❌ 查询 employee_roster 失败:', rosterError.message)
    } else {
      console.log(`✅ employee_roster 表找到 ${rosterData?.length || 0} 条记录`)
      if (rosterData && rosterData.length > 0) {
        console.log('记录详情:', rosterData)
      }
    }

    // 5. 尝试手动执行 JOIN 查询
    console.log('\n📋 尝试手动执行 JOIN 查询...')
    const { data: joinData, error: joinError } = await supabase
      .from('employee_list')
      .select(`
        id,
        employee_name,
        employee_uid,
        employee_leads_data!inner(
          id,
          account_id,
          xiaohongshu_nickname,
          time_range
        )
      `)
      .ilike('employee_name', '%周璇%')
    
    if (joinError) {
      console.log('❌ JOIN 查询失败:', joinError.message)
    } else {
      console.log(`✅ JOIN 查询成功，找到 ${joinData?.length || 0} 条记录`)
      if (joinData && joinData.length > 0) {
        console.log('JOIN 结果:', joinData)
      }
    }

    // 6. 检查 employee_list 表的结构
    console.log('\n📋 检查 employee_list 表的结构...')
    const { data: employeeListStructure, error: structureError } = await supabase
      .from('employee_list')
      .select('*')
      .limit(1)
    
    if (structureError) {
      console.log('❌ 查询 employee_list 结构失败:', structureError.message)
    } else {
      console.log(`✅ employee_list 表结构:`, employeeListStructure && employeeListStructure.length > 0 ? Object.keys(employeeListStructure[0]) : '无记录')
    }

    // 7. 检查是否有其他方式匹配"任菲菲"
    console.log('\n📋 尝试通过其他方式查找"任菲菲"...')
    
    // 检查是否有 employee_uid 为空的记录
    const { data: nullUidData, error: nullUidError } = await supabase
      .from('employee_list')
      .select('*')
      .is('employee_uid', null)
      .limit(5)
    
    if (nullUidError) {
      console.log('❌ 查询 null employee_uid 失败:', nullUidError.message)
    } else {
      console.log(`✅ 找到 ${nullUidData?.length || 0} 条 employee_uid 为空的记录`)
      if (nullUidData && nullUidData.length > 0) {
        console.log('前几条记录:', nullUidData.slice(0, 3).map(r => ({
          id: r.id,
          employee_name: r.employee_name,
          employee_uid: r.employee_uid
        })))
      }
    }

  } catch (error) {
    console.log('❌ 分析过程中出错:', error.message)
  }
}

analyzeJoinIssue()
