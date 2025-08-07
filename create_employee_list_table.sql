-- 创建员工列表表
create table public.employee_list (
  id uuid not null default gen_random_uuid (),
  employee_name text not null,
  employee_uid text not null,
  status text null,
  created_at timestamp with time zone not null default now(),
  constraint employee_pkey primary key (id)
) TABLESPACE pg_default;

-- 创建索引
create index IF not exists idx_employee_name on public.employee_list using btree (employee_name) TABLESPACE pg_default;

create index IF not exists idx_employee_uid on public.employee_list using btree (employee_uid) TABLESPACE pg_default;

create index IF not exists idx_employee_status on public.employee_list using btree (status) TABLESPACE pg_default;

-- 添加注释
comment on table public.employee_list is '员工列表表';
comment on column public.employee_list.id is '主键ID';
comment on column public.employee_list.employee_name is '员工姓名';
comment on column public.employee_list.employee_uid is '员工UID';
comment on column public.employee_list.status is '员工状态(如：正常、黄牌、红牌等)';
comment on column public.employee_list.created_at is '创建时间'; 