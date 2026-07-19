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

    if (statusId === "1" && orderId) {
      await db.from("orders").update({
        payment_status: "paid",
        status: "processing",
        bill_code: billCode,
      }).eq("id", orderId);

      console.log("Order paid:", orderId);

      // Fetch order and send confirmation email (non-blocking)
      db.from("orders")
        .select("*, order_items(*)")
        .eq("id", orderId)
        .single()
        .then(({ data: order }) => {
          if (!order?.buyer_email) return;
          sendOrderConfirmationEmail({
            email: order.buyer_email,
            name: order.buyer_name ?? order.recipient_name ?? "Customer",
            orderId: order.id,
            items: order.order_items ?? [],
            subtotal: Number(order.subtotal) || 0,
            deliveryFee: Number(order.delivery_fee) || 0,
            total: Number(order.total) || 0,
            deliveryAddress: order.delivery_address ?? undefined,
            recipientName: order.recipient_name ?? undefined,
          });
        })
        .catch(err => console.error("Email fetch error:", err));

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
