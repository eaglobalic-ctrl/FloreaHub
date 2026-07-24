import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { isAdminEmail } from "@/lib/admin";
import { notify } from "@/lib/notify";

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session || !isAdminEmail(session.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const db = getSupabaseAdmin();
    const { data, error } = await db
      .from("reviews")
      .select("*, users(name), florists(name)")
      .order("created_at", { ascending: false })
      .limit(150);
    if (error) throw error;
    return NextResponse.json({ reviews: data ?? [] });
  } catch (err) {
    console.error("Admin reviews fetch error:", err);
    return NextResponse.json({ reviews: [] });
  }
}

export async function DELETE(req: NextRequest) {
  const session = getSession(req);
  if (!session || !isAdminEmail(session.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { reviewId } = await req.json();
    if (!reviewId) return NextResponse.json({ error: "Missing reviewId" }, { status: 400 });

    const db = getSupabaseAdmin();
    const { data: review } = await db.from("reviews").select("user_id").eq("id", reviewId).maybeSingle();
    const { error } = await db.from("reviews").delete().eq("id", reviewId);
    if (error) throw error;

    if (review?.user_id) {
      await notify({
        userId: review.user_id,
        type: "review",
        title: "Your review was removed",
        body: "An admin removed a review you submitted for violating our guidelines.",
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Admin review delete error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
