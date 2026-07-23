// Client-side helper for Google reCAPTCHA v3 — invisible, no checkbox.
// Lazily loads the script on first use and caches the load promise so
// multiple forms on the same page (or repeated submits) don't re-inject it.
declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, opts: { action: string }) => Promise<string>;
    };
  }
}

let loadPromise: Promise<void> | null = null;

function loadScript(siteKey: string): Promise<void> {
  if (!loadPromise) {
    loadPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load reCAPTCHA script"));
      document.head.appendChild(script);
    });
  }
  return loadPromise;
}

// Returns undefined (not a token) if reCAPTCHA isn't configured or fails to
// load — callers should submit the form anyway; the server treats a missing
// token as "not configured, don't block" the same way.
export async function getRecaptchaToken(action: string): Promise<string | undefined> {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  if (!siteKey) return undefined;

  try {
    await loadScript(siteKey);
    return await new Promise<string>((resolve, reject) => {
      window.grecaptcha!.ready(() => {
        window.grecaptcha!.execute(siteKey, { action }).then(resolve).catch(reject);
      });
    });
  } catch (err) {
    console.error("reCAPTCHA token error:", err);
    return undefined;
  }
}
