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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("id");
  const billCode = searchParams.get("billCode");
  const floristId = searchParams.get("floristId");
  const buyerEmail = searchParams.get("buyerEmail");

  try {
    const db = getSupabaseAdmin();
    if (orderId) {
      const { data: order, error } = await db.from("orders").select("*, order_items(*)").eq("id", orderId).single();
      if (error) throw error;
      return NextResponse.json({ order });
    }
    if (billCode) {
      const { data: order, error } = await db.from("orders").select("*, order_items(*)").eq("bill_code", billCode).single();
      if (error) return NextResponse.json({ order: null });
      return NextResponse.json({ order });
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
