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
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(150);
    if (error) throw error;
    return NextResponse.json({ messages: data ?? [] });
  } catch (err) {
    console.error("Admin contact fetch error:", err);
    return NextResponse.json({ messages: [] });
  }
}

export async function PATCH(req: NextRequest) {
  const session = getSession(req);
  if (!session || !isAdminEmail(session.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id, status } = await req.json();
    if (!id || !["new", "read", "resolved"].includes(status)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const db = getSupabaseAdmin();
    const { data: message, error } = await db.from("contact_messages").update({ status }).eq("id", id).select().single();
    if (error) throw error;

    return NextResponse.json({ message });
  } catch (err) {
    console.error("Admin contact update error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
