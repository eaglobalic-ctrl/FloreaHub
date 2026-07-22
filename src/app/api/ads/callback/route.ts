import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.formData();
    const statusId = body.get("status_id")?.toString() ?? body.get("status")?.toString();
    // order_id confirmed (2026-07-22) as the field ToyyibPay actually uses
    // for our submitted reference — same fix as the product-order callback.
    const adId = body.get("order_id")?.toString() ?? body.get("billExternalReferenceNo")?.toString() ?? "";
    const billCode = body.get("billcode")?.toString() ?? "";

    console.log("Ads callback:", { statusId, adId, billCode });

    // status_id "1" = success
    if (statusId === "1" && (adId || billCode)) {
      const startDate = new Date().toISOString();
      const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const supabaseAdmin = getSupabaseAdmin();
      const updatePayload = { status: "active", starts_at: startDate, ends_at: endDate };

      let count = 0;
      if (adId) {
        const { error, count: byIdCount } = await supabaseAdmin.from("ads").update(updatePayload, { count: "exact" }).eq("id", adId);
        if (error) console.error("Ads callback update error (by adId):", error);
        count = byIdCount ?? 0;
      }
      if (count === 0 && billCode) {
        const { error, count: byBillCodeCount } = await supabaseAdmin.from("ads").update(updatePayload, { count: "exact" }).eq("bill_code", billCode);
        if (error) console.error("Ads callback update error (by billCode):", error);
        count = byBillCodeCount ?? 0;
      }
      console.log("Ad activated:", adId || billCode, "rows updated:", count);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Ads callback error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
