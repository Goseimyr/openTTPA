import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { archiveCampaign, createCampaignVersion, publishCampaign } from "@/app/dashboard/actions";
import { AutoDismissNotice } from "@/components/AutoDismissNotice";
import { TransparencyNotice } from "@/components/TransparencyNotice";
import { campaignForPublishedView } from "@/lib/campaignSnapshot";
import { loadCampaignVersionLinks } from "@/lib/campaignVersionLinks";
import { formatDate, normalizeOrganization, publicCampaignJsonUrl, publicCampaignUrl } from "@/lib/format";
import { createClient } from "@/utils/supabase/server";
import type { Campaign, Organization } from "@/lib/types";

export default async function CampaignPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ message?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select("*, organizations(*)")
    .eq("id", id)
    .single();

  if (campaignError) {
    console.error("Failed to load campaign", { id, error: campaignError });
  }

  if (!campaign) notFound();

  const campaignRecord = await loadCampaignVersionLinks(supabase, campaign as Campaign);
  const organization = normalizeOrganization(campaignRecord.organizations || null) as Organization | null;
  const { data: membership } = await supabase
    .from("organization_members")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("organization_id", campaignRecord.organization_id)
    .maybeSingle();

  if (!membership) notFound();

  const noticeCampaign = campaignForPublishedView(campaignRecord);
  const publicUrl = publicCampaignUrl(campaignRecord.slug);
  const jsonUrl = publicCampaignJsonUrl(campaignRecord.slug);
  const qrUrl = `/api/qr/${campaignRecord.slug}`;

  return (
    <main className="shell" style={{ paddingBottom: 64 }}>
      <section className="row" style={{ alignItems: "end", paddingTop: 28 }}>
        <div>
          <h1>{campaignRecord.name}</h1>
          <p className="lead">Se kampanjens uppgifter och länkar till transparensmeddelandet.</p>
        </div>
      </section>

      {query.message ? <AutoDismissNotice>{query.message}</AutoDismissNotice> : null}

      <section className="organization-details" style={{ margin: "20px 0" }}>
        <div className="organization-detail-grid">
          <Detail label="Organisation" value={organization?.name || "Ej angiven"} />
          <Detail label="Status" value={statusLabel(campaignRecord.status)} />
          <Detail label="Språk i reklamen" value={campaignRecord.language} />
          <Detail label="Senast uppdaterad" value={formatDateTime(campaignRecord.updated_at)} />
          <Detail label="Startdatum" value={formatDate(campaignRecord.period_start)} />
          <Detail label="Slutdatum" value={formatDate(campaignRecord.period_end)} />
          <Detail label="Version" value={campaignRecord.version} />
          <Detail label="Versioner" value={<VersionLinks campaign={campaignRecord} />} />
          <Detail label="Skapad" value={formatDateTime(campaignRecord.created_at)} />
          <Detail label="Publicerad" value={formatDateTime(campaignRecord.published_at)} />
          <Detail label="Arkiverad" value={formatDateTime(campaignRecord.archived_at)} />
        </div>
        <div className="qr-share">
          <img className="qr" src={qrUrl} alt={`QR-kod till ${publicUrl}`} />
          <div>
            <strong>Länk</strong>
            <p className="qr-link">
              <a href={publicUrl} target="_blank" rel="noreferrer">
                {publicUrl}
              </a>
            </p>
            <strong>QR-kod</strong>
            <p className="muted">Dela QR-koden i annonser, tryck eller annat material.</p>
            <div className="actions">
              <a className="button secondary" href={qrUrl} target="_blank" rel="noreferrer">
                Öppna QR-kod
              </a>
              <a className="button secondary" href={qrUrl} download={`${campaignRecord.slug}-qr.svg`}>
                Ladda ner SVG
              </a>
            </div>
          </div>
        </div>
        <div className="actions card-actions">
          {campaignRecord.status === "draft" ? (
            <>
              <form action={publishCampaign}>
                <input type="hidden" name="id" value={campaignRecord.id} />
                <button type="submit">Publicera meddelande</button>
              </form>
              <Link className="button secondary" href={`/dashboard/campaigns/${campaignRecord.id}/edit`}>
                Redigera meddelande
              </Link>
            </>
          ) : campaignRecord.status === "active" && !campaignRecord.replaced_by_campaign ? (
            <form action={createCampaignVersion}>
              <input type="hidden" name="id" value={campaignRecord.id} />
              <button type="submit">Skapa ny version</button>
            </form>
          ) : null}
          {campaignRecord.status === "active" && !campaignRecord.replaced_by_campaign ? (
            <form action={archiveCampaign}>
              <input type="hidden" name="id" value={campaignRecord.id} />
              <button type="submit" className="secondary">
                Arkivera
              </button>
            </form>
          ) : null}
          <Link className="button secondary" href={`/dashboard/campaigns/${campaignRecord.id}/events`}>
            Visa eventlogg
          </Link>
        </div>
      </section>

      <section className="organization-campaigns" style={{ margin: "36px 0 20px" }}>
        <h2>Transparensmeddelande</h2>
        <p className="muted">Så här visas informationen på den publika sidan.</p>
        <TransparencyNotice campaign={noticeCampaign} />
        <section className="machine-readable" style={{ marginTop: 28 }}>
          <h2>Maskinläsbar version</h2>
          <p className="muted">
            JSON-versionen kan användas av plattformar, register och andra system som behöver läsa
            transparensmeddelandet automatiskt.
          </p>
          <p>
            <a href={jsonUrl} target="_blank" rel="noreferrer">
              {jsonUrl}
            </a>
          </p>
        </section>
      </section>
    </main>
  );
}

function Detail({
  label,
  value,
  link,
  multiline
}: {
  label: string;
  value: ReactNode;
  link?: boolean;
  multiline?: boolean;
}) {
  const displayValue = value || "Ej angivet";

  return (
    <div className="organization-detail">
      <strong>{label}</strong>
      <p className="muted">
        {link && typeof value === "string" && value ? (
          <a href={value} target="_blank" rel="noreferrer">
            {value}
          </a>
        ) : multiline && typeof displayValue === "string" ? (
          <span style={{ whiteSpace: "pre-wrap" }}>{displayValue}</span>
        ) : (
          displayValue
        )}
      </p>
    </div>
  );
}

function VersionLinks({ campaign }: { campaign: Campaign }) {
  const versions: ReactNode[] = [];

  if (campaign.replaces_campaign) {
    versions.push(
      <Link key="previous" href={`/dashboard/campaigns/${campaign.replaces_campaign.id}`}>
        Version {campaign.replaces_campaign.version}
      </Link>
    );
  }

  versions.push(<span key="current">Version {campaign.version} (denna)</span>);

  if (campaign.replaced_by_campaign) {
    versions.push(
      <Link key="next" href={`/dashboard/campaigns/${campaign.replaced_by_campaign.id}`}>
        Version {campaign.replaced_by_campaign.version}
      </Link>
    );
  }

  return (
    <span>
      {versions.map((version, index) => (
        <span key={index}>
          {index > 0 ? " | " : null}
          {version}
        </span>
      ))}
    </span>
  );
}

function statusLabel(status: string) {
  if (status === "active") return "Publicerad";
  if (status === "archived") return "Arkiverad";
  return "Utkast";
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Ej angivet";
  return new Intl.DateTimeFormat("sv-SE", {
    dateStyle: "long",
    timeStyle: "short"
  }).format(new Date(value));
}
