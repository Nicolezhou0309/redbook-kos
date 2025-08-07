-- 优化违规记录表，增加记录来源功能
-- 方案：通过添加来源相关字段来跟踪记录的创建来源

-- 1. 删除现有表（如果存在）
DROP TABLE IF EXISTS public.disciplinary_record CASCADE;

-- 2. 创建优化后的违规记录表
CREATE TABLE public.disciplinary_record (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  employee_name text NOT NULL,
  reason text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  type text NULL,
  employee_id uuid NULL,
  
  -- 新增记录来源字段
  source_type text NULL, -- 来源类型：'manual'（手动录入）, 'import'（批量导入）, 'auto'（自动生成）
  source_table text NULL, -- 原始数据表名：'employee_response_data', 'employee_notes', 'employee_leads' 等
  source_record_id uuid NULL, -- 原始记录ID
  source_time_range jsonb NULL, -- 数据时间范围，JSONB格式，如 {"start": "2024-01-01", "end": "2024-01-31"}
  source_batch_id text NULL, -- 批量导入批次ID
  source_file_name text NULL, -- 导入文件名
  source_import_time timestamp with time zone NULL, -- 导入时间
  
  -- 来源详细信息（JSON格式，便于扩展）
  source_metadata jsonb NULL, -- 存储额外的来源信息
  
  CONSTRAINT disciplinary_record_pkey PRIMARY KEY (id),
  CONSTRAINT disciplinary_record_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES employee_list (id)
) TABLESPACE pg_default;

-- 3. 创建必要的索引
CREATE INDEX IF NOT EXISTS idx_disciplinary_record_employee_name ON public.disciplinary_record USING btree (employee_name);
CREATE INDEX IF NOT EXISTS idx_disciplinary_record_source_type ON public.disciplinary_record USING btree (source_type);
CREATE INDEX IF NOT EXISTS idx_disciplinary_record_source_table ON public.disciplinary_record USING btree (source_table);

-- 4. 添加表注释
COMMENT ON TABLE public.disciplinary_record IS '违规记录表（优化版，包含记录来源功能）';
COMMENT ON COLUMN public.disciplinary_record.id IS '主键ID';
COMMENT ON COLUMN public.disciplinary_record.employee_name IS '员工姓名';
COMMENT ON COLUMN public.disciplinary_record.reason IS '违规原因';
COMMENT ON COLUMN public.disciplinary_record.created_at IS '创建时间';
COMMENT ON COLUMN public.disciplinary_record.type IS '违规类型';
COMMENT ON COLUMN public.disciplinary_record.employee_id IS '员工ID（关联employee_list表）';
COMMENT ON COLUMN public.disciplinary_record.source_type IS '记录来源类型：manual-手动录入，import-批量导入，auto-自动生成';
COMMENT ON COLUMN public.disciplinary_record.source_table IS '原始数据表名';
COMMENT ON COLUMN public.disciplinary_record.source_record_id IS '原始记录ID';
COMMENT ON COLUMN public.disciplinary_record.source_time_range IS '数据时间范围（JSONB格式）';
COMMENT ON COLUMN public.disciplinary_record.source_batch_id IS '批量导入批次ID';
COMMENT ON COLUMN public.disciplinary_record.source_file_name IS '导入文件名';
COMMENT ON COLUMN public.disciplinary_record.source_import_time IS '导入时间';
COMMENT ON COLUMN public.disciplinary_record.source_metadata IS '来源详细信息（JSON格式）'; 