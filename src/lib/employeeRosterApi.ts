import { supabase } from './supabase'

export interface EmployeeRoster {
  id: string
  employee_name: string
  employee_uid: string | null
  area: string | null
  community: string | null
  department: string | null
  position: string | null
  manager: string | null
  phone: string | null
  email: string | null
  hire_date: string | null
  hire_period: string | null
  status: string | null
  remark: string | null
  extra_data: Record<string, any>
  source_file_name: string | null
  created_at: string
  updated_at: string
}

export interface EmployeeRosterForm {
  employee_name: string
  employee_uid?: string | null
  area?: string | null
  community?: string | null
  department?: string | null
  position?: string | null
  manager?: string | null
  phone?: string | null
  email?: string | null
  hire_date?: string | null
  hire_period?: string | null
  status?: string | null
  remark?: string | null
  extra_data?: Record<string, any>
  source_file_name?: string | null
}

export class EmployeeRosterApi {
  async getAll(): Promise<EmployeeRoster[]> {
    const { data, error } = await supabase
      .from('employee_roster')
      .select('*')
      .order('employee_name', { ascending: true })

    if (error) throw new Error(`获取花名册失败: ${error.message}`)
    return (data || []) as EmployeeRoster[]
  }

  async create(payload: EmployeeRosterForm): Promise<EmployeeRoster> {
    const { data, error } = await supabase
      .from('employee_roster')
      .insert([{ ...payload }])
      .select()
      .single()

    if (error) throw new Error(`创建失败: ${error.message}`)
    return data as EmployeeRoster
  }

  async update(id: string, updates: Partial<EmployeeRosterForm>): Promise<EmployeeRoster> {
    const { data, error } = await supabase
      .from('employee_roster')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`更新失败: ${error.message}`)
    return data as EmployeeRoster
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('employee_roster')
      .delete()
      .eq('id', id)

    if (error) throw new Error(`删除失败: ${error.message}`)
  }

  async batchUpsert(records: EmployeeRosterForm[]): Promise<EmployeeRoster[]> {
    // 过滤记录，只写入非空字段
    const cleanRecords = records.map(rec => {
      const cleaned: any = {
        employee_name: rec.employee_name || '',
      }
      if (rec.employee_uid !== undefined && rec.employee_uid !== null) cleaned.employee_uid = rec.employee_uid
      if (rec.area) cleaned.area = rec.area
      if (rec.community) cleaned.community = rec.community
      if (rec.department) cleaned.department = rec.department
      if (rec.position) cleaned.position = rec.position
      if (rec.manager) cleaned.manager = rec.manager
      if (rec.phone) cleaned.phone = rec.phone
      if (rec.email) cleaned.email = rec.email
      if (rec.hire_date) cleaned.hire_date = rec.hire_date
      if (rec.hire_period) cleaned.hire_period = rec.hire_period
      if (rec.status) cleaned.status = rec.status
      if (rec.remark) cleaned.remark = rec.remark
      if (rec.source_file_name) cleaned.source_file_name = rec.source_file_name
      return cleaned
    })

    const { data, error } = await supabase
      .from('employee_roster')
      .upsert(cleanRecords, { onConflict: 'employee_uid' })
      .select()

    if (error) throw new Error(`批量写入失败: ${error.message}`)
    return (data || []) as EmployeeRoster[]
  }

  async batchDelete(ids: string[]): Promise<void> {
    const { error } = await supabase
      .from('employee_roster')
      .delete()
      .in('id', ids)

    if (error) throw new Error(`批量删除失败: ${error.message}`)
  }

  async existsByUid(employeeUid: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('employee_roster')
      .select('id')
      .eq('employee_uid', employeeUid)
      .limit(1)

    if (error) return false
    return !!(data && data.length > 0)
  }
}

export const employeeRosterApi = new EmployeeRosterApi()


