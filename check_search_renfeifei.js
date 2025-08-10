import pkg from 'pg';
const { Client } = pkg;

// 使用 Supabase Shared Pooler 连接
const connectionString = 'postgresql://postgres.nemmkwzijaaadrzwrtyg:xArYBrzsINV1d7YB@aws-0-ap-southeast-11.pooler.supabase.com:5432/postgres'

const client = new Client({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
})

async function checkRenfeifeiRecords() {
  console.log('🔍 开始检查数据库中包含"任菲菲"的记录...')
  
  try {
    // 连接到数据库
    await client.connect()
    console.log('✅ 成功连接到数据库')
    
    // 测试连接
    const result = await client.query('SELECT NOW()')
    console.log('✅ 数据库连接测试成功，当前时间:', result.rows[0].now)
    // 1. 检查 employee_response_data 表（这是实际存在的表）
    console.log('\n📋 检查 employee_response_data 表...')
    try {
      const responseResult = await client.query(`
        SELECT * FROM employee_response_data 
        WHERE employee_name ILIKE '%任菲菲%' 
        LIMIT 10
      `)
      
      console.log(`✅ employee_response_data 表找到 ${responseResult.rows.length} 条记录`)
      if (responseResult.rows.length > 0) {
        console.log('记录详情:', responseResult.rows.map(r => ({
          employee_name: r.employee_name,
          employee_uid: r.employee_uid,
          id: r.id,
          created_at: r.created_at
        })))
      }
    } catch (error) {
      console.error('❌ 查询 employee_response_data 表出错:', error.message)
    }

    // 2. 检查 employee_list 表
    console.log('\n📋 检查 employee_list 表...')
    try {
      const listResult = await client.query(`
        SELECT * FROM employee_list 
        WHERE employee_name ILIKE '%任菲菲%' OR employee_uid ILIKE '%任菲菲%'
        LIMIT 10
      `)
      
      console.log(`✅ employee_list 表找到 ${listResult.rows.length} 条记录`)
      if (listResult.rows.length > 0) {
        console.log('记录详情:', listResult.rows.map(r => ({
          employee_name: r.employee_name,
          employee_uid: r.employee_uid,
          id: r.id,
          created_at: r.created_at
        })))
      }
    } catch (error) {
      console.error('❌ 查询 employee_list 表出错:', error.message)
    }

    // 3. 检查 employee_leads_data 表（正确的表名）
    console.log('\n📋 检查 employee_leads_data 表...')
    const { data: leadsData, error: leadsError } = await supabase
      .from('employee_leads_data')
      .select('*')
      .or('employee_name.ilike.%任菲菲%')
      .limit(10)
    
    if (leadsError) {
      console.error('❌ 查询 employee_leads_data 表出错:', leadsError)
    } else {
      console.log(`✅ employee_leads_data 表找到 ${leadsData?.length || 0} 条记录`)
      if (leadsData && leadsData.length > 0) {
        console.log('记录详情:', leadsData.map(r => ({
          employee_name: r.employee_name,
          id: r.id,
          created_at: r.created_at
        })))
      }
    }

    // 4. 检查 employee_roster 表（只检查存在的字段）
    console.log('\n📋 检查 employee_roster 表...')
    const { data: rosterData, error: rosterError } = await supabase
      .from('employee_roster')
      .select('*')
      .or('employee_name.ilike.%任菲菲%,employee_uid.ilike.%任菲菲%')
      .limit(10)
    
    if (rosterError) {
      console.error('❌ 查询 employee_roster 表出错:', rosterError)
    } else {
      console.log(`✅ employee_roster 表找到 ${rosterData?.length || 0} 条记录`)
      if (rosterData && rosterData.length > 0) {
        console.log('记录详情:', rosterData.map(r => ({
          employee_name: r.employee_name,
          employee_uid: r.employee_uid,
          id: r.id,
          created_at: r.created_at
        })))
      }
    }

    // 5. 检查是否有部分匹配的记录
    console.log('\n🔍 检查部分匹配的记录...')
    const { data: partialData, error: partialError } = await supabase
      .from('employee_response_data')
      .select('*')
      .or('employee_name.ilike.%任%')
      .limit(5)
    
    if (partialError) {
      console.error('❌ 查询部分匹配记录出错:', partialError)
    } else {
      console.log(`✅ 找到 ${partialData?.length || 0} 条包含"任"的记录`)
      if (partialData && partialData.length > 0) {
        console.log('部分匹配记录:', partialData.map(r => ({
          employee_name: r.employee_name,
          employee_uid: r.employee_uid,
          id: r.id
        })))
      }
    }

    // 6. 检查表的总记录数
    console.log('\n📊 检查各表的总记录数...')
    const { count: responseCount } = await supabase
      .from('employee_response_data')
      .select('*', { count: 'exact', head: true })
    
    const { count: listCount } = await supabase
      .from('employee_list')
      .select('*', { count: 'exact', head: true })
    
    const { count: leadsCount } = await supabase
      .from('employee_leads_data')
      .select('*', { count: 'exact', head: true })
    
    const { count: rosterCount } = await supabase
      .from('employee_roster')
      .select('*', { count: 'exact', head: true })
    
    console.log(`📈 各表记录数统计:`)
    console.log(`  - employee_response_data: ${responseCount || 0} 条`)
    console.log(`  - employee_list: ${listCount || 0} 条`)
    console.log(`  - employee_leads_data: ${leadsCount || 0} 条`)
    console.log(`  - employee_roster: ${rosterCount || 0} 条`)

    // 7. 检查是否有视图或函数
    console.log('\n🔍 检查是否存在 get_employee_join_data 函数...')
    try {
      const { data: viewData, error: viewError } = await supabase
        .rpc('get_employee_join_data', {
          search_query: '任菲菲',
          filter_employee_name: null,
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
          sort_field: 'employee_name',
          sort_order: 'asc',
          pagination_params: { page: 1, page_size: 20 }
        })
      
      if (viewError) {
        console.log('❌ 函数 get_employee_join_data 调用失败:', viewError.message)
      } else {
        console.log(`✅ 函数调用成功，返回 ${viewData?.length || 0} 条记录`)
        if (viewData && viewData.length > 0) {
          console.log('前几条记录:', viewData.slice(0, 3).map(r => ({
            employee_name: r.employee_name,
            employee_id: r.employee_id,
            xiaohongshu_nickname: r.xiaohongshu_nickname
          })))
        }
      }
    } catch (error) {
      console.log('❌ 尝试调用函数时出错:', error.message)
    }

    // 8. 检查数据库中实际存在的函数和视图
    console.log('\n🔍 检查数据库中实际存在的函数和视图...')
    try {
      // 检查所有可用的函数
      const { data: functions, error: functionsError } = await supabase
        .from('information_schema.routines')
        .select('routine_name, routine_type')
        .eq('routine_schema', 'public')
        .like('routine_name', '%employee%')
        .like('routine_name', '%join%')
      
      if (functionsError) {
        console.log('❌ 查询函数列表失败:', functionsError.message)
      } else {
        console.log(`✅ 找到 ${functions?.length || 0} 个相关函数:`)
        if (functions && functions.length > 0) {
          functions.forEach(f => {
            console.log(`  - ${f.routine_name} (${f.routine_type})`)
          })
        }
      }

      // 检查所有可用的视图
      const { data: views, error: viewsError } = await supabase
        .from('information_schema.views')
        .select('table_name')
        .eq('table_schema', 'public')
        .like('table_name', '%employee%')
        .like('table_name', '%join%')
      
      if (viewsError) {
        console.log('❌ 查询视图列表失败:', viewsError.message)
      } else {
        console.log(`✅ 找到 ${views?.length || 0} 个相关视图:`)
        if (views && views.length > 0) {
          views.forEach(v => {
            console.log(`  - ${v.table_name}`)
          })
        }
      }

      // 检查所有可用的表
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .like('table_name', '%employee%')
      
      if (tablesError) {
        console.log('❌ 查询表列表失败:', tablesError.message)
      } else {
        console.log(`✅ 找到 ${tables?.length || 0} 个相关表:`)
        if (tables && tables.length > 0) {
          tables.forEach(t => {
            console.log(`  - ${t.table_name}`)
          })
        }
      }

    } catch (error) {
      console.log('❌ 检查函数和视图时出错:', error.message)
    }

  } catch (error) {
    console.error('❌ 检查过程中发生错误:', error)
  }
}

// 运行检查
checkRenfeifeiRecords()
  .then(() => {
    console.log('\n✅ 检查完成')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ 检查失败:', error)
    process.exit(1)
  })
