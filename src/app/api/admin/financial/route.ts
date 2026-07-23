import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { isAdminEmail } from "@/lib/admin";
import { sendPayoutSentEmail } from "@/lib/email";

// 2% platform commission applies only to the product subtotal — the
// florist keeps the full delivery fee since they fulfil delivery themselves.
const payoutOwed = (o: { subtotal: number; delivery_fee: number }) => Number(o.subtotal) * 0.98 + Number(o.delivery_fee);

// Financial oversight — FASA 6.1. Escrow model (2026-07-23): payment
// collects 100% to the platform account; only once the buyer confirms
// receipt (or the auto-confirm cron does, after a grace period) is an
// order actually ready for the admin to pay the florist out manually.
export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session || !isAdminEmail(session.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const db = getSupabaseAdmin();
    const baseSelect = "id, total, subtotal, delivery_fee, split_amount, created_at, delivered_at, buyer_confirmed_at, florists(id, name, email, toyyibpay_username)";

    const historySelect = `${baseSelect}, payout_completed_at`;

    const [ready, awaiting, history] = await Promise.all([
      db.from("orders").select(baseSelect)
        .not("florist_id", "is", null)
        .eq("payment_status", "paid")
        .is("payout_completed_at", null)
        .not("buyer_confirmed_at", "is", null)
        .order("buyer_confirmed_at", { ascending: true })
        .limit(100),
      db.from("orders").select(baseSelect)
        .not("florist_id", "is", null)
        .eq("payment_status", "paid")
        .is("payout_completed_at", null)
        .is("buyer_confirmed_at", null)
        .order("created_at", { ascending: false })
        .limit(100),
      db.from("orders").select(historySelect)
        .not("florist_id", "is", null)
        .eq("payment_status", "paid")
        .not("payout_completed_at", "is", null)
        .order("payout_completed_at", { ascending: false })
        .limit(100),
    ]);
    if (ready.error) throw ready.error;
    if (awaiting.error) throw awaiting.error;
    if (history.error) throw history.error;

    const readyOwed = (ready.data ?? []).reduce((s, o) => s + payoutOwed(o), 0);
    const historyPaid = (history.data ?? []).reduce((s, o) => s + payoutOwed(o), 0);

    return NextResponse.json({
      readyForPayout: ready.data ?? [],
      readyForPayoutCount: ready.data?.length ?? 0,
      readyForPayoutOwed: Math.round(readyOwed * 100) / 100,
      awaitingConfirmation: awaiting.data ?? [],
      awaitingConfirmationCount: awaiting.data?.length ?? 0,
      payoutHistory: history.data ?? [],
      payoutHistoryCount: history.data?.length ?? 0,
      payoutHistoryTotal: Math.round(historyPaid * 100) / 100,
    });
  } catch (err) {
    console.error("Admin financial error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// Admin marks an order as manually paid out (bank transfer/DuitNow done
// outside the app — there's no automated disbursement API wired up).
export async function PATCH(req: NextRequest) {
  const session = getSession(req);
  if (!session || !isAdminEmail(session.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { orderId } = await req.json();
    if (!orderId) return NextResponse.json({ error: "Missing orderId" }, { status: 400 });

    const db = getSupabaseAdmin();
    const { data: order, error } = await db
      .from("orders")
      .update({ payout_completed_at: new Date().toISOString() })
      .eq("id", orderId)
      .select("*, florists(name, email)")
      .single();
    if (error) throw error;

    const florist = order?.florists as { name: string; email: string } | null;
    if (florist?.email) {
      await sendPayoutSentEmail({
        email: florist.email,
        name: florist.name,
        orderId: order.id,
        amount: payoutOwed(order),
      });
    }

    return NextResponse.json({ order });
  } catch (err) {
    console.error("Admin mark-payout error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
