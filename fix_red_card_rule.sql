-- 修正红牌规则：2张黄牌=1张红牌

-- 1. 修正违规状态计算函数
CREATE OR REPLACE FUNCTION calculate_employee_violation_status(p_employee_id uuid)
RETURNS jsonb AS $$
DECLARE
    v_yellow_cards integer := 0;
    v_red_cards integer := 0;
    v_current_status text := 'normal';
    v_week_violations integer;
    v_week_record record;
BEGIN
    -- 按周统计违规记录
    FOR v_week_record IN 
        SELECT 
            to_char(created_at, 'YYYY-WW') as week,
            count(*) as violations_count
        FROM public.disciplinary_record 
        WHERE employee_id = p_employee_id
        GROUP BY to_char(created_at, 'YYYY-WW')
        ORDER BY week
    LOOP
        v_week_violations := v_week_record.violations_count;
        
        IF v_week_violations > 0 THEN
            -- 本周有违规，获得黄牌
            v_yellow_cards := v_yellow_cards + v_week_violations;
            
            -- 检查是否升级为红牌（2张黄牌=1张红牌）
            IF v_yellow_cards >= 2 THEN
                v_red_cards := v_red_cards + floor(v_yellow_cards / 2);
                v_yellow_cards := v_yellow_cards % 2;
            END IF;
        ELSE
            -- 本周无违规，检查是否可以恢复黄牌
            IF v_yellow_cards > 0 AND v_red_cards = 0 THEN
                v_yellow_cards := greatest(0, v_yellow_cards - 1);
            END IF;
        END IF;
    END LOOP;
    
    -- 确定当前状态
    IF v_red_cards > 0 THEN
        v_current_status := 'red';
    ELSIF v_yellow_cards > 0 THEN
        v_current_status := 'yellow';
    ELSE
        v_current_status := 'normal';
    END IF;
    
    -- 返回状态信息
    RETURN jsonb_build_object(
        'employeeId', p_employee_id,
        'currentYellowCards', v_yellow_cards,
        'currentRedCards', v_red_cards,
        'status', v_current_status
    );
END;
$$ LANGUAGE plpgsql;

-- 2. 重新计算所有员工的违规状态
SELECT update_all_employees_violation_status();

-- 3. 验证修正结果
SELECT '修正后的员工状态分布' as test_name,
       violation_status,
       COUNT(*) as count
FROM employee_list 
GROUP BY violation_status
ORDER BY violation_status;

SELECT '修正后的黄牌分布' as test_name,
       current_yellow_cards,
       COUNT(*) as count
FROM employee_list 
GROUP BY current_yellow_cards
ORDER BY current_yellow_cards;

SELECT '修正后的红牌分布' as test_name,
       current_red_cards,
       COUNT(*) as count
FROM employee_list 
GROUP BY current_red_cards
ORDER BY current_red_cards;

-- 4. 检查有问题的员工
SELECT '需要检查的员工' as test_name,
       employee_name,
       current_yellow_cards,
       current_red_cards,
       violation_status
FROM employee_list 
WHERE (current_yellow_cards >= 2 AND current_red_cards = 0) 
   OR (current_yellow_cards > 0 AND current_red_cards > 0)
ORDER BY current_yellow_cards DESC, current_red_cards DESC;
