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
      .select("id, name, email, phone, city, state, address, status, is_active, plan, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ florists: data ?? [] });
  } catch (err) {
    console.error("Admin florists fetch error:", err);
    return NextResponse.json({ florists: [] });
  }
}

const ADMIN_EDITABLE_FIELDS = ["name", "email", "phone", "city", "state", "address"] as const;

// Suspend (is_active) and edit of fields locked from florist self-service
// (name/email/phone/address) — the ToS promises suspension for complaints
// and support can fix a typo the florist can't touch themselves, neither
// had a real mechanism before this.
export async function PATCH(req: NextRequest) {
  const session = getSession(req);
  if (!session || !isAdminEmail(session.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { floristId, is_active, ...fields } = await req.json();
    if (!floristId) return NextResponse.json({ error: "Missing floristId" }, { status: 400 });

    const update: Record<string, unknown> = {};
    if (typeof is_active === "boolean") update.is_active = is_active;
    for (const key of ADMIN_EDITABLE_FIELDS) {
      if (key in fields) update[key] = fields[key];
    }
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "No fields provided" }, { status: 400 });
    }

    const db = getSupabaseAdmin();
    const { data: florist, error } = await db.from("florists").update(update).eq("id", floristId).select().single();
    if (error) throw error;

    return NextResponse.json({ florist });
  } catch (err) {
    console.error("Admin florist update error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
