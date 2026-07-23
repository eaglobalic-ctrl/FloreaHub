import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  try {
    const { endpoint, keys } = await req.json();
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
    }

    const db = getSupabaseAdmin();
    // A device re-subscribing (browser data cleared, etc.) reuses the same
    // endpoint — upsert on it rather than accumulating duplicate rows.
    const { error } = await db.from("push_subscriptions").upsert({
      user_id: session.userId,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    }, { onConflict: "endpoint" });
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Push subscribe error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
