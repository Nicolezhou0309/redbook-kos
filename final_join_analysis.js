import pg from 'pg';
const { Client } = pg;

// 数据库连接配置
const config = {
  connectionString: 'postgresql://postgres.nemmkwzijaaadrzwrtyg:xArYBrzsINV1d7YB@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
};

async function finalJoinAnalysis() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ 数据库连接成功');
    
    console.log('\n🔍 深入分析RIGHT JOIN问题:');
    
    // 1. 检查函数中使用的具体JOIN逻辑
    console.log('\n1️⃣ 检查函数中的JOIN逻辑:');
    
    const functionJoinTest = await client.query(`
      SELECT 
        '函数JOIN逻辑测试' as test_type,
        COUNT(*) as total_records
      FROM public.employee_list e
      RIGHT JOIN public.employee_leads_data eld ON e.employee_uid = eld.account_id
      RIGHT JOIN public.employee_response_data erd ON (
        COALESCE(e.employee_uid, eld.account_id) = erd.employee_uid
        AND eld.time_range->>'start_date' = erd.time_range->>'start_date'
        AND eld.time_range->>'end_date' = erd.time_range->>'end_date'
        AND eld.time_range->>'remark' = erd.time_range->>'remark'
      );
    `);
    
    console.log('函数JOIN逻辑总记录数:', functionJoinTest.rows[0].total_records);
    
    // 2. 逐步分解JOIN来找出问题
    console.log('\n2️⃣ 逐步分解JOIN分析:');
    
    // 第一步：employee_list RIGHT JOIN employee_leads_data
    const step1Join = await client.query(`
      SELECT 
        'Step 1: employee_list RIGHT JOIN employee_leads_data' as step,
        COUNT(*) as total_records,
        COUNT(CASE WHEN e.id IS NOT NULL THEN 1 END) as employee_matched,
        COUNT(CASE WHEN e.id IS NULL THEN 1 END) as employee_unmatched
      FROM public.employee_list e
      RIGHT JOIN public.employee_leads_data eld ON e.employee_uid = eld.account_id;
    `);
    
    console.log('第一步JOIN结果:', step1Join.rows[0]);
    
    // 第二步：添加employee_response_data的JOIN
    const step2Join = await client.query(`
      SELECT 
        'Step 2: 添加employee_response_data JOIN' as step,
        COUNT(*) as total_records,
        COUNT(CASE WHEN e.id IS NOT NULL THEN 1 END) as employee_matched,
        COUNT(CASE WHEN e.id IS NULL THEN 1 END) as employee_unmatched
      FROM public.employee_list e
      RIGHT JOIN public.employee_leads_data eld ON e.employee_uid = eld.account_id
      RIGHT JOIN public.employee_response_data erd ON (
        COALESCE(e.employee_uid, eld.account_id) = erd.employee_uid
      );
    `);
    
    console.log('第二步JOIN结果:', step2Join.rows[0]);
    
    // 第三步：添加时间范围条件
    const step3Join = await client.query(`
      SELECT 
        'Step 3: 添加时间范围条件' as step,
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
      );
    `);
    
    console.log('第三步JOIN结果:', step3Join.rows[0]);
    
    // 3. 检查时间范围字段的实际值
    console.log('\n3️⃣ 检查时间范围字段的实际值:');
    
    const timeRangeValues = await client.query(`
      SELECT 
        'employee_leads_data' as table_name,
        account_id,
        time_range->>'remark' as time_remark,
        time_range->>'start_date' as start_date,
        time_range->>'end_date' as end_date
      FROM public.employee_leads_data
      WHERE time_range->>'remark' IS NOT NULL
      LIMIT 5;
    `);
    
    console.log('employee_leads_data 时间范围字段实际值 (前5条):');
    timeRangeValues.rows.forEach(row => {
      console.log(`  ${row.table_name}: ${row.account_id} - ${row.time_remark} (${row.start_date} - ${row.end_date})`);
    });
    
    const responseTimeRangeValues = await client.query(`
      SELECT 
        'employee_response_data' as table_name,
        employee_uid as account_id,
        time_range->>'remark' as time_remark,
        time_range->>'start_date' as start_date,
        time_range->>'end_date' as end_date
      FROM public.employee_response_data
      WHERE time_range->>'remark' IS NOT NULL
      LIMIT 5;
    `);
    
    console.log('\nemployee_response_data 时间范围字段实际值 (前5条):');
    responseTimeRangeValues.rows.forEach(row => {
      console.log(`  ${row.table_name}: ${row.account_id} - ${row.time_remark} (${row.start_date} - ${row.end_date})`);
    });
    
    // 4. 检查COALESCE逻辑
    console.log('\n4️⃣ 检查COALESCE逻辑:');
    
    const coalesceTest = await client.query(`
      SELECT 
        'COALESCE测试' as test_type,
        COUNT(DISTINCT eld.account_id) as leads_account_ids,
        COUNT(DISTINCT erd.employee_uid) as response_employee_uids,
        COUNT(DISTINCT COALESCE(e.employee_uid, eld.account_id)) as coalesced_ids
      FROM public.employee_leads_data eld
      LEFT JOIN public.employee_response_data erd ON eld.account_id = erd.employee_uid
      LEFT JOIN public.employee_list e ON e.employee_uid = eld.account_id;
    `);
    
    console.log('COALESCE逻辑测试:', coalesceTest.rows[0]);
    
    // 5. 找出问题的根本原因
    console.log('\n5️⃣ 找出问题的根本原因:');
    
    // 检查是否有时间范围字段为NULL的记录
    const nullTimeRangeCheck = await client.query(`
      SELECT 
        'NULL时间范围检查' as check_type,
        COUNT(*) as null_time_range_count
      FROM public.employee_leads_data eld
      WHERE eld.time_range IS NULL 
         OR eld.time_range->>'start_date' IS NULL 
         OR eld.time_range->>'end_date' IS NULL 
         OR eld.time_range->>'remark' IS NULL;
    `);
    
    console.log('NULL时间范围检查:', nullTimeRangeCheck.rows[0]);
    
    // 检查employee_response_data中是否有NULL时间范围
    const nullResponseTimeCheck = await client.query(`
      SELECT 
        'NULL响应时间范围检查' as check_type,
        COUNT(*) as null_time_range_count
      FROM public.employee_response_data erd
      WHERE erd.time_range IS NULL 
         OR erd.time_range->>'start_date' IS NULL 
         OR erd.time_range->>'end_date' IS NULL 
         OR erd.time_range->>'remark' IS NULL;
    `);
    
    console.log('NULL响应时间范围检查:', nullResponseTimeCheck.rows[0]);
    
    // 6. 测试修复后的JOIN逻辑
    console.log('\n6️⃣ 测试修复后的JOIN逻辑:');
    
    // 使用LEFT JOIN而不是RIGHT JOIN
    const fixedJoinTest = await client.query(`
      SELECT 
        '修复后的JOIN逻辑' as test_type,
        COUNT(*) as total_records,
        COUNT(CASE WHEN e.id IS NOT NULL THEN 1 END) as employee_matched,
        COUNT(CASE WHEN e.id IS NULL THEN 1 END) as employee_unmatched
      FROM public.employee_leads_data eld
      LEFT JOIN public.employee_response_data erd ON (
        eld.account_id = erd.employee_uid
        AND eld.time_range->>'start_date' = erd.time_range->>'start_date'
        AND eld.time_range->>'end_date' = erd.time_range->>'end_date'
        AND eld.time_range->>'remark' = erd.time_range->>'remark'
      )
      LEFT JOIN public.employee_list e ON e.employee_uid = eld.account_id
      WHERE eld.time_range->>'remark' IS NOT NULL;
    `);
    
    console.log('修复后的JOIN逻辑结果:', fixedJoinTest.rows[0]);
    
  } catch (error) {
    console.error('❌ 分析过程中出错:', error);
  } finally {
    await client.end();
    console.log('\n🔌 数据库连接已关闭');
  }
}

// 运行分析
finalJoinAnalysis().catch(console.error);
