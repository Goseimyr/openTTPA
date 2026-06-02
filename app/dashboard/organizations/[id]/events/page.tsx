import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  eventTypeLabel,
  formatEventDateTime,
  formatEventMetadata,
  normalizePublicationEvent,
  type PublicationEvent
} from "@/lib/publicationEvents";
import { createClient } from "@/utils/supabase/server";
import type { Organization } from "@/lib/types";

export default async function OrganizationEventsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organizations(*)")
    .eq("user_id", user.id)
    .eq("organization_id", id)
    .maybeSingle();

  const organization = normalizeOrganization(membership?.organizations || null) as Organization | null;
  if (!organization) notFound();

  const { data: events } = await supabase
    .from("campaign_publication_events")
    .select("id,campaign_id,event_type,metadata,created_at,created_by,campaigns!inner(id,name,organization_id,version)")
    .eq("campaigns.organization_id", organization.id)
    .order("created_at", { ascending: false });

  return (
    <main className="shell" style={{ paddingBottom: 64 }}>
      <section className="row" style={{ alignItems: "end", paddingTop: 28 }}>
        <div>
          <h1>Eventlogg</h1>
          <p className="lead">Publiceringshändelser för {organization.name}.</p>
        </div>
      </section>

      <EventTable events={((events || []) as unknown as PublicationEvent[]).map(normalizePublicationEvent)} showCampaign />
    </main>
  );
}

function EventTable({ events, showCampaign }: { events: PublicationEvent[]; showCampaign?: boolean }) {
  if (events.length === 0) return <p className="muted">Det finns inga publiceringshändelser ännu.</p>;

  return (
    <div className="table-wrap" style={{ marginTop: 20 }}>
      <table className="data-table event-table">
        <thead>
          <tr>
            <th>Händelse</th>
            {showCampaign ? <th>Kampanj</th> : null}
            <th>Tidpunkt</th>
            <th>Utförd av</th>
            <th>Detaljer</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.id}>
              <td>{eventTypeLabel(event.event_type)}</td>
              {showCampaign ? (
                <td>
                  {event.campaigns ? (
                    <Link className="table-link" href={`/dashboard/campaigns/${event.campaigns.id}`}>
                      {event.campaigns.name}
                    </Link>
                  ) : (
                    "Ej angiven"
                  )}
                </td>
              ) : null}
              <td>{formatEventDateTime(event.created_at)}</td>
              <td>{event.created_by || "Ej angiven"}</td>
              <td>{formatEventMetadata(event.metadata)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function normalizeOrganization(value: Organization | Organization[] | null) {
  return Array.isArray(value) ? value[0] : value;
}
