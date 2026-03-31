create table if not exists public.remove_bg_jobs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  clerk_user_id text not null,
  source_r2_key text not null,
  result_r2_key text not null,
  credits_spent integer not null default 1,
  status text not null default 'success' check (status in ('success', 'failed')),
  created_at timestamptz not null default now()
);

create index if not exists remove_bg_jobs_profile_created_idx
  on public.remove_bg_jobs(profile_id, created_at desc);
