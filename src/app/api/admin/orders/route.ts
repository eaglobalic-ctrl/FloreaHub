import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { isAdminEmail } from "@/lib/admin";
import { sendOrderRefundedEmail } from "@/lib/email";
import { notify } from "@/lib/notify";

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session || !isAdminEmail(session.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const db = getSupabaseAdmin();
    let query = db.from("orders").select("*, florists(name), order_items(*)").order("created_at", { ascending: false }).limit(100);
    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ orders: data ?? [] });
  } catch (err) {
    console.error("Admin orders fetch error:", err);
    return NextResponse.json({ orders: [] });
  }
}

// Records a refund that was already processed manually (bank transfer /
// ToyyibPay dashboard) — there's no programmatic "reverse a split payment"
// API, so this is bookkeeping, not a live money-movement trigger.
export async function PATCH(req: NextRequest) {
  const session = getSession(req);
  if (!session || !isAdminEmail(session.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { orderId, action } = await req.json();
    if (!orderId || action !== "refund") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const db = getSupabaseAdmin();
    const { data: order, error } = await db
      .from("orders")
      .update({ payment_status: "refunded", status: "cancelled" })
      .eq("id", orderId)
      .select("*")
      .single();
    if (error) throw error;

    if (order?.buyer_email) {
      await sendOrderRefundedEmail({
        email: order.buyer_email,
        name: order.buyer_name ?? order.recipient_name ?? "Customer",
        orderId: order.id,
        total: Number(order.total) || 0,
      });
    }
    if (order?.user_id) {
      await notify({ userId: order.user_id, type: "refund", title: "Order refunded", body: `RM${(Number(order.total) || 0).toFixed(2)} for order ${order.id} has been refunded.`, link: "/orders" });
    }

    return NextResponse.json({ order });
  } catch (err) {
    console.error("Admin order refund error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
