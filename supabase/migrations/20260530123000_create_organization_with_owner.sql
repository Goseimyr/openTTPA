create or replace function public.create_organization_with_owner(
  organization_name text,
  organization_org_number text default null,
  organization_website text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_organization_id uuid;
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if nullif(trim(organization_name), '') is null then
    raise exception 'Organisationens namn saknas.';
  end if;

  insert into public.organizations (name, org_number, website, created_by)
  values (
    trim(organization_name),
    nullif(trim(organization_org_number), ''),
    nullif(trim(organization_website), ''),
    current_user_id
  )
  returning id into new_organization_id;

  insert into public.organization_members (organization_id, user_id, role)
  values (new_organization_id, current_user_id, 'owner');

  return new_organization_id;
end;
$$;

revoke all on function public.create_organization_with_owner(text, text, text) from public;
grant execute on function public.create_organization_with_owner(text, text, text) to authenticated;
