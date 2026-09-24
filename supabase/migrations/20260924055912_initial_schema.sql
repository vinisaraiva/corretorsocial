-- Corretor Social — schema inicial
-- Preparado para Supabase/PostgreSQL.
-- Não contém secrets.

create extension if not exists pgcrypto;

create type public.property_status as enum ('active', 'paused', 'sold', 'rented', 'archived');
create type public.campaign_status as enum ('draft', 'generating', 'ready', 'scheduled', 'publishing', 'published', 'failed');
create type public.publication_status as enum ('queued', 'processing', 'published', 'failed', 'cancelled');
create type public.job_status as enum ('queued', 'processing', 'completed', 'failed', 'retrying', 'cancelled');
create type public.social_provider as enum ('instagram', 'facebook', 'tiktok', 'google_business');

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  professional_name text,
  agency_name text,
  creci text,
  whatsapp text,
  phone text,
  website text,
  email text,
  city text,
  service_regions text[] not null default '{}',
  logo_path text,
  primary_color text not null default '#176B5B',
  secondary_color text not null default '#18202A',
  communication_tone text not null default 'professional',
  review_before_publish boolean not null default true,
  default_cta text not null default 'Fale comigo no WhatsApp',
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.social_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider public.social_provider not null,
  external_account_id text,
  display_name text,
  status text not null default 'disconnected',
  token_secret_ref text,
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, provider, external_account_id)
);

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_url text,
  source_domain text,
  external_source_id text,
  purpose text not null default 'sale',
  property_type text,
  title text not null,
  price numeric(14,2),
  condo_fee numeric(12,2),
  iptu numeric(12,2),
  neighborhood text,
  city text,
  state text,
  public_location text,
  exact_location_private boolean not null default true,
  bedrooms integer,
  suites integer,
  bathrooms integer,
  parking integer,
  area_m2 numeric(10,2),
  description text,
  highlights text[] not null default '{}',
  status public.property_status not null default 'active',
  imported_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index properties_user_id_idx on public.properties(user_id);
create index properties_status_idx on public.properties(user_id, status);
create index properties_source_url_idx on public.properties(user_id, source_url);

create table public.property_media (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  original_url text,
  storage_path text,
  media_type text not null default 'image',
  width integer,
  height integer,
  sort_order integer not null default 0,
  ai_score numeric(5,2),
  ai_tags text[] not null default '{}',
  is_cover boolean not null default false,
  created_at timestamptz not null default now()
);

create index property_media_property_idx on public.property_media(property_id, sort_order);

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  visual_style text not null default 'essential',
  marketing_angle text,
  status public.campaign_status not null default 'draft',
  ai_model text,
  generation_metadata jsonb not null default '{}'::jsonb,
  scheduled_for timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index campaigns_user_idx on public.campaigns(user_id, created_at desc);
create index campaigns_property_idx on public.campaigns(property_id);

create table public.campaign_variants (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  provider public.social_provider not null,
  format text not null,
  headline text,
  caption text,
  hashtags text[] not null default '{}',
  cta text,
  rendered_asset_path text,
  render_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(campaign_id, provider, format)
);

create index campaign_variants_campaign_idx on public.campaign_variants(campaign_id);

create table public.publications (
  id uuid primary key default gen_random_uuid(),
  campaign_variant_id uuid not null references public.campaign_variants(id) on delete cascade,
  social_connection_id uuid references public.social_connections(id) on delete set null,
  idempotency_key text not null unique,
  scheduled_for timestamptz,
  status public.publication_status not null default 'queued',
  external_post_id text,
  external_url text,
  published_at timestamptz,
  last_error text,
  retry_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index publications_status_idx on public.publications(status, scheduled_for);

create table public.tracking_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  property_id uuid references public.properties(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete cascade,
  provider public.social_provider,
  short_code text not null unique,
  destination_url text not null,
  clicks integer not null default 0,
  created_at timestamptz not null default now()
);

create index tracking_links_user_idx on public.tracking_links(user_id);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  status public.job_status not null default 'queued',
  priority integer not null default 100,
  payload jsonb not null default '{}'::jsonb,
  result jsonb,
  attempts integer not null default 0,
  max_attempts integer not null default 3,
  run_after timestamptz not null default now(),
  locked_at timestamptz,
  locked_by text,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index jobs_queue_idx on public.jobs(status, priority, run_after);

create table public.ai_credit_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null,
  reason text not null,
  reference_type text,
  reference_id uuid,
  created_at timestamptz not null default now()
);

