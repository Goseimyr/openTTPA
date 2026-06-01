alter table public.campaigns
  add column if not exists controlling_entity_registered_name text;

update public.campaigns as c
set
  sponsor_registered_name = coalesce(c.sponsor_registered_name, o.registered_name),
  sponsor_address = coalesce(c.sponsor_address, o.address),
  sponsor_establishment = coalesce(
    c.sponsor_establishment,
    o.establishment,
    nullif(trim(regexp_replace(trim((string_to_array(o.address, ','))[array_length(string_to_array(o.address, ','), 1)]), '^\d{3}\s?\d{2}\s+', '')), '')
  )
from public.organizations as o
where c.organization_id = o.id
  and c.sponsor_name = o.name;

update public.campaigns as c
set
  controlling_entity_registered_name = coalesce(c.controlling_entity_registered_name, o.registered_name),
  controlling_entity_address = coalesce(c.controlling_entity_address, o.address),
  controlling_entity_establishment = coalesce(
    c.controlling_entity_establishment,
    o.establishment,
    nullif(trim(regexp_replace(trim((string_to_array(o.address, ','))[array_length(string_to_array(o.address, ','), 1)]), '^\d{3}\s?\d{2}\s+', '')), '')
  )
from public.organizations as o
where c.organization_id = o.id
  and c.controlling_entity = o.name;

update public.campaigns as c
set
  payer_registered_name = coalesce(c.payer_registered_name, o.registered_name),
  payer_address = coalesce(c.payer_address, o.address),
  payer_establishment = coalesce(
    c.payer_establishment,
    o.establishment,
    nullif(trim(regexp_replace(trim((string_to_array(o.address, ','))[array_length(string_to_array(o.address, ','), 1)]), '^\d{3}\s?\d{2}\s+', '')), '')
  )
from public.organizations as o
where c.organization_id = o.id
  and c.payer_name = o.name;

update public.campaigns
set
  sponsor_establishment = coalesce(
    sponsor_establishment,
    nullif(trim(regexp_replace(trim((string_to_array(sponsor_address, ','))[array_length(string_to_array(sponsor_address, ','), 1)]), '^\d{3}\s?\d{2}\s+', '')), '')
  ),
  controlling_entity_establishment = coalesce(
    controlling_entity_establishment,
    nullif(trim(regexp_replace(trim((string_to_array(controlling_entity_address, ','))[array_length(string_to_array(controlling_entity_address, ','), 1)]), '^\d{3}\s?\d{2}\s+', '')), '')
  ),
  payer_establishment = coalesce(
    payer_establishment,
    nullif(trim(regexp_replace(trim((string_to_array(payer_address, ','))[array_length(string_to_array(payer_address, ','), 1)]), '^\d{3}\s?\d{2}\s+', '')), '')
  );

update public.organizations
set establishment = coalesce(
  establishment,
  nullif(trim(regexp_replace(trim((string_to_array(address, ','))[array_length(string_to_array(address, ','), 1)]), '^\d{3}\s?\d{2}\s+', '')), '')
);
