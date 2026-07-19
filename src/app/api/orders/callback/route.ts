import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.formData();
    const statusId = body.get("status_id")?.toString() ?? body.get("status")?.toString();
    const billCode = body.get("billcode")?.toString() ?? "";
    const orderId = body.get("billExternalReferenceNo")?.toString() ?? "";

    console.log("Order callback:", { statusId, orderId, billCode });

    const db = getSupabaseAdmin();

    if (statusId === "1" && orderId) {
      const { error } = await db.from("orders").update({
        payment_status: "paid",
        status: "processing",
      }).eq("id", orderId);

      if (error) console.error("Order callback DB error:", error);
      else console.log("Order paid:", orderId);
    } else if (statusId === "3" && orderId) {
      await db.from("orders").update({ payment_status: "failed" }).eq("id", orderId);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Order callback error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
