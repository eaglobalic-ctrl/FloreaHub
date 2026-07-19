import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.formData();
    const statusId = body.get("status_id")?.toString() ?? body.get("status")?.toString();
    const adId = body.get("billExternalReferenceNo")?.toString() ?? "";
    const billCode = body.get("billcode")?.toString() ?? "";

    console.log("Ads callback:", { statusId, adId, billCode });

    // status_id "1" = success
    if (statusId === "1" && adId) {
      const startDate = new Date().toISOString();
      const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const supabaseAdmin = getSupabaseAdmin();

      const { error } = await supabaseAdmin
        .from("ads")
        .update({
          status: "active",
          start_date: startDate,
          end_date: endDate,
        })
        .eq("id", adId);

      if (error) console.error("Callback DB update error:", error);
      else console.log("Ad activated:", adId);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Ads callback error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
