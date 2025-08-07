-- 创建员工操作日志表
create table public.employee_operation_log (
  id uuid not null default gen_random_uuid (),
  employee_id uuid null, -- 允许为NULL，用于已删除的员工
  operation_type text not null, -- 'create', 'update', 'delete'
  operation_description text not null,
  old_data jsonb null, -- 操作前的数据
  new_data jsonb null, -- 操作后的数据
  operator_id text null, -- 操作人ID
  operator_name text null, -- 操作人姓名
  created_at timestamp with time zone not null default now(),
  constraint employee_operation_log_pkey primary key (id)
) TABLESPACE pg_default;

-- 创建索引
create index IF not exists idx_employee_operation_log_employee_id on public.employee_operation_log using btree (employee_id) TABLESPACE pg_default;
create index IF not exists idx_employee_operation_log_operation_type on public.employee_operation_log using btree (operation_type) TABLESPACE pg_default;
create index IF not exists idx_employee_operation_log_created_at on public.employee_operation_log using btree (created_at) TABLESPACE pg_default;
create index IF not exists idx_employee_operation_log_operator_id on public.employee_operation_log using btree (operator_id) TABLESPACE pg_default;

-- 添加外键约束（删除员工时保留操作日志，但employee_id设为NULL）
alter table public.employee_operation_log 
add constraint fk_employee_operation_log_employee_id 
foreign key (employee_id) references public.employee_list(id) on delete set null;

-- 创建触发器函数，用于自动记录操作日志
create or replace function log_employee_operation()
returns trigger as $$
declare
  operation_type text;
  operation_description text;
  old_data jsonb;
  new_data jsonb;
begin
  -- 确定操作类型
  if tg_op = 'INSERT' then
    operation_type := 'create';
    operation_description := '创建员工';
    new_data := to_jsonb(new);
  elsif tg_op = 'UPDATE' then
    operation_type := 'update';
    operation_description := '更新员工信息';
    old_data := to_jsonb(old);
    new_data := to_jsonb(new);
  elsif tg_op = 'DELETE' then
    operation_type := 'delete';
    operation_description := '删除员工';
    old_data := to_jsonb(old);
  end if;

  -- 插入操作日志
  insert into public.employee_operation_log (
    employee_id,
    operation_type,
    operation_description,
    old_data,
    new_data,
    operator_id,
    operator_name
  ) values (
    case 
      when tg_op = 'DELETE' then old.id
      else new.id
    end,
    operation_type,
    operation_description,
    old_data,
    new_data,
    current_setting('app.current_user_id', true),
    current_setting('app.current_user_name', true)
  );

  return coalesce(new, old);
end;
$$ language plpgsql;

-- 创建触发器（删除操作使用BEFORE触发器）
create trigger trigger_employee_operation_log_insert_update
after insert or update on public.employee_list
for each row execute function log_employee_operation();

create trigger trigger_employee_operation_log_delete
before delete on public.employee_list
for each row execute function log_employee_operation();

-- 创建视图，方便查询员工操作历史
create or replace view employee_operation_history as
select 
  eol.id as log_id,
  eol.employee_id,
  case 
    when el.employee_name is not null then el.employee_name
    when eol.old_data is not null then eol.old_data->>'employee_name'
    else '已删除员工'
  end as employee_name,
  case 
    when el.employee_uid is not null then el.employee_uid
    when eol.old_data is not null then eol.old_data->>'employee_uid'
    else '未知UID'
  end as employee_uid,
  eol.operation_type,
  eol.operation_description,
  eol.old_data,
  eol.new_data,
  eol.operator_id,
  eol.operator_name,
  eol.created_at
from public.employee_operation_log eol
left join public.employee_list el on eol.employee_id = el.id
order by eol.created_at desc;

-- 创建函数，用于手动记录操作日志
create or replace function manual_log_employee_operation(
  p_employee_id uuid,
  p_operation_type text,
  p_operation_description text,
  p_old_data jsonb default null,
  p_new_data jsonb default null,
  p_operator_id text default null,
  p_operator_name text default null
)
returns uuid as $$
declare
  log_id uuid;
begin
  insert into public.employee_operation_log (
    employee_id,
    operation_type,
    operation_description,
    old_data,
    new_data,
    operator_id,
    operator_name
  ) values (
    p_employee_id,
    p_operation_type,
    p_operation_description,
    p_old_data,
    p_new_data,
    p_operator_id,
    p_operator_name
  ) returning id into log_id;
  
  return log_id;
end;
$$ language plpgsql; 