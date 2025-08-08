-- 为employee_list表添加违规状态字段

-- 为employee_list表添加违规状态字段（用于快速查询）
ALTER TABLE public.employee_list 
ADD COLUMN IF NOT EXISTS current_yellow_cards integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_red_cards integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS violation_status text DEFAULT 'normal' CHECK (violation_status IN ('normal', 'yellow', 'red'));

-- 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_employee_list_violation_status 
ON public.employee_list(violation_status);

CREATE INDEX IF NOT EXISTS idx_employee_list_current_cards 
ON public.employee_list(current_yellow_cards, current_red_cards);

-- 添加表注释
COMMENT ON COLUMN public.employee_list.current_yellow_cards IS '当前黄牌数量';
COMMENT ON COLUMN public.employee_list.current_red_cards IS '当前红牌数量';
COMMENT ON COLUMN public.employee_list.violation_status IS '违规状态：normal-正常，yellow-黄牌，red-红牌';
