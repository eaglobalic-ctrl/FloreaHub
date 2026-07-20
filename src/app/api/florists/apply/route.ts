import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { sendAdminFloristNotification } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session) return NextResponse.json({ error: "Sila log masuk dahulu" }, { status: 401 });

    const { shopName, shopCity, shopState, shopPhone, bio } = await req.json();
    if (!shopName || !shopCity) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const db = getSupabaseAdmin();

    const { data: user } = await db.from("users").select("id, name, email, phone").eq("id", session.userId).single();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { data: existing } = await db.from("florists").select("id, status").eq("user_id", session.userId).maybeSingle();

    if (existing?.status === "pending") {
      return NextResponse.json({ error: "Permohonan anda masih dalam semakan" }, { status: 409 });
    }
    if (existing?.status === "approved") {
      return NextResponse.json({ error: "Anda sudah mempunyai kedai" }, { status: 409 });
    }

    const floristFields = {
      user_id: session.userId,
      name: shopName,
      city: shopCity,
      state: shopState || "Selangor",
      phone: shopPhone || user.phone,
      email: user.email,
      description: bio ?? null,
      status: "pending" as const,
      is_active: false,
      is_verified: false,
    };

    const { data: florist, error } = existing
      ? await db.from("florists").update(floristFields).eq("id", existing.id).select().single()
      : await db.from("florists").insert(floristFields).select().single();

    if (error) throw error;

    await sendAdminFloristNotification({ name: shopName, email: user.email, shopCity, shopPhone: shopPhone || user.phone });

    return NextResponse.json({ florist });
  } catch (err) {
    console.error("Florist apply error:", err);
    return NextResponse.json({ error: "Failed to submit application" }, { status: 500 });
  }
}
