import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendOccasionReminderEmail } from "@/lib/email";

function ymd(d: Date) {
  return d.toISOString().slice(0, 10);
}

// Runs daily via Vercel Cron (see vercel.json). Occasions recur yearly off
// month/day only — the stored year is irrelevant after the first save.
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getSupabaseAdmin();
    const { data: reminders, error } = await db.from("reminders").select("*, users(name, email)");
    if (error) throw error;

    const now = new Date();
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const todayStr = ymd(todayUTC);
    let sent = 0;

    for (const r of reminders ?? []) {
      const occ = new Date(`${r.occasion_date}T00:00:00Z`);
      let year = todayUTC.getUTCFullYear();
      let occurrence = new Date(Date.UTC(year, occ.getUTCMonth(), occ.getUTCDate()));
      if (occurrence < todayUTC) {
        year += 1;
        occurrence = new Date(Date.UTC(year, occ.getUTCMonth(), occ.getUTCDate()));
      }

      const notifyDate = new Date(occurrence);
      notifyDate.setUTCDate(notifyDate.getUTCDate() - (r.notify_days_before ?? 3));

      if (ymd(notifyDate) !== todayStr || r.last_notified_year === year) continue;

      const user = r.users as { name?: string; email?: string } | null;
      if (!user?.email) continue;

      await sendOccasionReminderEmail({
        name: user.name ?? "there",
        email: user.email,
        occasionName: r.name,
        occasionDate: ymd(occurrence),
        daysUntil: r.notify_days_before ?? 3,
      });
      await db.from("reminders").update({ last_notified_year: year }).eq("id", r.id);
      sent++;
    }

    return NextResponse.json({ ok: true, checked: reminders?.length ?? 0, sent });
  } catch (err) {
    console.error("Reminder cron error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
