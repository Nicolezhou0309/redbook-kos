-- 创建违规状态历史记录表
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

-- 添加表注释
COMMENT ON TABLE public.violation_status_history IS '违规状态变化历史记录表';
COMMENT ON COLUMN public.violation_status_history.employee_id IS '员工ID';
COMMENT ON COLUMN public.violation_status_history.week IS '周次（YYYY-WW格式）';
COMMENT ON COLUMN public.violation_status_history.change_type IS '变化类型：violation-违规，recovery-恢复，escalation-升级';
COMMENT ON COLUMN public.violation_status_history.card_type IS '卡片类型：yellow-黄牌，red-红牌';
COMMENT ON COLUMN public.violation_status_history.reason IS '变化原因';
COMMENT ON COLUMN public.violation_status_history.yellow_cards_before IS '变化前黄牌数量';
COMMENT ON COLUMN public.violation_status_history.yellow_cards_after IS '变化后黄牌数量';
COMMENT ON COLUMN public.violation_status_history.red_cards_before IS '变化前红牌数量';
COMMENT ON COLUMN public.violation_status_history.red_cards_after IS '变化后红牌数量';
