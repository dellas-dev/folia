# Database Schema — Folia (Final v3)

> Supabase (PostgreSQL)
> Auth: Clerk (NOT Supabase Auth)
> Storage: Cloudflare R2 (NOT Supabase Storage)

---

## Important: Clerk + Supabase Integration

Since we use Clerk for auth (not Supabase Auth), our `profiles` table uses `clerk_user_id` (string) instead of Supabase `auth.users` UUID.

---

## Tables

### `profiles`
Created automatically via Clerk webhook on user signup.

```sql
create table public.profiles (
  id                    uuid primary key default gen_random_uuid(),
  clerk_user_id         text not null unique,        -- Clerk user ID (e.g. user_xxx)
  email                 text not null,
  full_name             text,
  avatar_url            text,

  -- Tier & subscription
  tier                  text not null default 'none'
                          check (tier in ('none', 'starter', 'pro', 'business')),
  -- 'none' = has never purchased anything

  -- Subscription fields (Pro / Business monthly)
  subscription_status   text not null default 'inactive'
                          check (subscription_status in (
                            'active', 'past_due', 'canceled', 'inactive'
                          )),
  subscription_period_end timestamptz,

  -- Payment provider tracking
  mayar_customer_id     text,
  polar_customer_id     text,
  payment_provider      text check (payment_provider in ('mayar', 'polar')),

  -- Credits
  credits               integer not null default 0,
  -- No credits_limit field — limit comes from PLANS config, not DB

  -- Referral
  referred_by_code      text,

  -- Community gallery opt-in default
  public_gallery_default boolean not null default false,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- RLS
alter table public.profiles enable row level security;

-- Note: with Clerk, we use a custom JWT claim to identify users
-- Set up Supabase JWT template in Clerk dashboard
create policy "Users can read own profile"
  on public.profiles for select
  using (clerk_user_id = requesting_user_id());  -- custom function below

create policy "Users can update own profile"
  on public.profiles for update
  using (clerk_user_id = requesting_user_id());
```

```sql
-- Helper function to get clerk_user_id from JWT
create or replace function requesting_user_id()
returns text as $$
  select nullif(current_setting('request.jwt.claims', true)::json->>'sub', '')::text;
$$ language sql stable;
```

---

### `generations`
Every AI generation logged here. Stores R2 paths (not Supabase Storage).

```sql
create table public.generations (
  id                    uuid primary key default gen_random_uuid(),
  profile_id            uuid not null references public.profiles(id) on delete cascade,
  clerk_user_id         text not null,              -- denormalized for easy queries

  -- Type
  type                  text not null check (type in ('element', 'mockup')),

  -- Element fields
  style                 text check (style in (
                          'watercolor', 'line_art', 'cartoon', 'boho', 'minimalist'
                        )),
  prompt_raw            text,                       -- exactly what user typed
  prompt_enhanced       text,                       -- what Gemini produced
  reference_image_r2_key text,                      -- R2 key of reference image (nullable)

  -- Mockup fields
  invitation_r2_key     text,                       -- R2 key of uploaded invitation
  scene_preset          text,
  custom_scene_prompt   text,

  -- Output (Cloudflare R2)
  result_r2_keys        text[] not null,            -- array of R2 keys
  result_count          integer not null default 1,

  -- AI info
  model_used            text not null,              -- 'fal-ai/flux-pro' or 'fal-ai/flux/dev'
  gemini_used           boolean not null default true,
  generation_time_ms    integer,

  -- Resolution
  resolution            integer not null default 1024, -- 1024 or 2048

  -- Community gallery
  is_public             boolean not null default false,
  public_approved       boolean not null default true, -- for moderation later

  -- Credits spent
  credits_spent         integer not null default 1,

  created_at            timestamptz not null default now()
);

-- RLS
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

-- Indexes
create index generations_profile_type_idx
  on public.generations(profile_id, type, created_at desc);

create index generations_profile_style_idx
  on public.generations(profile_id, style, created_at desc);

create index generations_public_idx
  on public.generations(is_public, public_approved, created_at desc)
  where is_public = true and public_approved = true;
```

---

### `purchases`
Tracks every payment (one-time or subscription).

```sql
create table public.purchases (
  id                    uuid primary key default gen_random_uuid(),
  profile_id            uuid not null references public.profiles(id) on delete cascade,
  clerk_user_id         text not null,

  -- What they bought
  plan                  text not null check (plan in ('starter', 'pro', 'business', 'topup')),
  credits_added         integer not null,

  -- Payment
  amount_idr            integer,                    -- null if paid in USD
  amount_usd            numeric(10,2),              -- null if paid in IDR
  currency              text not null check (currency in ('IDR', 'USD')),
  payment_provider      text not null check (payment_provider in ('mayar', 'polar')),
  payment_id            text not null,              -- Mayar/Polar transaction ID
  payment_status        text not null default 'pending'
                          check (payment_status in ('pending', 'success', 'failed', 'refunded')),

  -- Subscription (for Pro/Business)
  is_subscription       boolean not null default false,
  subscription_id       text,                       -- Mayar/Polar subscription ID

  -- Referral
  referred_by_code      text,

  created_at            timestamptz not null default now()
);

-- RLS
alter table public.purchases enable row level security;

create policy "Users can read own purchases"
  on public.purchases for select
  using (clerk_user_id = requesting_user_id());
```

