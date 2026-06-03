import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { TransparencyNotice } from "@/components/TransparencyNotice";
import { campaignForPublishedView } from "@/lib/campaignSnapshot";
import { loadCampaignVersionLinks } from "@/lib/campaignVersionLinks";
import { publicCampaignJsonUrl, publicCampaignUrl } from "@/lib/format";
import { createClient } from "@/utils/supabase/server";
import type { Campaign } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TransparencyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("campaigns")
    .select("*, organizations(*)")
    .eq("slug", slug)
    .single();

  if (error) {
    console.error("Failed to load transparency notice", { slug, error });
  }

  if (!data) notFound();

  const campaign = campaignForPublishedView(await loadCampaignVersionLinks(supabase, data as Campaign));
  if (campaign.status === "draft") {
    const canPreview = await canPreviewCampaign(supabase, campaign);
    if (!canPreview) notFound();
  }

  if (campaign.status !== "draft") {
    await recordView(campaign.id, slug);
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: campaign.name,
    isBasedOn: "Regulation (EU) 2024/900",
    sponsor: campaign.sponsor_name,
    publisher: campaign.publisher_name,
    datePublished: campaign.period_start,
    expires: campaign.period_end,
    url: publicCampaignUrl(campaign.slug)
  };

  return (
    <main className="shell public-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <TransparencyNotice campaign={campaign} />
      <section className="permanent-link" style={{ marginTop: 28 }}>
        <h2>Permanent länk</h2>
        <p>
          Den här länken går till transparensmeddelandet och kan användas i annonser, tryckt material och
          andra sammanhang där informationen behöver vara tillgänglig.
        </p>
        <p>
          <a href={publicCampaignUrl(campaign.slug)}>{publicCampaignUrl(campaign.slug)}</a>
        </p>
      </section>
      <section className="machine-readable" style={{ marginTop: 28 }}>
        <h2>Maskinläsbar version</h2>
        <p>
          <a href={publicCampaignJsonUrl(campaign.slug)}>Maskinläsbar version</a>
        </p>
      </section>
      <section className="openttpa-intro" style={{ marginTop: 28 }}>
        <h2>Om OpenTTPA</h2>
        <p>
          OpenTTPA är en öppen källkodstjänst för att skapa och tillhandahålla transparensmeddelanden
          för politisk reklam enligt EU:s regler.
        </p>
        <p>
          <a href="/">Mer information</a>
        </p>
      </section>
    </main>
  );
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

async function recordView(campaignId: string, slug: string) {
  try {
    const headerStore = await headers();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    await fetch(`${siteUrl}/api/record-view`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "user-agent": headerStore.get("user-agent") || "",
        referer: headerStore.get("referer") || ""
      },
      body: JSON.stringify({ campaignId, slug })
    });
  } catch {
    // Public pages should remain available even if analytics is not configured.
  }
}
