alter table public.campaigns
  add column if not exists controlling_entity_registration_number text,
  add column if not exists controlling_entity_contact text,
  add column if not exists payer_registration_number text,
  add column if not exists payer_contact text;

update public.campaigns as c
set
  controlling_entity_registration_number = coalesce(c.controlling_entity_registration_number, o.org_number),
  controlling_entity_contact = coalesce(c.controlling_entity_contact, o.website, o.name)
from public.organizations as o
where c.organization_id = o.id
  and c.controlling_entity = o.name;

update public.campaigns as c
set
  payer_registration_number = coalesce(c.payer_registration_number, o.org_number),
  payer_contact = coalesce(c.payer_contact, o.website, o.name)
from public.organizations as o
where c.organization_id = o.id
  and c.payer_name = o.name;
