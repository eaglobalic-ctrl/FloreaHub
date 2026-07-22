import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { isAdminEmail } from "@/lib/admin";

// Financial oversight — FASA 6.1, flagged in the plan as the most urgent
// admin panel piece once split payment (FASA 3) went live.
export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session || !isAdminEmail(session.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const db = getSupabaseAdmin();

    // Orders that SHOULD have split to a florist but couldn't — florist_id
    // is set (this is a marketplace order, not a builder/company one),
    // payment went through, but split_recipient never got filled in
    // (usually because that florist never finished ToyyibPay payout setup).
    const { data: pendingPayout, error } = await db
      .from("orders")
      .select("id, total, split_amount, created_at, florists(id, name, email, toyyibpay_username)")
      .not("florist_id", "is", null)
      .eq("payment_status", "paid")
      .is("split_recipient", null)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;

    const owedTotal = (pendingPayout ?? []).reduce((s, o) => s + (Number(o.total) || 0) * 0.98, 0);

    return NextResponse.json({
      pendingManualPayout: pendingPayout ?? [],
      pendingManualPayoutCount: pendingPayout?.length ?? 0,
      pendingManualPayoutOwed: Math.round(owedTotal * 100) / 100,
    });
  } catch (err) {
    console.error("Admin financial error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
