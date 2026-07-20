import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { token, newPassword } = await req.json();
    if (!token || !newPassword) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    if (newPassword.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const db = getSupabaseAdmin();
    const { data: user } = await db
      .from("users")
      .select("id")
      .eq("reset_token_hash", tokenHash)
      .gt("reset_token_expires_at", new Date().toISOString())
      .maybeSingle();

    if (!user) return NextResponse.json({ error: "Link reset tidak sah atau sudah tamat tempoh" }, { status: 400 });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.from("users").update({
      password_hash: passwordHash,
      reset_token_hash: null,
      reset_token_expires_at: null,
    }).eq("id", user.id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Reset password error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
