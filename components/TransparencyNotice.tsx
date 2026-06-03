import type { ReactNode } from "react";
import { formatDate, formatMoney, publicCampaignUrl } from "@/lib/format";
import type { Campaign } from "@/lib/types";

export function TransparencyNotice({ campaign }: { campaign: Campaign }) {
  return (
    <section className="panel transparency-notice">
      <h2>TRANSPARENSMEDDELANDE</h2>
      <p>
        Detta är ett transparensmeddelande för politisk reklam. Det är utformat i enlighet med
        gällande förordning (EU) 2024/900. Syftet är att göra politiska
        reklammeddelanden lättare att identifiera och förstå.
      </p>
      {campaign.replaced_by_campaign ? (
        <p className="notice">
          Det finns en senare version av detta transparensmeddelande:{" "}
          <a href={publicCampaignUrl(campaign.replaced_by_campaign.slug)}>
            version {campaign.replaced_by_campaign.version}
          </a>
          .
        </p>
      ) : null}
      <dl>
        <Info label="1. Sponsor" value={formatEntity({
          name: campaign.sponsor_name,
          registeredName: campaign.sponsor_registered_name,
          email: campaign.sponsor_email,
          address: campaign.sponsor_address,
          establishment: campaign.sponsor_establishment,
          registrationNumber: campaign.sponsor_registration_number,
          contact: campaign.sponsor_contact
        })} />
        <Info
          label="2. Enhet som ytterst kontrollerar sponsorn"
          value={formatEntity({
            name: campaign.controlling_entity,
            registeredName: campaign.controlling_entity_registered_name,
            email: campaign.controlling_entity_email,
            address: campaign.controlling_entity_address,
            establishment: campaign.controlling_entity_establishment,
            registrationNumber: campaign.controlling_entity_registration_number,
            contact: campaign.controlling_entity_contact
          })}
        />
        <Info
          label="3. Enhet som betalar för det politiska reklammeddelandet"
          value={formatEntity({
            name: campaign.payer_name,
            registeredName: campaign.payer_registered_name,
            email: campaign.payer_email,
            address: campaign.payer_address,
            establishment: campaign.payer_establishment,
            registrationNumber: campaign.payer_registration_number,
            contact: campaign.payer_contact
          })}
        />
        <Info
          label="4. Period under vilken det politiska reklammeddelandet är avsett att publiceras, tillhandahållas eller spridas"
          value={`${formatDate(campaign.period_start)} till ${formatDate(campaign.period_end)}`}
        />
        <Info
          label="5. De sammanlagda beloppen och det sammanlagda värdet av andra förmåner för det politiska reklammeddelandet"
          value={formatAmount(campaign.amount_message, campaign.in_kind_message, campaign.amount_currency)}
        />
        <Info
          label="6. De sammanlagda beloppen och det sammanlagda värdet av andra förmåner för den politiska reklamkampanjen"
          value={formatAmount(campaign.amount_campaign, campaign.in_kind_campaign, campaign.amount_currency)}
        />
        <Info
          label="7. Information om källan till beloppen och andra förmåner"
          value={formatFunding(campaign)}
        />
        <Info
          label="8. Metod för att beräkna de sammanlagda beloppen och värdet av andra förmåner"
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
          label="9. Koppling till val, folkomröstning eller lagstiftnings- eller regleringsprocess"
          value={formatProcess(campaign)}
        />
        <Info
          label="10. Länk till officiell information om deltagande"
          value={campaign.official_info_url || "Ej angiven"}
          href={campaign.official_info_url || undefined}
        />
        <Info
          label="11. Länk till den europeiska databasen över politiska reklammeddelanden online"
          value={
            campaign.eu_database_url ||
            "En gemensam europeisk databas över politiska reklammeddelanden ska etableras i enlighet med EU:s förordning (EU) 2024/900. Fram till dess finns information via Europeiska kommissionens portal."
          }
          href={campaign.eu_database_url || undefined}
        />
        <Info
          label="12. Hur man anmäler politiska reklammeddelanden som eventuellt inte uppfyller kraven"
          value={formatComplaint(campaign)}
          href={campaign.complaint_url || undefined}
        />
        <Info
          label="13. Tidigare avbrott eller återkallelse"
          value={formatPriorPublication(campaign)}
        />
      </dl>

      <dl>
        <Info
          label="14. Det politiska reklammeddelandet har varit föremål för inriktningsteknik och/eller annonsleveransteknik som grundar sig på användning av personuppgifter"
          value={campaign.targeting_used ? "Ja" : "Nej"}
        />
        <Info
          label="15. Information om den inriktningsteknik och/eller annonsleveransteknik som använts"
          value={formatTargeting(campaign)}
        />
        <Info
          label="16. Effektiva medel för att hjälpa enskilda att utöva sina dataskyddsrättigheter"
          value={formatGdpr(campaign)}
        />
      </dl>

      <div className="actions transparency-notice-actions">
        <a className="button" href={`mailto:${campaign.complaint_contact}`}>
          Anmäl reklammeddelande
        </a>
      </div>
    </section>
  );
}

