import { NextRequest, NextResponse } from "next/server";

const BASE_URL =
  process.env.TOYYIBPAY_SANDBOX === "true"
    ? "https://dev.toyyibpay.com"
    : "https://toyyibpay.com";

export async function POST(req: NextRequest) {
  try {
    const { amount, name, email, phone, description, referenceNo } =
      await req.json();

    if (!process.env.TOYYIBPAY_SECRET_KEY || !process.env.TOYYIBPAY_CATEGORY_CODE) {
      return NextResponse.json(
        { error: "ToyyibPay credentials not configured" },
        { status: 500 }
      );
    }

    const params = new URLSearchParams({
      userSecretKey: process.env.TOYYIBPAY_SECRET_KEY,
      categoryCode: process.env.TOYYIBPAY_CATEGORY_CODE,
      billName: "FloreaHub Order",
      billDescription: description || "Flower order from FloreaHub",
      billPriceSetting: "1",
      billPayorInfo: "1",
      billAmount: String(Math.round(amount * 100)),
      billReturnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success`,
      billCallbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/toyyibpay/callback`,
      billExternalReferenceNo: referenceNo || `FH-${Date.now()}`,
      billTo: name,
      billEmail: email,
      billPhone: phone.replace(/[^0-9]/g, ""),
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
      return NextResponse.json({ error: "Failed to create bill", raw: data }, { status: 500 });
    }

    const billCode = data[0].BillCode;
    return NextResponse.json({
      billCode,
      paymentUrl: `${BASE_URL}/${billCode}`,
    });
  } catch (err) {
    console.error("ToyyibPay create-bill error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
