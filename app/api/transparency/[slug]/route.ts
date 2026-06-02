import { NextResponse } from "next/server";
import { campaignForPublishedView } from "@/lib/campaignSnapshot";
import { publicCampaignUrl } from "@/lib/format";
import { createClient } from "@/utils/supabase/server";
import type { Campaign } from "@/lib/types";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("campaigns")
    .select(
      "*, organizations(*), replaces_campaign:campaigns!campaigns_replaces_campaign_id_fkey(id,name,slug,version), replaced_by_campaign:campaigns!campaigns_replaced_by_campaign_id_fkey(id,name,slug,version)"
    )
    .eq("slug", slug)
    .single();

  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const campaign = campaignForPublishedView(data as Campaign);
  if (campaign.status === "draft") {
    const canPreview = await canPreviewCampaign(supabase, campaign);
    if (!canPreview) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  return NextResponse.json({
    schema: "openttpa.transparency_notice.v1",
    legal_basis: "Regulation (EU) 2024/900 and Commission Implementing Regulation (EU) 2025/1410",
    url: publicCampaignUrl(campaign.slug),
    campaign: {
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      version: campaign.version,
      published_at: campaign.published_at,
      archived_at: campaign.archived_at,
      replaces_url: campaign.replaces_campaign ? publicCampaignUrl(campaign.replaces_campaign.slug) : null,
      replaced_by_url: campaign.replaced_by_campaign ? publicCampaignUrl(campaign.replaced_by_campaign.slug) : null,
      language: campaign.language,
      updated_at: campaign.updated_at
    },
    transparency_notice: {
      sponsor: {
        type: campaign.sponsor_type,
        name: campaign.sponsor_name,
        registered_name: campaign.sponsor_registered_name,
        email: campaign.sponsor_email,
        contact: campaign.sponsor_contact,
        address: campaign.sponsor_address,
        establishment: campaign.sponsor_establishment,
        registration_number: campaign.sponsor_registration_number
      },
      controlling_entity: {
        name: campaign.controlling_entity,
        registered_name: campaign.controlling_entity_registered_name,
        email: campaign.controlling_entity_email,
        address: campaign.controlling_entity_address,
        establishment: campaign.controlling_entity_establishment,
        registration_number: campaign.controlling_entity_registration_number,
        contact: campaign.controlling_entity_contact
      },
      payer: {
        name: campaign.payer_name,
        registered_name: campaign.payer_registered_name,
        email: campaign.payer_email,
        address: campaign.payer_address,
        establishment: campaign.payer_establishment,
        registration_number: campaign.payer_registration_number,
        contact: campaign.payer_contact
      },
      publisher: {
        name: campaign.publisher_name,
        contact: campaign.publisher_contact
      },
      publication_period: {
        start: campaign.period_start,
        end: campaign.period_end
      },
      amounts: {
        currency: campaign.amount_currency,
        message_amount: campaign.amount_message,
        campaign_amount: campaign.amount_campaign,
        message_in_kind_value: campaign.in_kind_message,
        campaign_in_kind_value: campaign.in_kind_campaign,
        calculation_method: campaign.calculation_method,
        basis: campaign.amount_basis,
        includes_vat: campaign.amount_includes_vat
      },
      funding: {
        additional_information: campaign.funds_origin,
        source_type: campaign.funds_source_type,
        source_region: campaign.funds_source_region
      },
      political_process: {
        summary: campaign.linked_process,
        type: campaign.process_type,
        name: campaign.process_name,
        level: campaign.process_level,
        date: campaign.process_date,
        region: campaign.process_region,
        official_info_url: campaign.official_info_url
      },
      eu_database_url: campaign.eu_database_url,
      reporting: {
        contact: campaign.complaint_contact,
        url: campaign.complaint_url
      },
      prior_non_compliance: {
        occurred: campaign.prior_non_compliance,
        description: campaign.prior_non_compliance_description
      },
      targeting: {
        used: campaign.targeting_used,
        description: campaign.targeting_description,
        delivery_description: campaign.delivery_description,
        analysis_methods: campaign.targeting_analysis_methods,
        audience_groups: campaign.targeting_audience_groups,
        personal_data_categories: campaign.targeting_personal_data_categories,
        logic: campaign.targeting_logic,
        ai_systems: campaign.targeting_ai_systems,
        period_start: campaign.targeting_period_start,
        period_end: campaign.targeting_period_end,
        impressions: campaign.targeting_impressions,
        clicks: campaign.targeting_clicks,
        likes: campaign.targeting_likes,
        comments: campaign.targeting_comments,
        policy_url: campaign.targeting_policy_url,
        additional_info: campaign.targeting_additional_info
      },
      data_protection_rights: {
        controller_name: campaign.gdpr_controller_name,
        controller_contact: campaign.gdpr_controller_contact,
        consent_withdrawal_url: campaign.consent_withdrawal_url,
        rights_url: campaign.gdpr_rights_url,
        information_url: campaign.gdpr_info_url
      },
      channels: campaign.ad_channels || []
    }
  });
}

async function canPreviewCampaign(supabase: Awaited<ReturnType<typeof createClient>>, campaign: Campaign) {
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data } = await supabase
    .from("organization_members")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("organization_id", campaign.organization_id)
    .maybeSingle();

  return Boolean(data);
}
