import { notFound, redirect } from "next/navigation";
import { CampaignForm } from "@/components/CampaignForm";
import { normalizeOrganization, publicCampaignUrl } from "@/lib/format";
import { getOrganizationContacts } from "@/lib/organizationContacts";
import { createClient } from "@/utils/supabase/server";
import type { Campaign, Organization } from "@/lib/types";

export default async function EditCampaignPage({
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

  const { data: memberships } = await supabase
    .from("organization_members")
    .select("organizations(*)")
    .eq("user_id", user.id);

  const organizations = (memberships || [])
    .map((membership) => normalizeOrganization(membership.organizations))
    .filter(Boolean) as Organization[];
  const organizationContacts = await getOrganizationContacts(organizations.map((organization) => organization.id), user);

  const { data: campaign } = await supabase.from("campaigns").select("*").eq("id", id).single();
  if (!campaign) notFound();

  return (
    <main className="shell" style={{ paddingBottom: 64 }}>
      <h1>Uppdatera kampanj</h1>
      <p className="lead">
        Publik sida:{" "}
        <a href={publicCampaignUrl((campaign as Campaign).slug)}>{publicCampaignUrl((campaign as Campaign).slug)}</a>
      </p>
      <CampaignForm
        campaign={campaign as Campaign}
        organizations={organizations}
        organizationContacts={organizationContacts}
        currentUserId={user.id}
        message={query.message}
      />
    </main>
  );
}
