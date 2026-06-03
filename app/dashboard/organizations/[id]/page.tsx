import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { formatDate } from "@/lib/format";
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

  const { data: organizationMembers } = await supabase
    .from("organization_members")
    .select("user_id, role, created_at")
    .eq("organization_id", organization.id)
    .order("created_at", { ascending: true });

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("*, organizations(*)")
    .eq("organization_id", organization.id)
    .is("replaced_by_campaign_id", null)
    .order("updated_at", { ascending: false });

  const { data: viewRows } = await supabase
    .from("campaign_view_counts")
    .select("campaign_id, views")
    .in("campaign_id", (campaigns || []).map((campaign: Campaign) => campaign.id));

  const viewsByCampaign = new Map(
    (viewRows || []).map((row: { campaign_id: string; views: number }) => [row.campaign_id, row.views])
  );
  const establishment = organization.establishment || deriveEstablishmentFromAddress(organization.address);

  return (
    <main className="shell" style={{ paddingBottom: 64 }}>
      <section className="row" style={{ alignItems: "end", paddingTop: 28 }}>
        <div>
          <h1>{organization.name}</h1>
          <p className="lead">Se organisationens uppgifter, användare och kampanjer.</p>
        </div>
      </section>

      {query.message ? <p className="notice">{query.message}</p> : null}

      <section className="organization-details" style={{ margin: "20px 0" }}>
        <div className="organization-detail-grid">
          <div className="organization-detail">
            <strong>Juridisk form</strong>
            <p className="muted">{formatLegalForm(organization.legal_form)}</p>
          </div>
          <div className="organization-detail">
            <strong>Organisationsnummer</strong>
            <p className="muted">{organization.org_number || "Ej angivet"}</p>
          </div>
          <div className="organization-detail">
            <strong>Registrerat namn</strong>
            <p className="muted">{organization.registered_name || "Ej angivet"}</p>
          </div>
          <div className="organization-detail">
            <strong>E-postadress</strong>
            <p className="muted">{organization.email || "Ej angiven"}</p>
          </div>
          <div className="organization-detail">
            <strong>Postadress</strong>
            <p className="muted">{organization.address || "Ej angiven"}</p>
          </div>
          <div className="organization-detail">
            <strong>Etableringsort</strong>
            <p className="muted">{establishment || "Ej angiven"}</p>
          </div>
          <div className="organization-detail">
            <strong>Webbplats</strong>
            <p className="muted">
              {organization.website ? <a href={organization.website}>{organization.website}</a> : "Ej angiven"}
            </p>
          </div>
        </div>
        <div className="actions card-actions">
          <Link className="button secondary" href={`/dashboard/organizations/${organization.id}/edit`}>
            Redigera organisation
          </Link>
          <Link className="button secondary" href={`/dashboard/organizations/${organization.id}/events`}>
            Visa eventlogg
          </Link>
        </div>
      </section>

      <section className="organization-users" style={{ margin: "36px 0 20px" }}>
        <h2>Användare</h2>
        <div className="table-wrap">
          <table className="data-table user-table">
            <thead>
              <tr>
                <th>Användare</th>
                <th>Roll</th>
              </tr>
            </thead>
            <tbody>
              {(organizationMembers || []).map((member: OrganizationMember) => {
                const isCurrentUser = member.user_id === user.id;
                return (
                  <tr key={member.user_id}>
                    <td>
                      <Link
                        className="table-link"
                        href={`/dashboard/organizations/${organization.id}/users/${member.user_id}`}
                      >
                        {isCurrentUser ? user.email || "Du" : "Användare"}
                      </Link>
                      <p className="table-meta">{isCurrentUser ? "Inloggad användare" : `ID: ${member.user_id}`}</p>
                    </td>
                    <td>
                      <span className="pill">{roleLabel(member.role)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="actions card-actions">
          <button type="button" className="secondary" disabled>
            Bjud in användare
          </button>
        </div>
      </section>

      <section className="organization-campaigns" style={{ margin: "36px 0 20px" }}>
        <h2>Kampanjer</h2>

        {(campaigns || []).length > 0 ? (
          <div className="table-wrap" aria-label="Kampanjer">
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
          </div>
        ) : (
          <p className="muted campaign-empty-text">Skapa en kampanj för att få publik länk och QR-kod.</p>
        )}
        <div className="actions card-actions">
          <Link className="button" href={`/dashboard/campaigns/new?organization=${organization.id}`}>
            Skapa ny kampanj
          </Link>
        </div>
      </section>
    </main>
  );
}

function statusLabel(status: string) {
  if (status === "active") return "Publicerad";
  if (status === "archived") return "Arkiverad";
  return "Utkast";
}

function roleLabel(role: string | null) {
  if (role === "owner") return "Ägare";
  if (role === "admin") return "Administratör";
  return "Medlem";
}

function formatLegalForm(value: string | null) {
  if (value === "juridisk_person") return "Juridisk person";
  if (value === "fysisk_person") return "Fysisk person";
  if (value === "kampanjorganisation") return "Politisk kampanjorganisation utan juridisk personlighet";
  return "Ej angiven";
}

function normalizeOrganization(value: Organization | Organization[] | null) {
  return Array.isArray(value) ? value[0] : value;
}

function deriveEstablishmentFromAddress(address: string | null) {
  if (!address) return null;

  const lastAddressPart = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .at(-1);
  if (!lastAddressPart) return null;

  const withoutPostalCode = lastAddressPart.replace(/^\d{3}\s?\d{2}\s+/, "").trim();
  return withoutPostalCode || lastAddressPart;
}

type OrganizationMember = {
  user_id: string;
  role: string | null;
  created_at: string;
};
