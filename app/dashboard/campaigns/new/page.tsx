import { redirect } from "next/navigation";
import { normalizeOrganization } from "@/lib/format";
import { getOrganizationContacts } from "@/lib/organizationContacts";
import { CampaignForm } from "@/components/CampaignForm";
import { createClient } from "@/utils/supabase/server";
import type { Organization } from "@/lib/types";

export default async function NewCampaignPage({
  searchParams
}: {
  searchParams: Promise<{ message?: string; organization?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: memberships, error: membershipsError } = await supabase
    .from("organization_members")
    .select("organizations(*)")
    .eq("user_id", user.id);

  if (membershipsError) redirect("/dashboard?message=" + encodeURIComponent("Det gick inte att hämta organisationer."));

  const organizations = (memberships || [])
    .map((membership) => normalizeOrganization(membership.organizations))
    .filter(Boolean) as Organization[];

  if (organizations.length === 0) redirect("/dashboard");

  const selectedOrganizationId = organizations.some((organization) => organization.id === params.organization)
    ? params.organization
    : organizations[0].id;
  const organizationContacts = await getOrganizationContacts(organizations.map((organization) => organization.id), user);

  return (
    <main className="shell" style={{ paddingBottom: 64 }}>
      <h1>Ny kampanj</h1>
      <p className="lead">Fyll i uppgifterna som ska publiceras i transparensmeddelandet.</p>
      <CampaignForm
        organizations={organizations}
        organizationContacts={organizationContacts}
        currentUserId={user.id}
        message={params.message}
        selectedOrganizationId={selectedOrganizationId}
      />
    </main>
  );
}
