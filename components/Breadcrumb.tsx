"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type OrganizationCrumb = {
  id: string;
  name: string;
};

type CampaignCrumb = {
  id: string;
  name: string;
  organization_id: string;
};

export function Breadcrumb() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [organization, setOrganization] = useState<OrganizationCrumb | null>(null);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | null>(null);
  const [campaign, setCampaign] = useState<CampaignCrumb | null>(null);

  const showOrganizations =
    pathname === "/" ||
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/organizations") ||
    pathname.startsWith("/dashboard/campaigns");

  const routeOrganizationId = pathname.match(/^\/dashboard\/organizations\/([^/]+)/)?.[1] || null;
  const routeCampaignIdMatch = pathname.match(/^\/dashboard\/campaigns\/([^/]+)/)?.[1] || null;
  const routeCampaignId = routeCampaignIdMatch === "new" ? null : routeCampaignIdMatch;
  const selectedCampaignOrganizationId = pathname.startsWith("/dashboard/campaigns")
    ? searchParams.get("organization") || selectedOrganizationId || campaign?.organization_id || null
    : null;
  const organizationId = routeOrganizationId || selectedCampaignOrganizationId;
  const isNewCampaignPage = pathname === "/dashboard/campaigns/new";
  const isEditCampaignPage = Boolean(pathname.match(/^\/dashboard\/campaigns\/[^/]+\/edit$/));
  const isEditOrganizationPage = Boolean(pathname.match(/^\/dashboard\/organizations\/[^/]+\/edit$/));
  const isOrganizationUserPage = Boolean(pathname.match(/^\/dashboard\/organizations\/[^/]+\/users\/[^/]+$/));

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

    if (!routeCampaignId) {
      setCampaign(null);
      return;
    }

    async function loadCampaign() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("campaigns")
          .select("id, name, organization_id")
          .eq("id", decodeURIComponent(routeCampaignId || ""))
          .maybeSingle();

        if (!ignore) setCampaign(data || null);
      } catch {
        if (!ignore) setCampaign(null);
      }
    }

    setCampaign(null);
    loadCampaign();

    return () => {
      ignore = true;
    };
  }, [routeCampaignId]);

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
      {isEditOrganizationPage ? (
        <>
          <span aria-hidden>&gt;</span>
          <span>Redigera organisation</span>
        </>
      ) : null}
      {isOrganizationUserPage ? (
        <>
          <span aria-hidden>&gt;</span>
          <span>Användare</span>
        </>
      ) : null}
      {isNewCampaignPage ? (
        <>
          <span aria-hidden>&gt;</span>
          <span>Ny kampanj</span>
        </>
      ) : null}
      {campaign ? (
        <>
          <span aria-hidden>&gt;</span>
          {isEditCampaignPage ? (
            <Link href={`/dashboard/campaigns/${campaign.id}`}>{campaign.name}</Link>
          ) : (
            <span>{campaign.name}</span>
          )}
        </>
      ) : null}
      {isEditCampaignPage ? (
        <>
          <span aria-hidden>&gt;</span>
          <span>Redigera kampanj</span>
        </>
      ) : null}
    </>
  );
}
