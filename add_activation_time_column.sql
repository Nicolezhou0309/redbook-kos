-- 为员工列表表添加开通时间列
ALTER TABLE public.employee_list 
ADD COLUMN activation_time timestamp with time zone null;

-- 添加注释
COMMENT ON COLUMN public.employee_list.activation_time IS '员工开通时间';

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_employee_activation_time ON public.employee_list(activation_time); 