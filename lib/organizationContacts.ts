import type { OrganizationContact } from "@/lib/types";
import { createClient } from "@/utils/supabase/server";

type MembershipRow = {
  organization_id: string;
  user_id: string;
  role: string | null;
};

type CurrentUserContact = {
  id: string;
  email?: string | null;
};

export async function getOrganizationContacts(
  organizationIds: string[],
  currentUser?: CurrentUserContact
): Promise<OrganizationContact[]> {
  if (organizationIds.length === 0) return [];

  const supabase = await createClient();
  const { data: memberships } = await supabase
    .from("organization_members")
    .select("organization_id, user_id, role")
    .in("organization_id", organizationIds);

  const uniqueMemberships = Array.from(
    new Map(
      ((memberships || []) as MembershipRow[]).map((membership) => [
        `${membership.organization_id}:${membership.user_id}`,
        membership
      ])
    ).values()
  );

  const userEmails = new Map<string, string>();
  if (currentUser?.email) userEmails.set(currentUser.id, currentUser.email);

  return uniqueMemberships
    .map((membership) => {
      const email = userEmails.get(membership.user_id);
      if (!email) return null;

      return {
        organization_id: membership.organization_id,
        user_id: membership.user_id,
        email,
        role: membership.role
      };
    })
    .filter((contact): contact is OrganizationContact => Boolean(contact));
}
