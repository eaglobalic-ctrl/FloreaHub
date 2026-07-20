import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendWelcomeEmail } from "@/lib/email";
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const { email, name, phone, role, password } = await req.json();
    if (!email || !name) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    if (!password || password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });

    const db = getSupabaseAdmin();

    const { data: existing } = await db.from("users").select("id, email, name, role, status").eq("email", email).single();
    if (existing) return NextResponse.json({ user: existing, existed: true });

    const passwordHash = await bcrypt.hash(password, 10);

    // Every account is active immediately — whether it also runs a shop is
    // tracked separately on `florists`, not by gating this account's login.
    const { data: user, error } = await db.from("users").insert({
      email, name,
      phone: phone ?? null,
      role: role ?? "buyer",
      status: "active",
      password_hash: passwordHash,
    }).select("id, email, name, role, status").single();

    if (error) throw error;

    await sendWelcomeEmail({ name: user!.name, email: user!.email, role: user!.role, status: "active" });

    const token = createSessionToken({ userId: user!.id, email: user!.email, role: user!.role });
    const res = NextResponse.json({ user, existed: false });
    res.cookies.set(SESSION_COOKIE, token, { httpOnly: true, secure: true, sameSite: "lax", maxAge: SESSION_MAX_AGE, path: "/" });
    return res;
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
    const { data, error } = await db.from("users").select("id, email, name, phone, role, status").eq("email", email).single();
    if (error) return NextResponse.json({ user: null });
    return NextResponse.json({ user: data });
  } catch {
    return NextResponse.json({ user: null });
  }
}
