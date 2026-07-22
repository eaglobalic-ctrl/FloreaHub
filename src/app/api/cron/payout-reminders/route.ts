import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendPayoutSetupReminderEmail } from "@/lib/email";

const GRACE_DAYS = 3;

// Runs daily via Vercel Cron (see vercel.json). Nudges florists who have at
// least one order but never set up their ToyyibPay payout username — sent
// once per florist (payout_reminder_sent_at), not on every run.
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getSupabaseAdmin();
    const { data: florists, error } = await db
      .from("florists")
      .select("id, name, email")
      .eq("status", "approved")
      .is("toyyibpay_username", null)
      .is("payout_reminder_sent_at", null);
    if (error) throw error;

    const cutoff = new Date(Date.now() - GRACE_DAYS * 24 * 60 * 60 * 1000).toISOString();
    let sent = 0;

    for (const f of florists ?? []) {
      const { data: order } = await db
        .from("orders")
        .select("id")
        .eq("florist_id", f.id)
        .lte("created_at", cutoff)
        .limit(1)
        .maybeSingle();
      if (!order || !f.email) continue;

      await sendPayoutSetupReminderEmail({ name: f.name, email: f.email });
      await db.from("florists").update({ payout_reminder_sent_at: new Date().toISOString() }).eq("id", f.id);
      sent++;
    }

    return NextResponse.json({ ok: true, checked: florists?.length ?? 0, sent });
  } catch (err) {
    console.error("Payout reminder cron error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
