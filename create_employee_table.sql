-- 创建员工号回复数据表
CREATE TABLE IF NOT EXISTS employee_response_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_name TEXT NOT NULL,
  employee_uid TEXT NOT NULL,
  score_15s_response DECIMAL(5,2) DEFAULT 0,
  score_30s_response DECIMAL(5,2) DEFAULT 0,
  score_1min_response DECIMAL(5,2) DEFAULT 0,
  score_1hour_timeout DECIMAL(5,2) DEFAULT 0,
  score_avg_response_time DECIMAL(5,2) DEFAULT 0,
  rate_15s_response TEXT DEFAULT '0%',
  rate_30s_response TEXT DEFAULT '0%',
  rate_1min_response TEXT DEFAULT '0%',
  rate_1hour_timeout TEXT DEFAULT '0%',
  avg_response_time DECIMAL(10,2) DEFAULT 0,
  user_rating_score DECIMAL(5,2) DEFAULT 0,
  time_range TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_employee_response_data_uid ON employee_response_data(employee_uid);
CREATE INDEX IF NOT EXISTS idx_employee_response_data_time_range ON employee_response_data(time_range);
CREATE INDEX IF NOT EXISTS idx_employee_response_data_created_at ON employee_response_data(created_at);

-- 创建唯一约束防止重复数据
CREATE UNIQUE INDEX IF NOT EXISTS idx_employee_response_data_unique 
ON employee_response_data(employee_uid, time_range);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_employee_response_data_updated_at 
    BEFORE UPDATE ON employee_response_data 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 