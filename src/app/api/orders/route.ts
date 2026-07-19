import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, items, subtotal, deliveryFee, total, recipientName, recipientPhone, deliveryAddress, notes, billCode } = body;

    if (!orderId || !items?.length) {
      return NextResponse.json({ error: "Missing order data" }, { status: 400 });
    }

    const db = getSupabaseAdmin();

    // Create order
    const { error: orderError } = await db.from("orders").insert({
      id: orderId,
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

  try {
    const db = getSupabaseAdmin();
    if (orderId) {
      const { data: order, error } = await db.from("orders").select("*, order_items(*)").eq("id", orderId).single();
      if (error) throw error;
      return NextResponse.json({ order });
    }
    const { data, error } = await db.from("orders").select("*, order_items(*)").order("created_at", { ascending: false }).limit(50);
    if (error) throw error;
    return NextResponse.json({ orders: data ?? [] });
  } catch (err) {
    console.error("Order fetch error:", err);
    return NextResponse.json({ orders: [] });
  }
}
