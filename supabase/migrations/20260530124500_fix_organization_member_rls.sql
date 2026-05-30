create or replace function public.is_organization_member(target_organization_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = target_organization_id
      and m.user_id = auth.uid()
  );
$$;

create or replace function public.is_organization_admin(target_organization_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = target_organization_id
      and m.user_id = auth.uid()
      and m.role in ('owner', 'admin')
  );
$$;

revoke all on function public.is_organization_member(uuid) from public;
revoke all on function public.is_organization_admin(uuid) from public;
grant execute on function public.is_organization_member(uuid) to authenticated;
grant execute on function public.is_organization_admin(uuid) to authenticated;

drop policy if exists "members can read organizations" on public.organizations;
create policy "members can read organizations"
on public.organizations for select
using (public.is_organization_member(id));

drop policy if exists "owners can update organizations" on public.organizations;
create policy "owners can update organizations"
on public.organizations for update
using (public.is_organization_admin(id));

drop policy if exists "members can read memberships" on public.organization_members;
create policy "members can read memberships"
on public.organization_members for select
using (
  user_id = auth.uid()
  or public.is_organization_member(organization_id)
);

drop policy if exists "members can manage campaigns" on public.campaigns;
create policy "members can manage campaigns"
on public.campaigns for all
using (public.is_organization_member(organization_id))
with check (public.is_organization_member(organization_id));

drop policy if exists "members can read campaign versions" on public.campaign_versions;
create policy "members can read campaign versions"
on public.campaign_versions for select
using (
  exists (
    select 1
    from public.campaigns c
    where c.id = campaign_id
      and public.is_organization_member(c.organization_id)
  )
);

drop policy if exists "members can read views" on public.transparency_views;
create policy "members can read views"
on public.transparency_views for select
using (
  exists (
    select 1
    from public.campaigns c
    where c.id = campaign_id
      and public.is_organization_member(c.organization_id)
  )
);
