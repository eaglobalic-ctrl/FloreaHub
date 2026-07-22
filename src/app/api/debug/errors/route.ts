import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

// TEMPORARY, unauthenticated — diagnosing the silent order-insert failure
// without requiring the user to navigate the Admin Panel UI. Remove this
// route once root-caused; it has no auth gate and shouldn't stay in
// production longer than the debugging session that needed it.
export async function GET() {
  try {
    const db = getSupabaseAdmin();
    const { data, error } = await db
      .from("system_errors")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ errors: data ?? [] });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
