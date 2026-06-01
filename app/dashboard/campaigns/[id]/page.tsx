import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AutoDismissNotice } from "@/components/AutoDismissNotice";
import { formatDate, formatMoney, normalizeOrganization, publicCampaignJsonUrl, publicCampaignUrl } from "@/lib/format";
import { createClient } from "@/utils/supabase/server";
import type { Campaign, Organization } from "@/lib/types";

export default async function CampaignPage({
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

  const { data: campaign } = await supabase.from("campaigns").select("*, organizations(*)").eq("id", id).single();
  if (!campaign) notFound();

  const organization = normalizeOrganization((campaign as Campaign).organizations || null) as Organization | null;
  const { data: membership } = await supabase
    .from("organization_members")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("organization_id", (campaign as Campaign).organization_id)
    .maybeSingle();

  if (!membership) notFound();

  const publicUrl = publicCampaignUrl((campaign as Campaign).slug);
  const jsonUrl = publicCampaignJsonUrl((campaign as Campaign).slug);
  const qrUrl = `/api/qr/${(campaign as Campaign).slug}`;

  return (
    <main className="shell" style={{ paddingBottom: 64 }}>
      <section className="row" style={{ alignItems: "end", paddingTop: 28 }}>
        <div>
          <h1>{(campaign as Campaign).name}</h1>
          <p className="lead">Se kampanjens uppgifter och länkar till transparensmeddelandet.</p>
        </div>
      </section>

      {query.message ? <AutoDismissNotice>{query.message}</AutoDismissNotice> : null}

      <section className="organization-details" style={{ margin: "20px 0" }}>
        <div className="organization-detail-grid">
          <Detail label="Organisation" value={organization?.name || "Ej angiven"} />
          <Detail label="Status" value={statusLabel((campaign as Campaign).status)} />
          <Detail label="Språk i reklamen" value={(campaign as Campaign).language} />
          <Detail label="Startdatum" value={formatDate((campaign as Campaign).period_start)} />
          <Detail label="Slutdatum" value={formatDate((campaign as Campaign).period_end)} />
          <Detail label="Skapad" value={formatDateTime((campaign as Campaign).created_at)} />
          <Detail label="Senast uppdaterad" value={formatDateTime((campaign as Campaign).updated_at)} />
        </div>
        <div className="qr-share">
          <img className="qr" src={qrUrl} alt={`QR-kod till ${publicUrl}`} />
          <div>
            <strong>Länk</strong>
            <p className="qr-link">
              <a href={publicUrl} target="_blank" rel="noreferrer">
                {publicUrl}
              </a>
            </p>
            <strong>QR-kod</strong>
            <p className="muted">Dela QR-koden i annonser, tryck eller annat material.</p>
            <div className="actions">
              <a className="button secondary" href={qrUrl} target="_blank" rel="noreferrer">
                Öppna QR-kod
              </a>
              <a className="button secondary" href={qrUrl} download={`${(campaign as Campaign).slug}-qr.svg`}>
                Ladda ner SVG
              </a>
            </div>
          </div>
        </div>
        <div className="actions card-actions">
          <Link className="button secondary" href={`/dashboard/campaigns/${(campaign as Campaign).id}/edit`}>
            Redigera kampanj
          </Link>
        </div>
      </section>

      <section className="organization-campaigns" style={{ margin: "36px 0 20px" }}>
        <h2>Transparensmeddelande</h2>
        <p className="muted">
          Så här visas informationen på den publika sidan. Utkast kan förhandsgranskas av behöriga användare.
        </p>
        <TransparencyNoticePreview campaign={campaign as Campaign} />
        <section className="machine-readable" style={{ marginTop: 28 }}>
          <h2>Maskinläsbar version</h2>
          <p className="muted">
            JSON-versionen kan användas av plattformar, register och andra system som behöver läsa
            transparensmeddelandet automatiskt.
          </p>
          <p>
            <a href={jsonUrl} target="_blank" rel="noreferrer">
              {jsonUrl}
            </a>
          </p>
        </section>
      </section>
    </main>
  );
}

function TransparencyNoticePreview({ campaign }: { campaign: Campaign }) {
  return (
    <section className="panel" style={{ marginTop: 18 }}>
      <span className="pill">Transparensmeddelande</span>
      <h2>TRANSPARENSMEDDELANDE</h2>
      <p className="notice">
        Detta är ett transparensmeddelande för politisk reklam. Informationen lämnas på samma språk som
        kampanjens registrerade språk: {campaign.language}.
      </p>
      {campaign.status === "draft" ? (
        <p className="notice">Detta är en förhandsvisning av ett utkast och är inte publicerat.</p>
      ) : null}
      <dl>
        <Info
          label="1. Sponsor"
          value={formatEntity({
            name: campaign.sponsor_name,
            registeredName: campaign.sponsor_registered_name,
            email: campaign.sponsor_email,
            address: campaign.sponsor_address,
            establishment: campaign.sponsor_establishment,
            registrationNumber: campaign.sponsor_registration_number,
            contact: campaign.sponsor_contact
          })}
        />
        <Info label="Sponsorns typ" value={formatChoice(campaign.sponsor_type)} />
        <Info label="Sponsorns kontaktuppgifter" value={campaign.sponsor_contact} />
        <Info
          label="2. Enhet som ytterst kontrollerar sponsorn"
          value={formatEntity({
            name: campaign.controlling_entity,
            email: campaign.controlling_entity_email,
            address: campaign.controlling_entity_address,
            establishment: campaign.controlling_entity_establishment
          })}
        />
        <Info
          label="3. Enhet som betalar för det politiska reklammeddelandet"
          value={formatEntity({
            name: campaign.payer_name,
            registeredName: campaign.payer_registered_name,
            email: campaign.payer_email,
            address: campaign.payer_address,
            establishment: campaign.payer_establishment
          })}
        />
        <Info label="Utgivare" value={campaign.publisher_name || "Ej angiven"} />
        <Info label="Utgivarens kontaktuppgifter" value={campaign.publisher_contact || "Ej angiven"} />
        <Info label="4. Publiceringsperiod" value={`${formatDate(campaign.period_start)} till ${formatDate(campaign.period_end)}`} />
        <Info
          label="5. Belopp och andra förmåner för reklammeddelandet"
          value={formatAmount(campaign.amount_message, campaign.in_kind_message, campaign.amount_currency)}
        />
        <Info
          label="6. Belopp och andra förmåner för kampanjen"
          value={formatAmount(campaign.amount_campaign, campaign.in_kind_campaign, campaign.amount_currency)}
        />
        <Info label="7. Källa till belopp och andra förmåner" value={formatFunding(campaign)} />
        <Info
          label="8. Metod och underlag för att beräkna beloppen"
          value={joinValues([
            campaign.calculation_method,
            campaign.amount_basis,
            campaign.amount_includes_vat === null
              ? null
              : campaign.amount_includes_vat
                ? "Beloppen inkluderar moms."
                : "Beloppen anges utan moms."
          ])}
        />
        <Info
          label="9. Koppling till val, folkomröstning eller regleringsprocess"
          value={formatProcess(campaign)}
        />
        <Info
          label="10. Officiell information om villkoren för deltagande i valet kopplat till det politiska reklammeddelandet"
          value={campaign.official_info_url || "Ej angiven"}
          href={campaign.official_info_url || undefined}
        />
        {campaign.eu_database_url ? (
          <Info
            label="11. Länk till den europeiska databasen för politiska reklammeddelanden online"
            value={campaign.eu_database_url}
            href={campaign.eu_database_url}
          />
        ) : null}
        <Info
          label="12. Anmäl politiska reklammeddelanden som eventuellt inte uppfyller kraven"
          value={campaign.complaint_contact}
          href={campaign.complaint_url || undefined}
        />
        <Info
          label="13. Tidigare avbrott eller återkallelse"
          value={campaign.prior_non_compliance ? campaign.prior_non_compliance_description || "Ja" : "Nej"}
        />
        <Info
          label="14. Inriktningsteknik eller annonsleveransteknik baserad på personuppgifter"
          value={campaign.targeting_used ? "Ja" : "Nej"}
        />
        <Info label="15. Information om inriktning och annonsleverans" value={formatTargeting(campaign)} />
        <Info label="16. Dataskyddsrättigheter" value={formatGdpr(campaign)} />
        <Info label="Kanaler" value={(campaign.ad_channels || []).join(", ") || "Ej angivet"} />
        <Info label="Senast uppdaterad" value={formatDate(campaign.updated_at)} />
      </dl>
    </section>
  );
}

function Info({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div className="definition">
      <dt>{label}</dt>
      <dd>{href ? <a href={href}>{value}</a> : value}</dd>
    </div>
  );
}

function joinValues(values: Array<string | null | undefined>) {
  const filtered = values.filter(Boolean);
  return filtered.length > 0 ? filtered.join(" ") : "Ej angivet";
}

function formatChoice(value: string | null | undefined) {
  if (!value) return "Ej angivet";
  return value.replaceAll("_", " ");
}

function formatEntity(entity: {
  name?: string | null;
  registeredName?: string | null;
  email?: string | null;
  address?: string | null;
  establishment?: string | null;
  registrationNumber?: string | null;
  contact?: string | null;
}) {
  return joinValues([
    entity.name,
    entity.registeredName ? `Registrerat namn: ${entity.registeredName}.` : null,
    entity.email ? `E-post: ${entity.email}.` : null,
    entity.address ? `Postadress: ${entity.address}.` : null,
    entity.establishment ? `Etableringsort: ${entity.establishment}.` : null,
    entity.registrationNumber ? `Registreringsnummer: ${entity.registrationNumber}.` : null,
    entity.contact ? `Kontakt: ${entity.contact}.` : null
  ]);
}

function formatAmount(amount: number | null, inKind: number | null, currency: string) {
  return joinValues([
    `Belopp: ${formatMoney(amount, currency)}.`,
    inKind !== null ? `Värde av andra förmåner: ${formatMoney(inKind, currency)}.` : null
  ]);
}

function formatFunding(campaign: Campaign) {
  return joinValues([
    campaign.funds_origin ? `Kompletterande information: ${campaign.funds_origin}.` : null,
    campaign.funds_source_type ? `Källa: ${formatChoice(campaign.funds_source_type)}.` : null,
    campaign.funds_source_region ? `Geografiskt ursprung: ${formatChoice(campaign.funds_source_region)}.` : null
  ]);
}

function formatProcess(campaign: Campaign) {
  return joinValues([
    campaign.linked_process,
    campaign.process_type ? `Typ: ${formatChoice(campaign.process_type)}.` : null,
    campaign.process_name ? `Namn/titel: ${campaign.process_name}.` : null,
    campaign.process_level ? `Nivå: ${campaign.process_level}.` : null,
    campaign.process_date ? `Datum: ${formatDate(campaign.process_date)}.` : null,
    campaign.process_region ? `Berört land eller territorium: ${campaign.process_region}.` : null
  ]);
}

function formatTargeting(campaign: Campaign) {
  if (!campaign.targeting_used) return "Inte angivet som använt.";

  return joinValues([
    campaign.targeting_description ? `Beskrivning: ${campaign.targeting_description}.` : null,
    campaign.delivery_description ? `Annonsleverans: ${campaign.delivery_description}.` : null,
    campaign.targeting_analysis_methods ? `Analysmetoder: ${campaign.targeting_analysis_methods}.` : null,
    campaign.targeting_audience_groups ? `Målgrupper och parametrar: ${campaign.targeting_audience_groups}.` : null,
    campaign.targeting_personal_data_categories ? `Personuppgiftskategorier: ${campaign.targeting_personal_data_categories}.` : null,
    campaign.targeting_logic ? `Mål, mekanismer och logik: ${campaign.targeting_logic}.` : null,
    campaign.targeting_ai_systems ? `AI-system: ${campaign.targeting_ai_systems}.` : null,
    campaign.targeting_period_start || campaign.targeting_period_end
      ? `Spridningsperiod: ${formatDate(campaign.targeting_period_start)} till ${formatDate(campaign.targeting_period_end)}.`
      : null,
    campaign.targeting_impressions !== null ? `Visningar: ${campaign.targeting_impressions}.` : null,
    campaign.targeting_clicks !== null ? `Klick: ${campaign.targeting_clicks}.` : null,
    campaign.targeting_likes !== null ? `Gillningar: ${campaign.targeting_likes}.` : null,
    campaign.targeting_comments !== null ? `Kommentarer: ${campaign.targeting_comments}.` : null,
    campaign.targeting_policy_url ? `Intern policy: ${campaign.targeting_policy_url}.` : null,
    campaign.targeting_additional_info ? `Annan viktig information: ${campaign.targeting_additional_info}.` : null
  ]);
}

function formatGdpr(campaign: Campaign) {
  return joinValues([
    campaign.gdpr_controller_name ? `Personuppgiftsansvarig: ${campaign.gdpr_controller_name}.` : null,
    campaign.gdpr_controller_contact ? `Kontakt: ${campaign.gdpr_controller_contact}.` : null,
    campaign.consent_withdrawal_url ? `Återkalla samtycke: ${campaign.consent_withdrawal_url}.` : null,
    campaign.gdpr_rights_url ? `Utöva dataskyddsrättigheter: ${campaign.gdpr_rights_url}.` : null,
    campaign.gdpr_info_url ? `Dataskyddsinformation: ${campaign.gdpr_info_url}.` : null
  ]);
}

function Detail({
  label,
  value,
  link,
  multiline
}: {
  label: string;
  value: ReactNode;
  link?: boolean;
  multiline?: boolean;
}) {
  const displayValue = value || "Ej angivet";

  return (
    <div className="organization-detail">
      <strong>{label}</strong>
      <p className="muted">
        {link && typeof value === "string" && value ? (
          <a href={value} target="_blank" rel="noreferrer">
            {value}
          </a>
        ) : multiline && typeof displayValue === "string" ? (
          <span style={{ whiteSpace: "pre-wrap" }}>{displayValue}</span>
        ) : (
          displayValue
        )}
      </p>
    </div>
  );
}

function statusLabel(status: string) {
  if (status === "active") return "Aktuell";
  if (status === "archived") return "Arkiverad";
  return "Utkast";
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Ej angivet";
  return new Intl.DateTimeFormat("sv-SE", {
    dateStyle: "long",
    timeStyle: "short"
  }).format(new Date(value));
}
