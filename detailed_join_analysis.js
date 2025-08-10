import pg from 'pg';
const { Client } = pg;

// 数据库连接配置
const config = {
  connectionString: 'postgresql://postgres.nemmkwzijaaadrzwrtyg:xArYBrzsINV1d7YB@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
};

async function detailedJoinAnalysis() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ 数据库连接成功');
    
    // 1. 详细分析各表的数据分布
    console.log('\n📊 详细分析各表数据分布:');
    
    // 检查employee_leads_data的时间范围分布
    const leadsTimeDistribution = await client.query(`
      SELECT 
        time_range->>'remark' as time_remark,
        COUNT(*) as record_count,
        COUNT(DISTINCT account_id) as unique_accounts
      FROM public.employee_leads_data
      GROUP BY time_range->>'remark'
      ORDER BY time_remark;
    `);
    
    console.log('employee_leads_data 时间范围分布:');
    leadsTimeDistribution.rows.forEach(row => {
      console.log(`  ${row.time_remark}: ${row.record_count} 条记录, ${row.unique_accounts} 个唯一账户`);
    });
    
    // 检查employee_response_data的时间范围分布
    const responseTimeDistribution = await client.query(`
      SELECT 
        time_range->>'remark' as time_remark,
        COUNT(*) as record_count,
        COUNT(DISTINCT employee_uid) as unique_employees
      FROM public.employee_response_data
      GROUP BY time_range->>'remark'
      ORDER BY time_remark;
    `);
    
    console.log('\nemployee_response_data 时间范围分布:');
    responseTimeDistribution.rows.forEach(row => {
      console.log(`  ${row.time_remark}: ${row.record_count} 条记录, ${row.unique_employees} 个唯一员工`);
    });
    
    // 2. 分析JOIN失败的具体原因
    console.log('\n🔍 分析JOIN失败的具体原因:');
    
    // 检查时间范围不匹配的情况
    const timeMismatchAnalysis = await client.query(`
      SELECT 
        '时间范围不匹配' as issue_type,
        COUNT(*) as issue_count
      FROM public.employee_leads_data eld
      LEFT JOIN public.employee_response_data erd ON eld.account_id = erd.employee_uid
      WHERE erd.employee_uid IS NULL
      AND eld.time_range->>'remark' = '本周';
    `);
    
    console.log('本周时间范围JOIN失败数量:', timeMismatchAnalysis.rows[0].issue_count);
    
    // 3. 检查具体的JOIN键匹配情况
    console.log('\n🔑 检查JOIN键匹配情况:');
    
    // 检查employee_list和employee_leads_data的匹配
    const keyMatchAnalysis = await client.query(`
      SELECT 
        'employee_list vs employee_leads_data' as comparison,
        COUNT(DISTINCT e.employee_uid) as employee_list_uids,
        COUNT(DISTINCT eld.account_id) as leads_account_ids,
        COUNT(DISTINCT CASE WHEN e.employee_uid = eld.account_id THEN e.employee_uid END) as matched_keys,
        COUNT(DISTINCT CASE WHEN e.employee_uid IS NOT NULL AND eld.account_id IS NOT NULL AND e.employee_uid != eld.account_id THEN e.employee_uid END) as mismatched_keys
      FROM public.employee_list e
      FULL OUTER JOIN public.employee_leads_data eld ON e.employee_uid = eld.account_id;
    `);
    
    console.log('JOIN键匹配分析:', keyMatchAnalysis.rows[0]);
    
    // 4. 检查时间范围字段的格式和内容
    console.log('\n⏰ 检查时间范围字段格式:');
    
    const timeFormatAnalysis = await client.query(`
      SELECT 
        'employee_leads_data' as table_name,
        time_range->>'remark' as time_remark,
        time_range->>'start_date' as start_date,
        time_range->>'end_date' as end_date,
        COUNT(*) as record_count
      FROM public.employee_leads_data
      WHERE time_range->>'remark' = '本周'
      GROUP BY time_range->>'remark', time_range->>'start_date', time_range->>'end_date'
      UNION ALL
      SELECT 
        'employee_response_data' as table_name,
        time_range->>'remark' as time_remark,
        time_range->>'start_date' as start_date,
        time_range->>'end_date' as end_date,
        COUNT(*) as record_count
      FROM public.employee_response_data
      WHERE time_range->>'remark' = '本周'
      GROUP BY time_range->>'remark', time_range->>'start_date', time_range->>'end_date'
      ORDER BY table_name, time_remark;
    `);
    
    console.log('时间范围字段格式分析:');
    timeFormatAnalysis.rows.forEach(row => {
      console.log(`  ${row.table_name}: ${row.time_remark} (${row.start_date} - ${row.end_date}) - ${row.record_count} 条记录`);
    });
    
    // 5. 测试不同的JOIN策略
    console.log('\n🧪 测试不同的JOIN策略:');
    
    // 测试只使用employee_uid的JOIN
    const simpleJoinTest = await client.query(`
      SELECT COUNT(*) as simple_join_count
      FROM public.employee_leads_data eld
      INNER JOIN public.employee_response_data erd ON eld.account_id = erd.employee_uid
      WHERE eld.time_range->>'remark' = '本周';
    `);
    
    console.log('简单JOIN (只匹配employee_uid) 结果数:', simpleJoinTest.rows[0].simple_join_count);
    
    // 测试使用时间范围的JOIN
    const timeJoinTest = await client.query(`
      SELECT COUNT(*) as time_join_count
      FROM public.employee_leads_data eld
      INNER JOIN public.employee_response_data erd ON (
        eld.account_id = erd.employee_uid
        AND eld.time_range->>'remark' = erd.time_range->>'remark'
        AND eld.time_range->>'start_date' = erd.time_range->>'start_date'
        AND eld.time_range->>'end_date' = erd.time_range->>'end_date'
      )
      WHERE eld.time_range->>'remark' = '本周';
    `);
    
    console.log('时间范围JOIN 结果数:', timeJoinTest.rows[0].time_join_count);
    
    // 6. 分析RIGHT JOIN的影响
    console.log('\n🔄 分析RIGHT JOIN的影响:');
    
    const rightJoinImpact = await client.query(`
      SELECT 
        COUNT(*) as total_records,
        COUNT(CASE WHEN e.id IS NOT NULL THEN 1 END) as employee_matched,
        COUNT(CASE WHEN e.id IS NULL THEN 1 END) as employee_unmatched
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
    
    if (rightJoinImpact.rows[0].total_records > 0) {
      const unmatchedPercentage = (rightJoinImpact.rows[0].employee_unmatched / rightJoinImpact.rows[0].total_records * 100).toFixed(2);
      console.log(`RIGHT JOIN分析: 总记录数=${rightJoinImpact.rows[0].total_records}, 员工匹配=${rightJoinImpact.rows[0].employee_matched}, 员工未匹配=${rightJoinImpact.rows[0].employee_unmatched} (${unmatchedPercentage}%)`);
    } else {
      console.log('RIGHT JOIN分析: 没有匹配的记录');
    }
    
    // 7. 检查数据一致性问题
    console.log('\n🔍 检查数据一致性问题:');
    
    const dataConsistencyCheck = await client.query(`
      SELECT 
        'account_id不一致' as issue,
        COUNT(*) as count
      FROM public.employee_leads_data eld
      LEFT JOIN public.employee_response_data erd ON eld.account_id = erd.employee_uid
      WHERE erd.employee_uid IS NULL
      AND eld.time_range->>'remark' = '本周'
      UNION ALL
      SELECT 
        '时间范围不一致' as issue,
        COUNT(*) as count
      FROM public.employee_leads_data eld
      INNER JOIN public.employee_response_data erd ON eld.account_id = erd.employee_uid
      WHERE eld.time_range->>'remark' = '本周'
      AND (
        eld.time_range->>'start_date' != erd.time_range->>'start_date'
        OR eld.time_range->>'end_date' != erd.time_range->>'end_date'
        OR eld.time_range->>'remark' != erd.time_range->>'remark'
      );
    `);
    
    console.log('数据一致性问题分析:');
    dataConsistencyCheck.rows.forEach(row => {
      console.log(`  ${row.issue}: ${row.count} 条记录`);
    });
    
  } catch (error) {
    console.error('❌ 分析过程中出错:', error);
  } finally {
    await client.end();
    console.log('\n🔌 数据库连接已关闭');
  }
}

// 运行分析
detailedJoinAnalysis().catch(console.error);
