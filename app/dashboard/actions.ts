"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { slugify } from "@/lib/format";
import { createClient } from "@/utils/supabase/server";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  return { supabase, user };
}

export async function createOrganization(formData: FormData) {
  const { supabase, user } = await requireUser();
  const name = String(formData.get("name") || "").trim();
  const orgNumber = String(formData.get("org_number") || "").trim() || null;
  const website = String(formData.get("website") || "").trim() || null;

  if (!name) redirect("/dashboard?message=Organisationens namn saknas.");

  const { data, error } = await supabase
    .from("organizations")
    .insert({ name, org_number: orgNumber, website, created_by: user.id })
    .select("id")
    .single();

  if (error || !data) {
    redirect(`/dashboard?message=${encodeURIComponent(error?.message || "Organisationen kunde inte skapas.")}`);
  }

  await supabase.from("organization_members").insert({
    organization_id: data.id,
    user_id: user.id,
    role: "owner"
  });

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function saveCampaign(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const organizationId = String(formData.get("organization_id") || "");
  const slugBase = slugify(name || "kampanj");

  const payload = {
    organization_id: organizationId,
    status: String(formData.get("status") || "draft"),
    language: String(formData.get("language") || "sv"),
    name,
    sponsor_name: String(formData.get("sponsor_name") || "").trim(),
    sponsor_contact: String(formData.get("sponsor_contact") || "").trim(),
    controlling_entity: String(formData.get("controlling_entity") || "").trim() || null,
    publisher_name: String(formData.get("publisher_name") || "").trim() || null,
    publisher_contact: String(formData.get("publisher_contact") || "").trim() || null,
    period_start: String(formData.get("period_start") || ""),
    period_end: String(formData.get("period_end") || ""),
    amount_message: numberOrNull(formData.get("amount_message")),
    amount_campaign: numberOrNull(formData.get("amount_campaign")),
    funds_origin: String(formData.get("funds_origin") || "").trim(),
    calculation_method: String(formData.get("calculation_method") || "").trim(),
    linked_process: String(formData.get("linked_process") || "").trim() || null,
    targeting_used: formData.get("targeting_used") === "on",
    targeting_description: String(formData.get("targeting_description") || "").trim() || null,
    delivery_description: String(formData.get("delivery_description") || "").trim() || null,
    consent_withdrawal_url: String(formData.get("consent_withdrawal_url") || "").trim() || null,
    complaint_contact: String(formData.get("complaint_contact") || "").trim(),
    complaint_url: String(formData.get("complaint_url") || "").trim() || null,
    ad_channels: String(formData.get("ad_channels") || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  };

  if (!id) {
    const slug = `${slugBase}-${randomUUID().slice(0, 8)}`;
    const { error } = await supabase.from("campaigns").insert({ ...payload, slug });
    if (error) redirect(`/dashboard/campaigns/new?message=${encodeURIComponent(error.message)}`);
  } else {
    const { error } = await supabase.from("campaigns").update(payload).eq("id", id);
    if (error) redirect(`/dashboard/campaigns/${id}?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

function numberOrNull(value: FormDataEntryValue | null) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && value !== "" && value !== null ? parsed : null;
}
