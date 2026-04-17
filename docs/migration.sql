-- ============================================================
-- FOLIA — Full Database Migration
-- Run order is critical — do NOT reorder
-- ============================================================

-- ─── 1. Helper: get Clerk user ID from JWT ───────────────────
create or replace function requesting_user_id()
returns text as $$
  select nullif(current_setting('request.jwt.claims', true)::json->>'sub', '')::text;
$$ language sql stable;

-- ─── 2. updated_at trigger function ─────────────────────────
create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ─── 3. profiles ─────────────────────────────────────────────
create table if not exists public.profiles (
  id                      uuid primary key default gen_random_uuid(),
  clerk_user_id           text not null unique,
  email                   text not null,
  full_name               text,
  avatar_url              text,
  tier                    text not null default 'none'
                            check (tier in ('none', 'starter', 'pro', 'business')),
  subscription_status     text not null default 'inactive'
                            check (subscription_status in (
                              'active', 'past_due', 'canceled', 'inactive'
                            )),
  subscription_period_end timestamptz,
  mayar_customer_id       text,
  polar_customer_id       text,
  payment_provider        text check (payment_provider in ('mayar', 'polar')),
  credits                 integer not null default 0,
  referred_by_code        text,
  public_gallery_default  boolean not null default false,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (clerk_user_id = requesting_user_id());

create policy "Users can update own profile"
  on public.profiles for update
  using (clerk_user_id = requesting_user_id());

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function handle_updated_at();

-- ─── 4. generations ──────────────────────────────────────────
create table if not exists public.generations (
  id                      uuid primary key default gen_random_uuid(),
  profile_id              uuid not null references public.profiles(id) on delete cascade,
  clerk_user_id           text not null,
  type                    text not null check (type in ('element', 'mockup')),
  style                   text check (style in (
                            'watercolor', 'line_art', 'cartoon', 'boho', 'minimalist'
                          )),
  prompt_raw              text,
  prompt_enhanced         text,
  reference_image_r2_key  text,
  invitation_r2_key       text,
  scene_preset            text,
  custom_scene_prompt     text,
  result_r2_keys          text[] not null,
  result_count            integer not null default 1,
  model_used              text not null,
  gemini_used             boolean not null default true,
  generation_time_ms      integer,
  resolution              integer not null default 1024,
  is_public               boolean not null default false,
  public_approved         boolean not null default true,
  credits_spent           integer not null default 1,
  created_at              timestamptz not null default now()
);

alter table public.generations enable row level security;

create policy "Users can read own generations"
  on public.generations for select
  using (clerk_user_id = requesting_user_id());

create policy "Anyone can read public generations"
  on public.generations for select
  using (is_public = true and public_approved = true);

create policy "Users can insert own generations"
  on public.generations for insert
  with check (clerk_user_id = requesting_user_id());

create policy "Users can update own generations"
  on public.generations for update
  using (clerk_user_id = requesting_user_id());

create index if not exists generations_profile_type_idx
  on public.generations(profile_id, type, created_at desc);

create index if not exists generations_profile_style_idx
  on public.generations(profile_id, style, created_at desc);

create index if not exists generations_public_idx
  on public.generations(is_public, public_approved, created_at desc)
  where is_public = true and public_approved = true;

-- ─── 5. generation_counter ───────────────────────────────────
create table if not exists public.generation_counter (
  id          integer primary key default 1,
  total_count bigint not null default 0
);

alter table public.generation_counter enable row level security;

create policy "Anyone can read counter"
  on public.generation_counter for select using (true);

insert into public.generation_counter (id, total_count)
values (1, 0)
on conflict (id) do nothing;

create or replace function increment_generation_counter()
returns trigger as $$
begin
  update public.generation_counter
  set total_count = total_count + new.result_count
  where id = 1;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_generation_created
  after insert on public.generations
  for each row execute function increment_generation_counter();

-- ─── 6. purchases ────────────────────────────────────────────
create table if not exists public.purchases (
  id                uuid primary key default gen_random_uuid(),
  profile_id        uuid not null references public.profiles(id) on delete cascade,
  clerk_user_id     text not null,
  plan              text not null check (plan in ('starter', 'pro', 'business', 'topup')),
  credits_added     integer not null,
  amount_idr        integer,
  amount_usd        numeric(10,2),
  currency          text not null check (currency in ('IDR', 'USD')),
  payment_provider  text not null check (payment_provider in ('mayar', 'polar')),
  payment_id        text not null,
  payment_status    text not null default 'pending'
                      check (payment_status in ('pending', 'success', 'failed', 'refunded')),
  is_subscription   boolean not null default false,
  subscription_id   text,
  referred_by_code  text,
  created_at        timestamptz not null default now()
);

alter table public.purchases enable row level security;

create policy "Users can read own purchases"
  on public.purchases for select
  using (clerk_user_id = requesting_user_id());

-- ─── 7. affiliates ───────────────────────────────────────────
create table if not exists public.affiliates (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid not null unique references public.profiles(id) on delete cascade,
  clerk_user_id text not null unique,
  code          text not null unique,
  clicks        integer not null default 0,
  conversions   integer not null default 0,
  credits_earned integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.affiliates enable row level security;

create policy "Users can read own affiliate"
  on public.affiliates for select
  using (clerk_user_id = requesting_user_id());

create trigger affiliates_updated_at
  before update on public.affiliates
  for each row execute function handle_updated_at();

-- ─── 8. affiliate_referrals ──────────────────────────────────
create table if not exists public.affiliate_referrals (
  id                    uuid primary key default gen_random_uuid(),
  affiliate_id          uuid not null references public.affiliates(id) on delete cascade,
  referred_profile_id   uuid references public.profiles(id) on delete set null,
  plan                  text not null,
  credits_awarded       integer not null,
  status                text not null default 'awarded'
                          check (status in ('awarded', 'reversed')),
  created_at            timestamptz not null default now()
);

-- ─── 9. payment_events (idempotency) ────────────────────────
create table if not exists public.payment_events (
  id           text primary key,
  provider     text not null check (provider in ('mayar', 'polar')),
  type         text not null,
  processed_at timestamptz not null default now()
);
-- No RLS — service role only

