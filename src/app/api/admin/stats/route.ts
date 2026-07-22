import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { isAdminEmail } from "@/lib/admin";

const COMMISSION_RATE = 0.02;

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session || !isAdminEmail(session.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const db = getSupabaseAdmin();

    const [users, florists, paidOrders, ads, subs] = await Promise.all([
      db.from("users").select("id", { count: "exact", head: true }),
      db.from("florists").select("id, status"),
      db.from("orders").select("total").eq("payment_status", "paid"),
      db.from("ads").select("budget").neq("status", "pending"),
      db.from("subscriptions").select("amount").neq("status", "pending"),
    ]);

    const floristCounts = (florists.data ?? []).reduce((acc: Record<string, number>, f) => {
      acc[f.status] = (acc[f.status] ?? 0) + 1;
      return acc;
    }, {});

    const gmv = (paidOrders.data ?? []).reduce((s, o) => s + (Number(o.total) || 0), 0);
    const adsRevenue = (ads.data ?? []).reduce((s, a) => s + (Number(a.budget) || 0), 0);
    const subscriptionRevenue = (subs.data ?? []).reduce((s, sb) => s + (Number(sb.amount) || 0), 0);
    const commissionEarned = Math.round(gmv * COMMISSION_RATE * 100) / 100;

    return NextResponse.json({
      totalUsers: users.count ?? 0,
      floristsByStatus: { pending: 0, approved: 0, rejected: 0, ...floristCounts },
      totalOrders: paidOrders.data?.length ?? 0,
      gmv,
      adsRevenue,
      subscriptionRevenue,
      commissionEarned,
      totalCompanyRevenue: Math.round((commissionEarned + adsRevenue + subscriptionRevenue) * 100) / 100,
    });
  } catch (err) {
    console.error("Admin stats error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
