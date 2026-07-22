import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendOrderConfirmationEmail, sendNewOrderNotificationToFlorist } from "@/lib/email";

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

      // Per florist: decrement stock for what they just sold, and let them
      // know a paid order is waiting — neither happened anywhere before this.
      try {
        const { data: orders } = await db.from("orders").select("*, order_items(*), florists(name, email)").like("id", `${orderId}%`).not("florist_id", "is", null);

        for (const order of orders ?? []) {
          for (const item of order.order_items ?? []) {
            if (!item.product_id) continue;
            const { data: product } = await db.from("products").select("stock").eq("id", item.product_id).maybeSingle();
            if (product) {
              const newStock = Math.max(0, (Number(product.stock) || 0) - item.quantity);
              await db.from("products").update({ stock: newStock }).eq("id", item.product_id);
            }
          }

          const florist = order.florists as { name: string; email: string } | null;
          if (florist?.email) {
            await sendNewOrderNotificationToFlorist({
              email: florist.email,
              name: florist.name,
              orderId: order.id,
              items: order.order_items ?? [],
              total: Number(order.total) || 0,
              recipientName: order.recipient_name ?? undefined,
              deliveryAddress: order.delivery_address ?? undefined,
              deliveryDate: order.delivery_date ?? undefined,
            });
          }
        }
      } catch (err) {
        console.error("Stock/florist-notify error (non-blocking):", err);
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
