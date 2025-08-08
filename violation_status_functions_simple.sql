-- 简化版违规状态计算和自动更新函数

-- 1. 创建违规状态计算函数（简化版）
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
            
            -- 检查是否升级为红牌（3张黄牌=1张红牌，去除原来的2张黄牌）
            IF v_yellow_cards >= 3 THEN
                v_red_cards := v_red_cards + 1;
                v_yellow_cards := v_yellow_cards - 3;
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

-- 2. 创建更新员工违规状态的函数
CREATE OR REPLACE FUNCTION update_employee_violation_status(p_employee_id uuid)
RETURNS void AS $$
DECLARE
    v_status_info jsonb;
BEGIN
    -- 计算违规状态
    v_status_info := calculate_employee_violation_status(p_employee_id);
    
    -- 更新employee_list表中的状态
    UPDATE public.employee_list 
    SET 
        current_yellow_cards = (v_status_info->>'currentYellowCards')::integer,
        current_red_cards = (v_status_info->>'currentRedCards')::integer,
        violation_status = v_status_info->>'status'
    WHERE id = p_employee_id;
END;
$$ LANGUAGE plpgsql;

-- 3. 创建违规记录插入触发器函数
CREATE OR REPLACE FUNCTION trigger_update_violation_status()
RETURNS trigger AS $$
BEGIN
    -- 当插入或更新违规记录时，自动更新员工的违规状态
    IF NEW.employee_id IS NOT NULL THEN
        PERFORM update_employee_violation_status(NEW.employee_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. 创建触发器
DROP TRIGGER IF EXISTS update_violation_status_trigger ON public.disciplinary_record;
CREATE TRIGGER update_violation_status_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.disciplinary_record
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_violation_status();

-- 5. 创建批量更新所有员工违规状态的函数
CREATE OR REPLACE FUNCTION update_all_employees_violation_status()
RETURNS void AS $$
DECLARE
    v_employee record;
BEGIN
    FOR v_employee IN SELECT id FROM public.employee_list
    LOOP
        PERFORM update_employee_violation_status(v_employee.id);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 6. 创建获取员工违规状态的函数
CREATE OR REPLACE FUNCTION get_employee_violation_status(p_employee_id uuid)
RETURNS jsonb AS $$
BEGIN
    RETURN calculate_employee_violation_status(p_employee_id);
END;
$$ LANGUAGE plpgsql;

-- 7. 创建获取多个员工违规状态的函数
CREATE OR REPLACE FUNCTION get_multiple_employees_violation_status(p_employee_ids uuid[])
RETURNS jsonb AS $$
DECLARE
    v_employee_id uuid;
    v_result jsonb := '{}'::jsonb;
    v_status_info jsonb;
BEGIN
    FOREACH v_employee_id IN ARRAY p_employee_ids
    LOOP
        v_status_info := calculate_employee_violation_status(v_employee_id);
        v_result := v_result || jsonb_build_object(v_employee_id::text, v_status_info);
    END LOOP;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 8. 创建手动更新员工状态的函数（用于手动调用）
CREATE OR REPLACE FUNCTION refresh_employee_violation_status(p_employee_id uuid)
RETURNS jsonb AS $$
BEGIN
    -- 更新员工状态
    PERFORM update_employee_violation_status(p_employee_id);
    
    -- 返回更新后的状态
    RETURN get_employee_violation_status(p_employee_id);
END;
$$ LANGUAGE plpgsql;

-- 9. 创建批量刷新员工状态的函数
CREATE OR REPLACE FUNCTION refresh_all_employees_violation_status()
RETURNS void AS $$
BEGIN
    PERFORM update_all_employees_violation_status();
END;
$$ LANGUAGE plpgsql;
