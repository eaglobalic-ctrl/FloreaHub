import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getAppUrl } from "@/lib/url";
import { logSystemError } from "@/lib/systemLog";
import { computeBuilderTotal } from "@/lib/builderPricing";
import { getActiveSession } from "@/lib/activeSession";

const BASE_URL = process.env.TOYYIBPAY_SANDBOX === "true"
  ? "https://dev.toyyibpay.com"
  : "https://toyyibpay.com";

// Platform commission on product orders — florists keep the rest via
// ToyyibPay Split Payment. Ads/subscription payments never touch this route
// (separate create-plan-bill/ads-create routes) so this is never applied
// to 100%-company revenue.
const COMMISSION_RATE = 0.02;

type Item = {
  id: string; name: string; image: string; florist: string; floristId?: string | null; price: number; quantity: number;
  builderSelections?: { flowers: { id: string; qty: number }[]; wrapId: string };
};

export async function POST(req: NextRequest) {
  try {
    const session = await getActiveSession(req);
    if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const { name, email, phone, description, referenceNo, items, recipientName, recipientPhone, deliveryAddress, deliveryDate, notes } = await req.json();
    if (!deliveryDate) return NextResponse.json({ error: "Delivery date is required" }, { status: 400 });

    if (!process.env.TOYYIBPAY_SECRET_KEY || !process.env.TOYYIBPAY_CATEGORY_CODE) {
      return NextResponse.json({ error: "ToyyibPay credentials not configured" }, { status: 500 });
    }

    const orderId = referenceNo || `FH-${Date.now()}`;
    const db = getSupabaseAdmin();

    const cartItemsRaw: Item[] = items ?? [];
    if (!cartItemsRaw.length) return NextResponse.json({ error: "Cart is empty" }, { status: 400 });

    // Never trust client-submitted price/floristId — editing localStorage or
    // the raw request body would otherwise let anyone pay whatever they want
    // for a real product. Resolve every item against its actual `products`
    // row (price + florist_id) instead. Items with no matching product are
    // custom-bouquet-builder items — recompute those from the shared pricing
    // table (src/lib/builderPricing.ts) using the raw flower/wrap selections,
    // never from a pre-computed price the client sent.
    const productIds = cartItemsRaw.map(it => it.id).filter(Boolean);
    const { data: dbProducts } = productIds.length
      ? await db.from("products").select("id, price, florist_id, is_active").in("id", productIds)
      : { data: [] };
    const productById = new Map((dbProducts ?? []).map(p => [p.id, p]));

    const cartItems: Item[] = [];
    for (const raw of cartItemsRaw) {
      const quantity = Math.max(1, Math.floor(Number(raw.quantity) || 0));
      const product = productById.get(raw.id);

      if (product) {
        if (product.is_active === false) {
          return NextResponse.json({ error: `"${raw.name}" is no longer available` }, { status: 400 });
        }
        cartItems.push({ ...raw, price: Number(product.price), floristId: product.florist_id, quantity });
        continue;
      }

      if (!raw.builderSelections) {
        return NextResponse.json({ error: `Could not verify price for "${raw.name}"` }, { status: 400 });
      }
      const price = computeBuilderTotal(raw.builderSelections.flowers, raw.builderSelections.wrapId);
      cartItems.push({ ...raw, price, floristId: null, quantity });
    }

    // Group cart items per florist — a cart can span multiple sellers (like
    // Shopee's combined checkout). Items with no floristId (e.g. the custom
    // bouquet builder) fall into one "unassigned" group FloreaHub fulfills
    // directly, never split.
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
      // Commission applies only to the product subtotal — the florist keeps
      // the full delivery fee since they fulfil delivery themselves.
      const floristAmount = Math.round((subtotal * (1 - COMMISSION_RATE) + deliveryFee) * 100) / 100;
      return {
        key, groupItems, i,
        orderId: multiSeller ? `${orderId}-${i + 1}` : orderId,
        floristId: key === "__none__" ? null : key,
        subtotal, deliveryFee, total,
        toyyibpayUsername: florist?.toyyibpay_username || null,
        floristAmount,
      };
    });

    // SPLIT PAYMENT OFF BY DESIGN (2026-07-23) — switched to an escrow
    // model (Shopee-style): 100% collects to the platform account, buyer
    // confirms receipt (or auto-confirms after a grace period), THEN the
    // order is flagged for florist payout. Auto-splitting at payment time
    // is fundamentally incompatible with holding funds until confirmed
    // receipt — once ToyyibPay splits, that money is gone from our control
    // immediately, there's nothing left to "hold". This is not a fallback
    // for the earlier "Split Payment Error" — it's the intended design now.
    const splitArgs: { id: string; amount: string }[] = [];

    // Grand total recomputed entirely from resolved (DB-authoritative)
    // prices above — the client's own `amount` is never used here, since
    // trusting it was the actual vulnerability (a manipulated request body
    // could previously set this to anything, e.g. RM0.01, regardless of
    // what was really in the cart).
    const grandTotal = groupCalcs.reduce((s, g) => s + g.total, 0);
    if (grandTotal <= 0) return NextResponse.json({ error: "Invalid order total" }, { status: 400 });

    const params = new URLSearchParams({
      userSecretKey: process.env.TOYYIBPAY_SECRET_KEY,
      categoryCode: process.env.TOYYIBPAY_CATEGORY_CODE,
      billName: "FloreaHub Order",
      billDescription: description || "Flower order from FloreaHub",
      billPriceSetting: "1",
      billPayorInfo: "1",
      billAmount: String(Math.round(grandTotal * 100)),
      billReturnUrl: `${getAppUrl()}/checkout/success`,
      billCallbackUrl: `${getAppUrl()}/api/toyyibpay/callback`,
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

    // Read as text first — if ToyyibPay ever returns a non-JSON error page
    // (e.g. a validation error rendered as HTML), .json() would throw and
    // we'd lose the actual reason inside the generic catch-all below.
    const rawText = await res.text();
    let data: unknown;
    try { data = JSON.parse(rawText); } catch { data = null; }

    const billCodeCandidate = Array.isArray(data) ? (data[0] as { BillCode?: string } | undefined)?.BillCode : undefined;
    if (!billCodeCandidate) {
      console.error("ToyyibPay createBill did not return a BillCode:", JSON.stringify({
        httpStatus: res.status,
        sentSplitPayment: splitArgs.length > 0,
        splitArgs,
        rawResponseText: rawText.slice(0, 2000),
      }));
      return NextResponse.json({ error: "Failed to create bill", raw: data ?? rawText }, { status: 500 });
    }

    // ToyyibPay's createBill response only ever confirms the bill itself
    // (BillCode) — it does not confirm whether a split was accepted. If the
    // split args format is ever wrong, this is the only trace of it; check
    // Vercel logs against orders.split_recipient for the first real orders.
    if (splitArgs.length > 0) {
      console.log("Split payment requested:", JSON.stringify({ billCode: billCodeCandidate, splitArgs, rawResponse: data }));
    }

    const billCode = billCodeCandidate;

    // Save order(s) to Supabase — one row per florist, sharing this
    // bill_code as the group reference.
    //
    // Supabase-js does NOT throw on a failed insert — it resolves normally
    // with { data, error }. Every insert below used to be called without
    // capturing that, so a rejected insert (RLS, constraint, whatever)
    // failed completely silently: the bill still looked successful to the
    // buyer, but no order ever existed in the database. Confirmed via 3
    // real paid transactions that never appeared under their bill_code.
    try {
      for (const g of groupCalcs) {
        const wasSplit = splitArgs.some(s => s.id === g.toyyibpayUsername);

        const { error: orderError } = await db.from("orders").insert({
          id: g.orderId,
          user_id: session.userId,
          florist_id: g.floristId,
          subtotal: g.subtotal,
          delivery_fee: g.deliveryFee,
          total: g.total,
          buyer_name: name,
          buyer_email: email,
          recipient_name: recipientName ?? name,
          recipient_phone: recipientPhone ?? phone,
          delivery_address: deliveryAddress ?? null,
          delivery_date: deliveryDate,
          notes: notes ?? null,
          bill_code: billCode,
          payment_status: "pending",
          status: "pending",
          split_recipient: wasSplit ? g.toyyibpayUsername : null,
          split_amount: wasSplit ? g.floristAmount : null,
        });
        if (orderError) {
          await logSystemError("Order insert FAILED", { orderId: g.orderId, billCode, error: orderError });
          continue; // don't try to attach items to an order row that doesn't exist
        }

        const { error: itemsError } = await db.from("order_items").insert(
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
        if (itemsError) {
          await logSystemError("Order items insert FAILED", { orderId: g.orderId, billCode, error: itemsError });
        }
      }
    } catch (dbErr) {
      await logSystemError("Order DB save error (non-blocking)", { billCode, error: String(dbErr) });
    }

    return NextResponse.json({ billCode, paymentUrl: `${BASE_URL}/${billCode}`, orderId });
  } catch (err) {
    console.error("ToyyibPay create-bill error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
