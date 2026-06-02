"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
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
  website: z.string().url("Webbplatsen måste vara en giltig URL (börja med https://).").optional().or(z.literal("")),
  legal_form: z.string().optional(),
  registered_name: z.string().optional(),
  email: z.string().email("E-postadressen måste vara giltig.").optional().or(z.literal("")),
  address: z.string().optional(),
  establishment: z.string().optional()
});

const optionalUrl = z.string().url("Länken måste vara en giltig URL.").optional().or(z.literal(""));
const optionalDate = z.string().optional();
const optionalText = z.string().optional();

const campaignSchema = z.object({
  name: z.string().min(1, "Kampanjnamn saknas."),
  organization_id: z.string().uuid("Ogiltig organisation."),
  status: z.enum(["draft"]),
  language: z.string().min(1, "Språk saknas."),
  sponsor_type: z.string().min(1, "Sponsorns typ saknas."),
  sponsor_registered_name: optionalText,
  sponsor_name: z.string().min(1, "Sponsorns namn saknas."),
  sponsor_email: z.string().min(1, "Sponsorns e-postadress saknas."),
  sponsor_address: z.string().min(1, "Sponsorns postadress saknas."),
  sponsor_establishment: optionalText,
  sponsor_registration_number: optionalText,
  sponsor_contact: z.string().min(1, "Sponsorns webbplats saknas."),
  controlling_entity: z.string().optional(),
  controlling_entity_registered_name: optionalText,
  controlling_entity_email: optionalText,
  controlling_entity_address: optionalText,
  controlling_entity_establishment: optionalText,
  controlling_entity_registration_number: optionalText,
  controlling_entity_contact: optionalText,
  payer_name: optionalText,
  payer_registered_name: optionalText,
  payer_email: optionalText,
  payer_address: optionalText,
  payer_establishment: optionalText,
  payer_registration_number: optionalText,
  payer_contact: optionalText,
  publisher_name: z.string().optional(),
  publisher_contact: z.string().optional(),
  period_start: z.string().min(1, "Startdatum saknas."),
  period_end: z.string().min(1, "Slutdatum saknas."),
  amount_message: z.string().min(1, "Belopp för reklammeddelandet saknas."),
  amount_campaign: z.string().min(1, "Belopp för kampanjen saknas."),
  amount_currency: z.string().min(1, "Valuta saknas."),
  in_kind_message: z.string().optional(),
  in_kind_campaign: z.string().optional(),
  amount_basis: optionalText,
  amount_includes_vat: optionalText,
  funds_origin: optionalText,
  funds_source_type: z.string().min(1, "Finansieringskälla saknas."),
  funds_source_region: z.string().min(1, "Finansieringens geografiska ursprung saknas."),
  calculation_method: z.string().min(1, "Beräkningsmetod saknas."),
  linked_process: z.string().optional(),
  process_type: optionalText,
  process_name: optionalText,
  process_level: optionalText,
  process_date: optionalDate,
  process_region: optionalText,
  official_info_url: optionalUrl,
  eu_database_url: optionalUrl,
  prior_non_compliance: optionalText,
  prior_non_compliance_description: optionalText,
  targeting_used: z.string().optional(),
  targeting_description: z.string().optional(),
  targeting_analysis_methods: optionalText,
  targeting_audience_groups: optionalText,
  targeting_personal_data_categories: optionalText,
  targeting_logic: optionalText,
  targeting_ai_systems: optionalText,
  targeting_period_start: optionalDate,
  targeting_period_end: optionalDate,
  targeting_impressions: z.string().optional(),
  targeting_clicks: z.string().optional(),
  targeting_likes: z.string().optional(),
  targeting_comments: z.string().optional(),
  targeting_policy_url: optionalUrl,
  targeting_additional_info: optionalText,
  delivery_description: z.string().optional(),
  consent_withdrawal_url: z
    .string()
    .url("Länk för återkallande av samtycke måste vara en giltig URL.")
    .optional()
    .or(z.literal("")),
  gdpr_controller_name: optionalText,
  gdpr_controller_contact: optionalText,
  gdpr_rights_url: optionalUrl,
  gdpr_info_url: optionalUrl,
  complaint_contact: z.string().min(1, "Kontaktperson för anmälan av överträdelse saknas."),
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
    website: String(formData.get("website") || "").trim(),
    legal_form: String(formData.get("legal_form") || "").trim(),
    registered_name: String(formData.get("registered_name") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    address: String(formData.get("address") || "").trim(),
    establishment:
      String(formData.get("establishment") || "").trim() ||
      deriveEstablishmentFromAddress(String(formData.get("address") || "").trim()) ||
      ""
  };

  const result = organizationSchema.safeParse(raw);
  if (!result.success) {
    const message = result.error.issues[0]?.message || "Ogiltiga uppgifter.";
    redirect(`/dashboard?new=organization&message=${encodeURIComponent(message)}`);
  }

  const { name, org_number, website, legal_form, registered_name, email, address, establishment } = result.data;

  const { data, error } = await supabase.rpc("create_organization_with_owner", {
    organization_name: name,
    organization_org_number: org_number || null,
    organization_website: website || null,
    organization_legal_form: legal_form || null,
    organization_registered_name: registered_name || null,
    organization_email: email || null,
    organization_address: address || null,
    organization_establishment: establishment || null
  });

  if (error || !data) {
    console.error("create_organization_with_owner failed", {
      userId: user.id,
      error
    });
    redirect(
      `/dashboard?new=organization&message=${encodeURIComponent(error?.message || "Organisationen kunde inte skapas.")}`
    );
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
    website: String(formData.get("website") || "").trim(),
    legal_form: String(formData.get("legal_form") || "").trim(),
    registered_name: String(formData.get("registered_name") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    address: String(formData.get("address") || "").trim(),
    establishment:
      String(formData.get("establishment") || "").trim() ||
      deriveEstablishmentFromAddress(String(formData.get("address") || "").trim()) ||
      ""
  };

  const result = organizationSchema.safeParse(raw);
  if (!id) redirect("/dashboard?message=Organisation saknas.");

  if (!result.success) {
    const message = result.error.issues[0]?.message || "Ogiltiga uppgifter.";
    redirect(`/dashboard/organizations/${id}/edit?message=${encodeURIComponent(message)}`);
  }

  const { name, org_number, website, legal_form, registered_name, email, address, establishment } = result.data;
  const { error } = await supabase
    .from("organizations")
    .update({
      name,
      org_number: org_number || null,
      website: website || null,
      legal_form: legal_form || null,
      registered_name: registered_name || null,
      email: email || null,
      address: address || null,
      establishment: establishment || null
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
    status: "draft",
    language: String(formData.get("language") || "Svenska"),
    sponsor_type: String(formData.get("sponsor_type") || "").trim(),
    sponsor_registered_name: String(formData.get("sponsor_registered_name") || "").trim(),
    sponsor_name: String(formData.get("sponsor_name") || "").trim(),
    sponsor_email: String(formData.get("sponsor_email") || "").trim(),
    sponsor_address: String(formData.get("sponsor_address") || "").trim(),
    sponsor_establishment: String(formData.get("sponsor_establishment") || "").trim(),
    sponsor_registration_number: String(formData.get("sponsor_registration_number") || "").trim(),
    sponsor_contact: String(formData.get("sponsor_contact") || "").trim(),
    controlling_entity: String(formData.get("controlling_entity") || "").trim(),
    controlling_entity_registered_name: String(formData.get("controlling_entity_registered_name") || "").trim(),
    controlling_entity_email: String(formData.get("controlling_entity_email") || "").trim(),
    controlling_entity_address: String(formData.get("controlling_entity_address") || "").trim(),
    controlling_entity_establishment: String(formData.get("controlling_entity_establishment") || "").trim(),
    controlling_entity_registration_number: String(formData.get("controlling_entity_registration_number") || "").trim(),
    controlling_entity_contact: String(formData.get("controlling_entity_contact") || "").trim(),
    payer_name: String(formData.get("payer_name") || "").trim(),
    payer_registered_name: String(formData.get("payer_registered_name") || "").trim(),
    payer_email: String(formData.get("payer_email") || "").trim(),
    payer_address: String(formData.get("payer_address") || "").trim(),
    payer_establishment: String(formData.get("payer_establishment") || "").trim(),
    payer_registration_number: String(formData.get("payer_registration_number") || "").trim(),
    payer_contact: String(formData.get("payer_contact") || "").trim(),
    publisher_name: String(formData.get("publisher_name") || "").trim(),
    publisher_contact: String(formData.get("publisher_contact") || "").trim(),
    period_start: String(formData.get("period_start") || ""),
    period_end: String(formData.get("period_end") || ""),
    amount_message: String(formData.get("amount_message") || ""),
    amount_campaign: String(formData.get("amount_campaign") || ""),
    amount_currency: String(formData.get("amount_currency") || "SEK").trim().toUpperCase(),
    in_kind_message: String(formData.get("in_kind_message") || ""),
    in_kind_campaign: String(formData.get("in_kind_campaign") || ""),
    amount_basis: String(formData.get("amount_basis") || "").trim(),
    amount_includes_vat: formData.get("amount_includes_vat") === "on" ? "on" : "",
    funds_origin: String(formData.get("funds_origin") || "").trim(),
    funds_source_type: String(formData.get("funds_source_type") || "").trim(),
    funds_source_region: String(formData.get("funds_source_region") || "").trim(),
    calculation_method: String(formData.get("calculation_method") || "").trim(),
    linked_process: String(formData.get("linked_process") || "").trim(),
    process_type: String(formData.get("process_type") || "").trim(),
    process_name: String(formData.get("process_name") || "").trim(),
    process_level: String(formData.get("process_level") || "").trim(),
    process_date: String(formData.get("process_date") || ""),
    process_region: String(formData.get("process_region") || "").trim(),
    official_info_url: String(formData.get("official_info_url") || "").trim(),
    eu_database_url: String(formData.get("eu_database_url") || "").trim(),
    prior_non_compliance: formData.get("prior_non_compliance") === "on" ? "on" : "",
    prior_non_compliance_description: String(formData.get("prior_non_compliance_description") || "").trim(),
    targeting_used: formData.get("targeting_used") === "on" ? "on" : "",
    targeting_description: String(formData.get("targeting_description") || "").trim(),
    targeting_analysis_methods: String(formData.get("targeting_analysis_methods") || "").trim(),
    targeting_audience_groups: String(formData.get("targeting_audience_groups") || "").trim(),
    targeting_personal_data_categories: String(formData.get("targeting_personal_data_categories") || "").trim(),
    targeting_logic: String(formData.get("targeting_logic") || "").trim(),
    targeting_ai_systems: String(formData.get("targeting_ai_systems") || "").trim(),
    targeting_period_start: String(formData.get("targeting_period_start") || ""),
    targeting_period_end: String(formData.get("targeting_period_end") || ""),
    targeting_impressions: String(formData.get("targeting_impressions") || ""),
    targeting_clicks: String(formData.get("targeting_clicks") || ""),
    targeting_likes: String(formData.get("targeting_likes") || ""),
    targeting_comments: String(formData.get("targeting_comments") || ""),
    targeting_policy_url: String(formData.get("targeting_policy_url") || "").trim(),
    targeting_additional_info: String(formData.get("targeting_additional_info") || "").trim(),
    delivery_description: String(formData.get("delivery_description") || "").trim(),
    consent_withdrawal_url: String(formData.get("consent_withdrawal_url") || "").trim(),
    gdpr_controller_name: String(formData.get("gdpr_controller_name") || "").trim(),
    gdpr_controller_contact: String(formData.get("gdpr_controller_contact") || "").trim(),
    gdpr_rights_url: String(formData.get("gdpr_rights_url") || "").trim(),
    gdpr_info_url: String(formData.get("gdpr_info_url") || "").trim(),
    complaint_contact: String(formData.get("complaint_contact") || "").trim(),
    complaint_url: String(formData.get("complaint_url") || "").trim(),
    ad_channels: String(formData.get("ad_channels") || "")
  };
  const sponsorSameAsOrganization = formData.get("sponsor_same_as_organization") === "on";
  const controllingEntitySameAsOrganization = formData.get("controlling_entity_same_as_organization") === "on";
  const payerSameAsOrganization = formData.get("payer_same_as_organization") === "on";
  const publisherSameAsOrganization = formData.get("publisher_same_as_organization") === "on";

  if (
    sponsorSameAsOrganization ||
    controllingEntitySameAsOrganization ||
    payerSameAsOrganization ||
    publisherSameAsOrganization
  ) {
    const { data: organization } = await supabase
      .from("organizations")
      .select("name, org_number, website, legal_form, registered_name, email, address, establishment")
      .eq("id", raw.organization_id)
      .maybeSingle();

    if (organization) {
      const organizationContact = organization.website || organization.name;

      if (sponsorSameAsOrganization) {
        raw.sponsor_type = organization.legal_form || "juridisk_person";
        raw.sponsor_name = organization.name;
        raw.sponsor_contact = organizationContact;
        raw.sponsor_registration_number = organization.org_number || "";
        raw.sponsor_registered_name = organization.registered_name || "";
        raw.sponsor_email = organization.email || "";
        raw.sponsor_address = organization.address || "";
        raw.sponsor_establishment = organization.establishment || deriveEstablishmentFromAddress(organization.address) || "";
      }

      if (controllingEntitySameAsOrganization) {
        raw.controlling_entity = organization.name;
        raw.controlling_entity_registered_name = organization.registered_name || "";
        raw.controlling_entity_email = organization.email || "";
        raw.controlling_entity_address = organization.address || "";
        raw.controlling_entity_establishment =
          organization.establishment || deriveEstablishmentFromAddress(organization.address) || "";
        raw.controlling_entity_registration_number = organization.org_number || "";
        raw.controlling_entity_contact = organizationContact;
      }

      if (payerSameAsOrganization) {
        raw.payer_name = organization.name;
        raw.payer_registered_name = organization.registered_name || "";
        raw.payer_email = organization.email || "";
        raw.payer_address = organization.address || "";
        raw.payer_establishment = organization.establishment || deriveEstablishmentFromAddress(organization.address) || "";
        raw.payer_registration_number = organization.org_number || "";
        raw.payer_contact = organizationContact;
      }

      if (publisherSameAsOrganization) {
        raw.publisher_name = organization.name;
        raw.publisher_contact = organizationContact;
      }
    }
  }

  raw.sponsor_establishment ||= deriveEstablishmentFromAddress(raw.sponsor_address) || "";
  raw.controlling_entity_establishment ||= deriveEstablishmentFromAddress(raw.controlling_entity_address) || "";
  raw.payer_establishment ||= deriveEstablishmentFromAddress(raw.payer_address) || "";

  const backUrl = id
    ? `/dashboard/campaigns/${id}/edit`
    : `/dashboard/campaigns/new?organization=${encodeURIComponent(raw.organization_id)}`;
  const result = campaignSchema.safeParse(raw);
  if (!result.success) {
    const message = result.error.issues[0]?.message || "Ogiltiga uppgifter.";
    redirect(`${backUrl}${backUrl.includes("?") ? "&" : "?"}message=${encodeURIComponent(message)}`);
  }

  const {
    name,
    organization_id,
    status,
    language,
    sponsor_type,
    sponsor_registered_name,
    sponsor_name,
    sponsor_email,
    sponsor_address,
    sponsor_establishment,
    sponsor_registration_number,
    sponsor_contact,
    controlling_entity,
    controlling_entity_registered_name,
    controlling_entity_email,
    controlling_entity_address,
    controlling_entity_establishment,
    controlling_entity_registration_number,
    controlling_entity_contact,
    payer_name,
    payer_registered_name,
    payer_email,
    payer_address,
    payer_establishment,
    payer_registration_number,
    payer_contact,
    publisher_name,
    publisher_contact,
    period_start,
    period_end,
    amount_currency,
    in_kind_message,
    in_kind_campaign,
    amount_basis,
    amount_includes_vat,
    funds_origin,
    funds_source_type,
    funds_source_region,
    calculation_method,
    linked_process,
    process_type,
    process_name,
    process_level,
    process_date,
    process_region,
    official_info_url,
    eu_database_url,
    prior_non_compliance,
    prior_non_compliance_description,
    targeting_used,
    targeting_description,
    targeting_analysis_methods,
    targeting_audience_groups,
    targeting_personal_data_categories,
    targeting_logic,
    targeting_ai_systems,
    targeting_period_start,
    targeting_period_end,
    targeting_impressions,
    targeting_clicks,
    targeting_likes,
    targeting_comments,
    targeting_policy_url,
    targeting_additional_info,
    delivery_description,
    consent_withdrawal_url,
    gdpr_controller_name,
    gdpr_controller_contact,
    gdpr_rights_url,
    gdpr_info_url,
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
    sponsor_type: sponsor_type || null,
    sponsor_registered_name: sponsor_registered_name || null,
    sponsor_name,
    sponsor_email: sponsor_email || null,
    sponsor_address: sponsor_address || null,
    sponsor_establishment: sponsor_establishment || null,
    sponsor_registration_number: sponsor_registration_number || null,
    sponsor_contact,
    controlling_entity: controlling_entity || null,
    controlling_entity_registered_name: controlling_entity_registered_name || null,
    controlling_entity_email: controlling_entity_email || null,
    controlling_entity_address: controlling_entity_address || null,
    controlling_entity_establishment: controlling_entity_establishment || null,
    controlling_entity_registration_number: controlling_entity_registration_number || null,
    controlling_entity_contact: controlling_entity_contact || null,
    payer_name: payer_name || null,
    payer_registered_name: payer_registered_name || null,
    payer_email: payer_email || null,
    payer_address: payer_address || null,
    payer_establishment: payer_establishment || null,
    payer_registration_number: payer_registration_number || null,
    payer_contact: payer_contact || null,
    publisher_name: publisher_name || null,
    publisher_contact: publisher_contact || null,
    period_start,
    period_end,
    amount_message: parseAmount(amtMsg),
    amount_campaign: parseAmount(amtCmp),
    amount_currency,
    in_kind_message: parseAmount(in_kind_message),
    in_kind_campaign: parseAmount(in_kind_campaign),
    amount_basis: amount_basis || null,
    amount_includes_vat: amount_includes_vat === "on" ? true : null,
    funds_origin: funds_origin || null,
    funds_source_type: funds_source_type || null,
    funds_source_region: funds_source_region || null,
    calculation_method,
    linked_process: linked_process || null,
    process_type: process_type || null,
    process_name: process_name || null,
    process_level: process_level || null,
    process_date: process_date || null,
    process_region: process_region || null,
    official_info_url: official_info_url || null,
    eu_database_url: eu_database_url || null,
    prior_non_compliance: prior_non_compliance === "on",
    prior_non_compliance_description: prior_non_compliance_description || null,
    targeting_used: targeting_used === "on",
    targeting_description: targeting_description || null,
    targeting_analysis_methods: targeting_analysis_methods || null,
    targeting_audience_groups: targeting_audience_groups || null,
    targeting_personal_data_categories: targeting_personal_data_categories || null,
    targeting_logic: targeting_logic || null,
    targeting_ai_systems: targeting_ai_systems || null,
    targeting_period_start: targeting_period_start || null,
    targeting_period_end: targeting_period_end || null,
    targeting_impressions: parseInteger(targeting_impressions),
    targeting_clicks: parseInteger(targeting_clicks),
    targeting_likes: parseInteger(targeting_likes),
    targeting_comments: parseInteger(targeting_comments),
    targeting_policy_url: targeting_policy_url || null,
    targeting_additional_info: targeting_additional_info || null,
    delivery_description: delivery_description || null,
    consent_withdrawal_url: consent_withdrawal_url || null,
    gdpr_controller_name: gdpr_controller_name || null,
    gdpr_controller_contact: gdpr_controller_contact || null,
    gdpr_rights_url: gdpr_rights_url || null,
    gdpr_info_url: gdpr_info_url || null,
    complaint_contact,
    complaint_url: complaint_url || null,
    ad_channels: (ad_channels ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  };

  if (!id) {
    const slug = randomUUID().replaceAll("-", "").slice(0, 12);
    const { error } = await supabase.from("campaigns").insert({ ...payload, slug, publication_group_id: randomUUID() });
    if (error) {
      console.error("Failed to create campaign", { organizationId: organization_id, error });
      redirect(
        `/dashboard/campaigns/new?organization=${encodeURIComponent(organization_id)}&message=${encodeURIComponent(
          "Kampanjen kunde inte skapas."
        )}`
      );
    }
  } else {
    const { data: existingCampaign } = await supabase.from("campaigns").select("status").eq("id", id).single();
    if (existingCampaign?.status !== "draft") {
      redirect(
        `/dashboard/campaigns/${id}?message=${encodeURIComponent(
          "Publicerade och arkiverade meddelanden kan inte ändras. Skapa en ny version i stället."
        )}`
      );
    }

    const { error } = await supabase.from("campaigns").update(payload).eq("id", id);
    if (error) {
      console.error("Failed to update campaign", { campaignId: id, organizationId: organization_id, error });
      redirect(`/dashboard/campaigns/${id}/edit?message=${encodeURIComponent("Kampanjen kunde inte sparas.")}`);
    }
  }

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/organizations/${organization_id}`);

  if (id) {
    revalidatePath(`/dashboard/campaigns/${id}`);
    redirect(`/dashboard/campaigns/${id}?message=${encodeURIComponent("Kampanjen har sparats.")}`);
  }

  redirect(`/dashboard/organizations/${organization_id}`);
}

export async function publishCampaign(formData: FormData) {
  const { supabase, user } = await requireUser();
  const id = String(formData.get("id") || "");
  if (!id) redirect("/dashboard?message=Meddelande saknas.");

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .single();

  if (!campaign) redirect("/dashboard?message=Meddelandet kunde inte hittas.");
  if (campaign.status !== "draft") {
    redirect(`/dashboard/campaigns/${id}?message=${encodeURIComponent("Endast utkast kan publiceras.")}`);
  }

  const publishedAt = new Date().toISOString();
  const publishedSnapshot = {
    ...campaign,
    status: "active",
    published_at: publishedAt,
    published_snapshot: null
  };
  const { error } = await supabase
    .from("campaigns")
    .update({ status: "active", published_at: publishedAt, published_snapshot: publishedSnapshot })
    .eq("id", id)
    .eq("status", "draft");

  if (error) {
    console.error("Failed to publish campaign", { campaignId: id, error });
    redirect(`/dashboard/campaigns/${id}?message=${encodeURIComponent("Meddelandet kunde inte publiceras.")}`);
  }

  if (campaign.replaces_campaign_id) {
    await supabase
      .from("campaigns")
      .update({ replaced_by_campaign_id: id })
      .eq("id", campaign.replaces_campaign_id);
    await logCampaignPublicationEvent(supabase, {
      campaignId: campaign.replaces_campaign_id,
      eventType: "superseded",
      userId: user.id,
      metadata: { replaced_by_campaign_id: id }
    });
  }

  await logCampaignPublicationEvent(supabase, {
    campaignId: id,
    eventType: "published",
    userId: user.id,
    metadata: { replaces_campaign_id: campaign.replaces_campaign_id }
  });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/organizations/${campaign.organization_id}`);
  revalidatePath(`/dashboard/campaigns/${id}`);
  redirect(`/dashboard/campaigns/${id}?message=${encodeURIComponent("Meddelandet har publicerats.")}`);
}

export async function archiveCampaign(formData: FormData) {
  const { supabase, user } = await requireUser();
  const id = String(formData.get("id") || "");
  if (!id) redirect("/dashboard?message=Meddelande saknas.");

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id, organization_id, status")
    .eq("id", id)
    .single();

  if (!campaign) redirect("/dashboard?message=Meddelandet kunde inte hittas.");
  if (campaign.status !== "active") {
    redirect(`/dashboard/campaigns/${id}?message=${encodeURIComponent("Endast publicerade meddelanden kan arkiveras.")}`);
  }

  const archivedAt = new Date().toISOString();
  const { error } = await supabase
    .from("campaigns")
    .update({ status: "archived", archived_at: archivedAt })
    .eq("id", id)
    .eq("status", "active");

  if (error) {
    console.error("Failed to archive campaign", { campaignId: id, error });
    redirect(`/dashboard/campaigns/${id}?message=${encodeURIComponent("Meddelandet kunde inte arkiveras.")}`);
  }

  await logCampaignPublicationEvent(supabase, {
    campaignId: id,
    eventType: "archived",
    userId: user.id,
    metadata: { archived_at: archivedAt }
  });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/organizations/${campaign.organization_id}`);
  revalidatePath(`/dashboard/campaigns/${id}`);
  redirect(`/dashboard/campaigns/${id}?message=${encodeURIComponent("Meddelandet har arkiverats.")}`);
}

export async function createCampaignVersion(formData: FormData) {
  const { supabase, user } = await requireUser();
  const id = String(formData.get("id") || "");
  if (!id) redirect("/dashboard?message=Meddelande saknas.");

  const { data: source, error: sourceError } = await supabase.from("campaigns").select("*").eq("id", id).single();
  if (sourceError || !source) {
    console.error("Failed to load source campaign", { campaignId: id, error: sourceError });
    redirect(`/dashboard/campaigns/${id}?message=${encodeURIComponent("Meddelandet kunde inte kopieras.")}`);
  }

  if (source.status === "draft") {
    redirect(`/dashboard/campaigns/${id}/edit?message=${encodeURIComponent("Utkast kan redigeras direkt.")}`);
  }

  const {
    id: _id,
    slug: _slug,
    status: _status,
    published_at: _publishedAt,
    published_snapshot: _publishedSnapshot,
    archived_at: _archivedAt,
    replaced_by_campaign_id: _replacedByCampaignId,
    created_at: _createdAt,
    updated_at: _updatedAt,
    ...copy
  } = source;
  const slug = randomUUID().replaceAll("-", "").slice(0, 12);
  const { data: draft, error } = await supabase
    .from("campaigns")
    .insert({
      ...copy,
      slug,
      status: "draft",
      published_at: null,
      published_snapshot: null,
      archived_at: null,
      replaces_campaign_id: source.id,
      replaced_by_campaign_id: null,
      version: (source.version || 1) + 1,
      publication_group_id: source.publication_group_id || source.id
    })
    .select("id")
    .single();

  if (error || !draft) {
    console.error("Failed to create campaign version", { campaignId: id, error });
    redirect(`/dashboard/campaigns/${id}?message=${encodeURIComponent("Ny version kunde inte skapas.")}`);
  }

  await logCampaignPublicationEvent(supabase, {
    campaignId: source.id,
    eventType: "version_created",
    userId: user.id,
    metadata: { draft_campaign_id: draft.id, version: (source.version || 1) + 1 }
  });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/organizations/${source.organization_id}`);
  redirect(`/dashboard/campaigns/${draft.id}/edit?message=${encodeURIComponent("Ny version har skapats som utkast.")}`);
}

async function logCampaignPublicationEvent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  {
    campaignId,
    eventType,
    userId,
    metadata
  }: {
    campaignId: string;
    eventType: "published" | "archived" | "version_created" | "superseded";
    userId: string;
    metadata?: Record<string, unknown>;
  }
) {
  const { error } = await supabase.from("campaign_publication_events").insert({
    campaign_id: campaignId,
    event_type: eventType,
    created_by: userId,
    metadata: metadata || {}
  });

  if (error) {
    console.error("Failed to log campaign publication event", { campaignId, eventType, error });
  }
}

function parseAmount(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseInteger(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

function deriveEstablishmentFromAddress(address: string | null | undefined) {
  if (!address) return null;

  const lastAddressPart = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .at(-1);
  if (!lastAddressPart) return null;

  const withoutPostalCode = lastAddressPart.replace(/^\d{3}\s?\d{2}\s+/, "").trim();
  return withoutPostalCode || lastAddressPart;
}
