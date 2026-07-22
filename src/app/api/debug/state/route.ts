import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

// TEMPORARY, unauthenticated — full-picture diagnostic while root-causing
// the "order still not showing up anywhere" reports. Remove once resolved.
export async function GET() {
  try {
    const db = getSupabaseAdmin();
    const [errors, orders, orderItems] = await Promise.all([
      db.from("system_errors").select("*").order("created_at", { ascending: false }).limit(10),
      db.from("orders").select("*").order("created_at", { ascending: false }).limit(10),
      db.from("order_items").select("*").order("id", { ascending: false }).limit(10),
    ]);
    return NextResponse.json({
      errors: errors.data ?? [],
      errorsError: errors.error,
      orders: orders.data ?? [],
      ordersError: orders.error,
      orderItems: orderItems.data ?? [],
      orderItemsError: orderItems.error,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
