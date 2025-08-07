import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nemmkwzijaaadrzwrtyg.supabase.co'
// 使用正确的anon key
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lbW1rd3ppamFhYWRyendydHlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzOTk1MTksImV4cCI6MjA2OTk3NTUxOX0.alaL5ekLNXE1c499utZpzvhB2Ix0y9q5bLlXCHJGS-s'

export const supabase = createClient(supabaseUrl, supabaseKey)

// 测试连接函数
export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('employee_response_data').select('count').limit(1)
    
    if (error) {
      console.error('Supabase连接错误:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true, data }
  } catch (error) {
    console.error('Supabase连接异常:', error)
    return { success: false, error: error instanceof Error ? error.message : '未知错误' }
  }
} 