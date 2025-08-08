-- 违规状态计算和自动更新函数 V2

-- 1. 创建违规状态历史记录表
CREATE TABLE IF NOT EXISTS public.violation_status_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id uuid NOT NULL,
  week text NOT NULL,
  change_type text NOT NULL CHECK (change_type IN ('violation', 'recovery', 'escalation')),
  card_type text NOT NULL CHECK (card_type IN ('yellow', 'red')),
  reason text NOT NULL,
  yellow_cards_before integer NOT NULL,
  yellow_cards_after integer NOT NULL,
  red_cards_before integer NOT NULL,
  red_cards_after integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT violation_status_history_employee_id_fkey 
    FOREIGN KEY (employee_id) REFERENCES employee_list (id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_violation_status_history_employee_id 
ON public.violation_status_history(employee_id);

CREATE INDEX IF NOT EXISTS idx_violation_status_history_week 
ON public.violation_status_history(week);

-- 2. 创建添加黄牌记录时自动触发的函数
CREATE OR REPLACE FUNCTION add_yellow_card_and_update_status(
    p_employee_id uuid,
    p_reason text,
    p_type text DEFAULT 'manual'
)
RETURNS void AS $$
DECLARE
    v_current_yellow_cards integer;
    v_current_red_cards integer;
    v_new_yellow_cards integer;
    v_new_red_cards integer;
    v_current_week text;
    v_violation_record_id uuid;
BEGIN
    -- 获取当前周
    v_current_week := to_char(current_date, 'YYYY-WW');
    
    -- 获取员工当前状态
    SELECT current_yellow_cards, current_red_cards 
    INTO v_current_yellow_cards, v_current_red_cards
    FROM public.employee_list 
    WHERE id = p_employee_id;
    
    -- 设置默认值
    v_current_yellow_cards := COALESCE(v_current_yellow_cards, 0);
    v_current_red_cards := COALESCE(v_current_red_cards, 0);
    
    -- 添加违规记录
    INSERT INTO public.disciplinary_record (
        employee_id, 
        employee_name, 
        reason, 
        type,
        source_type
    ) VALUES (
        p_employee_id,
        (SELECT employee_name FROM public.employee_list WHERE id = p_employee_id),
        p_reason,
        p_type,
        'manual'
    ) RETURNING id INTO v_violation_record_id;
    
    -- 计算新的黄牌数量
    v_new_yellow_cards := v_current_yellow_cards + 1;
    v_new_red_cards := v_current_red_cards;
    
    -- 检查是否升级为红牌（3张黄牌=1张红牌）
    IF v_new_yellow_cards >= 3 THEN
        v_new_red_cards := v_new_red_cards + 1;
        v_new_yellow_cards := v_new_yellow_cards - 3;
        
        -- 记录升级历史
        INSERT INTO public.violation_status_history (
            employee_id, week, change_type, card_type, reason,
            yellow_cards_before, yellow_cards_after,
            red_cards_before, red_cards_after
        ) VALUES (
            p_employee_id, v_current_week, 'escalation', 'red', '3张黄牌升级为1张红牌',
            v_current_yellow_cards, v_new_yellow_cards,
            v_current_red_cards, v_new_red_cards
        );
    END IF;
    
    -- 记录违规历史
    INSERT INTO public.violation_status_history (
        employee_id, week, change_type, card_type, reason,
        yellow_cards_before, yellow_cards_after,
        red_cards_before, red_cards_after
    ) VALUES (
        p_employee_id, v_current_week, 'violation', 'yellow', 
        format('违规获得1张黄牌: %s', p_reason),
        v_current_yellow_cards, v_current_yellow_cards + 1,
        v_current_red_cards, v_current_red_cards
    );
    
    -- 更新员工状态
    UPDATE public.employee_list 
    SET 
        current_yellow_cards = v_new_yellow_cards,
        current_red_cards = v_new_red_cards,
        violation_status = CASE 
            WHEN v_new_red_cards > 0 THEN 'red'
            WHEN v_new_yellow_cards > 0 THEN 'yellow'
            ELSE 'normal'
        END
    WHERE id = p_employee_id;
END;
$$ LANGUAGE plpgsql;

-- 3. 创建恢复黄牌的函数
CREATE OR REPLACE FUNCTION recover_yellow_card(p_employee_id uuid)
RETURNS void AS $$
DECLARE
    v_current_yellow_cards integer;
    v_current_red_cards integer;
    v_current_week text;
BEGIN
    -- 获取当前周
    v_current_week := to_char(current_date, 'YYYY-WW');
    
    -- 获取员工当前状态
    SELECT current_yellow_cards, current_red_cards 
    INTO v_current_yellow_cards, v_current_red_cards
    FROM public.employee_list 
    WHERE id = p_employee_id;
    
    -- 设置默认值
    v_current_yellow_cards := COALESCE(v_current_yellow_cards, 0);
    v_current_red_cards := COALESCE(v_current_red_cards, 0);
    
    -- 检查是否可以恢复黄牌（有黄牌且无红牌）
    IF v_current_yellow_cards > 0 AND v_current_red_cards = 0 THEN
        -- 记录恢复历史
        INSERT INTO public.violation_status_history (
            employee_id, week, change_type, card_type, reason,
            yellow_cards_before, yellow_cards_after,
            red_cards_before, red_cards_after
        ) VALUES (
            p_employee_id, v_current_week, 'recovery', 'yellow', '本周无违规，恢复1张黄牌',
            v_current_yellow_cards, v_current_yellow_cards - 1,
            v_current_red_cards, v_current_red_cards
        );
        
        -- 更新员工状态
        UPDATE public.employee_list 
        SET 
            current_yellow_cards = v_current_yellow_cards - 1,
            violation_status = CASE 
                WHEN (v_current_yellow_cards - 1) > 0 THEN 'yellow'
                ELSE 'normal'
            END
        WHERE id = p_employee_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 4. 创建获取员工违规状态历史的函数
CREATE OR REPLACE FUNCTION get_employee_violation_history(p_employee_id uuid)
RETURNS jsonb AS $$
DECLARE
    v_history jsonb;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'week', week,
            'changeType', change_type,
            'cardType', card_type,
            'reason', reason,
            'yellowCardsBefore', yellow_cards_before,
            'yellowCardsAfter', yellow_cards_after,
            'redCardsBefore', red_cards_before,
            'redCardsAfter', red_cards_after,
            'timestamp', created_at
        ) ORDER BY created_at
    ) INTO v_history
    FROM public.violation_status_history
    WHERE employee_id = p_employee_id;
    
    RETURN COALESCE(v_history, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- 5. 创建获取员工当前状态的函数
CREATE OR REPLACE FUNCTION get_employee_current_status(p_employee_id uuid)
RETURNS jsonb AS $$
DECLARE
    v_status jsonb;
BEGIN
    SELECT jsonb_build_object(
        'employeeId', id,
        'employeeName', employee_name,
        'currentYellowCards', current_yellow_cards,
        'currentRedCards', current_red_cards,
        'status', violation_status
    ) INTO v_status
    FROM public.employee_list
    WHERE id = p_employee_id;
    
    RETURN v_status;
END;
$$ LANGUAGE plpgsql;

-- 6. 创建批量获取员工状态的函数
CREATE OR REPLACE FUNCTION get_multiple_employees_status(p_employee_ids uuid[])
RETURNS jsonb AS $$
DECLARE
    v_employee_id uuid;
    v_result jsonb := '{}'::jsonb;
    v_status jsonb;
BEGIN
    FOREACH v_employee_id IN ARRAY p_employee_ids
    LOOP
        v_status := get_employee_current_status(v_employee_id);
        v_result := v_result || jsonb_build_object(v_employee_id::text, v_status);
    END LOOP;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 7. 创建每周自动恢复黄牌的函数（需要定时任务调用）
CREATE OR REPLACE FUNCTION weekly_yellow_card_recovery()
RETURNS void AS $$
DECLARE
    v_employee record;
BEGIN
    -- 为所有有黄牌且无红牌的员工恢复1张黄牌
    FOR v_employee IN 
        SELECT id 
        FROM public.employee_list 
        WHERE current_yellow_cards > 0 AND current_red_cards = 0
    LOOP
        PERFORM recover_yellow_card(v_employee.id);
    END LOOP;
END;
$$ LANGUAGE plpgsql;
