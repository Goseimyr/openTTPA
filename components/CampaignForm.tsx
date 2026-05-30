"use client";

import { saveCampaign } from "@/app/dashboard/actions";
import type { Campaign, Organization } from "@/lib/types";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type Props = {
  campaign?: Campaign | null;
  organizations: Organization[];
  message?: string;
  selectedOrganizationId?: string;
};

export function CampaignForm({ campaign, organizations, message, selectedOrganizationId }: Props) {
  const defaultOrganizationId = campaign?.organization_id || selectedOrganizationId || organizations[0]?.id;
  const [currentOrganizationId, setCurrentOrganizationId] = useState(defaultOrganizationId);
  const [sponsorSameAsOrganization, setSponsorSameAsOrganization] = useState(false);
  const [controllingEntitySameAsOrganization, setControllingEntitySameAsOrganization] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentOrganization = organizations.find((organization) => organization.id === currentOrganizationId);

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

  return (
    <form className="panel grid" action={saveCampaign}>
      {message ? <p className="error">{message}</p> : null}
      <input type="hidden" name="id" value={campaign?.id || ""} />
      <input type="hidden" name="sponsor_same_as_organization" value={sponsorSameAsOrganization ? "on" : ""} />
      <input
        type="hidden"
        name="controlling_entity_same_as_organization"
        value={controllingEntitySameAsOrganization ? "on" : ""}
      />

      <div className="grid two">
        <label>
          Organisation
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
          <select name="status" defaultValue={campaign?.status || "draft"}>
            <option value="draft">Utkast</option>
            <option value="active">Aktuell</option>
            <option value="archived">Arkiverad</option>
          </select>
        </label>
      </div>

      <div className="grid two">
        <label>
          Kampanjnamn
          <input name="name" defaultValue={campaign?.name || ""} required />
        </label>
        <label>
          Språk i reklamen
          <input name="language" defaultValue={campaign?.language || "Svenska"} required />
        </label>
      </div>

      <h2>Sponsor</h2>
      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={sponsorSameAsOrganization}
          onChange={(event) => setSponsorSameAsOrganization(event.target.checked)}
        />
        Samma som organisation
      </label>
      <div className="grid two">
        <label>
          Sponsorns typ
          <select name="sponsor_type" defaultValue={campaign?.sponsor_type || ""} disabled={sponsorSameAsOrganization}>
            <option value="">Välj typ</option>
            <option value="juridisk_person">Juridisk person</option>
            <option value="fysisk_person">Fysisk person</option>
            <option value="kampanjorganisation">Politisk kampanjorganisation utan juridisk personlighet</option>
          </select>
        </label>
        <label>
          Sponsorns identitet
          <input
            name="sponsor_name"
            defaultValue={campaign?.sponsor_name || ""}
            placeholder={sponsorSameAsOrganization ? currentOrganization?.name : undefined}
            disabled={sponsorSameAsOrganization}
            required={!sponsorSameAsOrganization}
          />
        </label>
        <label>
          Registrerat namn, om annat
          <input
            name="sponsor_registered_name"
            defaultValue={campaign?.sponsor_registered_name || ""}
            placeholder={sponsorSameAsOrganization ? currentOrganization?.registered_name || undefined : undefined}
            disabled={sponsorSameAsOrganization}
          />
        </label>
        <label>
          Sponsorns e-postadress
          <input
            name="sponsor_email"
            type="email"
            defaultValue={campaign?.sponsor_email || ""}
            placeholder={sponsorSameAsOrganization ? currentOrganization?.email || undefined : undefined}
            disabled={sponsorSameAsOrganization}
          />
        </label>
        <label>
          Sponsorns kontaktuppgifter
          <input
            name="sponsor_contact"
            defaultValue={campaign?.sponsor_contact || ""}
            placeholder={sponsorSameAsOrganization ? currentOrganization?.website || currentOrganization?.name : undefined}
            disabled={sponsorSameAsOrganization}
            required={!sponsorSameAsOrganization}
          />
        </label>
        <label>
          Sponsorns postadress
          <input
            name="sponsor_address"
            defaultValue={campaign?.sponsor_address || ""}
            placeholder={sponsorSameAsOrganization ? currentOrganization?.address || undefined : undefined}
            disabled={sponsorSameAsOrganization}
          />
        </label>
        <label>
          Etableringsort, om annan än postadress
          <input
            name="sponsor_establishment"
            defaultValue={campaign?.sponsor_establishment || ""}
            placeholder={sponsorSameAsOrganization ? currentOrganization?.establishment || undefined : undefined}
            disabled={sponsorSameAsOrganization}
          />
        </label>
        <label>
          Relevant registreringsnummer
          <input
            name="sponsor_registration_number"
            defaultValue={campaign?.sponsor_registration_number || ""}
            placeholder={sponsorSameAsOrganization ? currentOrganization?.org_number || undefined : undefined}
            disabled={sponsorSameAsOrganization}
          />
        </label>
      </div>

      <h2>Kontrollerande enhet</h2>
      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={controllingEntitySameAsOrganization}
          onChange={(event) => setControllingEntitySameAsOrganization(event.target.checked)}
        />
        Samma som organisation
      </label>
      <div className="grid two">
        <label>
          Eventuell kontrollerande enhet
          <input
            name="controlling_entity"
            defaultValue={campaign?.controlling_entity || ""}
            placeholder={controllingEntitySameAsOrganization ? currentOrganization?.name : undefined}
            disabled={controllingEntitySameAsOrganization}
          />
        </label>
        <label>
          Kontrollerande enhets e-postadress
          <input
            name="controlling_entity_email"
            type="email"
            defaultValue={campaign?.controlling_entity_email || ""}
            placeholder={controllingEntitySameAsOrganization ? currentOrganization?.email || undefined : undefined}
            disabled={controllingEntitySameAsOrganization}
          />
        </label>
        <label>
          Kontrollerande enhets postadress
          <input
            name="controlling_entity_address"
            defaultValue={campaign?.controlling_entity_address || ""}
            placeholder={controllingEntitySameAsOrganization ? currentOrganization?.address || undefined : undefined}
            disabled={controllingEntitySameAsOrganization}
          />
        </label>
        <label>
          Kontrollerande enhets etableringsort
          <input
            name="controlling_entity_establishment"
            defaultValue={campaign?.controlling_entity_establishment || ""}
            placeholder={controllingEntitySameAsOrganization ? currentOrganization?.establishment || undefined : undefined}
            disabled={controllingEntitySameAsOrganization}
          />
        </label>
      </div>

      <h2>Utgivare</h2>
      <div className="grid two">
        <label>
          Utgivare
          <input name="publisher_name" defaultValue={campaign?.publisher_name || ""} />
        </label>
        <label>
          Utgivarens kontakt
          <input name="publisher_contact" defaultValue={campaign?.publisher_contact || ""} />
        </label>
      </div>

      <h2>Betalare, om annan än sponsorn</h2>
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

      <h2>Publicering och finansiering</h2>
      <div className="grid two">
        <label>
          Startdatum
          <input name="period_start" type="date" defaultValue={campaign?.period_start || ""} required />
        </label>
        <label>
          Slutdatum
          <input name="period_end" type="date" defaultValue={campaign?.period_end || ""} required />
        </label>
      </div>
      <div className="grid two">
        <label>
          Belopp för reklammeddelandet
          <input name="amount_message" type="number" min="0" step="1" defaultValue={campaign?.amount_message || ""} />
        </label>
        <label>
          Belopp för kampanjen
          <input name="amount_campaign" type="number" min="0" step="1" defaultValue={campaign?.amount_campaign || ""} />
        </label>
        <label>
          Valuta
          <input name="amount_currency" defaultValue={campaign?.amount_currency || "SEK"} required />
        </label>
        <label>
          Värde av andra förmåner för reklammeddelandet
          <input name="in_kind_message" type="number" min="0" step="1" defaultValue={campaign?.in_kind_message || ""} />
        </label>
        <label>
          Värde av andra förmåner för kampanjen
          <input name="in_kind_campaign" type="number" min="0" step="1" defaultValue={campaign?.in_kind_campaign || ""} />
        </label>
      </div>
      <label className="checkbox-row">
        <input name="amount_includes_vat" type="checkbox" defaultChecked={campaign?.amount_includes_vat || false} />
        Beloppen inkluderar moms
      </label>
      <label>
        Ursprung för ekonomiska medel
        <textarea
          name="funds_origin"
          defaultValue={campaign?.funds_origin || ""}
          placeholder="Exempel: privata medel inom EU, offentliga medel inom EU..."
          required
        />
      </label>
      <div className="grid two">
        <label>
          Finansieringskälla
          <select name="funds_source_type" defaultValue={campaign?.funds_source_type || ""}>
            <option value="">Välj källa</option>
            <option value="offentlig">Offentlig</option>
            <option value="privat">Privat</option>
            <option value="offentlig_och_privat">Offentlig och privat</option>
          </select>
        </label>
        <label>
          Finansieringens geografiska ursprung
          <select name="funds_source_region" defaultValue={campaign?.funds_source_region || ""}>
            <option value="">Välj ursprung</option>
            <option value="inom_eu">Inom EU</option>
            <option value="utanför_eu">Utanför EU</option>
            <option value="inom_och_utanför_eu">Inom och utanför EU</option>
          </select>
        </label>
      </div>
      <label>
        Metod för att beräkna beloppen
        <textarea name="calculation_method" defaultValue={campaign?.calculation_method || ""} required />
      </label>
      <label>
        Underlag för beloppen
        <textarea
          name="amount_basis"
          defaultValue={campaign?.amount_basis || ""}
          placeholder="Ange om beloppen är fakturerade, budgeterade eller debiterade och hur naturaförmåner har värderats."
        />
      </label>

      <h2>Koppling till politisk process</h2>
      <div className="grid two">
        <label>
          Typ av process
          <select name="process_type" defaultValue={campaign?.process_type || ""}>
            <option value="">Ingen tydlig koppling eller ej angivet</option>
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
          Officiell information om deltagande
          <input name="official_info_url" type="url" defaultValue={campaign?.official_info_url || ""} />
        </label>
      </div>
      <label>
        Sammanfattning av kopplingen
        <textarea name="linked_process" defaultValue={campaign?.linked_process || ""} />
      </label>
      <label>
        Länk till den europeiska databasen för politiska reklammeddelanden online
        <input name="eu_database_url" type="url" defaultValue={campaign?.eu_database_url || ""} />
      </label>

      <h2>Inriktning och annonsleverans</h2>
      <label className="checkbox-row">
        <input name="targeting_used" type="checkbox" defaultChecked={campaign?.targeting_used || false} />
        Inriktningsteknik eller annonsleveransteknik används
      </label>
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
          <input name="targeting_policy_url" type="url" defaultValue={campaign?.targeting_policy_url || ""} />
        </label>
      </div>
      <div className="grid two">
        <label>
          Spridningsperiod start
          <input name="targeting_period_start" type="date" defaultValue={campaign?.targeting_period_start || ""} />
        </label>
        <label>
          Spridningsperiod slut
          <input name="targeting_period_end" type="date" defaultValue={campaign?.targeting_period_end || ""} />
        </label>
        <label>
          Visningar
          <input name="targeting_impressions" type="number" min="0" step="1" defaultValue={campaign?.targeting_impressions || ""} />
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
          <input name="targeting_comments" type="number" min="0" step="1" defaultValue={campaign?.targeting_comments || ""} />
        </label>
      </div>
      <label>
        Annan viktig information om inriktning och annonsleverans
        <textarea name="targeting_additional_info" defaultValue={campaign?.targeting_additional_info || ""} />
      </label>
      <label>
        Kanaler, kommaseparerade
        <input name="ad_channels" defaultValue={(campaign?.ad_channels || []).join(", ")} />
      </label>

      <h2>Rättigheter och anmälan</h2>
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
      <div className="grid two">
        <label>
          Kontaktväg för anmälan till utgivaren
          <input name="complaint_contact" defaultValue={campaign?.complaint_contact || ""} required />
        </label>
        <label>
          Länk för anmälan
          <input name="complaint_url" type="url" defaultValue={campaign?.complaint_url || ""} />
        </label>
      </div>
      <label className="checkbox-row">
        <input name="prior_non_compliance" type="checkbox" defaultChecked={campaign?.prior_non_compliance || false} />
        En tidigare publicering eller version har avbrutits eller återkallats på grund av överträdelse
      </label>
      <label>
        Beskriv tidigare avbrott eller återkallelse
        <textarea name="prior_non_compliance_description" defaultValue={campaign?.prior_non_compliance_description || ""} />
      </label>

      <button type="submit">{campaign ? "Spara ändringar" : "Skapa kampanj"}</button>
    </form>
  );
}
