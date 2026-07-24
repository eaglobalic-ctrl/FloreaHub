const BASE_URL = process.env.TOYYIBPAY_SANDBOX === "true"
  ? "https://dev.toyyibpay.com"
  : "https://toyyibpay.com";

type ToyyibPayTransaction = {
  billpaymentStatus?: string;
  billpaymentAmount?: string;
  billExternalReferenceNo?: string;
};

// getBillTransactions is ToyyibPay's own server-to-server API — the only
// way to independently confirm a bill was actually paid. Every callback
// route (/api/toyyibpay/callback, /api/ads/callback, /api/toyyibpay/plan-callback)
// used to trust the callback's own POST body (status_id=1) directly, but
// that body is just an unauthenticated request anyone can send — including
// the buyer themselves, straight to the callback URL, using the billCode
// they were handed back right after createBill and before ever paying.
// Confirmed against a real paid bill (2026-07-24): responds with an array
// of transactions, each carrying billpaymentStatus ("1" = paid).
export async function fetchToyyibPayTransactions(billCode: string): Promise<ToyyibPayTransaction[]> {
  if (!billCode) return [];
  try {
    const params = new URLSearchParams({ billCode });
    const res = await fetch(`${BASE_URL}/index.php/api/getBillTransactions`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const text = await res.text();
    const data = JSON.parse(text);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("ToyyibPay getBillTransactions FAILED:", String(err));
    return [];
  }
}

export async function isToyyibPayBillPaid(billCode: string): Promise<boolean> {
  const txns = await fetchToyyibPayTransactions(billCode);
  return txns.some(tx => String(tx.billpaymentStatus) === "1");
}
