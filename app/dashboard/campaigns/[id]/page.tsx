import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AutoDismissNotice } from "@/components/AutoDismissNotice";
import { TransparencyNotice } from "@/components/TransparencyNotice";
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

  const { data: campaign } = await supabase.from("campaigns").select("*, organizations(*)").eq("id", id).single();
  if (!campaign) notFound();

  const organization = normalizeOrganization((campaign as Campaign).organizations || null) as Organization | null;
  const { data: membership } = await supabase
    .from("organization_members")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("organization_id", (campaign as Campaign).organization_id)
    .maybeSingle();

  if (!membership) notFound();

  const publicUrl = publicCampaignUrl((campaign as Campaign).slug);
  const jsonUrl = publicCampaignJsonUrl((campaign as Campaign).slug);
  const qrUrl = `/api/qr/${(campaign as Campaign).slug}`;

  return (
    <main className="shell" style={{ paddingBottom: 64 }}>
      <section className="row" style={{ alignItems: "end", paddingTop: 28 }}>
        <div>
          <h1>{(campaign as Campaign).name}</h1>
          <p className="lead">Se kampanjens uppgifter och länkar till transparensmeddelandet.</p>
        </div>
      </section>

      {query.message ? <AutoDismissNotice>{query.message}</AutoDismissNotice> : null}

      <section className="organization-details" style={{ margin: "20px 0" }}>
        <div className="organization-detail-grid">
          <Detail label="Organisation" value={organization?.name || "Ej angiven"} />
          <Detail label="Status" value={statusLabel((campaign as Campaign).status)} />
          <Detail label="Språk i reklamen" value={(campaign as Campaign).language} />
          <Detail label="Startdatum" value={formatDate((campaign as Campaign).period_start)} />
          <Detail label="Slutdatum" value={formatDate((campaign as Campaign).period_end)} />
          <Detail label="Skapad" value={formatDateTime((campaign as Campaign).created_at)} />
          <Detail label="Senast uppdaterad" value={formatDateTime((campaign as Campaign).updated_at)} />
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
              <a className="button secondary" href={qrUrl} download={`${(campaign as Campaign).slug}-qr.svg`}>
                Ladda ner SVG
              </a>
            </div>
          </div>
        </div>
        <div className="actions card-actions">
          <Link className="button secondary" href={`/dashboard/campaigns/${(campaign as Campaign).id}/edit`}>
            Redigera kampanj
          </Link>
        </div>
      </section>

      <section className="organization-campaigns" style={{ margin: "36px 0 20px" }}>
        <h2>Transparensmeddelande</h2>
        <p className="muted">Så här visas informationen på den publika sidan.</p>
        <TransparencyNotice campaign={campaign as Campaign} />
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

function statusLabel(status: string) {
  if (status === "active") return "Aktuell";
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
