import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const refno = form.get("refno");
    const status = form.get("status"); // 1=success, 2=pending, 3=fail
    const billcode = form.get("billcode");
    const transaction_id = form.get("transaction_id");
    const amount = form.get("amount");

    console.log("ToyyibPay callback received:", {
      refno,
      status,
      billcode,
      transaction_id,
      amount,
    });

    if (status === "1") {
      // Payment successful
      // TODO: Look up order by refno, mark as paid, trigger fulfillment
    } else if (status === "3") {
      // Payment failed
      // TODO: Mark order as failed
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("ToyyibPay callback error:", err);
    return NextResponse.json({ error: "Callback error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
