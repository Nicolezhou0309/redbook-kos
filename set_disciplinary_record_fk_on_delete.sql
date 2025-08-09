-- 修复 disciplinary_record -> employee_list 外键的删除行为
-- 目标：当删除 employee_list 中的员工时，自动处理 disciplinary_record.employee_id 引用
-- 推荐策略：ON DELETE SET NULL（保留违规历史数据，只断开员工引用）

BEGIN;

-- 1) 确保引用列允许为空（若已允许为空，此语句无副作用）
ALTER TABLE public.disciplinary_record
  ALTER COLUMN employee_id DROP NOT NULL;

-- 2) 删除现有外键约束（若不存在会忽略）
ALTER TABLE public.disciplinary_record
  DROP CONSTRAINT IF EXISTS disciplinary_record_employee_id_fkey;

-- 3) 重新创建外键，设置 ON DELETE SET NULL
ALTER TABLE public.disciplinary_record
  ADD CONSTRAINT disciplinary_record_employee_id_fkey
  FOREIGN KEY (employee_id)
  REFERENCES public.employee_list (id)
  ON DELETE SET NULL;

COMMIT;

-- 验证：查看当前外键的删除策略应为 SET NULL
-- SELECT rc.constraint_name, rc.delete_rule
-- FROM information_schema.referential_constraints rc
-- WHERE rc.constraint_name = 'disciplinary_record_employee_id_fkey';

-- 可选方案（如需联动删除违规记录，而非保留历史）：使用 ON DELETE CASCADE
-- 注意：此方案会在删除员工时同时删除其所有违规记录，请谨慎使用。
-- BEGIN;
-- ALTER TABLE public.disciplinary_record DROP CONSTRAINT IF EXISTS disciplinary_record_employee_id_fkey;
-- ALTER TABLE public.disciplinary_record
--   ADD CONSTRAINT disciplinary_record_employee_id_fkey
--   FOREIGN KEY (employee_id)
--   REFERENCES public.employee_list (id)
--   ON DELETE CASCADE;
-- COMMIT;


