// Converts the URL-safe base64 VAPID public key into the raw byte array
// the PushManager API expects.
function urlBase64ToUint8Array(base64: string): BufferSource {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Safe = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64Safe);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0))) as BufferSource;
}

export function pushSupported(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;
}

// iPhone/iPad only support Web Push from a site that's been "Added to Home
// Screen" and opened from that icon (iOS 16.4+) — never from a normal
// Safari tab, no matter what permission is granted. Chrome on iOS is just
// Safari underneath (Apple's WebKit policy), so this applies there too.
export function isIos(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const isAppleTouch = /iPad|iPhone|iPod/.test(ua);
  // iPadOS 13+ reports as "Macintosh" but is still touch-only, unlike a real Mac.
  const isIpadOsAsMac = ua.includes("Macintosh") && navigator.maxTouchPoints > 1;
  return isAppleTouch || isIpadOsAsMac;
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches
    || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export async function getPushPermissionState(): Promise<NotificationPermission | "unsupported"> {
  if (!pushSupported()) return "unsupported";
  return Notification.permission;
}

export type EnablePushResult = { ok: true } | { ok: false; reason: "ios-not-installed" | "unsupported" | "not-configured" | "permission-denied" };

// Registers the push-only service worker, asks for permission if needed,
// subscribes, and saves the subscription server-side. Safe to call
// repeatedly — re-subscribing with the same keys is a no-op on most browsers.
export async function enablePushNotifications(): Promise<EnablePushResult> {
  if (isIos() && !isStandalone()) return { ok: false, reason: "ios-not-installed" };
  if (!pushSupported()) return { ok: false, reason: "unsupported" };
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidKey) return { ok: false, reason: "not-configured" };

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { ok: false, reason: "permission-denied" };

  const registration = await navigator.serviceWorker.register("/sw-push.js");
  await navigator.serviceWorker.ready;

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });
  }

  const json = subscription.toJSON();
  await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
  });
  return { ok: true };
}

export async function disablePushNotifications(): Promise<void> {
  if (!pushSupported()) return;
  const registration = await navigator.serviceWorker.getRegistration("/sw-push.js");
  const subscription = await registration?.pushManager.getSubscription();
  if (subscription) {
    await fetch("/api/push/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    });
    await subscription.unsubscribe();
  }
}
