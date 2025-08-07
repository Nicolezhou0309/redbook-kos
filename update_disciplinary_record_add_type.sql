-- 为disciplinary_record表添加type字段
ALTER TABLE public.disciplinary_record 
ADD COLUMN IF NOT EXISTS type TEXT;

-- 更新现有记录的type字段（如果有数据的话）
UPDATE public.disciplinary_record 
SET type = CASE 
  WHEN reason LIKE '%回复率%' THEN '回复率'
  WHEN reason LIKE '%发布量%' THEN '发布量'
  ELSE '其他'
END
WHERE type IS NULL;

-- 查看表结构
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'disciplinary_record' 
ORDER BY ordinal_position;

-- 查看示例数据
SELECT * FROM public.disciplinary_record 
ORDER BY created_at DESC 
LIMIT 5; 