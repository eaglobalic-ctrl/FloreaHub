import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { getAppUrl } from "@/lib/url";

const BASE_URL = process.env.TOYYIBPAY_SANDBOX === "true"
  ? "https://dev.toyyibpay.com"
  : "https://toyyibpay.com";

const PLAN_PRICES: Record<string, { name: string; price: number }> = {
  pro: { name: "Pro Plan (Monthly)", price: 99 },
  elite: { name: "Premium Plan (Monthly)", price: 199 },
};

// Dedicated route for florist plan upgrades — deliberately separate from
// /api/toyyibpay/create-bill so this payment type can never accidentally
// carry split-payment args meant for product orders.
export async function POST(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const { floristId, plan, name, email, phone } = await req.json();
    const planInfo = PLAN_PRICES[plan];
    if (!floristId || !planInfo) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    if (!name || !email || !phone) return NextResponse.json({ error: "Missing contact details" }, { status: 400 });

    if (!process.env.TOYYIBPAY_SECRET_KEY || !process.env.TOYYIBPAY_CATEGORY_CODE) {
      return NextResponse.json({ error: "ToyyibPay credentials not configured" }, { status: 500 });
    }

    const db = getSupabaseAdmin();
    const { data: florist } = await db.from("florists").select("id, plan").eq("id", floristId).eq("user_id", session.userId).eq("status", "approved").maybeSingle();
    if (!florist) return NextResponse.json({ error: "Approved florist account not found for this user" }, { status: 403 });

    // Pending row created first so the callback (which only receives the
    // reference no + bill code) has something to look up and update.
    const { data: sub, error: subError } = await db.from("subscriptions").insert({
      florist_id: floristId,
      plan,
      status: "pending",
      amount: planInfo.price,
    }).select("id").single();
    if (subError || !sub) {
      console.error("Subscription insert error:", subError);
      return NextResponse.json({ error: "Could not start subscription" }, { status: 500 });
    }

    const params = new URLSearchParams({
      userSecretKey: process.env.TOYYIBPAY_SECRET_KEY,
      categoryCode: process.env.TOYYIBPAY_CATEGORY_CODE,
      billName: `FloreaHub ${planInfo.name}`,
      billDescription: `Florist plan upgrade — ${planInfo.name}`,
      billPriceSetting: "1",
      billPayorInfo: "1",
      billAmount: String(Math.round(planInfo.price * 100)),
      billReturnUrl: `${getAppUrl()}/dashboard?planSuccess=1`,
      billCallbackUrl: `${getAppUrl()}/api/toyyibpay/plan-callback`,
      billExternalReferenceNo: sub.id,
      billTo: name,
      billEmail: email,
      billPhone: phone.replace(/[^0-9]/g, ""),
      billSplitPayment: "0",
      billSplitPaymentArgs: "",
      billPaymentChannel: "2",
      billChargeToCustomer: "1",
    });

    const res = await fetch(`${BASE_URL}/index.php/api/createBill`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const data = await res.json();
    if (!data?.[0]?.BillCode) {
      return NextResponse.json({ error: "Failed to create payment", raw: data }, { status: 502 });
    }
    const billCode = data[0].BillCode;

    await db.from("subscriptions").update({ bill_code: billCode }).eq("id", sub.id);

    return NextResponse.json({ billCode, paymentUrl: `${BASE_URL}/${billCode}` });
  } catch (err) {
    console.error("create-plan-bill error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
