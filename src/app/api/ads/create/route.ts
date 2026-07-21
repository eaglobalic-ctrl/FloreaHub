import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const body = await req.json();
    const { adType, floristId, floristName, headline, tagline, imageUrl, price } = body;

    if (!adType || !floristId || !floristName || !price) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data: florist } = await supabaseAdmin.from("florists").select("id").eq("id", floristId).eq("user_id", session.userId).eq("status", "approved").maybeSingle();
    if (!florist) return NextResponse.json({ error: "Florist not found" }, { status: 403 });

    const baseUrl = process.env.TOYYIBPAY_SANDBOX === "true"
      ? "https://dev.toyyibpay.com"
      : "https://toyyibpay.com";

    const planNames: Record<string, string> = {
      product_boost: "Product Boost (7 days)",
      shop_spotlight: "Shop Spotlight (7 days)",
      premium_banner: "Premium Banner (7 days)",
    };

    const adId = `ad-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const params = new URLSearchParams({
      userSecretKey: process.env.TOYYIBPAY_SECRET_KEY!,
      categoryCode: process.env.TOYYIBPAY_CATEGORY_CODE!,
      billName: `FloreaHub Ads - ${planNames[adType] ?? adType}`,
      billDescription: `Advertising campaign for ${floristName}: ${headline ?? ""}`,
      billPriceSetting: "1",
      billPayorInfo: "1",
      billAmount: String(Math.round(Number(price) * 100)),
      billReturnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/ads?success=1`,
      billCallbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/ads/callback`,
      billExternalReferenceNo: adId,
      billTo: floristName,
      billEmail: "noreply@floreahub.com",
      billPhone: "0000000000",
      billSplitPayment: "0",
      billSplitPaymentArgs: "",
      billPaymentChannel: "2",
      billContentEmail: `Thank you for advertising on FloreaHub! Your ${planNames[adType] ?? adType} campaign will go live shortly.`,
      billChargeToCustomer: "1",
    });

    const res = await fetch(`${baseUrl}/index.php/api/createBill`, {
      method: "POST",
      body: params,
    });

    const data = await res.json();
    if (!data?.[0]?.BillCode) {
      return NextResponse.json({ error: "Failed to create payment" }, { status: 502 });
    }

    const billCode = data[0].BillCode;

    // Save pending campaign to Supabase
    const startDate = new Date().toISOString();
    const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { error: dbError } = await supabaseAdmin.from("ads").insert({
      id: adId,
      florist_id: floristId ?? "unknown",
      florist_name: floristName,
      type: adType,
      image_url: imageUrl ?? `https://image.pollinations.ai/prompt/${encodeURIComponent(headline + " flowers bouquet")}?width=600&height=400&nologo=true&seed=${Date.now()}`,
      headline,
      tagline: tagline ?? "",
      budget: Number(price),
      starts_at: startDate,
      ends_at: endDate,
      status: "pending",
      clicks: 0,
      impressions: 0,
      bill_code: billCode,
    });

    if (dbError) {
      console.error("DB insert error:", dbError);
      // Don't block payment even if DB fails
    }

    const paymentUrl = `${baseUrl}/${billCode}`;
    return NextResponse.json({ billCode, paymentUrl, adId });
  } catch (err) {
    console.error("Ads create error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
