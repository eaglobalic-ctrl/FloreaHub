import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendOrderConfirmationEmail, sendNewOrderNotificationToFlorist } from "@/lib/email";
import { logSystemError } from "@/lib/systemLog";
import { notify } from "@/lib/notify";
import { isToyyibPayBillPaid } from "@/lib/toyyibpay";

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
      // The callback body itself is unauthenticated — anyone who knows their
      // own billCode (handed back right after createBill, before paying)
      // could otherwise POST status_id=1 straight to this URL and get an
      // order marked paid for free. Independently confirm with ToyyibPay's
      // own API before trusting anything in this request.
      if (!billCode || !(await isToyyibPayBillPaid(billCode))) {
        await logSystemError("ToyyibPay callback REJECTED — could not independently verify payment", { orderId, billCode, statusId });
        return NextResponse.json({ error: "Could not verify payment" }, { status: 400 });
      }

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
        if (first?.user_id) {
          const total = (orders ?? []).reduce((s, o) => s + (Number(o.total) || 0), 0);
          await notify({ userId: first.user_id, type: "order", title: "Order confirmed!", body: `Your order for RM${total.toFixed(2)} has been placed. The florist will start preparing it.`, link: "/orders" });
        }
      } catch (err) {
        console.error("Email fetch error:", err);
      }

      // Per florist: decrement stock for what they just sold, and let them
      // know a paid order is waiting — neither happened anywhere before this.
      try {
        const { data: orders } = billCode
          ? await db.from("orders").select("*, order_items(*), florists(name, email, user_id)").eq("bill_code", billCode).not("florist_id", "is", null)
          : await db.from("orders").select("*, order_items(*), florists(name, email, user_id)").like("id", `${orderId}%`).not("florist_id", "is", null);

        for (const order of orders ?? []) {
          const florist = order.florists as { name: string; email: string; user_id: string } | null;

          for (const item of order.order_items ?? []) {
            if (!item.product_id) {
              await logSystemError("Stock decrement SKIPPED — order_item has no product_id", { orderId: order.id, itemName: item.product_name });
              continue;
            }
            // Atomic RPC ("stock = stock - qty" inside the UPDATE itself) —
            // a prior read-then-write here could lose an update when two
            // orders for the same product were paid within milliseconds of
            // each other, since both requests would read the same stale
            // stock value before either write landed. Returns old+new stock
            // so we can tell whether THIS decrement is what crossed the
            // low-stock line, instead of re-alerting on every order after.
            const { data: stockResult, error: stockError } = await db.rpc("decrement_product_stock", { p_product_id: item.product_id, p_quantity: item.quantity });
            if (stockError) {
              await logSystemError("Stock decrement FAILED — RPC rejected", { orderId: order.id, productId: item.product_id, quantity: item.quantity, error: stockError });
            } else {
              const row = stockResult?.[0] as { old_stock: number; new_stock: number; low_stock_threshold: number } | undefined;
              console.log("Stock decremented:", JSON.stringify({ orderId: order.id, productId: item.product_id, ...row }));

              // Threshold is set per-product by the florist (defaults to 5
              // for products created before this existed) — only fires once
              // per crossing, not on every order while already low.
              if (row && florist?.user_id && row.old_stock >= row.low_stock_threshold && row.new_stock < row.low_stock_threshold) {
                await notify({
                  userId: florist.user_id,
                  type: "stock",
                  title: row.new_stock === 0 ? "Out of stock" : "Low stock alert",
                  body: row.new_stock === 0
                    ? `"${item.product_name}" just sold out.`
                    : `"${item.product_name}" has only ${row.new_stock} left — consider restocking.`,
                  link: "/dashboard/products",
                });
              }
            }
          }

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
          if (florist?.user_id) {
            await notify({ userId: florist.user_id, type: "order", title: "New order received!", body: `RM${(Number(order.total) || 0).toFixed(2)} — payment confirmed, start preparing.`, link: "/dashboard?tab=orders" });
          }
        }
      } catch (err) {
        await logSystemError("Stock/florist-notify block threw (non-blocking)", { orderId, billCode, error: String(err) });
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
