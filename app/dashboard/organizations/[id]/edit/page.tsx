import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { normalizeOrganization } from "@/lib/format";
import { updateOrganization } from "@/app/dashboard/actions";
import { createClient } from "@/utils/supabase/server";
import type { Organization } from "@/lib/types";

export default async function EditOrganizationPage({
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

  return (
    <main className="shell" style={{ paddingBottom: 64 }}>
      <section style={{ paddingTop: 28 }}>
        <h1>Redigera organisation</h1>
        <p className="lead">Uppdatera grunduppgifterna för {organization.name}.</p>
      </section>

      <form className="card organization-details" action={updateOrganization} style={{ margin: "20px 0" }}>
        <input type="hidden" name="id" value={organization.id} />
        <h2>Organisation</h2>
        {query.message ? <p className="form-message">{query.message}</p> : null}
        <div className="organization-detail-grid">
          <label>
            Namn
            <input name="name" defaultValue={organization.name} required />
          </label>
          <label>
            Registrerat namn, om annat
            <input name="registered_name" defaultValue={organization.registered_name || ""} />
          </label>
          <label>
            Juridisk form
            <select name="legal_form" defaultValue={organization.legal_form || ""} required>
              <option value="">Välj juridisk form</option>
              <option value="juridisk_person">Juridisk person</option>
              <option value="fysisk_person">Fysisk person</option>
              <option value="kampanjorganisation">Politisk kampanjorganisation utan juridisk personlighet</option>
            </select>
          </label>
          <label>
            Organisationsnummer
            <input name="org_number" defaultValue={organization.org_number || ""} required />
          </label>
          <label>
            E-postadress
            <input name="email" type="email" defaultValue={organization.email || ""} required />
          </label>
          <label>
            Postadress
            <input name="address" defaultValue={organization.address || ""} required />
          </label>
          <label>
            Webbplats
            <input name="website" type="url" placeholder="https://..." defaultValue={organization.website || ""} required />
          </label>
          <label>
            Etableringsort, om annan än postadress
            <input name="establishment" defaultValue={organization.establishment || ""} />
          </label>
        </div>
        <div className="actions card-actions">
          <button type="submit">Spara organisation</button>
          <Link className="button secondary" href={`/dashboard/organizations/${organization.id}`}>
            Avbryt
          </Link>
        </div>
      </form>
    </main>
  );
}
