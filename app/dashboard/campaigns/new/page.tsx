import { redirect } from "next/navigation";
import { CampaignForm } from "@/components/CampaignForm";
import { createClient } from "@/utils/supabase/server";
import type { Organization } from "@/lib/types";

export default async function NewCampaignPage({
  searchParams
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: memberships } = await supabase
    .from("organization_members")
    .select("organizations(*)")
    .eq("user_id", user.id);

  const organizations = (memberships || [])
    .map((membership) => normalizeOrganization(membership.organizations))
    .filter(Boolean) as Organization[];

  if (organizations.length === 0) redirect("/dashboard");

  return (
    <main className="shell" style={{ paddingBottom: 64 }}>
      <h1>Ny kampanj</h1>
      <p className="lead">Fyll i uppgifterna som ska publiceras i transparensmeddelandet.</p>
      <CampaignForm organizations={organizations} message={params.message} />
    </main>
  );
}

function normalizeOrganization(value: Organization | Organization[] | null) {
  return Array.isArray(value) ? value[0] : value;
}
