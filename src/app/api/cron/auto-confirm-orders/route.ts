import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendOrderAutoConfirmedEmail } from "@/lib/email";
import { notify } from "@/lib/notify";

const GRACE_DAYS = 3;

// Runs daily via Vercel Cron (see vercel.json). Escrow gate: if the buyer
// never explicitly clicks "Confirm Received" within GRACE_DAYS of the
// florist marking an order "delivered", auto-confirm it so the florist
// isn't stuck waiting on a buyer who simply never comes back to the site
// (same idea as Shopee's auto-complete window).
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getSupabaseAdmin();
    const cutoff = new Date(Date.now() - GRACE_DAYS * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await db
      .from("orders")
      .update({ buyer_confirmed_at: new Date().toISOString() })
      .eq("status", "delivered")
      .is("buyer_confirmed_at", null)
      .lte("delivered_at", cutoff)
      .select("id, user_id, buyer_email, buyer_name, recipient_name");

    if (error) throw error;

    for (const order of data ?? []) {
      if (order.buyer_email) {
        await sendOrderAutoConfirmedEmail({
          email: order.buyer_email,
          name: order.buyer_name ?? order.recipient_name ?? "Customer",
          orderId: order.id,
        });
      }
      if (order.user_id) {
        await notify({ userId: order.user_id, type: "order", title: "Order auto-confirmed as received", body: `No response in 3 days, so order ${order.id} was marked received. Reply if that's wrong.`, link: "/orders" });
      }
    }

    return NextResponse.json({ ok: true, autoConfirmed: data?.length ?? 0 });
  } catch (err) {
    console.error("Auto-confirm cron error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
