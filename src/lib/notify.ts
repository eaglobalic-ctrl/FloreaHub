import webpush from "web-push";
import { getSupabaseAdmin } from "@/lib/supabase";
import { logSystemError } from "@/lib/systemLog";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
  const contact = process.env.ADMIN_EMAIL ?? process.env.GMAIL_USER ?? "admin@floriahub.vercel.app";
  webpush.setVapidDetails(`mailto:${contact}`, vapidPublicKey, vapidPrivateKey);
}

// The single entry point for every notification-worthy event — writes the
// in-app record (always, so /notifications has full history even if push
// isn't configured or the user never granted permission) and best-effort
// pushes to every device the user has subscribed on. Chat, order status,
// payments, payouts, reviews — everything funnels through here instead of
// each call site reinventing insert+push logic.
export async function notify({ userId, type, title, body, link }: {
  userId: string; type: string; title: string; body?: string; link?: string;
}) {
  const db = getSupabaseAdmin();

  const { error } = await db.from("notifications").insert({
    user_id: userId, type, title, body: body ?? null, link: link ?? null,
  });
  if (error) await logSystemError("Notification insert FAILED", { userId, type, error });

  if (!vapidPublicKey || !vapidPrivateKey) return;

  const { data: subs } = await db.from("push_subscriptions").select("*").eq("user_id", userId);
  if (!subs?.length) return;

  const payload = JSON.stringify({ title, body: body ?? "", link: link ?? "/" });

  await Promise.all(subs.map(async (sub) => {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      );
    } catch (err: unknown) {
      const statusCode = (err as { statusCode?: number })?.statusCode;
      if (statusCode === 410 || statusCode === 404) {
        // Subscription expired or the user revoked permission — stop
        // trying it instead of erroring on every future notification.
        await db.from("push_subscriptions").delete().eq("id", sub.id);
      } else {
        await logSystemError("Push send FAILED", { userId, endpoint: sub.endpoint, error: String(err) });
      }
    }
  }));
}
