import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.formData();
    const statusId = body.get("status_id")?.toString() ?? body.get("status")?.toString();
    // order_id confirmed (2026-07-22) as the field ToyyibPay actually uses
    // for our submitted reference — billExternalReferenceNo alone silently
    // matched nothing in the product-order callback, same risk here.
    const subId = body.get("order_id")?.toString() ?? body.get("billExternalReferenceNo")?.toString() ?? "";
    const billCode = body.get("billcode")?.toString() ?? "";

    console.log("Plan callback:", { statusId, subId, billCode });

    if (statusId === "1" && (subId || billCode)) {
      const db = getSupabaseAdmin();
      const startDate = new Date().toISOString();
      const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const updatePayload = { status: "active", starts_at: startDate, ends_at: endDate };
      let sub = null as { florist_id: string; plan: string } | null;
      let subError = null;

      if (subId) {
        const res = await db.from("subscriptions").update(updatePayload).eq("id", subId).select("florist_id, plan").maybeSingle();
        sub = res.data;
        subError = res.error;
      }
      if (!sub && billCode) {
        const res = await db.from("subscriptions").update(updatePayload).eq("bill_code", billCode).select("florist_id, plan").maybeSingle();
        sub = res.data;
        subError = res.error;
      }

      if (subError || !sub) {
        console.error("Plan callback: subscription not found", { subId, billCode, subError });
        return NextResponse.json({ ok: false }, { status: 404 });
      }

      const { error: floristError } = await db.from("florists").update({ plan: sub.plan }).eq("id", sub.florist_id);
      if (floristError) console.error("Plan callback: florist plan update error", floristError);
      else console.log("Florist plan upgraded:", sub.florist_id, "->", sub.plan);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Plan callback error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
