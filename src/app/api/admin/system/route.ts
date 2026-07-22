import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { isAdminEmail } from "@/lib/admin";

// Config presence checks only — never returns actual secret values, just
// whether each is set. There's no dedicated cron-run log table, so "last
// activity" timestamps below are the closest proxy for "crons are running"
// without adding new infrastructure just for this.
export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session || !isAdminEmail(session.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const db = getSupabaseAdmin();
    const [lastOrder, lastPayoutReminder, lastRenewalReminder, lastAd] = await Promise.all([
      db.from("orders").select("created_at").order("created_at", { ascending: false }).limit(1).maybeSingle(),
      db.from("florists").select("payout_reminder_sent_at").not("payout_reminder_sent_at", "is", null).order("payout_reminder_sent_at", { ascending: false }).limit(1).maybeSingle(),
      db.from("subscriptions").select("renewal_reminder_sent_at").not("renewal_reminder_sent_at", "is", null).order("renewal_reminder_sent_at", { ascending: false }).limit(1).maybeSingle(),
      db.from("ads").select("status").eq("status", "expired").limit(1).maybeSingle(),
    ]);

    return NextResponse.json({
      config: {
        gmail: !!process.env.GMAIL_APP_PASSWORD && !!process.env.GMAIL_USER,
        toyyibpaySecret: !!process.env.TOYYIBPAY_SECRET_KEY,
        toyyibpayCategory: !!process.env.TOYYIBPAY_CATEGORY_CODE,
        toyyibpaySandbox: process.env.TOYYIBPAY_SANDBOX === "true",
        cronSecret: !!process.env.CRON_SECRET,
        // Admin-notification emails (sendAdminFloristNotification,
        // sendContactFormEmail) fall back to GMAIL_USER when ADMIN_EMAIL
        // isn't set — so this is "configured" either way, just note which.
        adminEmail: !!process.env.ADMIN_EMAIL || !!process.env.GMAIL_USER,
        adminEmailSource: process.env.ADMIN_EMAIL ? "ADMIN_EMAIL" : process.env.GMAIL_USER ? "GMAIL_USER (fallback)" : null,
        appUrl: process.env.NEXT_PUBLIC_APP_URL || null,
        appUrlHasTrailingSlash: !!process.env.NEXT_PUBLIC_APP_URL?.endsWith("/"),
      },
      activity: {
        lastOrderAt: lastOrder.data?.created_at ?? null,
        lastPayoutReminderAt: lastPayoutReminder.data?.payout_reminder_sent_at ?? null,
        lastRenewalReminderAt: lastRenewalReminder.data?.renewal_reminder_sent_at ?? null,
        hasExpiredAdsProcessed: !!lastAd.data,
      },
    });
  } catch (err) {
    console.error("Admin system check error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
