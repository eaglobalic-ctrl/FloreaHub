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
      .from("florists")
      .select("id, name, email, phone, city, status, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ florists: data ?? [] });
  } catch (err) {
    console.error("Admin florists fetch error:", err);
    return NextResponse.json({ florists: [] });
  }
}
