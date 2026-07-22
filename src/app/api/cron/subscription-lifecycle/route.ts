import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendPlanRenewalReminderEmail, sendPlanDowngradedEmail } from "@/lib/email";

// Runs daily via Vercel Cron (see vercel.json). ToyyibPay has no
// auto-recurring billing, so florist plans are fixed 30-day periods that
// must be manually renewed — this cron only reminds (H-3) and auto-downgrades
// on expiry, it never charges anything.
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getSupabaseAdmin();
    const now = new Date();
    let reminded = 0;
    let downgraded = 0;

    // H-3 renewal reminder — active subscriptions only; a florist who
    // already cancelled explicitly opted out of renewing, don't nag them.
    const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const { data: dueSoon } = await db
      .from("subscriptions")
      .select("id, plan, ends_at, florist_id, florists(name, email)")
      .eq("status", "active")
      .is("renewal_reminder_sent_at", null)
      .lte("ends_at", in3Days)
      .gt("ends_at", now.toISOString());

    for (const sub of dueSoon ?? []) {
      const florist = sub.florists as unknown as { name: string; email: string } | null;
      if (!florist?.email) continue;
      await sendPlanRenewalReminderEmail({ name: florist.name, email: florist.email, plan: sub.plan, endsAt: sub.ends_at });
      await db.from("subscriptions").update({ renewal_reminder_sent_at: now.toISOString() }).eq("id", sub.id);
      reminded++;
    }

    // Auto-downgrade — active or cancelled subscriptions past their end date.
    const { data: expired } = await db
      .from("subscriptions")
      .select("id, plan, florist_id, florists(name, email, plan)")
      .in("status", ["active", "cancelled"])
      .lte("ends_at", now.toISOString());

    for (const sub of expired ?? []) {
      await db.from("subscriptions").update({ status: "expired" }).eq("id", sub.id);

      const florist = sub.florists as unknown as { name: string; email: string; plan: string } | null;
      // Only downgrade if the florist is still on the plan this subscription
      // granted — guards against clobbering a newer subscription they've
      // since started (e.g. upgraded again before this one's period ended).
      if (florist && florist.plan === sub.plan) {
        await db.from("florists").update({ plan: "free" }).eq("id", sub.florist_id);
        if (florist.email) await sendPlanDowngradedEmail({ name: florist.name, email: florist.email, plan: sub.plan });
        downgraded++;
      }
    }

    return NextResponse.json({ ok: true, reminded, downgraded });
  } catch (err) {
    console.error("Subscription lifecycle cron error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
