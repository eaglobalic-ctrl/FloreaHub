import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { notify } from "@/lib/notify";

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
      let activatedAd: { florist_id: string; headline: string | null } | null = null;
      if (adId) {
        const { data, error, count: byIdCount } = await supabaseAdmin.from("ads").update(updatePayload, { count: "exact" }).eq("id", adId).select("florist_id, headline");
        if (error) console.error("Ads callback update error (by adId):", error);
        count = byIdCount ?? 0;
        activatedAd = data?.[0] ?? null;
      }
      if (count === 0 && billCode) {
        const { data, error, count: byBillCodeCount } = await supabaseAdmin.from("ads").update(updatePayload, { count: "exact" }).eq("bill_code", billCode).select("florist_id, headline");
        if (error) console.error("Ads callback update error (by billCode):", error);
        count = byBillCodeCount ?? 0;
        activatedAd = data?.[0] ?? null;
      }
      console.log("Ad activated:", adId || billCode, "rows updated:", count);

      if (activatedAd?.florist_id) {
        const { data: florist } = await supabaseAdmin.from("florists").select("user_id").eq("id", activatedAd.florist_id).maybeSingle();
        if (florist?.user_id) {
          await notify({
            userId: florist.user_id,
            type: "payment",
            title: "Your ad campaign is live",
            body: activatedAd.headline ?? "Your campaign is now showing on FloreaHub.",
            link: "/dashboard/ads",
          });
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Ads callback error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
