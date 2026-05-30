import { saveCampaign } from "@/app/dashboard/actions";
import type { Campaign, Organization } from "@/lib/types";

type Props = {
  campaign?: Campaign | null;
  organizations: Organization[];
  message?: string;
  selectedOrganizationId?: string;
};

export function CampaignForm({ campaign, organizations, message, selectedOrganizationId }: Props) {
  const defaultOrganizationId = campaign?.organization_id || selectedOrganizationId || organizations[0]?.id;

  return (
    <form className="panel grid" action={saveCampaign}>
      {message ? <p className="error">{message}</p> : null}
      <input type="hidden" name="id" value={campaign?.id || ""} />

      <div className="grid two">
        <label>
          Organisation
          <select name="organization_id" defaultValue={defaultOrganizationId} required>
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
          <input name="language" defaultValue={campaign?.language || "sv"} required />
        </label>
      </div>

      <h2>Sponsor och utgivare</h2>
      <div className="grid two">
        <label>
          Sponsorns identitet
          <input name="sponsor_name" defaultValue={campaign?.sponsor_name || ""} required />
        </label>
        <label>
          Sponsorns kontaktuppgifter
          <input name="sponsor_contact" defaultValue={campaign?.sponsor_contact || ""} required />
        </label>
      </div>
      <label>
        Eventuell kontrollerande enhet
        <input name="controlling_entity" defaultValue={campaign?.controlling_entity || ""} />
      </label>
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
      </div>
      <label>
        Ursprung för ekonomiska medel
        <textarea
          name="funds_origin"
          defaultValue={campaign?.funds_origin || ""}
          placeholder="Exempel: privata medel inom EU, offentliga medel inom EU..."
          required
        />
      </label>
      <label>
        Metod för att beräkna beloppen
        <textarea name="calculation_method" defaultValue={campaign?.calculation_method || ""} required />
      </label>
      <label>
        Koppling till val, folkomröstning eller regleringsprocess
        <textarea name="linked_process" defaultValue={campaign?.linked_process || ""} />
      </label>

      <h2>Inriktning och annonsleverans</h2>
      <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <input
          style={{ width: 18, minHeight: 18 }}
          name="targeting_used"
          type="checkbox"
          defaultChecked={campaign?.targeting_used || false}
        />
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
      <label>
        Kanaler, kommaseparerade
        <input name="ad_channels" defaultValue={(campaign?.ad_channels || []).join(", ")} />
      </label>

      <h2>Rättigheter och anmälan</h2>
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

      <button type="submit">{campaign ? "Spara ändringar" : "Skapa kampanj"}</button>
    </form>
  );
}
