import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { isAdminEmail } from "@/lib/admin";

// Unlike the public /api/testimonials GET (approved only), this returns
// everything — pending testimonials only ever show up here for moderation.
export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session || !isAdminEmail(session.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const db = getSupabaseAdmin();
    const { data, error } = await db.from("testimonials").select("*").order("created_at", { ascending: false }).limit(200);
    if (error) throw error;
    return NextResponse.json({ testimonials: data ?? [] });
  } catch (err) {
    console.error("Admin testimonials fetch error:", err);
    return NextResponse.json({ testimonials: [] });
  }
}
