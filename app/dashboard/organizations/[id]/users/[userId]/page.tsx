import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { normalizeOrganization } from "@/lib/format";
import { createClient } from "@/utils/supabase/server";
import type { Organization } from "@/lib/types";

export default async function OrganizationUserPage({
  params
}: {
  params: Promise<{ id: string; userId: string }>;
}) {
  const { id, userId } = await params;
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: currentMembership } = await supabase
    .from("organization_members")
    .select("organizations(*)")
    .eq("user_id", user.id)
    .eq("organization_id", id)
    .maybeSingle();

  const organization = normalizeOrganization(currentMembership?.organizations || null) as Organization | null;
  if (!organization) notFound();

  const { data: member } = await supabase
    .from("organization_members")
    .select("user_id, role, created_at")
    .eq("organization_id", organization.id)
    .eq("user_id", userId)
    .maybeSingle();

  if (!member) notFound();

  const { data: userMemberships } = await supabase
    .from("organization_members")
    .select("organization_id, role, created_at, organizations(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  const isCurrentUser = member.user_id === user.id;

  return (
    <main className="shell" style={{ paddingBottom: 64 }}>
      <section style={{ paddingTop: 28 }}>
        <h1>{isCurrentUser ? user.email || "Du" : "Användare"}</h1>
        <p className="lead">Se användarens uppgifter och organisationer.</p>
      </section>

      <section className="organization-details" style={{ margin: "20px 0" }}>
        <div className="organization-detail-grid">
          <div className="organization-detail">
            <strong>E-postadress</strong>
            <p className="muted">{isCurrentUser ? user.email || "Ej angiven" : "Ej tillgänglig"}</p>
          </div>
          <div className="organization-detail">
            <strong>Användar-id</strong>
            <p className="muted">{member.user_id}</p>
          </div>
          <div className="organization-detail">
            <strong>Konto skapat</strong>
            <p className="muted">{isCurrentUser ? formatDateTime(user.created_at) : "Ej tillgängligt"}</p>
          </div>
          <div className="organization-detail">
            <strong>Senaste inloggning</strong>
            <p className="muted">
              {isCurrentUser && user.last_sign_in_at ? formatDateTime(user.last_sign_in_at) : "Ej tillgängligt"}
            </p>
          </div>
        </div>
        <div className="actions card-actions">
          <button type="button" className="secondary" disabled>
            Redigera användare
          </button>
        </div>
      </section>

      <section className="user-organizations" style={{ margin: "36px 0 20px" }}>
        <h2>Organisationer</h2>
        <div className="table-wrap">
          <table className="data-table user-organizations-table">
            <thead>
              <tr>
                <th>Organisation</th>
                <th>Roll</th>
                <th>Tillagd</th>
              </tr>
            </thead>
            <tbody>
              {(userMemberships || []).map((membership: UserMembership) => {
                const userOrganization = normalizeOrganization(membership.organizations) as Organization | null;
                return (
                  <tr key={membership.organization_id}>
                    <td>
                      {userOrganization ? (
                        <Link className="table-link" href={`/dashboard/organizations/${userOrganization.id}`}>
                          {userOrganization.name}
                        </Link>
                      ) : (
                        "Organisation"
                      )}
                    </td>
                    <td>
                      <span className="pill">{roleLabel(membership.role)}</span>
                    </td>
                    <td>{formatDateTime(membership.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="actions card-actions">
          <Link className="button" href="/dashboard?new=organization">
            Skapa ny organisation
          </Link>
        </div>
      </section>
    </main>
  );
}

function roleLabel(role: string | null) {
  if (role === "owner") return "Ägare";
  if (role === "admin") return "Administratör";
  return "Medlem";
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("sv-SE", {
    dateStyle: "long",
    timeStyle: "short"
  }).format(new Date(value));
}

type UserMembership = {
  organization_id: string;
  role: string | null;
  created_at: string;
  organizations: Organization | Organization[] | null;
};
