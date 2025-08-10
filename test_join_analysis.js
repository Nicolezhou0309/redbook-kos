import pg from 'pg';
const { Client } = pg;

// 数据库连接配置
const config = {
  connectionString: 'postgresql://postgres.nemmkwzijaaadrzwrtyg:xArYBrzsINV1d7YB@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
};

async function analyzeJoinIssues() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ 数据库连接成功');
    
    // 1. 检查各个表的数据量
    console.log('\n📊 检查各表数据量:');
    const tableCounts = await client.query(`
      SELECT 
        'employee_list' as table_name,
        COUNT(*) as total_count,
        COUNT(CASE WHEN employee_uid IS NOT NULL THEN 1 END) as uid_count,
        COUNT(CASE WHEN employee_uid IS NULL THEN 1 END) as null_uid_count
      FROM public.employee_list
      UNION ALL
      SELECT 
        'employee_leads_data' as table_name,
        COUNT(*) as total_count,
        COUNT(CASE WHEN account_id IS NOT NULL THEN 1 END) as account_id_count,
        COUNT(CASE WHEN account_id IS NULL THEN 1 END) as null_account_id_count
      FROM public.employee_leads_data
      UNION ALL
      SELECT 
        'employee_response_data' as table_name,
        COUNT(*) as total_count,
        COUNT(CASE WHEN employee_uid IS NOT NULL THEN 1 END) as employee_uid_count,
        COUNT(CASE WHEN employee_uid IS NULL THEN 1 END) as null_employee_uid_count
      FROM public.employee_response_data
      ORDER BY table_name;
    `);
    
    tableCounts.rows.forEach(row => {
      console.log(`${row.table_name}: 总记录数=${row.total_count}, 有效ID数=${row.uid_count || row.account_id_count || row.employee_uid_count}, 空ID数=${row.null_uid_count || row.null_account_id_count || row.null_employee_uid_count}`);
    });
    
    // 2. 检查JOIN键的匹配情况
    console.log('\n🔍 检查JOIN键匹配情况:');
    
    // 检查employee_list和employee_leads_data的JOIN
    const join1Analysis = await client.query(`
      SELECT 
        'employee_list -> employee_leads_data' as join_type,
        COUNT(DISTINCT e.employee_uid) as employee_list_uid_count,
        COUNT(DISTINCT eld.account_id) as leads_account_id_count,
        COUNT(DISTINCT CASE WHEN e.employee_uid = eld.account_id THEN e.employee_uid END) as matched_uid_count,
        COUNT(DISTINCT CASE WHEN e.employee_uid IS NULL THEN eld.account_id END) as unmatched_leads_count
      FROM public.employee_list e
      FULL OUTER JOIN public.employee_leads_data eld ON e.employee_uid = eld.account_id;
    `);
    
    console.log(join1Analysis.rows[0]);
    
    // 3. 检查时间范围匹配情况
    console.log('\n⏰ 检查时间范围匹配情况:');
    const timeRangeAnalysis = await client.query(`
      SELECT 
        COUNT(*) as total_leads_records,
        COUNT(DISTINCT time_range->>'remark') as unique_time_remarks,
        COUNT(DISTINCT time_range->>'start_date') as unique_start_dates,
        COUNT(DISTINCT time_range->>'end_date') as unique_end_dates
      FROM public.employee_leads_data;
    `);
    
    console.log('时间范围统计:', timeRangeAnalysis.rows[0]);
    
    // 4. 检查具体的JOIN失败案例
    console.log('\n❌ 检查JOIN失败的案例:');
    const failedJoins = await client.query(`
      SELECT 
        eld.account_id as leads_account_id,
        eld.time_range->>'remark' as leads_time_remark,
        eld.time_range->>'start_date' as leads_start_date,
        eld.time_range->>'end_date' as leads_end_date,
        erd.employee_uid as response_employee_uid,
        erd.time_range->>'remark' as response_time_remark,
        erd.time_range->>'start_date' as response_start_date,
        erd.time_range->>'end_date' as response_end_date
      FROM public.employee_leads_data eld
      LEFT JOIN public.employee_response_data erd ON (
        eld.account_id = erd.employee_uid
        AND eld.time_range->>'start_date' = erd.time_range->>'start_date'
        AND eld.time_range->>'end_date' = erd.time_range->>'end_date'
        AND eld.time_range->>'remark' = erd.time_range->>'remark'
      )
      WHERE erd.employee_uid IS NULL
      LIMIT 10;
    `);
    
    console.log('JOIN失败的案例 (前10条):');
    failedJoins.rows.forEach((row, index) => {
      console.log(`${index + 1}. Leads: ${row.leads_account_id} (${row.leads_time_remark}) | Response: ${row.response_employee_uid || 'NULL'}`);
    });
    
    // 5. 测试函数调用
    console.log('\n🧪 测试函数调用:');
    try {
      const functionResult = await client.query(`
        SELECT COUNT(*) as result_count 
        FROM public.get_employee_join_data(time_range_remark := '本周');
      `);
      console.log('函数执行结果记录数:', functionResult.rows[0].result_count);
    } catch (error) {
      console.error('函数执行失败:', error.message);
    }
    
    // 6. 分析RIGHT JOIN的影响
    console.log('\n🔄 分析RIGHT JOIN的影响:');
    const rightJoinAnalysis = await client.query(`
      SELECT 
        COUNT(*) as total_records,
        COUNT(CASE WHEN e.id IS NOT NULL THEN 1 END) as employee_matched,
        COUNT(CASE WHEN e.id IS NULL THEN 1 END) as employee_unmatched,
        ROUND(
          COUNT(CASE WHEN e.id IS NULL THEN 1 END)::numeric / COUNT(*)::numeric * 100, 2
        ) as unmatched_percentage
      FROM public.employee_list e
      RIGHT JOIN public.employee_leads_data eld ON e.employee_uid = eld.account_id
      RIGHT JOIN public.employee_response_data erd ON (
        COALESCE(e.employee_uid, eld.account_id) = erd.employee_uid
        AND eld.time_range->>'start_date' = erd.time_range->>'start_date'
        AND eld.time_range->>'end_date' = erd.time_range->>'end_date'
        AND eld.time_range->>'remark' = erd.time_range->>'remark'
      )
      WHERE eld.time_range->>'remark' = '本周';
    `);
    
    console.log('RIGHT JOIN分析结果:', rightJoinAnalysis.rows[0]);
    
  } catch (error) {
    console.error('❌ 分析过程中出错:', error);
  } finally {
    await client.end();
    console.log('\n🔌 数据库连接已关闭');
  }
}

// 运行分析
analyzeJoinIssues().catch(console.error);
