import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

const BASE_URL = process.env.TOYYIBPAY_SANDBOX === "true"
  ? "https://dev.toyyibpay.com"
  : "https://toyyibpay.com";

export async function POST(req: NextRequest) {
  try {
    const { amount, name, email, phone, description, referenceNo, items, recipientName, recipientPhone, deliveryAddress, notes } = await req.json();

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

    // Save order(s) to Supabase — one row per florist in the cart (a cart
    // can span multiple sellers, like Shopee's combined checkout), sharing
    // this bill_code as the group reference. Items with no floristId (e.g.
    // the custom bouquet builder) fall into a single "unassigned" group
    // fulfilled by FloreaHub directly, not any specific florist.
    try {
      const db = getSupabaseAdmin();
      type Item = { id: string; name: string; image: string; florist: string; floristId?: string | null; price: number; quantity: number };
      const cartItems: Item[] = items ?? [];

      const groups = new Map<string, Item[]>();
      for (const item of cartItems) {
        const key = item.floristId ?? "__none__";
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(item);
      }

      const floristIds = Array.from(groups.keys()).filter(k => k !== "__none__");
      const { data: florists } = floristIds.length
        ? await db.from("florists").select("id, delivery_fee").in("id", floristIds)
        : { data: [] };
      const deliveryFeeByFlorist = new Map((florists ?? []).map(f => [f.id, Number(f.delivery_fee) || 0]));

      const groupEntries = Array.from(groups.entries());
      const multiSeller = groupEntries.length > 1;

      for (let i = 0; i < groupEntries.length; i++) {
        const [key, groupItems] = groupEntries[i];
        const groupOrderId = multiSeller ? `${orderId}-${i + 1}` : orderId;
        const groupSubtotal = groupItems.reduce((s, it) => s + it.price * it.quantity, 0);
        const groupDeliveryFee = key === "__none__" ? 15 : (deliveryFeeByFlorist.get(key) ?? 15);

        await db.from("orders").insert({
          id: groupOrderId,
          florist_id: key === "__none__" ? null : key,
          subtotal: groupSubtotal,
          delivery_fee: groupDeliveryFee,
          total: groupSubtotal + groupDeliveryFee,
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

        await db.from("order_items").insert(
          groupItems.map(item => ({
            order_id: groupOrderId,
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
