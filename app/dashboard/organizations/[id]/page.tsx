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
        <Link className="button secondary" href={`/dashboard/organizations/${organization.id}/edit`}>
          Redigera organisation
        </Link>
      </section>

      {(campaigns || []).length === 0 ? (
        <section className="grid">
          <div className="panel">
            <h2>Ingen kampanj ännu</h2>
            <p className="muted">Skapa en kampanj för att få publik länk och QR-kod.</p>
          </div>
        </section>
      ) : (
        <section className="table-wrap" aria-label="Kampanjer">
          <table className="data-table campaign-table">
            <colgroup>
              <col className="name-column" />
              <col className="sponsor-column" />
              <col className="period-column" />
              <col className="status-column" />
              <col className="count-column" />
            </colgroup>
            <thead>
              <tr>
                <th>Kampanj</th>
                <th>Sponsor</th>
                <th>Period</th>
                <th>Status</th>
                <th>Visningar</th>
              </tr>
            </thead>
            <tbody>
              {(campaigns as Campaign[]).map((campaign) => (
                <tr key={campaign.id}>
                  <td>
                    <Link className="table-link" href={`/dashboard/campaigns/${campaign.id}`}>
                      {campaign.name}
                    </Link>
                    <p className="table-meta">
                      <a className="table-url" href={`/t/${campaign.slug}`}>
                        {publicCampaignUrl(campaign.slug)}
                      </a>
                    </p>
                  </td>
                  <td>{campaign.sponsor_name}</td>
                  <td>
                    {formatDate(campaign.period_start)} till {formatDate(campaign.period_end)}
                  </td>
                  <td>
                    <span className={`pill status-${campaign.status}`}>{statusLabel(campaign.status)}</span>
                  </td>
                  <td>{viewsByCampaign.get(campaign.id) || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section className="actions" style={{ marginTop: 20 }}>
        <Link className="button" href={`/dashboard/campaigns/new?organization=${organization.id}`}>
          Skapa ny kampanj
        </Link>
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
