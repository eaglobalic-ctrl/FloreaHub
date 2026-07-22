import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/session";

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

    const { orderId, status } = await req.json();
    if (!orderId || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const db = getSupabaseAdmin();

    // Only the florist that owns this order may advance its status
    const { data: order } = await db.from("orders").select("id, florist_id").eq("id", orderId).maybeSingle();
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const { data: florist } = await db.from("florists").select("id").eq("id", order.florist_id).eq("user_id", session.userId).maybeSingle();
    if (!florist) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { data: updated, error } = await db.from("orders").update({ status }).eq("id", orderId).select("*, order_items(*)").single();
    if (error) throw error;

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
      const { data, error } = await db.from("orders").select("*, order_items(*)").like("id", `${orderId}%`);
      if (error) throw error;
      return NextResponse.json({ orders: data ?? [] });
    }
    if (billCode) {
      const { data, error } = await db.from("orders").select("*, order_items(*)").eq("bill_code", billCode);
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
