import Link from "next/link";
import { redirect } from "next/navigation";
import { normalizeOrganization } from "@/lib/format";
import { createClient, hasSupabaseEnv } from "@/utils/supabase/server";
import type { Organization } from "@/lib/types";
import { createOrganization } from "./actions";

export default async function DashboardPage({
  searchParams
}: {
  searchParams: Promise<{
    message?: string;
    new?: string;
    name?: string;
    registered_name?: string;
    legal_form?: string;
    org_number?: string;
    email?: string;
    address?: string;
    website?: string;
    establishment?: string;
  }>;
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

  if (organizations.length === 0 || params.new === "organization") {
    return (
      <main className="shell" style={{ paddingBottom: 64 }}>
        <section style={{ paddingTop: 28 }}>
          <h1>Skapa ny organisation</h1>
          <p className="lead">
            Organisationen håller ihop sponsorer, kampanjer och användare. Du kan lägga till fler kampanjer
            efter detta steg.
          </p>
        </section>

        <form className="card organization-details" action={createOrganization} style={{ margin: "20px 0" }}>
          <h2>Organisation</h2>
          {params.message ? <p className="form-message">{params.message}</p> : null}
          <div className="organization-detail-grid">
            <label>
              Namn
              <input name="name" defaultValue={params.name || ""} required />
            </label>
            <label>
              Registrerat namn, om annat
              <input name="registered_name" defaultValue={params.registered_name || ""} />
            </label>
            <label>
              Juridisk form
              <select name="legal_form" defaultValue={params.legal_form || ""} required>
                <option value="">Välj juridisk form</option>
                <option value="juridisk_person">Juridisk person</option>
                <option value="fysisk_person">Fysisk person</option>
                <option value="kampanjorganisation">Politisk kampanjorganisation utan juridisk personlighet</option>
              </select>
            </label>
            <label>
              Organisationsnummer
              <input name="org_number" defaultValue={params.org_number || ""} required />
            </label>
            <label>
              E-postadress
              <input name="email" type="email" defaultValue={params.email || ""} required />
            </label>
            <label>
              Postadress
              <input name="address" defaultValue={params.address || ""} required />
            </label>
            <label>
              Webbplats
              <input name="website" type="url" placeholder="https://..." defaultValue={params.website || ""} required />
            </label>
            <label>
              Etableringsort, om annan än postadress
              <input name="establishment" defaultValue={params.establishment || ""} />
            </label>
          </div>
          <div className="actions card-actions">
            <button type="submit">Skapa ny organisation</button>
            {organizations.length > 0 ? (
              <Link className="button secondary" href="/dashboard">
                Avbryt
              </Link>
            ) : null}
          </div>
        </form>
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

      <section className="table-wrap" aria-label="Organisationer">
        <table className="data-table organization-table">
          <colgroup>
            <col className="name-column" />
            <col className="number-column" />
            <col className="website-column" />
            <col className="count-column" />
          </colgroup>
          <thead>
            <tr>
              <th>Organisation</th>
              <th>Organisationsnummer</th>
              <th>Webbplats</th>
              <th>Kampanjer</th>
            </tr>
          </thead>
          <tbody>
            {organizations.map((organization) => (
              <tr key={organization.id}>
                <td>
                  <Link className="table-link" href={`/dashboard/organizations/${organization.id}`}>
                    {organization.name}
                  </Link>
                </td>
                <td>{organization.org_number || "Ej angivet"}</td>
                <td>
                  {organization.website ? (
                    <a className="table-url" href={organization.website}>
                      {organization.website}
                    </a>
                  ) : (
                    "Ej angiven"
                  )}
                </td>
                <td>{campaignCounts.get(organization.id) || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="actions" style={{ marginTop: 20 }}>
        <Link className="button" href="/dashboard?new=organization">
          Skapa ny organisation
        </Link>
      </section>
    </main>
  );
}
