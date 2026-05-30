import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { formatDate, publicCampaignUrl } from "@/lib/format";
import { createClient } from "@/utils/supabase/server";
import type { Campaign, Organization } from "@/lib/types";

export default async function OrganizationPage({
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

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organizations(*)")
    .eq("user_id", user.id)
    .eq("organization_id", id)
    .maybeSingle();

  const organization = normalizeOrganization(membership?.organizations || null) as Organization | null;
  if (!organization) notFound();

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("*, organizations(*)")
    .eq("organization_id", organization.id)
    .order("updated_at", { ascending: false });

  const { data: viewRows } = await supabase
    .from("campaign_view_counts")
    .select("campaign_id, views")
    .in("campaign_id", (campaigns || []).map((campaign: Campaign) => campaign.id));

  const viewsByCampaign = new Map(
    (viewRows || []).map((row: { campaign_id: string; views: number }) => [row.campaign_id, row.views])
  );
  const totalViews = Array.from(viewsByCampaign.values()).reduce((sum, views) => sum + views, 0);

  return (
    <main className="shell" style={{ paddingBottom: 64 }}>
      <section className="row" style={{ alignItems: "end", paddingTop: 28 }}>
        <div>
          <h1>{organization.name}</h1>
        </div>
      </section>

      {query.message ? <p className="notice">{query.message}</p> : null}

      <section className="grid three" style={{ margin: "20px 0" }}>
        <div className="card">
          <strong>Organisationsnummer</strong>
          <p className="muted">{organization.org_number || "Ej angivet"}</p>
        </div>
        <div className="card">
          <strong>Webbplats</strong>
          <p className="muted">
            {organization.website ? <a href={organization.website}>{organization.website}</a> : "Ej angiven"}
          </p>
        </div>
        <div className="card">
          <strong>Aktivitet</strong>
          <p className="muted">
            {(campaigns || []).length} kampanjer · {totalViews} visningar
          </p>
        </div>
      </section>

      <section className="actions" style={{ margin: "20px 0" }}>
        <Link className="button" href={`/dashboard/campaigns/new?organization=${organization.id}`}>
          Ny kampanj
        </Link>
        <Link className="button secondary" href="/dashboard">
          Alla organisationer
        </Link>
      </section>

      <section className="grid">
        {(campaigns || []).length === 0 ? (
          <div className="panel">
            <h2>Ingen kampanj ännu</h2>
            <p className="muted">Skapa en kampanj för att få publik länk och QR-kod.</p>
          </div>
        ) : (
          (campaigns as Campaign[]).map((campaign) => (
            <article className="card grid" key={campaign.id}>
              <div className="row">
                <div>
                  <span className={`pill status-${campaign.status}`}>{statusLabel(campaign.status)}</span>
                  <h2>{campaign.name}</h2>
                  <p className="muted">
                    {formatDate(campaign.period_start)} till {formatDate(campaign.period_end)}
                  </p>
                </div>
                <img className="qr" src={`/api/qr/${campaign.slug}`} alt={`QR-kod för ${campaign.name}`} />
              </div>
              <div className="grid three">
                <div>
                  <strong>{viewsByCampaign.get(campaign.id) || 0}</strong>
                  <p className="muted">visningar</p>
                </div>
                <div>
                  <strong>{campaign.sponsor_name}</strong>
                  <p className="muted">sponsor</p>
                </div>
                <div>
                  <strong>{publicCampaignUrl(campaign.slug)}</strong>
                  <p className="muted">publik länk</p>
                </div>
              </div>
              <div className="actions">
                <Link className="button" href={`/dashboard/campaigns/${campaign.id}`}>
                  Uppdatera
                </Link>
                <Link className="button secondary" href={`/t/${campaign.slug}`}>
                  Öppna transparenssida
                </Link>
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  );
}

function statusLabel(status: string) {
  if (status === "active") return "Aktuell";
  if (status === "archived") return "Arkiverad";
  return "Utkast";
}

function normalizeOrganization(value: Organization | Organization[] | null) {
  return Array.isArray(value) ? value[0] : value;
}
