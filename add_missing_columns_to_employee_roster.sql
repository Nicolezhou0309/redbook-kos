-- 检查并添加缺失的列到 employee_roster 表
-- 注意：不重置数据库，只添加缺失的列

-- 添加 position 列（如果不存在）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'employee_roster' 
    AND column_name = 'position'
  ) THEN
    ALTER TABLE public.employee_roster ADD COLUMN position text null;
    RAISE NOTICE '已添加 position 列';
  ELSE
    RAISE NOTICE 'position 列已存在';
  END IF;
END $$;

-- 添加 hire_period 列（如果不存在）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'employee_roster' 
    AND column_name = 'hire_period'
  ) THEN
    ALTER TABLE public.employee_roster ADD COLUMN hire_period text null;
    RAISE NOTICE '已添加 hire_period 列';
  ELSE
    RAISE NOTICE 'hire_period 列已存在';
  END IF;
END $$;

-- 添加其他可能缺失的列
DO $$
BEGIN
  -- 检查 area
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'employee_roster' 
    AND column_name = 'area'
  ) THEN
    ALTER TABLE public.employee_roster ADD COLUMN area text null;
    CREATE INDEX IF NOT EXISTS idx_employee_roster_area ON public.employee_roster USING btree (area);
  END IF;

  -- 检查 community
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'employee_roster' 
    AND column_name = 'community'
  ) THEN
    ALTER TABLE public.employee_roster ADD COLUMN community text null;
    CREATE INDEX IF NOT EXISTS idx_employee_roster_community ON public.employee_roster USING btree (community);
  END IF;

  -- 检查 manager
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'employee_roster' 
    AND column_name = 'manager'
  ) THEN
    ALTER TABLE public.employee_roster ADD COLUMN manager text null;
    CREATE INDEX IF NOT EXISTS idx_employee_roster_manager ON public.employee_roster USING btree (manager);
  END IF;
END $$;

-- 更新注释
COMMENT ON COLUMN public.employee_roster.position IS '岗位/职务';
COMMENT ON COLUMN public.employee_roster.hire_period IS '入职周期（导入为文本）';
COMMENT ON COLUMN public.employee_roster.area IS '片区';
COMMENT ON COLUMN public.employee_roster.community IS '社区';
COMMENT ON COLUMN public.employee_roster.manager IS '直线经理';

