import { createClient } from '@supabase/supabase-js'

// Supabase 配置
const supabaseUrl = 'https://nemmkwzijaaadrzwrtyg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lbW1rd3ppamFhYWRyendydHlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzOTk1MTksImV4cCI6MjA2OTk3NTUxOX0.alaL5ekLNXE1c499utZpzvhB2Ix0y9q5bLlXCHJGS-s'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 测试张书悦的搜索结果
async function testZhangShuyue() {
  console.log('🔍 测试张书悦搜索结果')
  console.log('=====================================')
  
  try {
    const { data, error } = await supabase.rpc('get_employee_join_data', {
      search_query: null,
      filter_employee_name: '张书悦',
      filter_employee_uid: null,
      filter_xiaohongshu_nickname: null,
      filter_region: null,
      filter_status: null,
      time_range_remark: null,
      start_date: null,
      end_date: null,
      min_interactions: null,
      max_interactions: null,
      min_form_leads: null,
      max_form_leads: null,
      min_private_message_leads: null,
      max_private_message_leads: null,
      min_private_message_openings: null,
      max_private_message_openings: null,
      min_private_message_leads_kept: null,
      max_private_message_leads_kept: null,
      min_notes_exposure_count: null,
      max_notes_exposure_count: null,
      min_notes_click_count: null,
      max_notes_click_count: null,
      min_published_notes_count: null,
      max_published_notes_count: null,
      min_promoted_notes_count: null,
      max_promoted_notes_count: null,
      min_notes_promotion_cost: null,
      max_notes_promotion_cost: null,
      min_response_time: null,
      max_response_time: null,
      min_user_rating: null,
      max_user_rating: null,
      min_score_15s_response: null,
      max_score_15s_response: null,
      min_score_30s_response: null,
      max_score_30s_response: null,
      min_score_1min_response: null,
      max_score_1min_response: null,
      min_score_1hour_timeout: null,
      max_score_1hour_timeout: null,
      min_score_avg_response_time: null,
      max_score_avg_response_time: null,
      min_rate_15s_response: null,
      max_rate_15s_response: null,
      min_rate_30s_response: null,
      max_rate_30s_response: null,
      min_rate_1min_response: null,
      max_rate_1min_response: null,
      min_rate_1hour_timeout: null,
      max_rate_1hour_timeout: null,
      yellow_card_timeout_rate: null,
      yellow_card_notes_count: null,
      yellow_card_min_private_message_leads: null,
      yellow_card_start_date: null,
      yellow_card_end_date: null,
      sort_by: 'employee_name',
      sort_direction: 'asc',
      page_number: 1,
      page_size: 20
    })
    
    if (error) {
      console.error('❌ 调用失败:', error)
      return
    }
    
    console.log(`✅ 后端返回 ${data?.length || 0} 条记录`)
    
    // 分析原始数据
    console.log('\n🔍 原始返回数据分析:')
    if (data && data.length > 0) {
      // 获取总计数
      const totalCount = data[0].total_count || 0
      console.log(`📊 total_count: ${totalCount}`)
      
      console.log('\n📋 详细记录:')
      data.forEach((record, index) => {
        console.log(`  记录 ${index + 1}:`)
        console.log(`    employee_name: ${record.employee_name}`)
        console.log(`    employee_uid: ${record.employee_uid}`)
        console.log(`    employee_id: ${record.employee_id}`)
        console.log(`    xiaohongshu_nickname: ${record.xiaohongshu_nickname}`)
        console.log(`    leads_id: ${record.leads_id}`)
        console.log(`    response_id: ${record.response_id}`)
        console.log(`    total_count: ${record.total_count}`)
        
        if (record.time_range) {
          console.log(`    time_range: ${JSON.stringify(record.time_range)}`)
        }
        if (record.response_time_range) {
          console.log(`    response_time_range: ${JSON.stringify(record.response_time_range)}`)
        }
        console.log('    ========================================')
      })
      
      // 检查是否有重复数据
      console.log('\n🔍 重复数据分析:')
      const uniqueRecords = new Map()
      const duplicates = []
      
      data.forEach((record, index) => {
        // 使用多个字段组合作为唯一标识
        const key = `${record.employee_uid}_${record.leads_id}_${record.response_id}_${JSON.stringify(record.time_range)}_${JSON.stringify(record.response_time_range)}`
        
        if (uniqueRecords.has(key)) {
          duplicates.push({
            index: index + 1,
            duplicate_of: uniqueRecords.get(key),
            record: record
          })
        } else {
          uniqueRecords.set(key, index + 1)
        }
      })
      
      if (duplicates.length > 0) {
        console.log(`❌ 发现 ${duplicates.length} 条重复记录:`)
        duplicates.forEach(dup => {
          console.log(`  记录 ${dup.index} 与记录 ${dup.duplicate_of} 重复`)
        })
      } else {
        console.log('✅ 没有发现重复记录')
      }
      
      console.log(`\n📊 总结:`)
      console.log(`  - 后端返回记录数: ${data.length}`)
      console.log(`  - total_count 显示: ${totalCount}`)
      console.log(`  - 唯一记录数: ${uniqueRecords.size}`)
      console.log(`  - 重复记录数: ${duplicates.length}`)
      
      // 模拟前端修复前的逻辑
      console.log(`\n🔄 模拟前端处理:`)
      const resultDataBefore = [...data]
      let totalCountBefore = 0
      if (resultDataBefore.length > 0) {
        const lastRow = resultDataBefore[resultDataBefore.length - 1]
        if (lastRow.total_count) {
          totalCountBefore = lastRow.total_count
          resultDataBefore.pop() // 错误地删除最后一条
        }
      }
      console.log(`  修复前显示: ${resultDataBefore.length} 条记录，总计数: ${totalCountBefore}`)
      
      // 模拟前端修复后的逻辑
      const resultDataAfter = [...data]
      let totalCountAfter = 0
      if (resultDataAfter.length > 0) {
        totalCountAfter = resultDataAfter[0].total_count || 0
        // 不删除任何记录
      }
      console.log(`  修复后显示: ${resultDataAfter.length} 条记录，总计数: ${totalCountAfter}`)
    }
    
  } catch (error) {
    console.error('❌ API调用异常:', error)
  }
}

// 运行测试
testZhangShuyue().catch(console.error)
