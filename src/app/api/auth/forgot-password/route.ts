import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendPasswordResetEmail } from "@/lib/email";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    const db = getSupabaseAdmin();
    const { data: user } = await db.from("users").select("id, name, email").eq("email", email).maybeSingle();

    // Always return ok — don't reveal whether an email is registered
    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
      const expiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString();

      await db.from("users").update({ reset_token_hash: tokenHash, reset_token_expires_at: expiresAt }).eq("id", user.id);

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://floriahub.vercel.app";
      const resetUrl = `${baseUrl}/reset-password?token=${token}`;
      sendPasswordResetEmail({ name: user.name, email: user.email, resetUrl });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Forgot password error:", err);
    return NextResponse.json({ ok: true });
  }
}
