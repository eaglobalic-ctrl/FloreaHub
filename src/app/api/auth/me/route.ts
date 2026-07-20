import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ user: null });

  try {
    const db = getSupabaseAdmin();
    const { data, error } = await db
      .from("users")
      .select("id, email, name, phone, role, status")
      .eq("id", session.userId)
      .single();

    if (error || !data) return NextResponse.json({ user: null });
    return NextResponse.json({ user: data });
  } catch {
    return NextResponse.json({ user: null });
  }
}
