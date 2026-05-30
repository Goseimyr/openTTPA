import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { formatDate, formatMoney, publicCampaignUrl } from "@/lib/format";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import type { Campaign } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TransparencyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("campaigns")
    .select("*, organizations(*)")
    .eq("slug", slug)
    .in("status", ["active", "archived"])
    .single();

  if (!data) notFound();

  const campaign = data as Campaign;
  await recordView(campaign.id, slug);

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
      <section className="stack">
        <span className="pill">Transparensmeddelande</span>
        <h1>{campaign.name}</h1>
        <p className="notice">
          Detta är ett transparensmeddelande för politisk reklam. Informationen lämnas på samma
          språk som kampanjens registrerade språk: {campaign.language}.
        </p>
      </section>

      <section className="panel" style={{ marginTop: 24 }}>
        <dl>
          <Info label="Sponsor" value={campaign.sponsor_name} />
          <Info label="Sponsorns kontaktuppgifter" value={campaign.sponsor_contact} />
          <Info label="Eventuell kontrollerande enhet" value={campaign.controlling_entity || "Ingen angiven"} />
          <Info label="Utgivare" value={campaign.publisher_name || "Ej angiven"} />
          <Info label="Utgivarens kontaktuppgifter" value={campaign.publisher_contact || "Ej angiven"} />
          <Info label="Publiceringsperiod" value={`${formatDate(campaign.period_start)} till ${formatDate(campaign.period_end)}`} />
          <Info label="Belopp för reklammeddelandet" value={formatMoney(campaign.amount_message)} />
          <Info label="Belopp för kampanjen" value={formatMoney(campaign.amount_campaign)} />
          <Info label="Ursprung för ekonomiska medel" value={campaign.funds_origin} />
          <Info label="Beräkningsmetod" value={campaign.calculation_method} />
          <Info
            label="Koppling till val, folkomröstning eller regleringsinitiativ"
            value={campaign.linked_process || "Ingen koppling angiven"}
          />
          <Info label="Inriktningsteknik eller annonsleveransteknik" value={campaign.targeting_used ? "Ja" : "Nej"} />
          <Info label="Beskrivning av inriktning" value={campaign.targeting_description || "Ej angiven"} />
          <Info label="Beskrivning av annonsleverans" value={campaign.delivery_description || "Ej angiven"} />
          <Info label="Kanaler" value={(campaign.ad_channels || []).join(", ") || "Ej angivet"} />
          <Info
            label="Återkalla samtycke"
            value={campaign.consent_withdrawal_url || "Ingen särskild länk angiven"}
            href={campaign.consent_withdrawal_url || undefined}
          />
          <Info
            label="Anmäl bristande efterlevnad till utgivaren"
            value={campaign.complaint_contact}
            href={campaign.complaint_url || undefined}
          />
          <Info label="Senast uppdaterad" value={formatDate(campaign.updated_at)} />
        </dl>
      </section>
    </main>
  );
}

function Info({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div className="definition">
      <dt>{label}</dt>
      <dd>{href ? <a href={href}>{value}</a> : value}</dd>
    </div>
  );
}

async function recordView(campaignId: string, slug: string) {
  try {
    const headerStore = await headers();
    const supabase = createAdminClient();
    await supabase.from("transparency_views").insert({
      campaign_id: campaignId,
      slug,
      user_agent: headerStore.get("user-agent"),
      referer: headerStore.get("referer")
    });
  } catch {
    // Public pages should remain available even if analytics is not configured.
  }
}
