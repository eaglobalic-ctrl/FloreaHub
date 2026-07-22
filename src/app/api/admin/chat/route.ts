import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { isAdminEmail } from "@/lib/admin";

// Audit trail for blocked chat messages — messages.blocked_reason existed
// but was never populated or surfaced anywhere until now (FASA 6.5).
export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session || !isAdminEmail(session.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const db = getSupabaseAdmin();
    const { data, error } = await db
      .from("messages")
      .select("*, conversations(buyer_id, florist_id, users(name, email), florists(name))")
      .not("blocked_reason", "is", null)
      .order("created_at", { ascending: false })
      .limit(150);
    if (error) throw error;
    return NextResponse.json({ messages: data ?? [] });
  } catch (err) {
    console.error("Admin chat moderation fetch error:", err);
    return NextResponse.json({ messages: [] });
  }
}
