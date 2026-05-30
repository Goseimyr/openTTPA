"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
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

const organizationSchema = z.object({
  name: z.string().min(1, "Organisationens namn saknas."),
  org_number: z.string().optional(),
  website: z.string().url("Webbplatsen måste vara en giltig URL (börja med https://).").optional().or(z.literal(""))
});

const campaignSchema = z.object({
  name: z.string().min(1, "Kampanjnamn saknas."),
  organization_id: z.string().uuid("Ogiltig organisation."),
  status: z.enum(["draft", "active", "archived"]),
  language: z.string().min(1, "Språk saknas."),
  sponsor_name: z.string().min(1, "Sponsorns namn saknas."),
  sponsor_contact: z.string().min(1, "Sponsorns kontaktuppgifter saknas."),
  controlling_entity: z.string().optional(),
  publisher_name: z.string().optional(),
  publisher_contact: z.string().optional(),
  period_start: z.string().min(1, "Startdatum saknas."),
  period_end: z.string().min(1, "Slutdatum saknas."),
  amount_message: z.string().optional(),
  amount_campaign: z.string().optional(),
  funds_origin: z.string().min(1, "Ursprung för ekonomiska medel saknas."),
  calculation_method: z.string().min(1, "Beräkningsmetod saknas."),
  linked_process: z.string().optional(),
  targeting_used: z.string().optional(),
  targeting_description: z.string().optional(),
  delivery_description: z.string().optional(),
  consent_withdrawal_url: z
    .string()
    .url("Länk för återkallande av samtycke måste vara en giltig URL.")
    .optional()
    .or(z.literal("")),
  complaint_contact: z.string().min(1, "Kontaktuppgifter för klagomål saknas."),
  complaint_url: z
    .string()
    .url("Klagomålslänk måste vara en giltig URL.")
    .optional()
    .or(z.literal("")),
  ad_channels: z.string().optional()
}).refine(
  (data) => !data.period_start || !data.period_end || data.period_start <= data.period_end,
  { message: "Startdatum måste vara före eller samma som slutdatum.", path: ["period_end"] }
);

export async function createOrganization(formData: FormData) {
  const { supabase, user } = await requireUser();

  const raw = {
    name: String(formData.get("name") || "").trim(),
    org_number: String(formData.get("org_number") || "").trim(),
    website: String(formData.get("website") || "").trim()
  };

  const result = organizationSchema.safeParse(raw);
  if (!result.success) {
    const message = result.error.issues[0]?.message || "Ogiltiga uppgifter.";
    redirect(`/dashboard?message=${encodeURIComponent(message)}`);
  }

  const { name, org_number, website } = result.data;

  const { data, error } = await supabase.rpc("create_organization_with_owner", {
    organization_name: name,
    organization_org_number: org_number || null,
    organization_website: website || null
  });

  if (error || !data) {
    console.error("create_organization_with_owner failed", {
      userId: user.id,
      error
    });
    redirect(`/dashboard?message=${encodeURIComponent(error?.message || "Organisationen kunde inte skapas.")}`);
  }

  console.info("Organization created", {
    organizationId: data,
    userId: user.id
  });

  revalidatePath("/dashboard");
  redirect(`/dashboard?created=${encodeURIComponent(String(data))}`);
}

