import type { ReactNode } from "react";

export type PublicationEvent = {
  id: number;
  campaign_id: string;
  event_type: "published" | "archived" | "version_created" | "superseded";
  metadata: Record<string, unknown> | null;
  created_at: string;
  created_by: string | null;
  campaigns?: {
    id: string;
    name: string;
    organization_id: string;
    version: number;
  } | null;
};

type PublicationEventRow = Omit<PublicationEvent, "campaigns"> & {
  campaigns?: PublicationEvent["campaigns"] | PublicationEvent["campaigns"][] | null;
};

export function normalizePublicationEvent(row: PublicationEventRow): PublicationEvent {
  return {
    ...row,
    campaigns: Array.isArray(row.campaigns) ? row.campaigns[0] || null : row.campaigns || null
  };
}

export function eventTypeLabel(eventType: PublicationEvent["event_type"]) {
  if (eventType === "published") return "Publicerad";
  if (eventType === "archived") return "Arkiverad";
  if (eventType === "version_created") return "Ny version skapad";
  if (eventType === "superseded") return "Ersatt av senare version";
  return eventType;
}

export function formatEventMetadata(metadata: Record<string, unknown> | null): ReactNode {
  if (!metadata || Object.keys(metadata).length === 0) return "Inga detaljer";

  return (
    <dl className="value-list value-list-compact event-metadata">
      {Object.entries(metadata).map(([key, value]) => (
        <div key={key}>
          <dt>{metadataLabel(key)}:</dt>
          <dd>{formatMetadataValue(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

export function formatEventDateTime(value: string | null | undefined) {
  if (!value) return "Ej angivet";

  return new Intl.DateTimeFormat("sv-SE", {
    dateStyle: "long",
    timeStyle: "short"
  }).format(new Date(value));
}

function metadataLabel(key: string) {
  if (key === "replaces_campaign_id") return "Ersätter meddelande";
  if (key === "replaced_by_campaign_id") return "Ersatt av meddelande";
  if (key === "draft_campaign_id") return "Nytt utkast";
  if (key === "archived_at") return "Arkiverad";
  if (key === "version") return "Version";
  if (key === "backfilled") return "Skapad i efterhand";
  return key.replaceAll("_", " ");
}

function formatMetadataValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "Ej angivet";
  if (typeof value === "boolean") return value ? "Ja" : "Nej";
  if (typeof value === "string") return value;
  if (typeof value === "number") return new Intl.NumberFormat("sv-SE").format(value);
  return JSON.stringify(value);
}
