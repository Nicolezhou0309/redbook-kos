-- 创建员工响应数据表
CREATE TABLE public.employee_response_data (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  employee_name text NOT NULL,
  employee_uid text NOT NULL,
  score_15s_response numeric(5, 2) NULL DEFAULT 0,
  score_30s_response numeric(5, 2) NULL DEFAULT 0,
  score_1min_response numeric(5, 2) NULL DEFAULT 0,
  score_1hour_timeout numeric(5, 2) NULL DEFAULT 0,
  score_avg_response_time numeric(5, 2) NULL DEFAULT 0,
  rate_15s_response text NULL DEFAULT '0%'::text,
  rate_30s_response text NULL DEFAULT '0%'::text,
  rate_1min_response text NULL DEFAULT '0%'::text,
  rate_1hour_timeout text NULL DEFAULT '0%'::text,
  avg_response_time numeric(10, 2) NULL DEFAULT 0,
  user_rating_score numeric(5, 2) NULL DEFAULT 0,
  time_range text NOT NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT employee_response_data_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_employee_response_data_uid 
ON public.employee_response_data USING btree (employee_uid) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_employee_response_data_time_range 
ON public.employee_response_data USING btree (time_range) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_employee_response_data_created_at 
ON public.employee_response_data USING btree (created_at) TABLESPACE pg_default;

-- 创建唯一索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_employee_response_data_unique 
ON public.employee_response_data USING btree (employee_uid, time_range) TABLESPACE pg_default;

-- 创建更新触发器函数（如果不存在）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 创建触发器
CREATE TRIGGER update_employee_response_data_updated_at 
BEFORE UPDATE ON employee_response_data 
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column(); 