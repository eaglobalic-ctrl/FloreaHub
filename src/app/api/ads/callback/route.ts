import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.formData();
    const status = body.get("status_id") ?? body.get("status");
    const refNo = body.get("billExternalReferenceNo")?.toString() ?? "";
    console.log("Ads callback:", { status, refNo });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
