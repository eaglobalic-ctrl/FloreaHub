import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { isAdminEmail } from "@/lib/admin";
import { sendFloristApprovedEmail, sendFloristRejectedEmail } from "@/lib/email";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city");
  const plan = searchParams.get("plan");
  const q = searchParams.get("q");
  const id = searchParams.get("id");
  const userId = searchParams.get("userId");

  try {
    const db = getSupabaseAdmin();

    // Lookup by owning user — used by the seller dashboard to resolve its own florist_id.
    // Only the account itself (or an admin) may look this up.
    if (userId) {
      const session = getSession(req);
      if (!session || (session.userId !== userId && !isAdminEmail(session.email))) {
        return NextResponse.json({ florists: [] });
      }
      const { data, error } = await db.from("florists").select("*").eq("user_id", userId).maybeSingle();
      if (error) return NextResponse.json({ florists: [], error: error.message });
      return NextResponse.json({ florists: data ? [data] : [] });
    }

    let query = db.from("florists").select("*").eq("is_active", true);

    if (id) query = query.eq("id", id);
    if (city) query = query.ilike("city", `%${city}%`);
    if (plan) query = query.eq("plan", plan);
    if (q) query = query.or(`name.ilike.%${q}%,city.ilike.%${q}%,description.ilike.%${q}%`);

    query = query.order("rating", { ascending: false });

    const { data, error } = await query;
    if (error) {
      console.error("Florists query error:", error);
      return NextResponse.json({ florists: [], error: error.message });
    }
    return NextResponse.json({ florists: data ?? [] });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Florists fetch error:", msg);
    return NextResponse.json({ florists: [], error: msg });
  }
}

// Shop name, contact info, and location are set at registration/approval
// time and stay locked from self-service editing — only photo,
// description, and delivery settings are the florist's to change here.
const SELF_EDITABLE_FIELDS = [
  "description", "cover_image", "same_day_delivery", "min_order", "delivery_fee",
] as const;

export async function PUT(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { floristId, ...fields } = body;
    if (!floristId) return NextResponse.json({ error: "Missing floristId" }, { status: 400 });

    const db = getSupabaseAdmin();

    const { data: existing, error: lookupError } = await db
      .from("florists")
      .select("user_id")
      .eq("id", floristId)
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (!existing || existing.user_id !== session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const update: Record<string, unknown> = {};
    for (const key of SELF_EDITABLE_FIELDS) {
      if (key in fields) update[key] = fields[key];
    }
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "No editable fields provided" }, { status: 400 });
    }

    const { data: florist, error } = await db
      .from("florists")
      .update(update)
      .eq("id", floristId)
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json({ florist });
  } catch (err) {
    console.error("Florist self-update error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session || !isAdminEmail(session.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { floristId, status } = await req.json();
    if (!floristId || !["approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const db = getSupabaseAdmin();
    const { data: florist, error } = await db
      .from("florists")
      .update({
        status,
        is_active: status === "approved",
        is_verified: status === "approved",
      })
      .eq("id", floristId)
      .select()
      .single();

    if (error) throw error;

    if (status === "approved") {
      await sendFloristApprovedEmail({ name: florist.name, email: florist.email });
    } else {
      await sendFloristRejectedEmail({ name: florist.name, email: florist.email });
    }

    return NextResponse.json({ florist });
  } catch (err) {
    console.error("Florist review error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
