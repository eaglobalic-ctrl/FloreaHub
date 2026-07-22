import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { isAdminEmail } from "@/lib/admin";
import { sendCommissionUpdateEmail } from "@/lib/email";

// One-time broadcast for the 5% -> 2% commission change + split payment
// rollout (FASA 3.3). Admin-triggered, not automatic — this sends a real
// email to every approved florist, so it should only be fired once,
// deliberately, when the person running the platform is ready to announce it.
export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session || !isAdminEmail(session.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const db = getSupabaseAdmin();
    const { data: florists, error } = await db.from("florists").select("name, email").eq("status", "approved");
    if (error) throw error;

    let sent = 0;
    for (const f of florists ?? []) {
      if (!f.email) continue;
      await sendCommissionUpdateEmail({ name: f.name, email: f.email });
      sent++;
    }

    return NextResponse.json({ ok: true, sent });
  } catch (err) {
    console.error("Commission update notify error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
