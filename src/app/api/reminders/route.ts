import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/session";

const NOTIFY_DAYS: Record<string, number> = {
  "3 days before": 3,
  "1 week before": 7,
  "2 weeks before": 14,
  "1 month before": 30,
};
const DAYS_TO_LABEL = Object.fromEntries(Object.entries(NOTIFY_DAYS).map(([k, v]) => [v, k]));

export async function GET(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session) return NextResponse.json({ reminders: [] });

    const db = getSupabaseAdmin();
    const { data, error } = await db
      .from("reminders")
      .select("*")
      .eq("user_id", session.userId)
      .order("occasion_date", { ascending: true });
    if (error) throw error;

    const reminders = (data ?? []).map(r => ({
      id: r.id,
      name: r.name,
      date: r.occasion_date,
      type: r.type,
      notify: DAYS_TO_LABEL[r.notify_days_before] ?? "3 days before",
    }));
    return NextResponse.json({ reminders });
  } catch (err) {
    console.error("Reminders fetch error:", err);
    return NextResponse.json({ reminders: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const { name, date, type, notify } = await req.json();
    if (!name || !date) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const db = getSupabaseAdmin();
    const { data, error } = await db.from("reminders").insert({
      user_id: session.userId,
      name,
      occasion_date: date,
      type: type ?? "other",
      notify_days_before: NOTIFY_DAYS[notify] ?? 3,
    }).select().single();
    if (error) throw error;

    return NextResponse.json({
      reminder: { id: data.id, name: data.name, date: data.occasion_date, type: data.type, notify: notify ?? "3 days before" },
    });
  } catch (err) {
    console.error("Reminder create error:", err);
    return NextResponse.json({ error: "Failed to save reminder" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const db = getSupabaseAdmin();
    const { error } = await db.from("reminders").delete().eq("id", id).eq("user_id", session.userId);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Reminder delete error:", err);
    return NextResponse.json({ error: "Failed to delete reminder" }, { status: 500 });
  }
}
