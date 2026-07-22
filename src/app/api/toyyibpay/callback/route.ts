import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendOrderConfirmationEmail, sendNewOrderNotificationToFlorist } from "@/lib/email";
import { logSystemError } from "@/lib/systemLog";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    // ToyyibPay's browser-facing return redirect confirmed to use `order_id`
    // for our own reference (verified 2026-07-22 from a real redirect URL:
    // ?status_id=1&billcode=...&order_id=FH-...&msg=ok&transaction_id=TP...).
    // `refno`/`billExternalReferenceNo` were assumed field names that turned
    // out to actually hold ToyyibPay's own transaction id in the callback
    // POST body, not ours — silently matching zero order rows ever since.
    // order_id is checked first; the others stay as fallbacks in case the
    // callback body differs from the redirect for some payment channels.
    const orderId = form.get("order_id")?.toString() ?? form.get("billExternalReferenceNo")?.toString() ?? form.get("refno")?.toString() ?? "";
    const statusId = form.get("status_id")?.toString() ?? form.get("status")?.toString();
    const billCode = form.get("billcode")?.toString() ?? "";

    console.log("ToyyibPay callback:", { orderId, statusId, billCode, allFields: Object.fromEntries(form.entries()) });

    const db = getSupabaseAdmin();

    // A multi-seller checkout creates one order row per florist (ids like
    // `${orderId}-1`, `${orderId}-2`, ...) sharing this reference — "%" also
    // matches zero extra characters, so this covers the single-seller case too.
    if (statusId === "1" && (orderId || billCode)) {
      let count = 0;
      if (orderId) {
        const { error: updateError, count: byIdCount } = await db.from("orders").update({
          payment_status: "paid",
          status: "processing",
          bill_code: billCode,
        }, { count: "exact" }).like("id", `${orderId}%`);
        if (updateError) await logSystemError("Order payment_status update FAILED (by orderId)", { orderId, billCode, error: updateError });
        count = byIdCount ?? 0;
      }

      // Fallback: bill_code is unique per bill and always known to be
      // correct (unlike the reference field, whose name has proven
      // unreliable) — use it if the orderId-based match found nothing.
      if (count === 0 && billCode) {
        const { error: fallbackError, count: byBillCodeCount } = await db.from("orders").update({
          payment_status: "paid",
          status: "processing",
        }, { count: "exact" }).eq("bill_code", billCode).neq("payment_status", "paid");
        if (fallbackError) await logSystemError("Order payment_status update FAILED (by billCode fallback)", { orderId, billCode, error: fallbackError });
        count = byBillCodeCount ?? 0;
      }

      if (count === 0) await logSystemError("Order payment_status update matched ZERO rows via orderId AND billCode — no order exists for this reference", { orderId, billCode });
      console.log("Order paid:", orderId || billCode, "rows updated:", count);

      // Fetch order(s) and send one consolidated confirmation email —
      // awaited deliberately, since Vercel can freeze the function the
      // instant a response is returned. bill_code is the reliable lookup
      // key (see note above on orderId's field-name history); fall back to
      // the orderId-like match only if we somehow have no bill code at all.
      try {
        const { data: orders } = billCode
          ? await db.from("orders").select("*, order_items(*)").eq("bill_code", billCode)
          : await db.from("orders").select("*, order_items(*)").like("id", `${orderId}%`);
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
        const { data: orders } = billCode
          ? await db.from("orders").select("*, order_items(*), florists(name, email)").eq("bill_code", billCode).not("florist_id", "is", null)
          : await db.from("orders").select("*, order_items(*), florists(name, email)").like("id", `${orderId}%`).not("florist_id", "is", null);

        for (const order of orders ?? []) {
          for (const item of order.order_items ?? []) {
            if (!item.product_id) continue;
            const { data: product } = await db.from("products").select("stock").eq("id", item.product_id).maybeSingle();
            if (product) {
              const newStock = Math.max(0, (Number(product.stock) || 0) - item.quantity);
              const { error: stockError } = await db.from("products").update({ stock: newStock }).eq("id", item.product_id);
              if (stockError) console.error("Stock update FAILED:", JSON.stringify({ productId: item.product_id, error: stockError }));
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

      // Post an "order placed" card into the buyer<->florist chat — was
      // reusing the generic "asking about this product" card before, which
      // reads wrong once a purchase actually happened.
      try {
        const { data: orders } = billCode
          ? await db.from("orders").select("*, order_items(*)").eq("bill_code", billCode).not("florist_id", "is", null)
          : await db.from("orders").select("*, order_items(*)").like("id", `${orderId}%`).not("florist_id", "is", null);

        for (const order of orders ?? []) {
          if (!order.user_id || !order.florist_id) continue;
          const firstItem = order.order_items?.[0];
          if (!firstItem) continue;

          const { data: existingConvo } = await db.from("conversations").select("*").eq("buyer_id", order.user_id).eq("florist_id", order.florist_id).maybeSingle();
          const conversation = existingConvo ?? (await db.from("conversations").insert({ buyer_id: order.user_id, florist_id: order.florist_id }).select().single()).data;
          if (!conversation) continue;

          const { error: cardError } = await db.from("messages").insert({
            conversation_id: conversation.id,
            sender_role: "buyer",
            order_id: order.id,
            product_id: firstItem.product_id,
            product_name: order.order_items.length > 1 ? `${firstItem.product_name} +${order.order_items.length - 1} more` : firstItem.product_name,
            product_price: Number(order.total),
            product_image: firstItem.product_image,
          });
          if (cardError) console.error("Order card insert FAILED:", JSON.stringify({ orderId: order.id, error: cardError }));

          await db.from("conversations").update({
            last_message_at: new Date().toISOString(),
            florist_unread_count: (conversation.florist_unread_count ?? 0) + 1,
          }).eq("id", conversation.id);
        }
      } catch (err) {
        console.error("Order card post error (non-blocking):", err);
      }

    } else if (statusId === "3" && (orderId || billCode)) {
      const { error: failError } = billCode
        ? await db.from("orders").update({ payment_status: "failed" }).eq("bill_code", billCode)
        : await db.from("orders").update({ payment_status: "failed" }).like("id", `${orderId}%`);
      if (failError) console.error("Order payment_status=failed update error:", JSON.stringify({ orderId, billCode, error: failError }));
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
