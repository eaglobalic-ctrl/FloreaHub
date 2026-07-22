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
      .from("users")
      .select("id, name, email, phone, role, is_active, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return NextResponse.json({ users: data ?? [] });
  } catch (err) {
    console.error("Admin users fetch error:", err);
    return NextResponse.json({ users: [] });
  }
}

export async function PATCH(req: NextRequest) {
  const session = getSession(req);
  if (!session || !isAdminEmail(session.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { userId, is_active } = await req.json();
    if (!userId || typeof is_active !== "boolean") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    if (userId === session.userId && !is_active) {
      return NextResponse.json({ error: "You can't suspend your own admin account" }, { status: 400 });
    }

    const db = getSupabaseAdmin();
    const { data: user, error } = await db.from("users").update({ is_active }).eq("id", userId).select().single();
    if (error) throw error;

    return NextResponse.json({ user });
  } catch (err) {
    console.error("Admin user ban error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
