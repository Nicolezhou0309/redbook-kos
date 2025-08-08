-- 创建添加黄牌记录时自动触发的函数
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
