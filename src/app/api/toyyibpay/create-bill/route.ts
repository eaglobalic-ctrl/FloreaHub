import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

const BASE_URL = process.env.TOYYIBPAY_SANDBOX === "true"
  ? "https://dev.toyyibpay.com"
  : "https://toyyibpay.com";

// Platform commission on product orders — florists keep the rest via
// ToyyibPay Split Payment. Ads/subscription payments never touch this route
// (separate create-plan-bill/ads-create routes) so this is never applied
// to 100%-company revenue.
const COMMISSION_RATE = 0.02;

type Item = { id: string; name: string; image: string; florist: string; floristId?: string | null; price: number; quantity: number };

export async function POST(req: NextRequest) {
  try {
    const { amount, name, email, phone, description, referenceNo, items, recipientName, recipientPhone, deliveryAddress, notes } = await req.json();

    if (!process.env.TOYYIBPAY_SECRET_KEY || !process.env.TOYYIBPAY_CATEGORY_CODE) {
      return NextResponse.json({ error: "ToyyibPay credentials not configured" }, { status: 500 });
    }

    const orderId = referenceNo || `FH-${Date.now()}`;
    const db = getSupabaseAdmin();

    // Group cart items per florist — a cart can span multiple sellers (like
    // Shopee's combined checkout). Items with no floristId (e.g. the custom
    // bouquet builder) fall into one "unassigned" group FloreaHub fulfills
    // directly, never split.
    const cartItems: Item[] = items ?? [];
    const groups = new Map<string, Item[]>();
    for (const item of cartItems) {
      const key = item.floristId ?? "__none__";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    }

    const floristIds = Array.from(groups.keys()).filter(k => k !== "__none__");
    const { data: florists } = floristIds.length
      ? await db.from("florists").select("id, delivery_fee, toyyibpay_username").in("id", floristIds)
      : { data: [] };
    const floristById = new Map((florists ?? []).map(f => [f.id, f]));

    const groupEntries = Array.from(groups.entries());
    const multiSeller = groupEntries.length > 1;

    // Per-group numbers, computed once and reused for both the split args
    // sent to ToyyibPay and the order rows saved after payment is created.
    const groupCalcs = groupEntries.map(([key, groupItems], i) => {
      const florist = key === "__none__" ? null : floristById.get(key);
      const subtotal = groupItems.reduce((s, it) => s + it.price * it.quantity, 0);
      const deliveryFee = key === "__none__" ? 15 : Number(florist?.delivery_fee ?? 15);
      const total = subtotal + deliveryFee;
      const floristAmount = Math.round(total * (1 - COMMISSION_RATE) * 100) / 100;
      return {
        key, groupItems, i,
        orderId: multiSeller ? `${orderId}-${i + 1}` : orderId,
        floristId: key === "__none__" ? null : key,
        subtotal, deliveryFee, total,
        toyyibpayUsername: florist?.toyyibpay_username || null,
        floristAmount,
      };
    });

    // Only florists with a configured ToyyibPay username go into the split —
    // anyone else's share simply stays with the platform account and needs
    // manual payout later (tracked via orders.split_recipient being null
    // while florist_id is set — surfaced in the admin financial dashboard).
    //
    // amount is in CENTS, same convention as billAmount — confirmed against
    // a real transaction on 2026-07-22: sending RM as a decimal string
    // ("6.86") got interpreted as 6.86 cents (RM0.07), not RM6.86.
    const splitArgs = groupCalcs
      .filter(g => g.floristId && g.toyyibpayUsername)
      .map(g => ({ id: g.toyyibpayUsername as string, amount: String(Math.round(g.floristAmount * 100)) }));

    for (const g of groupCalcs) {
      if (g.floristId && !g.toyyibpayUsername) {
        console.error(`Split payment: florist ${g.floristId} has no ToyyibPay username — RM${g.total} will need manual payout (order ${g.orderId})`);
      }
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
      billExternalReferenceNo: orderId,
      billTo: name,
      billEmail: email,
      billPhone: phone.replace(/[^0-9]/g, ""),
      billSplitPayment: splitArgs.length > 0 ? "1" : "0",
      billSplitPaymentArgs: splitArgs.length > 0 ? JSON.stringify(splitArgs) : "",
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

    // ToyyibPay's createBill response only ever confirms the bill itself
    // (BillCode) — it does not confirm whether a split was accepted. If the
    // split args format is ever wrong, this is the only trace of it; check
    // Vercel logs against orders.split_recipient for the first real orders.
    if (splitArgs.length > 0) {
      console.log("Split payment requested:", JSON.stringify({ billCode: data[0].BillCode, splitArgs, rawResponse: data }));
    }

    const billCode = data[0].BillCode;

    // Save order(s) to Supabase — one row per florist, sharing this
    // bill_code as the group reference.
    try {
      for (const g of groupCalcs) {
        const wasSplit = splitArgs.some(s => s.id === g.toyyibpayUsername);

        await db.from("orders").insert({
          id: g.orderId,
          florist_id: g.floristId,
          subtotal: g.subtotal,
          delivery_fee: g.deliveryFee,
          total: g.total,
          buyer_name: name,
          buyer_email: email,
          recipient_name: recipientName ?? name,
          recipient_phone: recipientPhone ?? phone,
          delivery_address: deliveryAddress ?? null,
          notes: notes ?? null,
          bill_code: billCode,
          payment_status: "pending",
          status: "pending",
          split_recipient: wasSplit ? g.toyyibpayUsername : null,
          split_amount: wasSplit ? g.floristAmount : null,
        });

        await db.from("order_items").insert(
          g.groupItems.map(item => ({
            order_id: g.orderId,
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