function Info({ label, value, href }: { label: string; value: ReactNode; href?: string }) {
  return (
    <div className="definition">
      <dt>{label}</dt>
      <dd>{href ? <a href={href}>{value}</a> : value}</dd>
    </div>
  );
}

function InlineList({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <ol className="template-list" type="a">
      {items.map((item) => (
        <li key={item.label}>
          {item.label}: {item.value}
        </li>
      ))}
    </ol>
  );
}

function ValueList({ items, compact = false }: { items: Array<{ label: string; value: ReactNode }>; compact?: boolean }) {
  const visibleItems = items.filter((item) => item.value !== null);

  return (
    <dl className={`value-list${compact ? " value-list-compact" : ""}`}>
      {visibleItems.map((item) => (
        <div key={item.label}>
          <dt>{item.label}:</dt>
          <dd>{item.value || "Ej angivet"}</dd>
        </div>
      ))}
    </dl>
  );
}

function joinValues(values: Array<string | null | undefined>) {
  const filtered = values.filter(Boolean);
  return filtered.length > 0 ? filtered.join(" ") : "Ej angivet";
}

function formatChoice(value: string | null | undefined) {
  if (!value) return "Ej angivet";
  const normalized = value.replaceAll("_", " ").replace(/\beu\b/g, "EU");
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
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
  const establishment = establishmentIfDifferentFromAddress(entity.establishment || null, entity.address || null);

  return (
    <ValueList
      items={[
        { label: "Namn", value: entity.name || "Ej angivet" },
        { label: "Registrerat namn", value: entity.registeredName || null },
        { label: "E-postadress", value: entity.email || "Ej angiven" },
        { label: "Postadress", value: entity.address || "Ej angiven" },
        { label: "Etableringsort", value: establishment },
        { label: "Registreringsnummer", value: entity.registrationNumber || "Ej angivet" },
        { label: "Webbplats", value: entity.contact || "Ej angiven" }
      ]}
    />
  );
}

function establishmentIfDifferentFromAddress(establishment: string | null, address: string | null) {
  if (!establishment) return null;

  const addressEstablishment = deriveEstablishmentFromAddress(address);
  if (!addressEstablishment) return establishment;

  return normalizePlace(establishment) === normalizePlace(addressEstablishment) ? null : establishment;
}

function normalizePlace(value: string) {
  return value.trim().toLowerCase();
}

