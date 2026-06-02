alter table public.campaigns
  add column if not exists published_at timestamptz,
  add column if not exists archived_at timestamptz,
  add column if not exists replaces_campaign_id uuid references public.campaigns(id),
  add column if not exists replaced_by_campaign_id uuid references public.campaigns(id),
  add column if not exists version integer not null default 1,
  add column if not exists publication_group_id uuid;

update public.campaigns
set publication_group_id = coalesce(publication_group_id, id);

update public.campaigns
set published_at = coalesce(published_at, updated_at, created_at)
where status in ('active', 'archived') and published_at is null;

update public.campaigns
set archived_at = coalesce(archived_at, updated_at, created_at)
where status = 'archived' and archived_at is null;

alter table public.campaigns
  alter column publication_group_id set not null;

create index if not exists campaigns_publication_group_id_idx
on public.campaigns(publication_group_id);

create index if not exists campaigns_replaces_campaign_id_idx
on public.campaigns(replaces_campaign_id);

create index if not exists campaigns_replaced_by_campaign_id_idx
on public.campaigns(replaced_by_campaign_id);

create or replace function public.prevent_locked_campaign_content_update()
returns trigger
language plpgsql
as $$
begin
  if old.status in ('active', 'archived') and (
    new.organization_id is distinct from old.organization_id or
    new.slug is distinct from old.slug or
    new.published_at is distinct from old.published_at or
    new.replaces_campaign_id is distinct from old.replaces_campaign_id or
    new.version is distinct from old.version or
    new.publication_group_id is distinct from old.publication_group_id or
    new.language is distinct from old.language or
    new.name is distinct from old.name or
    new.sponsor_name is distinct from old.sponsor_name or
    new.sponsor_contact is distinct from old.sponsor_contact or
    new.controlling_entity is distinct from old.controlling_entity or
    new.publisher_name is distinct from old.publisher_name or
    new.publisher_contact is distinct from old.publisher_contact or
    new.period_start is distinct from old.period_start or
    new.period_end is distinct from old.period_end or
    new.amount_message is distinct from old.amount_message or
    new.amount_campaign is distinct from old.amount_campaign or
    new.funds_origin is distinct from old.funds_origin or
    new.calculation_method is distinct from old.calculation_method or
    new.linked_process is distinct from old.linked_process or
    new.targeting_used is distinct from old.targeting_used or
    new.targeting_description is distinct from old.targeting_description or
    new.delivery_description is distinct from old.delivery_description or
    new.consent_withdrawal_url is distinct from old.consent_withdrawal_url or
    new.complaint_contact is distinct from old.complaint_contact or
    new.complaint_url is distinct from old.complaint_url or
    new.ad_channels is distinct from old.ad_channels or
    new.sponsor_type is distinct from old.sponsor_type or
    new.sponsor_registered_name is distinct from old.sponsor_registered_name or
    new.sponsor_email is distinct from old.sponsor_email or
    new.sponsor_address is distinct from old.sponsor_address or
    new.sponsor_establishment is distinct from old.sponsor_establishment or
    new.sponsor_registration_number is distinct from old.sponsor_registration_number or
    new.amount_currency is distinct from old.amount_currency or
    new.amount_basis is distinct from old.amount_basis or
    new.amount_includes_vat is distinct from old.amount_includes_vat or
    new.targeting_analysis_methods is distinct from old.targeting_analysis_methods or
    new.targeting_audience_groups is distinct from old.targeting_audience_groups or
    new.targeting_personal_data_categories is distinct from old.targeting_personal_data_categories or
    new.targeting_logic is distinct from old.targeting_logic or
    new.targeting_ai_systems is distinct from old.targeting_ai_systems or
    new.targeting_period_start is distinct from old.targeting_period_start or
    new.targeting_period_end is distinct from old.targeting_period_end or
    new.targeting_impressions is distinct from old.targeting_impressions or
    new.targeting_clicks is distinct from old.targeting_clicks or
    new.targeting_likes is distinct from old.targeting_likes or
    new.targeting_comments is distinct from old.targeting_comments or
    new.targeting_policy_url is distinct from old.targeting_policy_url or
    new.targeting_additional_info is distinct from old.targeting_additional_info or
    new.gdpr_controller_name is distinct from old.gdpr_controller_name or
    new.gdpr_controller_contact is distinct from old.gdpr_controller_contact or
    new.gdpr_rights_url is distinct from old.gdpr_rights_url or
    new.gdpr_info_url is distinct from old.gdpr_info_url or
    new.official_info_url is distinct from old.official_info_url or
    new.eu_database_url is distinct from old.eu_database_url or
    new.prior_non_compliance is distinct from old.prior_non_compliance or
    new.prior_non_compliance_description is distinct from old.prior_non_compliance_description or
    new.funds_source_type is distinct from old.funds_source_type or
    new.funds_source_region is distinct from old.funds_source_region or
    new.in_kind_message is distinct from old.in_kind_message or
    new.in_kind_campaign is distinct from old.in_kind_campaign or
    new.payer_name is distinct from old.payer_name or
    new.payer_registered_name is distinct from old.payer_registered_name or
    new.payer_email is distinct from old.payer_email or
    new.payer_address is distinct from old.payer_address or
    new.payer_establishment is distinct from old.payer_establishment or
    new.controlling_entity_registered_name is distinct from old.controlling_entity_registered_name or
    new.controlling_entity_email is distinct from old.controlling_entity_email or
    new.controlling_entity_address is distinct from old.controlling_entity_address or
    new.controlling_entity_establishment is distinct from old.controlling_entity_establishment or
    new.controlling_entity_registration_number is distinct from old.controlling_entity_registration_number or
    new.controlling_entity_contact is distinct from old.controlling_entity_contact or
    new.payer_registration_number is distinct from old.payer_registration_number or
    new.payer_contact is distinct from old.payer_contact
  ) then
    raise exception 'Published or archived campaign messages cannot be edited. Create a new version instead.';
  end if;

  if old.status = 'archived' and new.status is distinct from old.status then
    raise exception 'Archived campaign messages cannot be reactivated.';
  end if;

  if old.status = 'active' and new.status not in ('active', 'archived') then
    raise exception 'Published campaign messages cannot be reverted to draft.';
  end if;

  return new;
end;
$$;

drop trigger if exists campaigns_prevent_locked_content_update on public.campaigns;
create trigger campaigns_prevent_locked_content_update
before update on public.campaigns
for each row execute function public.prevent_locked_campaign_content_update();
