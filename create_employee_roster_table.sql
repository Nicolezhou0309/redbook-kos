-- 人员花名册表（Employee Roster）
-- 注意：不重置数据库，仅新增表

create table if not exists public.employee_roster (
  id uuid primary key default gen_random_uuid(),
  employee_name text not null,
  employee_uid text null,
  area text null, -- 片区
  community text null, -- 社区
  department text null,
  position text null,
  manager text null, -- 直线经理
  phone text null,
  email text null,
  hire_date date null,
  hire_period text null, -- 入职周期
  status text null,
  remark text null,
  extra_data jsonb not null default '{}',
  source_file_name text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 唯一约束：PostgreSQL 的 UNIQUE 允许多条 NULL，因此可直接使用完整唯一索引
-- 这样可支持 ON CONFLICT (employee_uid)
drop index if exists ux_employee_roster_uid_not_null;
create unique index if not exists ux_employee_roster_uid on public.employee_roster (employee_uid);

-- 常用索引
create index if not exists idx_employee_roster_name on public.employee_roster using btree (employee_name);
create index if not exists idx_employee_roster_status on public.employee_roster using btree (status);
create index if not exists idx_employee_roster_department on public.employee_roster using btree (department);
create index if not exists idx_employee_roster_area on public.employee_roster using btree (area);
create index if not exists idx_employee_roster_community on public.employee_roster using btree (community);
create index if not exists idx_employee_roster_manager on public.employee_roster using btree (manager);

-- 更新时间触发器
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_employee_roster_updated_at on public.employee_roster;
create trigger trg_employee_roster_updated_at
before update on public.employee_roster
for each row execute function public.set_updated_at();

comment on table public.employee_roster is '人员花名册';
comment on column public.employee_roster.employee_name is '姓名（必填）';
comment on column public.employee_roster.employee_uid is '员工UID（可选，若有则唯一）';
comment on column public.employee_roster.area is '片区';
comment on column public.employee_roster.community is '社区';
comment on column public.employee_roster.department is '部门';
comment on column public.employee_roster.position is '岗位/职务';
comment on column public.employee_roster.manager is '直线经理';
comment on column public.employee_roster.phone is '电话';
comment on column public.employee_roster.email is '邮箱';
comment on column public.employee_roster.hire_date is '入职日期';
comment on column public.employee_roster.hire_period is '入职周期（导入为文本）';
comment on column public.employee_roster.status is '在职状态（在职/离职/试用等）';
comment on column public.employee_roster.remark is '备注';
comment on column public.employee_roster.extra_data is '额外字段（保底保存Excel未映射列）';
comment on column public.employee_roster.source_file_name is '来源文件名';

