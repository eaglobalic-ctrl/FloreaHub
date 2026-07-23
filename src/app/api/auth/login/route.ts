import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/session";
import { verifyRecaptcha } from "@/lib/recaptcha";

export async function POST(req: NextRequest) {
  try {
    const { email, password, recaptchaToken } = await req.json();
    if (!email || !password) return NextResponse.json({ error: "Email and password required" }, { status: 400 });

    if (!(await verifyRecaptcha(recaptchaToken, "login"))) {
      return NextResponse.json({ error: "Verification failed — please try again" }, { status: 400 });
    }

    const db = getSupabaseAdmin();
    const { data: user, error } = await db
      .from("users")
      .select("id, email, name, phone, role, status, password_hash, is_active")
      .eq("email", email)
      .single();

    if (error || !user) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    if (user.is_active === false) return NextResponse.json({ error: "This account has been suspended. Contact support if you think this is a mistake." }, { status: 403 });

    if (!user.password_hash) {
      // Account predates password auth — claim it with whatever is submitted now
      const passwordHash = await bcrypt.hash(password, 10);
      await db.from("users").update({ password_hash: passwordHash }).eq("id", user.id);
    } else {
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Login is never gated by seller-application status — that lives on
    // `florists.status` and doesn't affect this account's ability to sign in.
    const { password_hash: _passwordHash, ...safeUser } = user;
    void _passwordHash;

    const token = createSessionToken({ userId: user.id, email: user.email, role: user.role });
    const res = NextResponse.json({ user: safeUser });
    res.cookies.set(SESSION_COOKIE, token, { httpOnly: true, secure: true, sameSite: "lax", maxAge: SESSION_MAX_AGE, path: "/" });
    return res;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
