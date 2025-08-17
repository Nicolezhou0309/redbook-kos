-- 测试3张黄牌触发红牌的规则
-- 验证红牌规则已从2张黄牌修改为3张黄牌

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

-- 3. 测试3张黄牌触发红牌的逻辑
-- 模拟一个员工获得3张黄牌的情况
DO $$
DECLARE
    v_employee_id uuid;
    v_yellow_cards integer;
    v_red_cards integer;
    v_status text;
BEGIN
    -- 选择一个员工进行测试
    SELECT id INTO v_employee_id FROM employee_list LIMIT 1;
    
    -- 查看当前状态
    SELECT current_yellow_cards, current_red_cards, violation_status 
    INTO v_yellow_cards, v_red_cards, v_status
    FROM employee_list WHERE id = v_employee_id;
    
    RAISE NOTICE '员工ID: %, 当前黄牌: %, 当前红牌: %, 状态: %', 
                 v_employee_id, v_yellow_cards, v_red_cards, v_status;
    
    -- 模拟添加3次违规记录（应该触发红牌）
    FOR i IN 1..3 LOOP
        INSERT INTO disciplinary_record (
            employee_id, 
            employee_name,
            type, 
            reason, 
            created_at
        ) VALUES (
            v_employee_id,
            '测试员工',
            'test_violation',
            format('测试违规记录 %s - 验证3张黄牌触发红牌规则', i),
            current_timestamp
        );
        
        -- 等待一下让触发器执行
        PERFORM pg_sleep(0.1);
        
        -- 查看更新后的状态
        SELECT current_yellow_cards, current_red_cards, violation_status 
        INTO v_yellow_cards, v_red_cards, v_status
        FROM employee_list WHERE id = v_employee_id;
        
        RAISE NOTICE '添加第 % 次违规后 - 黄牌: %, 红牌: %, 状态: %', 
                     i, v_yellow_cards, v_red_cards, v_status;
    END LOOP;
    
    -- 最终状态
    SELECT current_yellow_cards, current_red_cards, violation_status 
    INTO v_yellow_cards, v_red_cards, v_status
    FROM employee_list WHERE id = v_employee_id;
    
    RAISE NOTICE '最终状态 - 黄牌: %, 红牌: %, 状态: %', 
                 v_yellow_cards, v_red_cards, v_status;
    
    -- 验证规则：3张黄牌应该变成1张红牌，剩余0张黄牌
    IF v_red_cards = 1 AND v_yellow_cards = 0 AND v_status = 'red' THEN
        RAISE NOTICE '✅ 测试通过：3张黄牌成功触发1张红牌';
    ELSE
        RAISE NOTICE '❌ 测试失败：期望红牌=1, 黄牌=0, 状态=red，实际红牌=%, 黄牌=%, 状态=%', 
                     v_red_cards, v_yellow_cards, v_status;
    END IF;
END $$;

-- 4. 清理测试数据
DELETE FROM disciplinary_record 
WHERE reason LIKE '测试违规记录%';

-- 5. 重新计算所有员工状态
SELECT update_all_employees_violation_status();

-- 6. 查看最终状态
SELECT '测试后的员工状态分布' as test_name,
       violation_status,
       COUNT(*) as count
FROM employee_list 
GROUP BY violation_status
ORDER BY violation_status;
