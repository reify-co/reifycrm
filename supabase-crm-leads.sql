create table if not exists public.crm_leads (
  id text primary key,
  gmail_message_id text unique,
  lead jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists crm_leads_updated_at_idx
  on public.crm_leads (updated_at desc);

create index if not exists crm_leads_assigned_to_idx
  on public.crm_leads ((lead->>'assignedTo'));

create index if not exists crm_leads_status_idx
  on public.crm_leads ((lead->>'status'));

alter table public.crm_leads enable row level security;
