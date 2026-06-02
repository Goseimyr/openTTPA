import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  eventTypeLabel,
  formatEventDateTime,
  formatEventMetadata,
  type PublicationEvent
} from "@/lib/publicationEvents";
import { createClient } from "@/utils/supabase/server";
import type { Campaign } from "@/lib/types";

export default async function CampaignEventsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: campaign } = await supabase.from("campaigns").select("id,name,organization_id").eq("id", id).single();
  if (!campaign) notFound();

  const { data: membership } = await supabase
    .from("organization_members")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("organization_id", (campaign as Campaign).organization_id)
    .maybeSingle();

  if (!membership) notFound();

  const { data: events } = await supabase
    .from("campaign_publication_events")
    .select("id,campaign_id,event_type,metadata,created_at,created_by")
    .eq("campaign_id", id)
    .order("created_at", { ascending: false });

  return (
    <main className="shell" style={{ paddingBottom: 64 }}>
      <section className="row" style={{ alignItems: "end", paddingTop: 28 }}>
        <div>
          <h1>Eventlogg</h1>
          <p className="lead">Publiceringshändelser för {campaign.name}.</p>
        </div>
        <Link className="button secondary" href={`/dashboard/campaigns/${id}`}>
          Till meddelandet
        </Link>
      </section>

      {events && events.length > 0 ? (
        <div className="table-wrap" style={{ marginTop: 20 }}>
          <table className="data-table event-table">
            <thead>
              <tr>
                <th>Händelse</th>
                <th>Tidpunkt</th>
                <th>Utförd av</th>
                <th>Detaljer</th>
              </tr>
            </thead>
            <tbody>
              {(events as PublicationEvent[]).map((event) => (
                <tr key={event.id}>
                  <td>{eventTypeLabel(event.event_type)}</td>
                  <td>{formatEventDateTime(event.created_at)}</td>
                  <td>{event.created_by || "Ej angiven"}</td>
                  <td>{formatEventMetadata(event.metadata)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="muted">Det finns inga publiceringshändelser ännu.</p>
      )}
    </main>
  );
}
