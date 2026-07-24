import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { notify } from "@/lib/notify";

// Runs daily via Vercel Cron (see vercel.json). /api/ads already filters
// active-ads queries by `ends_at > now()` at read time, so expired
// campaigns never show publicly even without this — but the stored status
// column itself needs to flip too, since dashboard stats ("Active
// Campaigns" count) and the future admin ads oversight panel read status
// directly rather than re-deriving it from ends_at.
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getSupabaseAdmin();
    const { data, error } = await db
      .from("ads")
      .update({ status: "expired" })
      .eq("status", "active")
      .lte("ends_at", new Date().toISOString())
      .select("id, florist_id, headline");
    if (error) throw error;

    if (data?.length) {
      const floristIds = [...new Set(data.map(ad => ad.florist_id).filter(Boolean))];
      const { data: florists } = await db.from("florists").select("id, user_id").in("id", floristIds);
      const ownerByFlorist = new Map((florists ?? []).map(f => [f.id, f.user_id]));

      await Promise.all(data.map(ad => {
        const userId = ownerByFlorist.get(ad.florist_id);
        if (!userId) return Promise.resolve();
        return notify({
          userId,
          type: "payment",
          title: "Your ad campaign has expired",
          body: ad.headline ? `"${ad.headline}" is no longer showing. Renew it from your dashboard.` : "Renew it from your dashboard to keep it running.",
          link: "/dashboard/ads",
        });
      }));
    }

    return NextResponse.json({ ok: true, expired: data?.length ?? 0 });
  } catch (err) {
    console.error("Ads expire cron error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