create index ai_credit_ledger_user_idx on public.ai_credit_ledger(user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger social_connections_set_updated_at
before update on public.social_connections
for each row execute function public.set_updated_at();

create trigger properties_set_updated_at
before update on public.properties
for each row execute function public.set_updated_at();

create trigger campaigns_set_updated_at
before update on public.campaigns
for each row execute function public.set_updated_at();

create trigger campaign_variants_set_updated_at
before update on public.campaign_variants
for each row execute function public.set_updated_at();

create trigger publications_set_updated_at
before update on public.publications
for each row execute function public.set_updated_at();

create trigger jobs_set_updated_at
before update on public.jobs
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, email)
  values (new.id, new.email)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.social_connections enable row level security;
alter table public.properties enable row level security;
alter table public.property_media enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_variants enable row level security;
alter table public.publications enable row level security;
alter table public.tracking_links enable row level security;
alter table public.jobs enable row level security;
alter table public.ai_credit_ledger enable row level security;

create policy "profiles_select_own"
on public.profiles for select
using (auth.uid() = user_id);

create policy "profiles_update_own"
on public.profiles for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "connections_select_own"
on public.social_connections for select
using (auth.uid() = user_id);

create policy "connections_insert_own"
on public.social_connections for insert
with check (auth.uid() = user_id);

create policy "connections_update_own"
on public.social_connections for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "connections_delete_own"
on public.social_connections for delete
using (auth.uid() = user_id);

create policy "properties_select_own"
on public.properties for select
using (auth.uid() = user_id);

create policy "properties_insert_own"
on public.properties for insert
with check (auth.uid() = user_id);

create policy "properties_update_own"
on public.properties for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "properties_delete_own"
on public.properties for delete
using (auth.uid() = user_id);

create policy "property_media_select_own"
on public.property_media for select
using (
  exists (
    select 1
    from public.properties p
    where p.id = property_media.property_id
      and p.user_id = auth.uid()
  )
);

create policy "property_media_insert_own"
on public.property_media for insert
with check (
  exists (
    select 1
    from public.properties p
    where p.id = property_media.property_id
      and p.user_id = auth.uid()
  )
);

create policy "property_media_update_own"
on public.property_media for update
using (
  exists (
    select 1
    from public.properties p
    where p.id = property_media.property_id
      and p.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.properties p
    where p.id = property_media.property_id
      and p.user_id = auth.uid()
  )
);

create policy "property_media_delete_own"
on public.property_media for delete
using (
  exists (
    select 1
    from public.properties p
    where p.id = property_media.property_id
      and p.user_id = auth.uid()
  )
);

create policy "campaigns_select_own"
on public.campaigns for select
using (auth.uid() = user_id);

create policy "campaigns_insert_own"
on public.campaigns for insert
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.properties p
    where p.id = campaigns.property_id
      and p.user_id = auth.uid()
  )
);

create policy "campaigns_update_own"
on public.campaigns for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "campaigns_delete_own"
on public.campaigns for delete
using (auth.uid() = user_id);

create policy "campaign_variants_select_own"
on public.campaign_variants for select
using (
  exists (
    select 1
    from public.campaigns c
    where c.id = campaign_variants.campaign_id
      and c.user_id = auth.uid()
  )
);

create policy "campaign_variants_write_own"
on public.campaign_variants for all
using (
  exists (
    select 1
    from public.campaigns c
    where c.id = campaign_variants.campaign_id
      and c.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.campaigns c
    where c.id = campaign_variants.campaign_id
      and c.user_id = auth.uid()
  )
);

create policy "publications_select_own"
on public.publications for select
using (
  exists (
    select 1
    from public.campaign_variants v
    join public.campaigns c on c.id = v.campaign_id
    where v.id = publications.campaign_variant_id
      and c.user_id = auth.uid()
  )
);

create policy "tracking_links_select_own"
on public.tracking_links for select
using (auth.uid() = user_id);

create policy "tracking_links_insert_own"
on public.tracking_links for insert
with check (auth.uid() = user_id);

create policy "jobs_select_own"
on public.jobs for select
using (auth.uid() = user_id);

create policy "jobs_insert_own"
on public.jobs for insert
with check (auth.uid() = user_id);

create policy "ai_credit_ledger_select_own"
on public.ai_credit_ledger for select
using (auth.uid() = user_id);
