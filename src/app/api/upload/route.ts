import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/session";

const BUCKET = "shop-images";
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const form = await req.formData();
    const file = form.get("file");
    const folder = (form.get("folder")?.toString() ?? "misc").replace(/[^a-z0-9-]/gi, "");

    if (!(file instanceof File)) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: "Only JPG, PNG, WEBP or GIF images are allowed" }, { status: 400 });
    if (file.size > MAX_SIZE) return NextResponse.json({ error: "Image must be under 5MB" }, { status: 400 });

    const ext = file.type.split("/")[1];
    const path = `${folder}/${session.userId}-${Date.now()}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const db = getSupabaseAdmin();
    const { error } = await db.storage.from(BUCKET).upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    });
    if (error) throw error;

    const { data } = db.storage.from(BUCKET).getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
