import Link from "next/link";
import { redirect } from "next/navigation";
import { normalizeOrganization } from "@/lib/format";
import { createClient, hasSupabaseEnv } from "@/utils/supabase/server";
import type { Organization } from "@/lib/types";
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
            {params.message ? <p className="form-message">{params.message}</p> : null}
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

  const { data: campaigns, error: campaignsError } = await supabase
    .from("campaigns")
    .select("id, organization_id")
    .in("organization_id", organizations.map((organization) => organization.id));

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

  const campaignCounts = new Map<string, number>();
  (campaigns || []).forEach((campaign: { organization_id: string }) => {
    campaignCounts.set(campaign.organization_id, (campaignCounts.get(campaign.organization_id) || 0) + 1);
  });

  return (
    <main className="shell" style={{ paddingBottom: 64 }}>
      <section className="row" style={{ alignItems: "end", paddingTop: 28 }}>
        <div>
          <h1>Organisationer</h1>
          <p className="lead">Välj en organisation för att se och hantera dess kampanjer.</p>
        </div>
      </section>

      {params.message ? <p className="notice">{params.message}</p> : null}

      <section className="grid">
        {organizations.map((organization) => (
          <article className="card grid" key={organization.id}>
            <div className="row">
              <div>
                <h2>{organization.name}</h2>
                <p className="muted">
                  {organization.org_number || "Organisationsnummer ej angivet"}
                  {organization.website ? ` · ${organization.website}` : ""}
                </p>
              </div>
              <span className="pill">{campaignCounts.get(organization.id) || 0} kampanjer</span>
            </div>
            <div className="actions">
              <Link className="button" href={`/dashboard/organizations/${organization.id}`}>
                Öppna organisation
              </Link>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
