import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

const BASE_URL = process.env.TOYYIBPAY_SANDBOX === "true"
  ? "https://dev.toyyibpay.com"
  : "https://toyyibpay.com";

export async function POST(req: NextRequest) {
  try {
    const { amount, name, email, phone, description, referenceNo, items, deliveryFee, recipientName, recipientPhone, deliveryAddress, notes } = await req.json();

    if (!process.env.TOYYIBPAY_SECRET_KEY || !process.env.TOYYIBPAY_CATEGORY_CODE) {
      return NextResponse.json({ error: "ToyyibPay credentials not configured" }, { status: 500 });
    }

    const orderId = referenceNo || `FH-${Date.now()}`;

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
      billExternalReferenceNo: orderId,
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
    const subtotal = amount - (deliveryFee ?? 0);

    // Save order to Supabase
    try {
      const db = getSupabaseAdmin();

      // Resolve the florist this order belongs to from the first real product in the cart
      // (products carry florist_id; the plan-upgrade/custom-builder "items" don't map to a real product)
      let floristId: string | null = null;
      const firstProductId = items?.find((item: { id: string }) => item.id)?.id;
      if (firstProductId) {
        const { data: product } = await db.from("products").select("florist_id").eq("id", firstProductId).maybeSingle();
        floristId = product?.florist_id ?? null;
      }

      await db.from("orders").insert({
        id: orderId,
        florist_id: floristId,
        subtotal: subtotal > 0 ? subtotal : amount,
        delivery_fee: deliveryFee ?? 0,
        total: amount,
        buyer_name: name,
        buyer_email: email,
        recipient_name: recipientName ?? name,
        recipient_phone: recipientPhone ?? phone,
        delivery_address: deliveryAddress ?? null,
        notes: notes ?? null,
        bill_code: billCode,
        payment_status: "pending",
        status: "pending",
      });

      if (items?.length) {
        await db.from("order_items").insert(
          items.map((item: { id: string; name: string; image: string; florist: string; price: number; quantity: number }) => ({
            order_id: orderId,
            product_id: item.id ?? null,
            product_name: item.name,
            product_image: item.image ?? null,
            florist_name: item.florist,
            price: item.price,
            quantity: item.quantity,
          }))
        );
      }
    } catch (dbErr) {
      console.error("Order DB save error (non-blocking):", dbErr);
    }

    return NextResponse.json({ billCode, paymentUrl: `${BASE_URL}/${billCode}`, orderId });
  } catch (err) {
    console.error("ToyyibPay create-bill error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
