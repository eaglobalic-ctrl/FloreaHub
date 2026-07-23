import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendContactFormEmail } from "@/lib/email";
import { verifyRecaptcha } from "@/lib/recaptcha";

export async function POST(req: NextRequest) {
  try {
    const { name, email, topic, message, recaptchaToken } = await req.json();
    if (!name || !email || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!(await verifyRecaptcha(recaptchaToken))) {
      return NextResponse.json({ error: "Verification failed — please try again" }, { status: 400 });
    }

    const db = getSupabaseAdmin();
    const { error } = await db.from("contact_messages").insert({
      name, email, topic: topic || null, message,
    });
    if (error) {
      console.error("Contact message insert error:", error);
      return NextResponse.json({ error: "Could not save your message" }, { status: 500 });
    }

    await sendContactFormEmail({ name, email, topic, message });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Contact form error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
