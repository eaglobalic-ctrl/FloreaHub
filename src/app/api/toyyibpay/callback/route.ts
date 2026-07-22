import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendOrderConfirmationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const orderId = form.get("billExternalReferenceNo")?.toString() ?? form.get("refno")?.toString() ?? "";
    const statusId = form.get("status_id")?.toString() ?? form.get("status")?.toString();
    const billCode = form.get("billcode")?.toString() ?? "";

    console.log("ToyyibPay callback:", { orderId, statusId, billCode });

    const db = getSupabaseAdmin();

    // A multi-seller checkout creates one order row per florist (ids like
    // `${orderId}-1`, `${orderId}-2`, ...) sharing this reference — "%" also
    // matches zero extra characters, so this covers the single-seller case too.
    if (statusId === "1" && orderId) {
      await db.from("orders").update({
        payment_status: "paid",
        status: "processing",
        bill_code: billCode,
      }).like("id", `${orderId}%`);

      console.log("Order paid:", orderId);

      // Fetch order(s) and send one consolidated confirmation email —
      // awaited deliberately, since Vercel can freeze the function the
      // instant a response is returned
      try {
        const { data: orders } = await db.from("orders").select("*, order_items(*)").like("id", `${orderId}%`);
        const first = orders?.[0];
        if (first?.buyer_email) {
          await sendOrderConfirmationEmail({
            email: first.buyer_email,
            name: first.buyer_name ?? first.recipient_name ?? "Customer",
            orderId,
            items: (orders ?? []).flatMap(o => o.order_items ?? []),
            subtotal: (orders ?? []).reduce((s, o) => s + (Number(o.subtotal) || 0), 0),
            deliveryFee: (orders ?? []).reduce((s, o) => s + (Number(o.delivery_fee) || 0), 0),
            total: (orders ?? []).reduce((s, o) => s + (Number(o.total) || 0), 0),
            deliveryAddress: first.delivery_address ?? undefined,
            recipientName: first.recipient_name ?? undefined,
          });
        }
      } catch (err) {
        console.error("Email fetch error:", err);
      }

    } else if (statusId === "3" && orderId) {
      await db.from("orders").update({ payment_status: "failed" }).like("id", `${orderId}%`);
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
