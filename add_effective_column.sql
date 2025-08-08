-- 为违规记录表添加生效列
-- 并修改相关函数只读取生效的记录

-- 1. 为disciplinary_record表添加生效列
ALTER TABLE public.disciplinary_record 
ADD COLUMN IF NOT EXISTS is_effective boolean DEFAULT true;

-- 2. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_disciplinary_record_is_effective 
ON public.disciplinary_record(is_effective);

-- 3. 添加表注释
COMMENT ON COLUMN public.disciplinary_record.is_effective IS '是否生效：true-生效，false-不生效';

-- 4. 修改违规状态计算函数，只读取生效的记录
CREATE OR REPLACE FUNCTION calculate_employee_violation_status(p_employee_id uuid)
RETURNS jsonb AS $$
DECLARE
    v_yellow_cards integer := 0;
    v_red_cards integer := 0;
    v_current_status text := 'normal';
    v_week_violations integer;
    v_week_record record;
BEGIN
    -- 按周统计违规记录（只读取生效的记录）
    FOR v_week_record IN 
        SELECT 
            to_char(created_at, 'YYYY-WW') as week,
            count(*) as violations_count
        FROM public.disciplinary_record 
        WHERE employee_id = p_employee_id 
          AND is_effective = true  -- 只读取生效的记录
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

-- 5. 创建设置记录生效状态的函数
CREATE OR REPLACE FUNCTION set_disciplinary_record_effective(
    p_record_id uuid,
    p_is_effective boolean
)
RETURNS void AS $$
BEGIN
    -- 更新记录的生效状态
    UPDATE public.disciplinary_record 
    SET is_effective = p_is_effective
    WHERE id = p_record_id;
    
    -- 如果记录有员工ID，则更新该员工的违规状态
    IF EXISTS (
        SELECT 1 FROM public.disciplinary_record 
        WHERE id = p_record_id AND employee_id IS NOT NULL
    ) THEN
        PERFORM update_employee_violation_status(
            (SELECT employee_id FROM public.disciplinary_record WHERE id = p_record_id)
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 6. 创建批量设置记录生效状态的函数
CREATE OR REPLACE FUNCTION batch_set_disciplinary_records_effective(
    p_record_ids uuid[],
    p_is_effective boolean
)
RETURNS void AS $$
DECLARE
    v_record_id uuid;
    v_employee_ids uuid[] := '{}';
    v_employee_id uuid;
BEGIN
    -- 更新所有指定记录的生效状态
    UPDATE public.disciplinary_record 
    SET is_effective = p_is_effective
    WHERE id = ANY(p_record_ids);
    
    -- 收集所有受影响的员工ID
    SELECT array_agg(DISTINCT employee_id) INTO v_employee_ids
    FROM public.disciplinary_record 
    WHERE id = ANY(p_record_ids) 
      AND employee_id IS NOT NULL;
    
    -- 更新所有受影响员工的违规状态
    IF v_employee_ids IS NOT NULL THEN
        FOREACH v_employee_id IN ARRAY v_employee_ids
        LOOP
            PERFORM update_employee_violation_status(v_employee_id);
        END LOOP;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 7. 创建获取生效记录数量的函数
CREATE OR REPLACE FUNCTION get_effective_violation_count(p_employee_id uuid)
RETURNS integer AS $$
DECLARE
    v_count integer;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM public.disciplinary_record 
    WHERE employee_id = p_employee_id 
      AND is_effective = true;
    
    RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql;

-- 8. 创建获取员工所有记录（包括生效和失效）的函数
CREATE OR REPLACE FUNCTION get_all_disciplinary_records_by_employee_id(p_employee_id uuid)
RETURNS TABLE(
    id uuid,
    employee_name text,
    reason text,
    created_at timestamp with time zone,
    type text,
    employee_id uuid,
    source_type text,
    is_effective boolean
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dr.id,
        dr.employee_name,
        dr.reason,
        dr.created_at,
        dr.type,
        dr.employee_id,
        dr.source_type,
        dr.is_effective
    FROM public.disciplinary_record dr
    WHERE dr.employee_id = p_employee_id
    ORDER BY dr.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 9. 更新现有数据，确保所有现有记录都是生效的
UPDATE public.disciplinary_record 
SET is_effective = true 
WHERE is_effective IS NULL;

-- 10. 重新计算所有员工的违规状态
SELECT update_all_employees_violation_status();
