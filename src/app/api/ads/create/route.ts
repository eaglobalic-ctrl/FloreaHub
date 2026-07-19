import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { adType, floristName, headline, tagline, price } = body;

    if (!adType || !floristName || !price) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const baseUrl = process.env.TOYYIBPAY_SANDBOX === "false"
      ? "https://toyyibpay.com"
      : "https://dev.toyyibpay.com";

    const planNames: Record<string, string> = {
      product_boost: "Product Boost (7 days)",
      shop_spotlight: "Shop Spotlight (7 days)",
      premium_banner: "Premium Banner (7 days)",
    };

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
      billExternalReferenceNo: `AD-${Date.now()}`,
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
    const paymentUrl = `${baseUrl}/${billCode}`;
    return NextResponse.json({ billCode, paymentUrl });
  } catch (err) {
    console.error("Ads create error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
