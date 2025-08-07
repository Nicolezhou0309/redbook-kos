-- 创建员工线索明细表
create table public.employee_leads_data (
  id uuid not null default gen_random_uuid (),
  employee_name text not null,
  xiaohongshu_account_id text not null,
  xiaohongshu_nickname text not null,
  account_id text not null,
  region text null,
  tags text null,
  activation_time date null,
  published_notes_count integer null default 0,
  promoted_notes_count integer null default 0,
  notes_promotion_cost numeric(10, 2) null default 0,
  total_interactions integer null default 0,
  total_form_leads integer null default 0,
  total_private_message_leads integer null default 0,
  total_private_message_openings integer null default 0,
  total_private_message_leads_kept integer null default 0,
  notes_exposure_count integer null default 0,
  notes_click_count integer null default 0,
  time_range jsonb not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint employee_leads_data_pkey primary key (id)
) TABLESPACE pg_default;

-- 创建索引
create index IF not exists idx_employee_leads_data_account_id on public.employee_leads_data using btree (account_id) TABLESPACE pg_default;
create index IF not exists idx_employee_leads_data_time_range on public.employee_leads_data using gin (time_range) TABLESPACE pg_default;
create index IF not exists idx_employee_leads_data_created_at on public.employee_leads_data using btree (created_at) TABLESPACE pg_default;
create unique INDEX IF not exists idx_employee_leads_data_unique on public.employee_leads_data using btree (account_id, (time_range->>'remark')) TABLESPACE pg_default;

-- 创建更新时间触发器
create trigger update_employee_leads_data_updated_at BEFORE
update on employee_leads_data for EACH row
execute FUNCTION update_updated_at_column (); 