export async function updateOrganization(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("id") || "");

  const raw = {
    name: String(formData.get("name") || "").trim(),
    org_number: String(formData.get("org_number") || "").trim(),
    website: String(formData.get("website") || "").trim()
  };

  const result = organizationSchema.safeParse(raw);
  if (!id) redirect("/dashboard?message=Organisation saknas.");

  if (!result.success) {
    const message = result.error.issues[0]?.message || "Ogiltiga uppgifter.";
    redirect(`/dashboard/organizations/${id}/edit?message=${encodeURIComponent(message)}`);
  }

  const { name, org_number, website } = result.data;
  const { error } = await supabase
    .from("organizations")
    .update({
      name,
      org_number: org_number || null,
      website: website || null
    })
    .eq("id", id);

  if (error) {
    redirect(`/dashboard/organizations/${id}/edit?message=${encodeURIComponent("Organisationen kunde inte sparas.")}`);
  }

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/organizations/${id}`);
  redirect(`/dashboard/organizations/${id}?message=${encodeURIComponent("Organisationen har sparats.")}`);
}

export async function saveCampaign(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("id") || "");

  const raw = {
    name: String(formData.get("name") || "").trim(),
    organization_id: String(formData.get("organization_id") || ""),
    status: String(formData.get("status") || "draft"),
    language: String(formData.get("language") || "sv"),
    sponsor_name: String(formData.get("sponsor_name") || "").trim(),
    sponsor_contact: String(formData.get("sponsor_contact") || "").trim(),
    controlling_entity: String(formData.get("controlling_entity") || "").trim(),
    publisher_name: String(formData.get("publisher_name") || "").trim(),
    publisher_contact: String(formData.get("publisher_contact") || "").trim(),
    period_start: String(formData.get("period_start") || ""),
    period_end: String(formData.get("period_end") || ""),
    amount_message: String(formData.get("amount_message") || ""),
    amount_campaign: String(formData.get("amount_campaign") || ""),
    funds_origin: String(formData.get("funds_origin") || "").trim(),
    calculation_method: String(formData.get("calculation_method") || "").trim(),
    linked_process: String(formData.get("linked_process") || "").trim(),
    targeting_used: formData.get("targeting_used") === "on" ? "on" : "",
    targeting_description: String(formData.get("targeting_description") || "").trim(),
    delivery_description: String(formData.get("delivery_description") || "").trim(),
    consent_withdrawal_url: String(formData.get("consent_withdrawal_url") || "").trim(),
    complaint_contact: String(formData.get("complaint_contact") || "").trim(),
    complaint_url: String(formData.get("complaint_url") || "").trim(),
    ad_channels: String(formData.get("ad_channels") || "")
  };

  const backUrl = id ? `/dashboard/campaigns/${id}` : "/dashboard/campaigns/new";
  const result = campaignSchema.safeParse(raw);
  if (!result.success) {
    const message = result.error.issues[0]?.message || "Ogiltiga uppgifter.";
    redirect(`${backUrl}?message=${encodeURIComponent(message)}`);
  }

  const {
    name,
    organization_id,
    status,
    language,
    sponsor_name,
    sponsor_contact,
    controlling_entity,
    publisher_name,
    publisher_contact,
    period_start,
    period_end,
    funds_origin,
    calculation_method,
    linked_process,
    targeting_used,
    targeting_description,
    delivery_description,
    consent_withdrawal_url,
    complaint_contact,
    complaint_url,
    ad_channels,
    amount_message: amtMsg,
    amount_campaign: amtCmp
  } = result.data;

  const payload = {
    organization_id,
    status,
    language,
    name,
    sponsor_name,
    sponsor_contact,
    controlling_entity: controlling_entity || null,
    publisher_name: publisher_name || null,
    publisher_contact: publisher_contact || null,
    period_start,
    period_end,
    amount_message: parseAmount(amtMsg),
    amount_campaign: parseAmount(amtCmp),
    funds_origin,
    calculation_method,
    linked_process: linked_process || null,
    targeting_used: targeting_used === "on",
    targeting_description: targeting_description || null,
    delivery_description: delivery_description || null,
    consent_withdrawal_url: consent_withdrawal_url || null,
    complaint_contact,
    complaint_url: complaint_url || null,
    ad_channels: (ad_channels ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  };

  if (!id) {
    const slugBase = slugify(name || "kampanj");
    const slug = `${slugBase}-${randomUUID().slice(0, 8)}`;
    const { error } = await supabase.from("campaigns").insert({ ...payload, slug });
    if (error) redirect(`/dashboard/campaigns/new?message=${encodeURIComponent("Kampanjen kunde inte skapas.")}`);
  } else {
    const { error } = await supabase.from("campaigns").update(payload).eq("id", id);
    if (error) redirect(`/dashboard/campaigns/${id}?message=${encodeURIComponent("Kampanjen kunde inte sparas.")}`);
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

function parseAmount(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
