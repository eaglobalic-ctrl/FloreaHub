import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

// Fire-and-forget tracking endpoint — impressions/clicks were previously
// written to the customer's own browser localStorage, so no aggregate data
// ever reached the server. This lets the real `ads` row be incremented.
export async function POST(req: NextRequest) {
  try {
    const { adId, type } = await req.json();
    if (!adId || (type !== "impression" && type !== "click")) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const column = type === "impression" ? "impressions" : "clicks";
    const db = getSupabaseAdmin();
    const { data: ad } = await db.from("ads").select(column).eq("id", adId).maybeSingle();
    if (!ad) return NextResponse.json({ ok: true }); // demo/unknown ad ids — nothing to track

    await db.from("ads").update({ [column]: ((ad as unknown as Record<string, number>)[column] ?? 0) + 1 }).eq("id", adId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Ads track error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
