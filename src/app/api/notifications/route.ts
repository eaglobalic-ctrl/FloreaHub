import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ notifications: [], unreadCount: 0 });

  try {
    const db = getSupabaseAdmin();
    const [list, unread] = await Promise.all([
      db.from("notifications").select("*").eq("user_id", session.userId).order("created_at", { ascending: false }).limit(50),
      db.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", session.userId).is("read_at", null),
    ]);
    if (list.error) throw list.error;

    return NextResponse.json({ notifications: list.data ?? [], unreadCount: unread.count ?? 0 });
  } catch (err) {
    console.error("Notifications fetch error:", err);
    return NextResponse.json({ notifications: [], unreadCount: 0 });
  }
}

// Marks one notification (by id) or all of them (allRead: true) as read.
export async function PATCH(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  try {
    const { id, allRead } = await req.json();
    const db = getSupabaseAdmin();

    if (allRead) {
      const { error } = await db.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", session.userId).is("read_at", null);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const { error } = await db.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id).eq("user_id", session.userId);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Notification mark-read error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
