import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ user: null });

  try {
    const db = getSupabaseAdmin();
    const { data: user, error } = await db
      .from("users")
      .select("id, email, name, phone, role, status")
      .eq("id", session.userId)
      .single();

    if (error || !user) return NextResponse.json({ user: null });

    const { data: florist } = await db
      .from("florists")
      .select("id, name, status, plan")
      .eq("user_id", session.userId)
      .maybeSingle();

    return NextResponse.json({ user, florist: florist ?? null });
  } catch {
    return NextResponse.json({ user: null });
  }
}
