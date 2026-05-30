import QRCode from "qrcode";
import { NextResponse } from "next/server";
import { publicCampaignUrl } from "@/lib/format";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const svg = await QRCode.toString(publicCampaignUrl(slug), {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 1,
    color: {
      dark: "#19201d",
      light: "#ffffff"
    }
  });

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600"
    }
  });
}
