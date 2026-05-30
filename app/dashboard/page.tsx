import Link from "next/link";
import { redirect } from "next/navigation";
import { formatDate, normalizeOrganization, publicCampaignUrl } from "@/lib/format";
import { createClient, hasSupabaseEnv } from "@/utils/supabase/server";
import type { Campaign, Organization } from "@/lib/types";
import { createOrganization } from "./actions";

export default async function DashboardPage({
  searchParams
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;

  if (!hasSupabaseEnv()) {
    return (
      <main className="shell">
        <section className="panel">
          <h1>Supabase saknas</h1>
          <p className="muted">
            Lägg in variablerna från <code>.env.example</code> i <code>.env.local</code> för att
            använda inloggning, databas och statistik.
          </p>
        </section>
      </main>
    );
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: memberships, error: membershipsError } = await supabase
    .from("organization_members")
    .select("organizations(*)")
    .eq("user_id", user.id);

  if (membershipsError) {
    return (
      <main className="shell">
        <section className="panel">
          <h1>Något gick fel</h1>
          <p className="muted">Det gick inte att hämta dina organisationer. Försök igen senare.</p>
        </section>
      </main>
    );
  }

  const organizations = ((memberships || [])
    .map((membership) => normalizeOrganization(membership.organizations))
    .filter(Boolean) || []) as Organization[];

  if (organizations.length === 0) {
    return (
      <main className="shell">
        <section className="grid two" style={{ alignItems: "start", paddingTop: 40 }}>
          <div>
            <h1>Skapa organisation</h1>
            <p className="lead">
              Organisationen håller ihop sponsorer, kampanjer och användare. Du kan lägga till fler
              kampanjer efter detta steg.
            </p>
          </div>
          <form className="panel grid" action={createOrganization}>
            <label>
              Organisationsnamn
              <input name="name" required />
            </label>
            <label>
              Organisationsnummer
              <input name="org_number" />
            </label>
            <label>
              Webbplats
              <input name="website" type="url" placeholder="https://..." />
            </label>
            <button type="submit">Skapa organisation</button>
          </form>
        </section>
      </main>
    );
  }

  const organizationIds = organizations.map((organization) => organization.id);
  const { data: campaigns, error: campaignsError } = await supabase
    .from("campaigns")
    .select("*, organizations(*)")
    .in("organization_id", organizationIds)
    .order("updated_at", { ascending: false });

  if (campaignsError) {
    return (
      <main className="shell">
        <section className="panel">
          <h1>Något gick fel</h1>
          <p className="muted">Det gick inte att hämta dina kampanjer. Försök igen senare.</p>
        </section>
      </main>
    );
  }

  const { data: viewRows } = await supabase
    .from("campaign_view_counts")
    .select("campaign_id, views")
    .in("campaign_id", (campaigns || []).map((campaign: Campaign) => campaign.id));

  const viewsByCampaign = new Map((viewRows || []).map((row: { campaign_id: string; views: number }) => [row.campaign_id, row.views]));

  return (
    <main className="shell" style={{ paddingBottom: 64 }}>
      <section className="row" style={{ alignItems: "end", paddingTop: 28 }}>
        <div>
          <h1>Kampanjer</h1>
          <p className="muted">Inloggad som {user.email}</p>
        </div>
        <Link className="button secondary" href="/profile">
          Profil
        </Link>
      </section>

      {params.message ? <p className="notice">{params.message}</p> : null}

      <section className="actions" style={{ margin: "20px 0" }}>
        <Link className="button" href="/dashboard/campaigns/new">
          Ny kampanj
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
                    {campaign.organizations?.name} · {formatDate(campaign.period_start)} till{" "}
                    {formatDate(campaign.period_end)}
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