---

### `affiliates`
One row per user who has activated the affiliate program.

```sql
create table public.affiliates (
  id                    uuid primary key default gen_random_uuid(),
  profile_id            uuid not null unique references public.profiles(id) on delete cascade,
  clerk_user_id         text not null unique,

  code                  text not null unique,       -- e.g. 'abc123'

  -- Stats
  clicks                integer not null default 0,
  conversions           integer not null default 0,
  credits_earned        integer not null default 0,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- RLS
alter table public.affiliates enable row level security;

create policy "Users can read own affiliate"
  on public.affiliates for select
  using (clerk_user_id = requesting_user_id());
```

---

### `affiliate_referrals`

```sql
create table public.affiliate_referrals (
  id                    uuid primary key default gen_random_uuid(),
  affiliate_id          uuid not null references public.affiliates(id) on delete cascade,
  referred_profile_id   uuid references public.profiles(id) on delete set null,

  plan                  text not null,
  credits_awarded       integer not null,           -- credits given to affiliate
  status                text not null default 'awarded'
                          check (status in ('awarded', 'reversed')),

  created_at            timestamptz not null default now()
);
```

```sql
create or replace function public.award_affiliate_referral(
  referred_by_code_input text,
  referred_profile_id_input uuid,
  plan_input text,
  credits_awarded_input integer
)
returns boolean as $$
declare
  affiliate_row public.affiliates%rowtype;
begin
  if coalesce(trim(referred_by_code_input), '') = '' or credits_awarded_input <= 0 then
    return false;
  end if;

  select *
  into affiliate_row
  from public.affiliates
  where code = upper(trim(referred_by_code_input));

  if not found or affiliate_row.profile_id = referred_profile_id_input then
    return false;
  end if;

  update public.profiles
  set credits = credits + credits_awarded_input
  where id = affiliate_row.profile_id;

  update public.affiliates
  set conversions = conversions + 1,
      credits_earned = credits_earned + credits_awarded_input
  where id = affiliate_row.id;

  insert into public.affiliate_referrals (
    affiliate_id,
    referred_profile_id,
    plan,
    credits_awarded,
    status
  ) values (
    affiliate_row.id,
    referred_profile_id_input,
    plan_input,
    credits_awarded_input,
    'awarded'
  );

  return true;
end;
$$ language plpgsql;
```

---

### `payment_events`
Idempotency — prevent duplicate webhook processing.

```sql
create table public.payment_events (
  id                    text primary key,           -- Mayar/Polar event ID
  provider              text not null check (provider in ('mayar', 'polar')),
  type                  text not null,
  processed_at          timestamptz not null default now()
);
-- No RLS — server-side service role only
```

---

### `generation_counter` (for real-time public counter)

```sql
create table public.generation_counter (
  id                    integer primary key default 1,
  total_count           bigint not null default 0
);

-- Insert initial row
insert into public.generation_counter (id, total_count) values (1, 0);

-- No RLS — publicly readable
create policy "Anyone can read counter"
  on public.generation_counter for select using (true);
```

```sql
-- Trigger to increment counter on every generation
create or replace function increment_generation_counter()
returns trigger as $$
begin
  update public.generation_counter
  set total_count = total_count + new.result_count
  where id = 1;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_generation_created
  after insert on public.generations
  for each row execute function increment_generation_counter();
```

---

## Triggers

### Auto-update `updated_at`
```sql
create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function handle_updated_at();

create trigger affiliates_updated_at
  before update on public.affiliates
  for each row execute function handle_updated_at();
```

---

## Cloudflare R2 Bucket Structure

```
folia-storage/                        # Single R2 bucket
├── uploads/
│   └── {clerk_user_id}/
│       └── {timestamp}-{filename}    # Reference images & invitation uploads
└── generations/
    └── {clerk_user_id}/
        └── {generation_id}-{index}.png  # Generated clipart output
```

---

## Credits Logic

```typescript
// Server-side: add credits after payment
await supabase
  .from('profiles')
  .update({ credits: profile.credits + plan.credits })
  .eq('clerk_user_id', clerkUserId)

// Server-side: check and deduct before generation
if (profile.credits < num_variations) {
  return Response.json(
    { error: 'Not enough credits. Please top up or subscribe.' },
    { status: 403 }
  )
}

await supabase
  .from('profiles')
  .update({ credits: profile.credits - num_variations })
  .eq('clerk_user_id', clerkUserId)
```

---

## Migration Run Order

1. `requesting_user_id()` function
2. `profiles` table + RLS + `handle_updated_at` trigger
3. `generations` table + RLS + indexes + `increment_generation_counter` trigger
4. `generation_counter` table + initial row
5. `purchases` table + RLS
6. `affiliates` table + RLS
7. `affiliate_referrals` table
8. `payment_events` table
