"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type OrganizationCrumb = {
  id: string;
  name: string;
};

export function Breadcrumb() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [organization, setOrganization] = useState<OrganizationCrumb | null>(null);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | null>(null);

  const showOrganizations =
    pathname === "/" ||
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/organizations") ||
    pathname.startsWith("/dashboard/campaigns");

  const routeOrganizationId = pathname.match(/^\/dashboard\/organizations\/([^/]+)/)?.[1] || null;
  const campaignOrganizationId = pathname.startsWith("/dashboard/campaigns")
    ? searchParams.get("organization") || selectedOrganizationId
    : null;
  const organizationId = routeOrganizationId || campaignOrganizationId;

  useEffect(() => {
    function handleOrganizationChange(event: Event) {
      const detail = (event as CustomEvent<{ organizationId?: string }>).detail;
      setSelectedOrganizationId(detail?.organizationId || null);
    }

    window.addEventListener("openttpa:organization-change", handleOrganizationChange);
    return () => window.removeEventListener("openttpa:organization-change", handleOrganizationChange);
  }, []);

  useEffect(() => {
    if (!pathname.startsWith("/dashboard/campaigns")) setSelectedOrganizationId(null);
  }, [pathname]);

  useEffect(() => {
    let ignore = false;

    if (!organizationId) {
      setOrganization(null);
      return;
    }

    async function loadOrganization() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("organizations")
          .select("id, name")
          .eq("id", decodeURIComponent(organizationId || ""))
          .maybeSingle();

        if (!ignore) setOrganization(data || null);
      } catch {
        if (!ignore) setOrganization(null);
      }
    }

    setOrganization(null);
    loadOrganization();

    return () => {
      ignore = true;
    };
  }, [organizationId]);

  if (!showOrganizations) return null;

  return (
    <>
      <Link href="/">Start</Link>
      <span aria-hidden>&gt;</span>
      <Link href="/dashboard">Organisationer</Link>
      {organization ? (
        <>
          <span aria-hidden>&gt;</span>
          <Link href={`/dashboard/organizations/${organization.id}`}>{organization.name}</Link>
        </>
      ) : null}
    </>
  );
}
