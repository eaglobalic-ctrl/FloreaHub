import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email, name, phone, role } = await req.json();
    if (!email || !name) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const db = getSupabaseAdmin();

    // Check if user exists
    const { data: existing } = await db.from("users").select("id, email, name, role").eq("email", email).single();
    if (existing) return NextResponse.json({ user: existing, existed: true });

    // Create new user
    const { data: user, error } = await db.from("users").insert({
      email, name, phone: phone ?? null, role: role ?? "buyer",
    }).select("id, email, name, role").single();

    if (error) throw error;
    // Non-blocking — don't fail registration if email fails
    sendWelcomeEmail({ name: user!.name, email: user!.email, role: user!.role });
    return NextResponse.json({ user, existed: false });
  } catch (err) {
    console.error("User create error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  try {
    const db = getSupabaseAdmin();
    const { data, error } = await db.from("users").select("id, email, name, phone, role").eq("email", email).single();
    if (error) return NextResponse.json({ user: null });
    return NextResponse.json({ user: data });
  } catch {
    return NextResponse.json({ user: null });
  }
}
