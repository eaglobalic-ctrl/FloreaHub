import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { isAdminEmail } from "@/lib/admin";
import { logSystemError } from "@/lib/systemLog";

// Public homepage feed — only ever returns admin-approved testimonials.
export async function GET() {
  try {
    const db = getSupabaseAdmin();
    const { data, error } = await db.from("testimonials").select("*").eq("approved", true).order("created_at", { ascending: false }).limit(24);
    if (error) throw error;
    return NextResponse.json({ testimonials: data ?? [] });
  } catch (err) {
    console.error("Testimonials fetch error:", err);
    return NextResponse.json({ testimonials: [] });
  }
}

// Buyer or seller shares a testimonial about FloreaHub itself — separate
// from florist/product reviews. Goes in unapproved and needs an admin to
// publish it before it can show up anywhere public.
export async function POST(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const { rating, comment } = await req.json();
    if (!rating || !comment) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const db = getSupabaseAdmin();
    const { data: user } = await db.from("users").select("name").eq("id", session.userId).maybeSingle();
    const role = session.role === "florist" ? "florist" : "buyer";

    const { data, error } = await db.from("testimonials").insert({
      user_id: session.userId,
      role,
      name: user?.name ?? "FloreaHub user",
      rating,
      comment,
    }).select().single();

    if (error) {
      await logSystemError("Testimonial insert FAILED", { userId: session.userId, error });
      throw error;
    }

    return NextResponse.json({ testimonial: data });
  } catch (err) {
    console.error("Testimonial create error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// Admin approves/rejects a pending testimonial.
export async function PATCH(req: NextRequest) {
  const session = getSession(req);
  if (!session || !isAdminEmail(session.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { testimonialId, approved } = await req.json();
    if (!testimonialId || typeof approved !== "boolean") return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const db = getSupabaseAdmin();
    const { data, error } = await db.from("testimonials").update({ approved }).eq("id", testimonialId).select().single();
    if (error) throw error;

    return NextResponse.json({ testimonial: data });
  } catch (err) {
    console.error("Testimonial moderation error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// Admin deletes a testimonial outright.
export async function DELETE(req: NextRequest) {
  const session = getSession(req);
  if (!session || !isAdminEmail(session.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { testimonialId } = await req.json();
    if (!testimonialId) return NextResponse.json({ error: "Missing testimonialId" }, { status: 400 });

    const db = getSupabaseAdmin();
    const { error } = await db.from("testimonials").delete().eq("id", testimonialId);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Testimonial delete error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
