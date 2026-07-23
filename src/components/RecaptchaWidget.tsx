"use client";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

declare global {
  interface Window {
    grecaptcha?: {
      render: (container: HTMLElement, params: { sitekey: string }) => number;
      getResponse: (widgetId?: number) => string;
      reset: (widgetId?: number) => void;
    };
    __recaptchaV2Ready?: () => void;
  }
}

let loadPromise: Promise<void> | null = null;
function loadScript(): Promise<void> {
  if (window.grecaptcha?.render) return Promise.resolve();
  if (!loadPromise) {
    loadPromise = new Promise((resolve) => {
      window.__recaptchaV2Ready = resolve;
      const script = document.createElement("script");
      script.src = "https://www.google.com/recaptcha/api.js?onload=__recaptchaV2Ready&render=explicit";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    });
  }
  return loadPromise;
}

export type RecaptchaWidgetHandle = { getToken: () => string; reset: () => void };

// The "I'm not a robot" checkbox widget — renders nothing if reCAPTCHA
// isn't configured yet, so forms keep working during setup.
const RecaptchaWidget = forwardRef<RecaptchaWidgetHandle>((_props, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<number | null>(null);
  const [, setReady] = useState(false);
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  useEffect(() => {
    if (!siteKey || !containerRef.current || widgetId.current !== null) return;
    let cancelled = false;
    loadScript().then(() => {
      if (cancelled || !containerRef.current || widgetId.current !== null) return;
      widgetId.current = window.grecaptcha!.render(containerRef.current, { sitekey: siteKey });
      setReady(true);
    });
    return () => { cancelled = true; };
  }, [siteKey]);

  useImperativeHandle(ref, () => ({
    getToken: () => (widgetId.current !== null ? window.grecaptcha?.getResponse(widgetId.current) ?? "" : ""),
    reset: () => { if (widgetId.current !== null) window.grecaptcha?.reset(widgetId.current); },
  }));

  if (!siteKey) return null;
  return <div ref={containerRef} className="my-1" />;
});
RecaptchaWidget.displayName = "RecaptchaWidget";
export default RecaptchaWidget;
