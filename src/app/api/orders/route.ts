import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { sendOrderStatusUpdateEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, items, subtotal, deliveryFee, total, recipientName, recipientPhone, deliveryAddress, notes, billCode } = body;

    if (!orderId || !items?.length) {
      return NextResponse.json({ error: "Missing order data" }, { status: 400 });
    }

    const db = getSupabaseAdmin();

    // Resolve the florist this order belongs to from the first real product in the cart
    let floristId: string | null = null;
    const firstProductId = items.find((item: { id: string }) => item.id)?.id;
    if (firstProductId) {
      const { data: product } = await db.from("products").select("florist_id").eq("id", firstProductId).maybeSingle();
      floristId = product?.florist_id ?? null;
    }

    // Create order
    const { error: orderError } = await db.from("orders").insert({
      id: orderId,
      florist_id: floristId,
      subtotal,
      delivery_fee: deliveryFee ?? 0,
      total,
      recipient_name: recipientName,
      recipient_phone: recipientPhone,
      delivery_address: deliveryAddress,
      notes,
      bill_code: billCode,
      payment_status: "pending",
      status: "pending",
    });

    if (orderError) throw orderError;

    // Create order items
    const orderItems = items.map((item: { id: string; name: string; image: string; florist: string; price: number; quantity: number }) => ({
      order_id: orderId,
      product_id: item.id ?? null,
      product_name: item.name,
      product_image: item.image,
      florist_name: item.florist,
      price: item.price,
      quantity: item.quantity,
    }));

    const { error: itemsError } = await db.from("order_items").insert(orderItems);
    if (itemsError) console.error("Order items error:", itemsError);

    return NextResponse.json({ ok: true, orderId });
  } catch (err) {
    console.error("Order create error:", err);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}

const VALID_STATUSES = ["pending", "processing", "ready", "delivering", "delivered", "cancelled"];

export async function PATCH(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { orderId, status, markSeenFloristId, trackingNumber, courier } = await req.json();

    // Bulk "I've seen my new orders" — clears the dashboard's new-orders
    // badge, same idea as clearing a chat's unread count on open.
    if (markSeenFloristId) {
      const db = getSupabaseAdmin();
      const { data: florist } = await db.from("florists").select("id").eq("id", markSeenFloristId).eq("user_id", session.userId).maybeSingle();
      if (!florist) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      await db.from("orders").update({ florist_seen_at: new Date().toISOString() }).eq("florist_id", markSeenFloristId).is("florist_seen_at", null);
      return NextResponse.json({ ok: true });
    }

    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    if (status === undefined && trackingNumber === undefined && courier === undefined) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const db = getSupabaseAdmin();

    // Only the florist that owns this order may advance its status
    const { data: order } = await db.from("orders").select("id, florist_id, status").eq("id", orderId).maybeSingle();
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const { data: florist } = await db.from("florists").select("id, name").eq("id", order.florist_id).eq("user_id", session.userId).maybeSingle();
    if (!florist) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Two ways to advance an order, both landing on the same field: the
    // existing manual buttons (explicit status), or saving a courier
    // tracking number — which implies "it's out for delivery" and
    // auto-advances status, without removing the manual path. Never lets
    // a tracking-number save move status BACKWARDS (e.g. re-saving after
    // "delivered" shouldn't revert to "delivering").
    let nextStatus: string | undefined = status;
    if (!nextStatus && trackingNumber) {
      const currentIdx = VALID_STATUSES.indexOf(order.status);
      const deliveringIdx = VALID_STATUSES.indexOf("delivering");
      if (currentIdx < deliveringIdx) nextStatus = "delivering";
    }

    const update: Record<string, unknown> = {};
    if (nextStatus) update.status = nextStatus;
    if (trackingNumber !== undefined) update.tracking_number = trackingNumber || null;
    if (courier !== undefined) update.courier = courier || null;

    const { data: updated, error } = await db.from("orders").update(update).eq("id", orderId).select("*, order_items(*)").single();
    if (error) throw error;

    // Buyer gets an automatic email every time the order's status actually
    // changes (whether via the manual button or the tracking-number
    // shortcut) — the status change itself is still a manual real-world
    // action (someone has to actually prepare/dispatch real flowers), but
    // the buyer no longer has to keep refreshing /orders to find out.
    if (nextStatus && updated?.buyer_email) {
      sendOrderStatusUpdateEmail({
        email: updated.buyer_email,
        name: updated.buyer_name ?? updated.recipient_name ?? "Customer",
        orderId: updated.id,
        status: nextStatus,
        floristName: florist.name,
      }).catch(err => console.error("Order status email error (non-blocking):", err));
    }

    return NextResponse.json({ order: updated });
  } catch (err) {
    console.error("Order status update error:", err);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("id");
  const billCode = searchParams.get("billCode");
  const floristId = searchParams.get("floristId");
  const buyerEmail = searchParams.get("buyerEmail");

  try {
    const db = getSupabaseAdmin();
    // A multi-seller checkout creates one order row per florist, all sharing
    // the same bill_code — either lookup can now resolve to more than one row.
    if (orderId) {
      // "%" also matches zero extra characters, so this covers both the
      // single-seller case (id === orderId) and multi-seller sub-rows
      // (id === `${orderId}-2`, etc.) in one parameterized query.
      const { data, error } = await db.from("orders").select("*, order_items(*), florists(id, name)").like("id", `${orderId}%`);
      if (error) throw error;
      return NextResponse.json({ orders: data ?? [] });
    }
    if (billCode) {
      const { data, error } = await db.from("orders").select("*, order_items(*), florists(id, name)").eq("bill_code", billCode);
      if (error) throw error;
      return NextResponse.json({ orders: data ?? [] });
    }
    // A caller must scope by florist or buyer — an unscoped request would leak every order in the marketplace
    if (!floristId && !buyerEmail) return NextResponse.json({ orders: [] });

    const session = getSession(req);
    if (!session) return NextResponse.json({ orders: [] });

    if (buyerEmail && buyerEmail !== session.email) return NextResponse.json({ orders: [] });
    if (floristId) {
      const { data: florist } = await db.from("florists").select("id").eq("id", floristId).eq("user_id", session.userId).maybeSingle();
      if (!florist) return NextResponse.json({ orders: [] });
    }

    let query = db.from("orders").select("*, order_items(*)").order("created_at", { ascending: false }).limit(50);
    if (floristId) query = query.eq("florist_id", floristId);
    if (buyerEmail) query = query.eq("buyer_email", buyerEmail);
    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ orders: data ?? [] });
  } catch (err) {
    console.error("Order fetch error:", err);
    return NextResponse.json({ orders: [] });
  }
}
