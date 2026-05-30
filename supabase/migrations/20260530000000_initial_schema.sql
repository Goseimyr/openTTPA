create extension if not exists pgcrypto;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  org_number text,
  website text,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  slug text not null unique,
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  language text not null default 'sv',
  name text not null,
  sponsor_name text not null,
  sponsor_contact text not null,
  controlling_entity text,
  publisher_name text,
  publisher_contact text,
  period_start date not null,
  period_end date not null,
  amount_message numeric(14, 2),
  amount_campaign numeric(14, 2),
  funds_origin text not null,
  calculation_method text not null,
  linked_process text,
  targeting_used boolean not null default false,
  targeting_description text,
  delivery_description text,
  consent_withdrawal_url text,
  complaint_contact text not null,
  complaint_url text,
  ad_channels text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.campaign_versions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  snapshot jsonb not null,
  changed_at timestamptz not null default now(),
  changed_by uuid references auth.users(id)
);

create table if not exists public.transparency_views (
  id bigint generated always as identity primary key,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  slug text not null,
  viewed_at timestamptz not null default now(),
  user_agent text,
  referer text
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.snapshot_campaign_version()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.campaign_versions (campaign_id, snapshot, changed_by)
  values (old.id, to_jsonb(old), auth.uid());
  return new;
end;
$$;

drop trigger if exists campaigns_touch_updated_at on public.campaigns;
create trigger campaigns_touch_updated_at
before update on public.campaigns
for each row execute function public.touch_updated_at();

drop trigger if exists campaigns_snapshot_version on public.campaigns;
create trigger campaigns_snapshot_version
before update on public.campaigns
for each row execute function public.snapshot_campaign_version();

create or replace view public.campaign_view_counts as
select campaign_id, count(*)::int as views
from public.transparency_views
group by campaign_id;

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_versions enable row level security;
alter table public.transparency_views enable row level security;

drop policy if exists "members can read organizations" on public.organizations;
create policy "members can read organizations"
on public.organizations for select
using (
  exists (
    select 1 from public.organization_members m
    where m.organization_id = id and m.user_id = auth.uid()
  )
);

drop policy if exists "authenticated users can create organizations" on public.organizations;
create policy "authenticated users can create organizations"
on public.organizations for insert
with check (created_by = auth.uid());

drop policy if exists "owners can update organizations" on public.organizations;
create policy "owners can update organizations"
on public.organizations for update
using (
  exists (
    select 1 from public.organization_members m
    where m.organization_id = id and m.user_id = auth.uid() and m.role in ('owner', 'admin')
  )
);

drop policy if exists "members can read memberships" on public.organization_members;
create policy "members can read memberships"
on public.organization_members for select
using (user_id = auth.uid() or exists (
  select 1 from public.organization_members m
  where m.organization_id = organization_id and m.user_id = auth.uid()
));

drop policy if exists "users can create own membership" on public.organization_members;
create policy "users can create own membership"
on public.organization_members for insert
with check (user_id = auth.uid());

drop policy if exists "members can manage campaigns" on public.campaigns;
create policy "members can manage campaigns"
on public.campaigns for all
using (
  exists (
    select 1 from public.organization_members m
    where m.organization_id = organization_id and m.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.organization_members m
    where m.organization_id = organization_id and m.user_id = auth.uid()
  )
);

drop policy if exists "public can read published campaigns" on public.campaigns;
create policy "public can read published campaigns"
on public.campaigns for select
using (status in ('active', 'archived'));

drop policy if exists "members can read campaign versions" on public.campaign_versions;
create policy "members can read campaign versions"
on public.campaign_versions for select
using (
  exists (
    select 1
    from public.campaigns c
    join public.organization_members m on m.organization_id = c.organization_id
    where c.id = campaign_id and m.user_id = auth.uid()
  )
);

drop policy if exists "members can read views" on public.transparency_views;
create policy "members can read views"
on public.transparency_views for select
using (
  exists (
    select 1
    from public.campaigns c
    join public.organization_members m on m.organization_id = c.organization_id
    where c.id = campaign_id and m.user_id = auth.uid()
  )
);
