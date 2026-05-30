import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const { campaignId, slug } = await request.json();

    if (!campaignId || !slug) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const supabase = createAdminClient();
    await supabase.from("transparency_views").insert({
      campaign_id: campaignId,
      slug,
      user_agent: request.headers.get("user-agent"),
      referer: request.headers.get("referer")
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
