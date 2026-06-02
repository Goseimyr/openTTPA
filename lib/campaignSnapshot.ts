import type { Campaign } from "@/lib/types";

export function campaignForPublishedView(campaign: Campaign): Campaign {
  if (campaign.status === "draft" || !campaign.published_snapshot) return campaign;

  const snapshot = campaign.published_snapshot as Partial<Campaign>;

  return {
    ...campaign,
    ...snapshot,
    id: campaign.id,
    organization_id: campaign.organization_id,
    slug: campaign.slug,
    status: campaign.status,
    published_at: campaign.published_at,
    published_snapshot: campaign.published_snapshot,
    archived_at: campaign.archived_at,
    replaces_campaign_id: campaign.replaces_campaign_id,
    replaced_by_campaign_id: campaign.replaced_by_campaign_id,
    version: campaign.version,
    publication_group_id: campaign.publication_group_id,
    created_at: campaign.created_at,
    updated_at: campaign.updated_at,
    organizations: campaign.organizations,
    replaces_campaign: campaign.replaces_campaign,
    replaced_by_campaign: campaign.replaced_by_campaign
  };
}