function deriveEstablishmentFromAddress(address: string | null) {
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

function formatAmount(amount: number | null, inKind: number | null, currency: string) {
  return (
    <ValueList
      items={[
        { label: "Totalt belopp", value: formatMoney(amount, currency) },
        { label: "Värde av andra förmåner", value: inKind !== null ? formatMoney(inKind, currency) : "Ej angivet" }
      ]}
    />
  );
}

function formatFunding(campaign: Campaign) {
  return (
    <ValueList
      items={[
        { label: "Källa", value: formatChoice(campaign.funds_source_type) },
        { label: "Geografiskt ursprung", value: formatChoice(campaign.funds_source_region) },
        { label: "Kompletterande information", value: campaign.funds_origin || "Ej angiven" }
      ]}
    />
  );
}

function formatProcess(campaign: Campaign) {
  const hasProcess =
    campaign.process_type ||
    campaign.process_name ||
    campaign.process_level ||
    campaign.process_date ||
    campaign.process_region ||
    campaign.linked_process;

  if (!hasProcess) return "Ingen tydlig koppling angiven.";

  return (
    <ValueList
      items={[
        { label: "Typ", value: formatChoice(campaign.process_type) },
        { label: "Namn eller titel", value: campaign.process_name || "Ej angivet" },
        { label: "Nivå", value: formatChoice(campaign.process_level) },
        { label: "Datum", value: formatDate(campaign.process_date) },
        { label: "Berört land eller territorium", value: campaign.process_region || "Ej angivet" },
        {
          label: "Ytterligare information",
          value:
            campaign.linked_process && campaign.linked_process !== "on"
              ? campaign.linked_process
              : "Ej angiven"
        }
      ]}
    />
  );
}

function formatComplaint(campaign: Campaign) {
  return (
    <ValueList
      items={[
        { label: "Anmälan görs till", value: campaign.publisher_name || "Utgivaren" },
        { label: "Kontaktperson för anmälan av överträdelse", value: campaign.complaint_contact }
      ]}
    />
  );
}

function formatPriorPublication(campaign: Campaign) {
  return (
    <ValueList
      items={[
        {
          label: "Tidigare avbrott eller återkallelse",
          value: campaign.prior_non_compliance ? campaign.prior_non_compliance_description || "Ja" : "Nej"
        },
        {
          label: "Ersätter tidigare version",
          value: campaign.replaces_campaign ? (
            <a href={publicCampaignUrl(campaign.replaces_campaign.slug)}>
              version {campaign.replaces_campaign.version}
            </a>
          ) : (
            "Nej"
          )
        }
      ]}
    />
  );
}

function formatTargeting(campaign: Campaign) {
  if (!campaign.targeting_used) return "Inriktningsteknik eller annonsleveransteknik används inte.";

  return (
    <ValueList
      items={[
        { label: "Analysmetoder", value: campaign.targeting_analysis_methods || "Ej angivet" },
        {
          label: "Mottagargrupper och parametrar",
          value: campaign.targeting_audience_groups || "Ej angivet"
        },
        {
          label: "Kategorier av personuppgifter",
          value: campaign.targeting_personal_data_categories || "Ej angivet"
        },
        {
          label: "Mål, mekanismer och logik",
          value: campaign.targeting_logic || campaign.targeting_description || "Ej angivet"
        },
        { label: "System för artificiell intelligens", value: campaign.targeting_ai_systems || "Ej angivet" },
        {
          label: "Spridningsperiod",
          value:
            campaign.targeting_period_start || campaign.targeting_period_end
              ? `${formatDate(campaign.targeting_period_start)} till ${formatDate(campaign.targeting_period_end)}`
              : `${formatDate(campaign.period_start)} till ${formatDate(campaign.period_end)}`
        },
        { label: "Antal visningar", value: formatNumber(campaign.targeting_impressions) },
        {
          label: "Interaktioner",
          value: (
            <ValueList
              compact
              items={[
                { label: "Klick", value: formatNumber(campaign.targeting_clicks) },
                { label: "Gillningar", value: formatNumber(campaign.targeting_likes) },
                { label: "Kommentarer", value: formatNumber(campaign.targeting_comments) }
              ]}
            />
          )
        },
        { label: "Intern policy", value: campaign.targeting_policy_url || "Ej angiven" },
        {
          label: "Annan viktig information",
          value: joinValues([campaign.delivery_description, campaign.targeting_additional_info])
        }
      ]}
    />
  );
}

function formatGdpr(campaign: Campaign) {
  if (!campaign.targeting_used) return "Personuppgifter används inte för inriktningsteknik eller annonsleveransteknik.";

  return (
    <ValueList
      items={[
        {
          label: "Personuppgiftsansvarig",
          value: campaign.gdpr_controller_name || "Ej angiven"
        },
        {
          label: "Kontaktuppgifter",
          value: campaign.gdpr_controller_contact || "Ej angivna"
        },
        {
          label: "Återkalla samtycke",
          value: campaign.consent_withdrawal_url || "Ej angivet"
        },
        {
          label: "Utöva dataskyddsrättigheter",
          value: campaign.gdpr_rights_url || "Ej angivet"
        },
        {
          label: "Information enligt dataskyddsförordningen",
          value: campaign.gdpr_info_url || "Ej angivet"
        }
      ]}
    />
  );
}

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined) return "Ej angivet";
  return new Intl.NumberFormat("sv-SE").format(value);
}
