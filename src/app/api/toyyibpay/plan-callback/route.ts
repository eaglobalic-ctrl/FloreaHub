import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.formData();
    const statusId = body.get("status_id")?.toString() ?? body.get("status")?.toString();
    const subId = body.get("billExternalReferenceNo")?.toString() ?? "";
    const billCode = body.get("billcode")?.toString() ?? "";

    console.log("Plan callback:", { statusId, subId, billCode });

    if (statusId === "1" && subId) {
      const db = getSupabaseAdmin();
      const startDate = new Date().toISOString();
      const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const { data: sub, error: subError } = await db
        .from("subscriptions")
        .update({ status: "active", starts_at: startDate, ends_at: endDate })
        .eq("id", subId)
        .select("florist_id, plan")
        .single();

      if (subError || !sub) {
        console.error("Plan callback: subscription not found", subError);
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
