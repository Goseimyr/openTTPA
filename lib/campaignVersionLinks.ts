import type { Campaign } from "@/lib/types";
import { createClient } from "@/utils/supabase/server";

type CampaignVersionLink = Pick<Campaign, "id" | "name" | "slug" | "version">;
type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export async function loadCampaignVersionLinks(
  supabase: SupabaseClient,
  campaign: Campaign
): Promise<Campaign> {
  const [replacesCampaign, replacedByCampaign] = await Promise.all([
    loadCampaignVersionLink(supabase, campaign.replaces_campaign_id, "replaces_campaign_id"),
    loadCampaignVersionLink(supabase, campaign.replaced_by_campaign_id, "replaced_by_campaign_id")
  ]);

  return {
    ...campaign,
    replaces_campaign: replacesCampaign,
    replaced_by_campaign: replacedByCampaign
  };
}

async function loadCampaignVersionLink(
  supabase: SupabaseClient,
  campaignId: string | null,
  relation: "replaces_campaign_id" | "replaced_by_campaign_id"
): Promise<CampaignVersionLink | null> {
  if (!campaignId) return null;

  const { data, error } = await supabase
    .from("campaigns")
    .select("id,name,slug,version")
    .eq("id", campaignId)
    .maybeSingle();

  if (error) {
    console.error("Failed to load campaign version link", {
      campaignId,
      relation,
      error
    });
  }

  return (data as CampaignVersionLink | null) || null;
}
