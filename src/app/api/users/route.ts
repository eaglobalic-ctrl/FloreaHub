import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendWelcomeEmail } from "@/lib/email";
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/session";
import { getSession } from "@/lib/session";
import { verifyRecaptcha } from "@/lib/recaptcha";

export async function POST(req: NextRequest) {
  try {
    const { email, name, phone, role, password, recaptchaToken } = await req.json();
    if (!email || !name) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    if (!password || password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });

    if (!(await verifyRecaptcha(recaptchaToken, "register"))) {
      return NextResponse.json({ error: "Verification failed — please try again" }, { status: 400 });
    }

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

// The caller's own profile only — this used to accept an arbitrary
// ?email= and return that person's name/phone with no auth check at all.
// Nothing in the app actually called it that way; tightened to session-only.
export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ user: null }, { status: 401 });

  try {
    const db = getSupabaseAdmin();
    const { data, error } = await db.from("users").select("id, email, name, phone, role, status, avatar_url").eq("id", session.userId).single();
    if (error) return NextResponse.json({ user: null });
    return NextResponse.json({ user: data });
  } catch {
    return NextResponse.json({ user: null });
  }
}

const SELF_EDITABLE_FIELDS: Record<string, string> = { name: "name", phone: "phone", avatarUrl: "avatar_url" };

export async function PATCH(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  try {
    const body = await req.json();
    const update: Record<string, unknown> = {};
    for (const [key, column] of Object.entries(SELF_EDITABLE_FIELDS)) {
      if (key in body) update[column] = body[key];
    }
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "No editable fields provided" }, { status: 400 });
    }

    const db = getSupabaseAdmin();
    const { data, error } = await db
      .from("users")
      .update(update)
      .eq("id", session.userId)
      .select("id, email, name, phone, role, status, avatar_url")
      .single();
    if (error) throw error;

    return NextResponse.json({ user: data });
  } catch (err) {
    console.error("Profile update error:", err);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
