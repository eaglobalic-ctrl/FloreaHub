import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return NextResponse.json({ error: "Email and password required" }, { status: 400 });

    const db = getSupabaseAdmin();
    const { data: user, error } = await db
      .from("users")
      .select("id, email, name, phone, role, status, password_hash")
      .eq("email", email)
      .single();

    if (error || !user) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });

    if (!user.password_hash) {
      // Account predates password auth — claim it with whatever is submitted now
      const passwordHash = await bcrypt.hash(password, 10);
      await db.from("users").update({ password_hash: passwordHash }).eq("id", user.id);
    } else {
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const { password_hash: _passwordHash, ...safeUser } = user;
    void _passwordHash;
    return NextResponse.json({ user: safeUser });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
