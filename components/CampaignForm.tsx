"use client";

import { saveCampaign } from "@/app/dashboard/actions";
import type { Campaign, Organization, OrganizationContact } from "@/lib/types";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { MouseEvent } from "react";
import { useEffect, useState } from "react";

type Props = {
  campaign?: Campaign | null;
  organizations: Organization[];
  organizationContacts?: OrganizationContact[];
  currentUserId?: string;
  message?: string;
  selectedOrganizationId?: string;
};

export function CampaignForm({
  campaign,
  organizations,
  organizationContacts = [],
  currentUserId,
  message,
  selectedOrganizationId
}: Props) {
  const defaultOrganizationId = campaign?.organization_id || selectedOrganizationId || organizations[0]?.id;
  const defaultOrganization = organizations.find((organization) => organization.id === defaultOrganizationId);
  const initialSponsorDifferentFromOrganization = campaign?.sponsor_name
    ? campaign.sponsor_name !== defaultOrganization?.name
    : false;
  const initialControllingEntityDifferentFromOrganization = campaign?.controlling_entity
    ? campaign.controlling_entity !== defaultOrganization?.name
    : false;
  const initialPayerDifferentFromOrganization = campaign?.payer_name
    ? campaign.payer_name !== defaultOrganization?.name
    : false;
  const initialPublisherDifferentFromOrganization = campaign?.publisher_name
    ? campaign.publisher_name !== defaultOrganization?.name
    : false;
  const defaultComplaintContact =
    campaign?.complaint_contact ||
    findPreferredContact(organizationContacts, defaultOrganizationId, currentUserId) ||
    "";
  const hasProcessLink = Boolean(
    campaign?.linked_process ||
      campaign?.process_type ||
      campaign?.process_name ||
      campaign?.process_level ||
      campaign?.process_date ||
      campaign?.process_region ||
      campaign?.official_info_url
  );
  const [currentOrganizationId, setCurrentOrganizationId] = useState(defaultOrganizationId);
  const [sponsorDifferentFromOrganization, setSponsorDifferentFromOrganization] = useState(
    initialSponsorDifferentFromOrganization
  );
  const [controllingEntityDifferentFromOrganization, setControllingEntityDifferentFromOrganization] = useState(
    initialControllingEntityDifferentFromOrganization
  );
  const [payerDifferentFromOrganization, setPayerDifferentFromOrganization] = useState(
    initialPayerDifferentFromOrganization
  );
  const [publisherDifferentFromOrganization, setPublisherDifferentFromOrganization] = useState(
    initialPublisherDifferentFromOrganization
  );
  const [processLinkExists, setProcessLinkExists] = useState(hasProcessLink);
  const [priorNonCompliance, setPriorNonCompliance] = useState(Boolean(campaign?.prior_non_compliance));
  const [complaintContact, setComplaintContact] = useState(defaultComplaintContact);
  const [targetingUsed, setTargetingUsed] = useState(Boolean(campaign?.targeting_used));
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentOrganization = organizations.find((organization) => organization.id === currentOrganizationId);
  const currentOrganizationLabel = currentOrganization?.name || "Vald organisation";
  const currentOrganizationContacts = organizationContacts.filter(
    (contact) => contact.organization_id === currentOrganizationId
  );
  const selectedComplaintContactExists = currentOrganizationContacts.some(
    (contact) => contact.email === complaintContact
  );
  const calculationMethodDefault = [campaign?.calculation_method, campaign?.amount_basis]
    .filter((value): value is string => Boolean(value))
    .join("\n\n");

  useEffect(() => {
    if (!defaultOrganizationId) return;
    window.dispatchEvent(
      new CustomEvent("openttpa:organization-change", {
        detail: { organizationId: defaultOrganizationId }
      })
    );
  }, [defaultOrganizationId]);

  function handleOrganizationChange(organizationId: string) {
    setCurrentOrganizationId(organizationId);
    if (!campaign) {
      setComplaintContact(findPreferredContact(organizationContacts, organizationId, currentUserId) || "");
    }
    window.dispatchEvent(
      new CustomEvent("openttpa:organization-change", {
        detail: { organizationId }
      })
    );

    if (pathname !== "/dashboard/campaigns/new") return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("organization", organizationId);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function handleFillTestData(event: MouseEvent<HTMLButtonElement>) {
    const form = event.currentTarget.form;
    if (!form) return;

    const preferredContact =
      findPreferredContact(organizationContacts, currentOrganizationId, currentUserId) ||
      complaintContact ||
      "test@example.se";
    const startDate = formatInputDate(new Date());
    const endDate = formatInputDate(addDays(new Date(), 30));

    setSponsorDifferentFromOrganization(true);
    setControllingEntityDifferentFromOrganization(false);
    setPayerDifferentFromOrganization(false);
    setPublisherDifferentFromOrganization(false);
    setProcessLinkExists(false);
    setTargetingUsed(false);
    setPriorNonCompliance(false);
    setComplaintContact(preferredContact);

    window.setTimeout(() => {
      fillField(form, "name", "Testkampanj för transparensmeddelande");
      fillField(form, "language", "Svenska");
      fillField(form, "complaint_contact", preferredContact);
      fillField(form, "sponsor_type", "juridisk_person");
      fillField(form, "sponsor_name", "Testorganisationen");
      fillField(form, "sponsor_email", "kontakt@testorganisationen.se");
      fillField(form, "sponsor_contact", "kontakt@testorganisationen.se");
      fillField(form, "sponsor_address", "Testgatan 1, 111 11 Stockholm");
      fillField(form, "sponsor_registration_number", "000000-0000");
      fillField(form, "period_start", startDate);
      fillField(form, "period_end", endDate);
      fillField(form, "amount_message", "10000");
      fillField(form, "amount_campaign", "50000");
      fillField(form, "amount_currency", "SEK");
      fillField(form, "funds_source_type", "privat");
      fillField(form, "funds_source_region", "inom_eu");
      fillField(
        form,
        "calculation_method",
        "Beloppen är preliminärt budgeterade utifrån planerade annonsköp och uppskattad produktion."
      );
      fillField(form, "funds_origin", "Testdata för lokal utveckling.");
    }, 0);
  }

  return (
    <form className="panel grid" action={saveCampaign}>
      {message ? <p className="error">{message}</p> : null}
      <input type="hidden" name="id" value={campaign?.id || ""} />
      <input
        type="hidden"
        name="sponsor_same_as_organization"
        value={sponsorDifferentFromOrganization ? "" : "on"}
      />
      <input
        type="hidden"
        name="controlling_entity_same_as_organization"
        value={controllingEntityDifferentFromOrganization ? "" : "on"}
      />
      <input
        type="hidden"
        name="payer_same_as_organization"
        value={payerDifferentFromOrganization ? "" : "on"}
      />
      <input
        type="hidden"
        name="publisher_same_as_organization"
        value={publisherDifferentFromOrganization ? "" : "on"}
      />

      <div className="grid two">
        <label>
          Kampanjnamn
          <RequiredMark />
          <input name="name" defaultValue={campaign?.name || ""} required />
        </label>
        <label>
          Språk i reklamen
          <RequiredMark />
          <input name="language" defaultValue={campaign?.language || "Svenska"} required />
        </label>
      </div>

      <div className="grid two">
        <label>
          Organisation
          <RequiredMark />
          <select
            name="organization_id"
            defaultValue={defaultOrganizationId}
            onChange={(event) => handleOrganizationChange(event.target.value)}
            required
          >
            {organizations.map((organization) => (
              <option key={organization.id} value={organization.id}>
                {organization.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Status
          <RequiredMark />
          <select name="status" defaultValue={campaign?.status || "draft"}>
            <option value="draft">Utkast</option>
            <option value="active">Aktuell</option>
            <option value="archived">Arkiverad</option>
          </select>
        </label>
        <label>
          Kontaktperson för anmälan av överträdelse
          <RequiredMark />
          <select
            name="complaint_contact"
            value={complaintContact}
            onChange={(event) => setComplaintContact(event.target.value)}
            required
          >
            <option value="">Välj kontakt</option>
            {complaintContact && !selectedComplaintContactExists ? (
              <option value={complaintContact}>{complaintContact}</option>
            ) : null}
            {currentOrganizationContacts.map((contact) => (
              <option key={`${contact.organization_id}:${contact.user_id}`} value={contact.email}>
                {contact.email}
              </option>
            ))}
          </select>
        </label>
      </div>

      <h2>Sponsor</h2>
      <p className="section-help">Den som står bakom reklamen och på vars vägnar den publiceras.</p>
      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={sponsorDifferentFromOrganization}
          onChange={(event) => setSponsorDifferentFromOrganization(event.target.checked)}
        />
        Annan än {currentOrganizationLabel}
      </label>
      {sponsorDifferentFromOrganization ? (
        <div className="grid two">
          <label>
            Sponsorns typ
            <RequiredMark />
            <select name="sponsor_type" defaultValue={campaign?.sponsor_type || ""} required>
              <option value="">Välj typ</option>
              <option value="juridisk_person">Juridisk person</option>
              <option value="fysisk_person">Fysisk person</option>
              <option value="kampanjorganisation">Politisk kampanjorganisation utan juridisk personlighet</option>
            </select>
          </label>
          <label>
            Sponsorns identitet
            <RequiredMark />
            <input name="sponsor_name" defaultValue={campaign?.sponsor_name || ""} required />
          </label>
          <label>
            Registrerat namn, om annat
            <input name="sponsor_registered_name" defaultValue={campaign?.sponsor_registered_name || ""} />
          </label>
          <label>
            Sponsorns e-postadress
            <RequiredMark />
            <input name="sponsor_email" type="email" defaultValue={campaign?.sponsor_email || ""} required />
          </label>
          <label>
            Sponsorns kontaktuppgifter
            <RequiredMark />
            <input name="sponsor_contact" defaultValue={campaign?.sponsor_contact || ""} required />
          </label>
          <label>
            Sponsorns postadress
            <RequiredMark />
            <input name="sponsor_address" defaultValue={campaign?.sponsor_address || ""} required />
          </label>
          <label>
            Etableringsort, om annan än postadress
            <input name="sponsor_establishment" defaultValue={campaign?.sponsor_establishment || ""} />
          </label>
          <label>
            Relevant registreringsnummer
            <input name="sponsor_registration_number" defaultValue={campaign?.sponsor_registration_number || ""} />
          </label>
        </div>
      ) : null}

      <h2>Kontrollerande enhet</h2>
      <p className="section-help">En aktör som ytterst styr sponsorn, till exempel genom ägande eller beslutande inflytande.</p>
      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={controllingEntityDifferentFromOrganization}
          onChange={(event) => setControllingEntityDifferentFromOrganization(event.target.checked)}
        />
        Annan än {currentOrganizationLabel}
      </label>
      {controllingEntityDifferentFromOrganization ? (
        <div className="grid two">
          <label>
            Kontrollerande enhet
            <input name="controlling_entity" defaultValue={campaign?.controlling_entity || ""} />
          </label>
          <label>
            Kontrollerande enhets e-postadress
            <input
              name="controlling_entity_email"
              type="email"
              defaultValue={campaign?.controlling_entity_email || ""}
            />
          </label>
          <label>
            Kontrollerande enhets postadress
            <input name="controlling_entity_address" defaultValue={campaign?.controlling_entity_address || ""} />
          </label>
          <label>
            Kontrollerande enhets etableringsort
            <input
              name="controlling_entity_establishment"
              defaultValue={campaign?.controlling_entity_establishment || ""}
            />
          </label>
        </div>
      ) : null}

      <h2>Betalare</h2>
      <p className="section-help">Den som betalar för reklamen, om det är någon annan än sponsorn.</p>
      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={payerDifferentFromOrganization}
          onChange={(event) => setPayerDifferentFromOrganization(event.target.checked)}
        />
        Annan än {currentOrganizationLabel}
      </label>
      {payerDifferentFromOrganization ? (
        <div className="grid two">
          <label>
            Betalande enhet eller person
            <input name="payer_name" defaultValue={campaign?.payer_name || ""} />
          </label>
          <label>
            Betalarens registrerade namn, om annat
            <input name="payer_registered_name" defaultValue={campaign?.payer_registered_name || ""} />
          </label>
          <label>
            Betalarens e-postadress
            <input name="payer_email" type="email" defaultValue={campaign?.payer_email || ""} />
          </label>
          <label>
            Betalarens postadress
            <input name="payer_address" defaultValue={campaign?.payer_address || ""} />
          </label>
          <label>
            Betalarens etableringsort
            <input name="payer_establishment" defaultValue={campaign?.payer_establishment || ""} />
          </label>
        </div>
      ) : null}

      <h2>Utgivare</h2>
      <p className="section-help">Den aktör som publicerar, levererar eller sprider reklamen. Här anges också hur reklamen kan anmälas.</p>
      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={publisherDifferentFromOrganization}
          onChange={(event) => setPublisherDifferentFromOrganization(event.target.checked)}
        />
        Annan än {currentOrganizationLabel}
      </label>
      {publisherDifferentFromOrganization ? (
        <div className="grid two">
          <label>
            Utgivare
            <input name="publisher_name" defaultValue={campaign?.publisher_name || ""} />
          </label>
          <label>
            Utgivarens e-postadress
            <input name="publisher_contact" defaultValue={campaign?.publisher_contact || ""} />
          </label>
        </div>
      ) : null}

      <h2>Publicering och finansiering</h2>
      <p className="section-help">När reklamen visas och vilka pengar eller andra förmåner som finansierar den.</p>
      <div className="grid two">
        <label>
          Startdatum
          <RequiredMark />
          <input name="period_start" type="date" defaultValue={campaign?.period_start || ""} required />
        </label>
        <label>
          Slutdatum
          <RequiredMark />
          <input name="period_end" type="date" defaultValue={campaign?.period_end || ""} required />
        </label>
      </div>
      <div className="grid two">
        <label>
          Belopp för reklammeddelandet
          <RequiredMark />
          <input name="amount_message" type="number" min="0" step="1" defaultValue={campaign?.amount_message || ""} required />
        </label>
        <label>
          Belopp för kampanjen
          <RequiredMark />
          <input name="amount_campaign" type="number" min="0" step="1" defaultValue={campaign?.amount_campaign || ""} required />
        </label>
      </div>
      <div className="grid two">
        <label>
          Värde av andra förmåner för reklammeddelandet
          <input name="in_kind_message" type="number" min="0" step="1" defaultValue={campaign?.in_kind_message || ""} />
        </label>
        <label>
          Värde av andra förmåner för kampanjen
          <input name="in_kind_campaign" type="number" min="0" step="1" defaultValue={campaign?.in_kind_campaign || ""} />
        </label>
      </div>
      <div className="grid two">
        <label>
          Valuta
          <RequiredMark />
          <input name="amount_currency" defaultValue={campaign?.amount_currency || "SEK"} required />
        </label>
        <label className="checkbox-row checkbox-row-inline-field">
          <input name="amount_includes_vat" type="checkbox" defaultChecked={campaign?.amount_includes_vat || false} />
          Beloppen inkluderar moms
        </label>
      </div>
      <div className="grid two">
        <label>
          Finansieringskälla
          <RequiredMark />
          <select name="funds_source_type" defaultValue={campaign?.funds_source_type || ""} required>
            <option value="">Välj källa</option>
            <option value="offentlig">Offentlig</option>
            <option value="privat">Privat</option>
            <option value="offentlig_och_privat">Offentlig och privat</option>
          </select>
        </label>
        <label>
          Finansieringens geografiska ursprung
          <RequiredMark />
          <select name="funds_source_region" defaultValue={campaign?.funds_source_region || ""} required>
            <option value="">Välj ursprung</option>
            <option value="inom_eu">Inom EU</option>
            <option value="utanför_eu">Utanför EU</option>
            <option value="inom_och_utanför_eu">Inom och utanför EU</option>
          </select>
        </label>
      </div>
      <label>
        Metod och underlag för att beräkna beloppen
        <RequiredMark />
        <textarea
          name="calculation_method"
          defaultValue={calculationMethodDefault}
          placeholder="Ange om beloppen är fakturerade, budgeterade eller debiterade, hur de har beräknats och hur eventuella naturaförmåner har värderats."
          required
        />
      </label>
      <label>
        Kompletterande information om finansiering
        <textarea
          name="funds_origin"
          defaultValue={campaign?.funds_origin || ""}
          placeholder="Exempel: mer information om finansieringen eller särskilda omständigheter."
        />
      </label>

      <h2>Koppling till politisk process</h2>
      <p className="section-help">Ange om reklamen har en tydlig koppling till val, folkomröstning eller politiskt beslut.</p>
      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={processLinkExists}
          onChange={(event) => setProcessLinkExists(event.target.checked)}
        />
        Finns tydlig koppling
      </label>
      {processLinkExists ? (
        <>
          <div className="grid two">
            <label>
              Typ av process
              <select name="process_type" defaultValue={campaign?.process_type || ""}>
                <option value="">Välj typ</option>
                <option value="val">Val</option>
                <option value="folkomröstning">Folkomröstning</option>
                <option value="lagstiftningsinitiativ">Lagstiftningsinitiativ</option>
                <option value="regleringsprocess">Regleringsprocess</option>
              </select>
            </label>
            <label>
              Processens nivå
              <select name="process_level" defaultValue={campaign?.process_level || ""}>
                <option value="">Välj nivå</option>
                <option value="EU">EU</option>
                <option value="nationell">Nationell</option>
                <option value="regional">Regional</option>
                <option value="lokal">Lokal</option>
              </select>
            </label>
            <label>
              Namn eller titel
              <input name="process_name" defaultValue={campaign?.process_name || ""} />
            </label>
            <label>
              Datum
              <input name="process_date" type="date" defaultValue={campaign?.process_date || ""} />
            </label>
            <label>
              Berört land eller territorium
              <input name="process_region" defaultValue={campaign?.process_region || ""} />
            </label>
            <label>
              Länk till information om deltagande
              <input name="official_info_url" type="url" defaultValue={campaign?.official_info_url || ""} />
            </label>
          </div>
          <label>
            Ytterligare information om kopplingen
            <textarea name="linked_process" defaultValue={campaign?.linked_process || ""} />
          </label>
        </>
      ) : null}
      <h2>Inriktning och annonsleverans</h2>
      <p className="section-help">Beskriv om personuppgifter används för att välja mottagare eller styra hur reklamen levereras.</p>
      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={targetingUsed}
          onChange={(event) => setTargetingUsed(event.target.checked)}
        />
        Inriktningsteknik eller annonsleveransteknik används
      </label>
      {targetingUsed ? (
        <>
          <input type="hidden" name="targeting_used" value="on" />
          <label>
            Beskriv inriktningsteknik
            <textarea name="targeting_description" defaultValue={campaign?.targeting_description || ""} />
          </label>
          <label>
            Beskriv annonsleverans och kanaler
            <textarea name="delivery_description" defaultValue={campaign?.delivery_description || ""} />
          </label>
          <div className="grid two">
            <label>
              Analysmetoder som använts
              <textarea name="targeting_analysis_methods" defaultValue={campaign?.targeting_analysis_methods || ""} />
            </label>
            <label>
              Målgrupper och parametrar
              <textarea name="targeting_audience_groups" defaultValue={campaign?.targeting_audience_groups || ""} />
            </label>
            <label>
              Kategorier av personuppgifter
              <textarea
                name="targeting_personal_data_categories"
                defaultValue={campaign?.targeting_personal_data_categories || ""}
              />
            </label>
            <label>
              Mål, mekanismer och logik
              <textarea name="targeting_logic" defaultValue={campaign?.targeting_logic || ""} />
            </label>
            <label>
              AI-system vid inriktning eller annonsleverans
              <textarea name="targeting_ai_systems" defaultValue={campaign?.targeting_ai_systems || ""} />
            </label>
            <label>
              Intern policy för inriktning och annonsleverans
              <textarea name="targeting_policy_url" defaultValue={campaign?.targeting_policy_url || ""} />
            </label>
          </div>
          <div className="grid two">
            <label>
              Visningar
              <input
                name="targeting_impressions"
                type="number"
                min="0"
                step="1"
                defaultValue={campaign?.targeting_impressions || ""}
              />
            </label>
            <label>
              Klick
              <input name="targeting_clicks" type="number" min="0" step="1" defaultValue={campaign?.targeting_clicks || ""} />
            </label>
            <label>
              Gillningar
              <input name="targeting_likes" type="number" min="0" step="1" defaultValue={campaign?.targeting_likes || ""} />
            </label>
            <label>
              Kommentarer
              <input
                name="targeting_comments"
                type="number"
                min="0"
                step="1"
                defaultValue={campaign?.targeting_comments || ""}
              />
            </label>
          </div>
          <label>
            Annan viktig information om inriktning och annonsleverans
            <textarea name="targeting_additional_info" defaultValue={campaign?.targeting_additional_info || ""} />
          </label>
          <label>
            Kanaler där reklamen visas
            <input
              name="ad_channels"
              defaultValue={(campaign?.ad_channels || []).join(", ")}
              placeholder="Exempel: Facebook, Instagram, webbplats, e-post"
            />
          </label>
          <h3>Rättigheter</h3>
          <p className="section-help">Hur personer kan utöva sina dataskyddsrättigheter.</p>
          <div className="grid two">
            <label>
              Personuppgiftsansvarig
              <input name="gdpr_controller_name" defaultValue={campaign?.gdpr_controller_name || ""} />
            </label>
            <label>
              Personuppgiftsansvarigs kontaktuppgifter
              <input name="gdpr_controller_contact" defaultValue={campaign?.gdpr_controller_contact || ""} />
            </label>
            <label>
              Länk för att utöva dataskyddsrättigheter
              <input name="gdpr_rights_url" type="url" defaultValue={campaign?.gdpr_rights_url || ""} />
            </label>
            <label>
              Länk till dataskyddsinformation
              <input name="gdpr_info_url" type="url" defaultValue={campaign?.gdpr_info_url || ""} />
            </label>
          </div>
          <label>
            Länk för återkallelse av samtycke
            <input name="consent_withdrawal_url" type="url" defaultValue={campaign?.consent_withdrawal_url || ""} />
          </label>
        </>
      ) : null}

      <h2>Anmälan</h2>
      <p className="section-help">Information om tidigare avbrott eller återkallelser av reklamen.</p>
      <label className="checkbox-row">
        <input
          name="prior_non_compliance"
          type="checkbox"
          checked={priorNonCompliance}
          onChange={(event) => setPriorNonCompliance(event.target.checked)}
        />
        En tidigare publicering eller version har avbrutits eller återkallats på grund av överträdelse
      </label>
      {priorNonCompliance ? (
        <label>
          Beskriv tidigare avbrott eller återkallelse
          <textarea name="prior_non_compliance_description" defaultValue={campaign?.prior_non_compliance_description || ""} />
        </label>
      ) : null}

      <div className="actions">
        <button type="submit">{campaign ? "Spara ändringar" : "Skapa kampanj"}</button>
        <button type="button" className="secondary" onClick={handleFillTestData}>
          Fyll i testdata
        </button>
      </div>
    </form>
  );
}

function RequiredMark() {
  return (
    <span className="required-mark" aria-label="obligatoriskt" title="Obligatoriskt">
      *
    </span>
  );
}

function findPreferredContact(
  contacts: OrganizationContact[],
  organizationId: string | undefined,
  currentUserId: string | undefined
) {
  const organizationContacts = contacts.filter((contact) => contact.organization_id === organizationId);
  return (
    organizationContacts.find((contact) => contact.user_id === currentUserId)?.email ||
    organizationContacts[0]?.email
  );
}

function fillField(form: HTMLFormElement, name: string, value: string) {
  const field = form.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(`[name="${name}"]`);
  if (!field) return;

  field.value = value;
  field.dispatchEvent(new Event("input", { bubbles: true }));
  field.dispatchEvent(new Event("change", { bubbles: true }));
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function formatInputDate(date: Date) {
  return date.toISOString().slice(0, 10);
}
