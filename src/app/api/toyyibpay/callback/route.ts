import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const orderId = form.get("billExternalReferenceNo")?.toString() ?? form.get("refno")?.toString() ?? "";
    const statusId = form.get("status_id")?.toString() ?? form.get("status")?.toString();
    const billCode = form.get("billcode")?.toString() ?? "";

    console.log("ToyyibPay callback:", { orderId, statusId, billCode });

    const db = getSupabaseAdmin();

    if (statusId === "1" && orderId) {
      await db.from("orders").update({
        payment_status: "paid",
        status: "processing",
        bill_code: billCode,
      }).eq("id", orderId);
      console.log("Order paid:", orderId);
    } else if (statusId === "3" && orderId) {
      await db.from("orders").update({ payment_status: "failed" }).eq("id", orderId);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("ToyyibPay callback error:", err);
    return NextResponse.json({ error: "Callback error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
