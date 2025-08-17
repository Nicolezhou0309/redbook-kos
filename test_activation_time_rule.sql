-- 测试基于开通时间的红黄牌计算规则
-- 验证"开通时间次周才开始计算红黄牌"的规则

-- 1. 查看当前员工状态分布
SELECT '当前员工状态分布' as test_name,
       violation_status,
       COUNT(*) as count
FROM employee_list 
GROUP BY violation_status
ORDER BY violation_status;

-- 2. 查看当前黄牌和红牌分布
SELECT '当前黄牌分布' as test_name,
       current_yellow_cards,
       COUNT(*) as count
FROM employee_list 
GROUP BY current_yellow_cards
ORDER BY current_yellow_cards;

SELECT '当前红牌分布' as test_name,
       current_red_cards,
       COUNT(*) as count
FROM employee_list 
GROUP BY current_red_cards
ORDER BY current_red_cards;

-- 3. 测试基于开通时间的规则
-- 选择一个有开通时间的员工进行测试
DO $$
DECLARE
    v_employee_id uuid;
    v_employee_name text;
    v_activation_time timestamp with time zone;
    v_activation_week text;
    v_status_info jsonb;
    v_yellow_cards integer;
    v_red_cards integer;
    v_status text;
    v_rule_applied text;
    v_record record;
BEGIN
    -- 选择一个有开通时间的员工
    SELECT id, employee_name, activation_time 
    INTO v_employee_id, v_employee_name, v_activation_time
    FROM employee_list 
    WHERE activation_time IS NOT NULL 
    LIMIT 1;
    
    IF v_employee_id IS NULL THEN
        RAISE NOTICE '没有找到有开通时间的员工';
        RETURN;
    END IF;
    
    v_activation_week := to_char(v_activation_time, 'YYYY-WW');
    
    RAISE NOTICE '测试员工: %, 开通时间: %, 开通周: %', 
                 v_employee_name, v_activation_time, v_activation_week;
    
    -- 查看当前状态
    SELECT current_yellow_cards, current_red_cards, violation_status 
    INTO v_yellow_cards, v_red_cards, v_status
    FROM employee_list WHERE id = v_employee_id;
    
    RAISE NOTICE '当前状态 - 黄牌: %, 红牌: %, 状态: %', 
                 v_yellow_cards, v_red_cards, v_status;
    
    -- 调用新的计算函数
    v_status_info := calculate_employee_violation_status(v_employee_id);
    
    RAISE NOTICE '新规则计算结果: %', v_status_info;
    
    -- 验证规则应用情况
    v_rule_applied := v_status_info->>'ruleApplied';
    
    IF v_rule_applied = 'activation_time_delayed_rule' THEN
        RAISE NOTICE '✅ 新规则已应用：基于开通时间的延迟计算';
    ELSE
        RAISE NOTICE '❌ 新规则未应用：使用标准规则';
    END IF;
    
    -- 查看违规记录时间分布
    RAISE NOTICE '违规记录时间分布:';
    FOR v_record IN 
        SELECT 
            to_char(created_at, 'YYYY-WW') as week,
            count(*) as violations_count,
            reason
        FROM disciplinary_record 
        WHERE employee_id = v_employee_id
        GROUP BY to_char(created_at, 'YYYY-WW'), reason
        ORDER BY week
    LOOP
        IF v_record.week <= v_activation_week THEN
            RAISE NOTICE '  周 %: % 次违规 (开通当周或之前，不计入红黄牌) - %', 
                         v_record.week, v_record.violations_count, v_record.reason;
        ELSE
            RAISE NOTICE '  周 %: % 次违规 (开通次周之后，计入红黄牌) - %', 
                         v_record.week, v_record.violations_count, v_record.reason;
        END IF;
    END LOOP;
    
END $$;

-- 4. 测试不同开通时间的员工
SELECT '不同开通时间员工的状态' as test_name,
       employee_name,
       activation_time,
       to_char(activation_time, 'YYYY-WW') as activation_week,
       current_yellow_cards,
       current_red_cards,
       violation_status
FROM employee_list 
WHERE activation_time IS NOT NULL
ORDER BY activation_time
LIMIT 10;

-- 5. 查看违规记录与开通时间的关系
SELECT '违规记录与开通时间关系分析' as analysis,
       e.employee_name,
       e.activation_time,
       to_char(e.activation_time, 'YYYY-WW') as activation_week,
       d.created_at as violation_time,
       to_char(d.created_at, 'YYYY-WW') as violation_week,
       CASE 
           WHEN to_char(d.created_at, 'YYYY-WW') <= to_char(e.activation_time, 'YYYY-WW') 
           THEN '开通当周或之前（不计入红黄牌）'
           ELSE '开通次周之后（计入红黄牌）'
       END as rule_applied,
       d.reason
FROM employee_list e
JOIN disciplinary_record d ON e.id = d.employee_id
WHERE e.activation_time IS NOT NULL
ORDER BY e.activation_time, d.created_at
LIMIT 15;
