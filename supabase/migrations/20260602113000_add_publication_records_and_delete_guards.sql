alter table public.campaigns
  add column if not exists published_snapshot jsonb;

alter table public.campaigns
  drop constraint if exists campaigns_organization_id_fkey,
  add constraint campaigns_organization_id_fkey
    foreign key (organization_id) references public.organizations(id) on delete restrict;

alter table public.campaign_versions
  drop constraint if exists campaign_versions_campaign_id_fkey,
  add constraint campaign_versions_campaign_id_fkey
    foreign key (campaign_id) references public.campaigns(id) on delete restrict;

alter table public.transparency_views
  drop constraint if exists transparency_views_campaign_id_fkey,
  add constraint transparency_views_campaign_id_fkey
    foreign key (campaign_id) references public.campaigns(id) on delete restrict;

create table if not exists public.campaign_publication_events (
  id bigint generated always as identity primary key,
  campaign_id uuid not null references public.campaigns(id) on delete restrict,
  event_type text not null check (event_type in ('published', 'archived', 'version_created', 'superseded')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create index if not exists campaign_publication_events_campaign_id_idx
on public.campaign_publication_events(campaign_id);

alter table public.campaign_publication_events enable row level security;

drop policy if exists "members can read publication events" on public.campaign_publication_events;
create policy "members can read publication events"
on public.campaign_publication_events for select
using (
  exists (
    select 1
    from public.campaigns c
    join public.organization_members m on m.organization_id = c.organization_id
    where c.id = campaign_id and m.user_id = auth.uid()
  )
);

drop policy if exists "members can insert publication events" on public.campaign_publication_events;
create policy "members can insert publication events"
on public.campaign_publication_events for insert
with check (
  exists (
    select 1
    from public.campaigns c
    join public.organization_members m on m.organization_id = c.organization_id
    where c.id = campaign_id and m.user_id = auth.uid()
  )
);

update public.campaigns as c
set published_snapshot = to_jsonb(c) - 'published_snapshot'
where c.status in ('active', 'archived') and c.published_snapshot is null;

insert into public.campaign_publication_events (campaign_id, event_type, metadata, created_at, created_by)
select
  c.id,
  'published',
  jsonb_build_object('backfilled', true),
  coalesce(c.published_at, c.updated_at, c.created_at),
  null
from public.campaigns c
where c.status in ('active', 'archived')
  and not exists (
    select 1
    from public.campaign_publication_events e
    where e.campaign_id = c.id and e.event_type = 'published'
  );

insert into public.campaign_publication_events (campaign_id, event_type, metadata, created_at, created_by)
select
  c.id,
  'archived',
  jsonb_build_object('backfilled', true),
  coalesce(c.archived_at, c.updated_at, c.created_at),
  null
from public.campaigns c
where c.status = 'archived'
  and not exists (
    select 1
    from public.campaign_publication_events e
    where e.campaign_id = c.id and e.event_type = 'archived'
  );

create or replace function public.prevent_locked_campaign_delete()
returns trigger
language plpgsql
as $$
begin
  if old.status in ('active', 'archived') then
    raise exception 'Published or archived campaign messages cannot be deleted.';
  end if;

  return old;
end;
$$;

drop trigger if exists campaigns_prevent_locked_delete on public.campaigns;
create trigger campaigns_prevent_locked_delete
before delete on public.campaigns
for each row execute function public.prevent_locked_campaign_delete();

create or replace function public.prevent_locked_campaign_record_update()
returns trigger
language plpgsql
as $$
begin
  if old.status in ('active', 'archived') and new.published_snapshot is distinct from old.published_snapshot then
    raise exception 'Published snapshots cannot be changed.';
  end if;

  if old.status = 'archived' and new.archived_at is distinct from old.archived_at then
    raise exception 'Archived campaign metadata cannot be changed.';
  end if;

  if old.status = 'active' and new.status <> 'archived' and new.archived_at is distinct from old.archived_at then
    raise exception 'Archive timestamp can only be set when archiving a published campaign.';
  end if;

  return new;
end;
$$;

drop trigger if exists campaigns_prevent_locked_record_update on public.campaigns;
create trigger campaigns_prevent_locked_record_update
before update on public.campaigns
for each row execute function public.prevent_locked_campaign_record_update();
