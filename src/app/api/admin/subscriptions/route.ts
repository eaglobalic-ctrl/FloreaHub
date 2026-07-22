import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { isAdminEmail } from "@/lib/admin";

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session || !isAdminEmail(session.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const db = getSupabaseAdmin();
    const { data, error } = await db
      .from("subscriptions")
      .select("*, florists(name, email)")
      .order("created_at", { ascending: false })
      .limit(150);
    if (error) throw error;
    return NextResponse.json({ subscriptions: data ?? [] });
  } catch (err) {
    console.error("Admin subscriptions fetch error:", err);
    return NextResponse.json({ subscriptions: [] });
  }
}
