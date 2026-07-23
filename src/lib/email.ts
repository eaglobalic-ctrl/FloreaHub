import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    const options: SMTPTransport.Options & { family?: number } = {
      // Explicit host/port instead of the "gmail" shorthand, and family: 4
      // to force IPv4 — on Vercel, Node resolves smtp.gmail.com to an IPv6
      // address by default and the outbound IPv6 route hangs until it
      // times out (ETIMEDOUT at the CONN stage, before TLS/auth even runs).
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      family: 4,
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 10_000,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    };
    transporter = nodemailer.createTransport(options);
  }
  return transporter;
}

const SENDER_EMAIL = process.env.GMAIL_USER ?? "pretty.dalisya@gmail.com";
const SENDER_NAME = "FloreaHub";

// Text-based flower glyph, not inline <svg> — Outlook/Hotmail's rendering
// engine (and several other clients) strip inline SVG entirely, which left
// only the colored badge box with nothing inside it. A Unicode symbol
// renders everywhere plain text does, which is universal.
const LOGO_SVG = `<table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 4px;">
  <tr>
    <td style="background:#b5294e;border-radius:10px;width:40px;height:40px;text-align:center;vertical-align:middle;padding:0;">
      <span style="font-size:22px;line-height:40px;color:#ffffff;">&#10047;</span>
    </td>
    <td style="padding-left:10px;vertical-align:middle;">
      <span style="color:#ffffff;font-size:20px;font-weight:700;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;letter-spacing:-0.3px;">Florea<span style="color:rgba(255,255,255,0.75);">Hub</span></span>
    </td>
  </tr>
</table>`;

const LOGO_SVG_GREEN = `<table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 4px;">
  <tr>
    <td style="background:#2d6a4f;border-radius:10px;width:40px;height:40px;text-align:center;vertical-align:middle;padding:0;">
      <span style="font-size:22px;line-height:40px;color:#ffffff;">&#10047;</span>
    </td>
    <td style="padding-left:10px;vertical-align:middle;">
      <span style="color:#ffffff;font-size:20px;font-weight:700;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;letter-spacing:-0.3px;">Florea<span style="color:rgba(255,255,255,0.75);">Hub</span></span>
    </td>
  </tr>
</table>`;

async function send(to: string, subject: string, html: string) {
  if (!process.env.GMAIL_APP_PASSWORD) return;
  const mail = { from: `"${SENDER_NAME}" <${SENDER_EMAIL}>`, to, subject, html };

  try {
    await getTransporter().sendMail(mail);
  } catch (err) {
    console.error("Email send error, retrying once:", err);
    try {
      // Drop the cached transporter — if the connection was hung/stale, a
      // fresh one is more likely to succeed than reusing the same socket
      transporter = null;
      await getTransporter().sendMail(mail);
    } catch (retryErr) {
      console.error("Email send error (retry also failed, non-blocking):", retryErr);
    }
  }
}

// ── Welcome email ─────────────────────────────────────────────────────────────

export async function sendWelcomeEmail({ name, email, role, status }: { name: string; email: string; role: string; status?: string }) {
  const isSeller = role === "florist" || role === "seller";
  const isPending = status === "pending";

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">
    <div style="background:linear-gradient(135deg,${isSeller ? "#2d6a4f,#1b4332" : "#b5294e,#7c1d35"});padding:36px 32px;text-align:center;">
      ${isSeller ? LOGO_SVG_GREEN : LOGO_SVG}
    </div>
    <div style="padding:36px 32px;">
      <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">Welcome, ${name.split(" ")[0]}! 👋</h2>
      <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
        ${isSeller
          ? "Your FloreaHub florist account is ready. Start setting up your shop and reach thousands of customers across Malaysia."
          : "Your FloreaHub account is ready. Discover fresh flowers from the best florists across Malaysia."}
      </p>
      ${isSeller ? (isPending ? `
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:20px;margin-bottom:24px;">
        <p style="margin:0 0 8px;font-weight:700;color:#92400e;font-size:14px;">Application under review</p>
        <p style="margin:0;color:#78350f;font-size:14px;line-height:1.6;">The FloreaHub team will review your shop details and get back to you within <strong>1-2 business days</strong>. Check this email for updates.</p>
      </div>
      <div style="background:#f9fafb;border-radius:10px;padding:16px;margin-bottom:24px;">
        <p style="margin:0 0 10px;font-weight:600;color:#374151;font-size:13px;">What happens next:</p>
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${["Team reviews your application and shop details", "You'll get an approval email or a request for more info", "Once approved, log in and set up your first product", "Start receiving orders from customers across Malaysia"].map((s, i) => `
          <div style="display:flex;gap:10px;align-items:flex-start;">
            <div style="width:20px;height:20px;min-width:20px;background:#d97706;border-radius:50%;text-align:center;line-height:20px;">
              <span style="color:#fff;font-size:11px;font-weight:700;">${i + 1}</span>
            </div>
            <p style="margin:1px 0 0;font-size:13px;color:#6b7280;">${s}</p>
          </div>`).join("")}
        </div>
      </div>
      ` : `
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin-bottom:24px;">
        <p style="margin:0 0 10px;font-weight:600;color:#166534;font-size:14px;">Next steps:</p>
        <ul style="margin:0;padding-left:18px;color:#15803d;font-size:14px;line-height:2;">
          <li>Go to your <a href="https://floriahub.vercel.app/dashboard" style="color:#2d6a4f;font-weight:600;">Dashboard</a></li>
          <li>Upload your first product</li>
          <li>Pick a plan to boost your visibility</li>
        </ul>
      </div>
      <a href="https://floriahub.vercel.app/dashboard" style="display:block;background:#2d6a4f;color:#fff;text-align:center;padding:14px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;margin-bottom:24px;">Open Dashboard →</a>
      `) : `
      <div style="background:#fff5f7;border:1px solid #fecdd3;border-radius:12px;padding:20px;margin-bottom:24px;">
        <p style="margin:0 0 10px;font-weight:600;color:#9f1239;font-size:14px;">What you get:</p>
        <ul style="margin:0;padding-left:18px;color:#be185d;font-size:14px;line-height:2;">
          <li>Fresh flowers from verified local florists</li>
          <li>Real-photo bouquets before delivery</li>
          <li>Reminders for birthdays &amp; anniversaries</li>
          <li>Same-day delivery in major cities</li>
        </ul>
      </div>
      <a href="https://floriahub.vercel.app/shop" style="display:block;background:#b5294e;color:#fff;text-align:center;padding:14px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;margin-bottom:24px;">Browse Flowers →</a>
      `}
      <p style="margin:0;color:#9ca3af;font-size:13px;text-align:center;">Got a question? Reply to this email or visit <a href="https://floriahub.vercel.app" style="color:#b5294e;">floriahub.vercel.app</a></p>
    </div>
    <div style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #f3f4f6;">
      <p style="margin:0;color:#d1d5db;font-size:12px;">© 2024 FloreaHub by Lisya Lane Empire · Malaysia's Premier Florist Marketplace</p>
    </div>
  </div>
</body>
</html>`;

  await send(email, isSeller ? "Welcome to FloreaHub — your florist account is ready" : "Welcome to FloreaHub", html);
}

// ── Order status update (florist advances the order) ────────────────────────────

const STATUS_COPY: Record<string, { title: string; body: string; emoji: string }> = {
  processing: { title: "Your florist is preparing your order", body: "The florist has confirmed and started preparing your flowers.", emoji: "&#127793;" },
  ready: { title: "Your order is ready for delivery", body: "Your bouquet is ready and waiting for pickup.", emoji: "&#127991;" },
  delivering: { title: "Your order is on the way!", body: "A rider is on the way to deliver your flowers.", emoji: "&#128666;" },
  delivered: { title: "Your order has been delivered!", body: "We hope you love these beautiful flowers. Thanks for shopping with FloreaHub!", emoji: "&#127881;" },
};

export async function sendOrderStatusUpdateEmail({ email, name, orderId, status, floristName }: {
  email: string; name: string; orderId: string; status: string; floristName?: string;
}) {
  const copy = STATUS_COPY[status];
  if (!copy) return;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">
    <div style="background:linear-gradient(135deg,#2d6a4f,#1b4332);padding:32px;text-align:center;">
      ${LOGO_SVG_GREEN}
      <div style="width:48px;height:48px;background:rgba(255,255,255,0.15);border:2px solid rgba(255,255,255,0.4);border-radius:50%;display:inline-block;line-height:44px;text-align:center;margin:16px auto 10px;font-size:22px;">${copy.emoji}</div>
      <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">${copy.title}</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,.7);font-size:13px;">${orderId}</p>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
        Hi ${name.split(" ")[0]}, ${copy.body}${floristName ? ` — ${floristName}` : ""}
      </p>
      <a href="https://floriahub.vercel.app/orders" style="display:block;background:#b5294e;color:#fff;text-align:center;padding:14px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">View My Orders →</a>
    </div>
    <div style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #f3f4f6;">
      <p style="margin:0;color:#d1d5db;font-size:12px;">© 2024 FloreaHub by Lisya Lane Empire</p>
    </div>
  </div>
</body>
</html>`;

  await send(email, `${copy.title} — ${orderId}`, html);
}

// ── Order confirmation email ───────────────────────────────────────────────────

type OrderItem = { product_name: string; florist_name: string; price: number; quantity: number };

export async function sendOrderConfirmationEmail({
  email, name, orderId, items, subtotal, deliveryFee, total, deliveryAddress, recipientName,
}: {
  email: string; name: string; orderId: string;
  items: OrderItem[];
  subtotal: number; deliveryFee: number; total: number;
  deliveryAddress?: string; recipientName?: string;
}) {
  const itemRows = items.map(i => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">
        <p style="margin:0;font-size:14px;font-weight:500;color:#111827;">${i.product_name}</p>
        <p style="margin:2px 0 0;font-size:12px;color:#9ca3af;">${i.florist_name} · qty ${i.quantity}</p>
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;text-align:right;font-size:14px;font-weight:600;color:#111827;">
        RM${(i.price * i.quantity).toFixed(2)}
      </td>
    </tr>`).join("");

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">
    <div style="background:linear-gradient(135deg,#2d6a4f,#1b4332);padding:32px;text-align:center;">
      ${LOGO_SVG_GREEN}
      <div style="width:48px;height:48px;background:rgba(255,255,255,0.15);border:2px solid rgba(255,255,255,0.4);border-radius:50%;display:inline-block;line-height:44px;text-align:center;margin:16px auto 10px;font-size:22px;color:#fff;font-weight:700;">&#10003;</div>
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">Order Confirmed!</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,.7);font-size:13px;">${orderId}</p>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
        Hi ${name.split(" ")[0]}, thanks for your order! The florist has been notified and will start preparing your flowers.
      </p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px;"><tbody>${itemRows}</tbody></table>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr>
          <td style="padding:4px 0;font-size:14px;color:#6b7280;">Subtotal</td>
          <td style="padding:4px 0;font-size:14px;color:#6b7280;text-align:right;">RM${subtotal.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:14px;color:#6b7280;">Delivery fee</td>
          <td style="padding:4px 0;font-size:14px;color:#6b7280;text-align:right;">${deliveryFee > 0 ? `RM${deliveryFee.toFixed(2)}` : "Free"}</td>
        </tr>
        <tr>
          <td style="padding:8px 0 0;font-size:16px;font-weight:700;color:#111827;">Total Paid</td>
          <td style="padding:8px 0 0;font-size:16px;font-weight:700;color:#b5294e;text-align:right;">RM${total.toFixed(2)}</td>
        </tr>
      </table>
      ${deliveryAddress ? `
      <div style="background:#f9fafb;border-radius:10px;padding:16px;margin-bottom:24px;">
        <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;">Deliver to</p>
        <p style="margin:0;font-size:14px;color:#111827;font-weight:500;">${recipientName || name}</p>
        <p style="margin:2px 0 0;font-size:13px;color:#6b7280;">${deliveryAddress}</p>
      </div>` : ""}
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin-bottom:24px;">
        <p style="margin:0 0 12px;font-weight:600;color:#166534;font-size:14px;">What happens next:</p>
        ${["The florist confirms and prepares your bouquet", "You may receive a photo of the bouquet before dispatch", "A rider picks it up and delivers it to your address", "Enjoy your beautiful flowers!"].map((step, i) => `
        <div style="display:flex;gap:10px;align-items:flex-start;margin-bottom:8px;">
          <div style="width:20px;height:20px;min-width:20px;background:#2d6a4f;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;">
            <span style="color:#fff;font-size:11px;font-weight:700;">${i + 1}</span>
          </div>
          <p style="margin:2px 0 0;font-size:13px;color:#15803d;">${step}</p>
        </div>`).join("")}
      </div>
      <a href="https://floriahub.vercel.app/orders" style="display:block;background:#b5294e;color:#fff;text-align:center;padding:14px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">Track My Order →</a>
    </div>
    <div style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #f3f4f6;">
      <p style="margin:0;color:#d1d5db;font-size:12px;">© 2024 FloreaHub by Lisya Lane Empire · Got a question? Reply to this email.</p>
    </div>
  </div>
</body>
</html>`;

  await send(email, `Order confirmed — ${orderId}`, html);
}

// ── Florist: new order notification ──────────────────────────────────────────

export async function sendNewOrderNotificationToFlorist({
  email, name, orderId, items, total, recipientName, deliveryAddress, deliveryDate,
}: {
  email: string; name: string; orderId: string;
  items: OrderItem[];
  total: number; recipientName?: string; deliveryAddress?: string; deliveryDate?: string;
}) {
  const itemRows = items.map(i => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">
        <p style="margin:0;font-size:14px;font-weight:500;color:#111827;">${i.product_name}</p>
        <p style="margin:2px 0 0;font-size:12px;color:#9ca3af;">qty ${i.quantity}</p>
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;text-align:right;font-size:14px;font-weight:600;color:#111827;">
        RM${(i.price * i.quantity).toFixed(2)}
      </td>
    </tr>`).join("");

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">
    <div style="background:linear-gradient(135deg,#b5294e,#8a1f3c);padding:32px;text-align:center;">
      ${LOGO_SVG}
      <div style="width:48px;height:48px;background:rgba(255,255,255,0.15);border:2px solid rgba(255,255,255,0.4);border-radius:50%;display:inline-block;line-height:44px;text-align:center;margin:16px auto 10px;font-size:22px;color:#fff;font-weight:700;">&#127801;</div>
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">New Order!</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,.7);font-size:13px;">${orderId}</p>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
        Hi ${name.split(" ")[0]}, you've got a new order! Payment has been confirmed — please start preparing it.
      </p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px;"><tbody>${itemRows}</tbody></table>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr>
          <td style="padding:8px 0 0;font-size:16px;font-weight:700;color:#111827;">Total (you receive ~98%)</td>
          <td style="padding:8px 0 0;font-size:16px;font-weight:700;color:#b5294e;text-align:right;">RM${total.toFixed(2)}</td>
        </tr>
      </table>
      ${(deliveryAddress || deliveryDate) ? `
      <div style="background:#f9fafb;border-radius:10px;padding:16px;margin-bottom:24px;">
        <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;">Deliver to</p>
        ${recipientName ? `<p style="margin:0;font-size:14px;color:#111827;font-weight:500;">${recipientName}</p>` : ""}
        ${deliveryAddress ? `<p style="margin:2px 0 0;font-size:13px;color:#6b7280;">${deliveryAddress}</p>` : ""}
        ${deliveryDate ? `<p style="margin:6px 0 0;font-size:13px;color:#6b7280;"><strong>Delivery date:</strong> ${new Date(deliveryDate).toLocaleDateString("en-MY", { day: "numeric", month: "long", year: "numeric" })}</p>` : ""}
      </div>` : ""}
      <a href="https://floriahub.vercel.app/dashboard?tab=orders" style="display:block;background:#b5294e;color:#fff;text-align:center;padding:14px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">View Order in Dashboard →</a>
    </div>
    <div style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #f3f4f6;">
      <p style="margin:0;color:#d1d5db;font-size:12px;">© 2024 FloreaHub by Lisya Lane Empire</p>
    </div>
  </div>
</body>
</html>`;

  await send(email, `New order received — ${orderId}`, html);
}

// ── Admin: new florist notification ──────────────────────────────────────────

export async function sendAdminFloristNotification({ name, email, shopCity, shopPhone }: {
  name: string; email: string; shopCity?: string; shopPhone?: string;
}) {
  const adminEmail = process.env.ADMIN_EMAIL ?? process.env.GMAIL_USER ?? "";
  if (!adminEmail) return;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">
    <div style="background:linear-gradient(135deg,#1e40af,#1e3a8a);padding:28px 32px;">
      ${LOGO_SVG}
      <p style="margin:12px 0 0;color:rgba(255,255,255,.8);font-size:13px;">Admin Notification</p>
    </div>
    <div style="padding:32px;">
      <h2 style="margin:0 0 4px;font-size:20px;font-weight:700;color:#111827;">New Florist Application</h2>
      <p style="margin:0 0 24px;color:#6b7280;font-size:14px;">A new florist has registered and is waiting for review.</p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:24px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:6px 0;font-size:13px;color:#6b7280;width:120px;">Name</td><td style="padding:6px 0;font-size:14px;font-weight:600;color:#111827;">${name}</td></tr>
          <tr><td style="padding:6px 0;font-size:13px;color:#6b7280;">Email</td><td style="padding:6px 0;font-size:14px;color:#111827;">${email}</td></tr>
          ${shopCity ? `<tr><td style="padding:6px 0;font-size:13px;color:#6b7280;">City</td><td style="padding:6px 0;font-size:14px;color:#111827;">${shopCity}</td></tr>` : ""}
          ${shopPhone ? `<tr><td style="padding:6px 0;font-size:13px;color:#6b7280;">Phone</td><td style="padding:6px 0;font-size:14px;color:#111827;">${shopPhone}</td></tr>` : ""}
        </table>
      </div>
      <a href="https://floriahub.vercel.app/admin" style="display:block;background:#1e40af;color:#fff;text-align:center;padding:14px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">Review &amp; Approve Now</a>
    </div>
    <div style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #f3f4f6;">
      <p style="margin:0;color:#d1d5db;font-size:12px;">FloreaHub Admin · floriahub.vercel.app/admin</p>
    </div>
  </div>
</body>
</html>`;

  await send(adminEmail, `[FloreaHub] New florist awaiting approval — ${name}`, html);
}

// ── Florist approved ──────────────────────────────────────────────────────────

export async function sendFloristApprovedEmail({ name, email }: { name: string; email: string }) {
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">
    <div style="background:linear-gradient(135deg,#2d6a4f,#1b4332);padding:36px 32px;text-align:center;">
      ${LOGO_SVG_GREEN}
      <div style="width:52px;height:52px;background:rgba(255,255,255,0.15);border:2px solid rgba(255,255,255,0.5);border-radius:50%;display:inline-block;line-height:48px;text-align:center;margin:16px auto 8px;font-size:22px;color:#fff;font-weight:700;">&#10003;</div>
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">Congratulations! Account Approved</h1>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.6;">
        Hi ${name.split(" ")[0]}, your florist application for FloreaHub has been <strong style="color:#2d6a4f;">approved</strong>. You can start setting up your shop and selling flowers now!
      </p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin-bottom:24px;">
        <p style="margin:0 0 10px;font-weight:600;color:#166534;font-size:14px;">Get started:</p>
        <ul style="margin:0;padding-left:18px;color:#15803d;font-size:14px;line-height:2.2;">
          <li>Log in to your account at <a href="https://floriahub.vercel.app/login" style="color:#2d6a4f;font-weight:600;">floriahub.vercel.app</a></li>
          <li>Upload your first product in the Dashboard</li>
          <li>Set prices, photos, and delivery details</li>
          <li>Pick a subscription plan to boost your visibility</li>
        </ul>
      </div>
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:20px;margin-bottom:24px;">
        <p style="margin:0 0 8px;font-weight:600;color:#1e40af;font-size:14px;">Important — how you get paid</p>
        <p style="margin:0 0 10px;color:#1e3a8a;font-size:13px;line-height:1.7;">
          FloreaHub collects 100% of each order upfront and holds it until the buyer confirms they received it (or automatically after 3 days). Once confirmed, our team pays out your share — 98% of the sale, plus 100% of the delivery fee — via bank transfer or ToyyibPay.
        </p>
        <p style="margin:0;color:#1e3a8a;font-size:13px;line-height:1.7;">
          <strong>Tip:</strong> add your ToyyibPay username in <strong>Dashboard → Payout Setup</strong> for the fastest payout option — without it, payouts go via manual bank transfer, which can take a little longer.
        </p>
      </div>
      <a href="https://floriahub.vercel.app/login" style="display:block;background:#2d6a4f;color:#fff;text-align:center;padding:14px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">Log In &amp; Start Selling</a>
    </div>
    <div style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #f3f4f6;">
      <p style="margin:0;color:#d1d5db;font-size:12px;">© 2024 FloreaHub by Lisya Lane Empire</p>
    </div>
  </div>
</body>
</html>`;

  await send(email, "Your florist account has been approved — FloreaHub", html);
}

// ── Password reset ─────────────────────────────────────────────────────────────

export async function sendPasswordResetEmail({ name, email, resetUrl }: { name: string; email: string; resetUrl: string }) {
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">
    <div style="background:linear-gradient(135deg,#b5294e,#7c1d35);padding:36px 32px;text-align:center;">
      ${LOGO_SVG}
    </div>
    <div style="padding:36px 32px;">
      <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">Reset Password</h2>
      <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
        Hi ${name.split(" ")[0]}, we received a request to reset the password for your FloreaHub account. Click the button below to set a new password — this link is valid for <strong>1 hour</strong>.
      </p>
      <a href="${resetUrl}" style="display:block;background:#b5294e;color:#fff;text-align:center;padding:14px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;margin-bottom:20px;">Set New Password</a>
      <p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.6;">If you didn't request this, just ignore this email — your password won't change.</p>
    </div>
    <div style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #f3f4f6;">
      <p style="margin:0;color:#d1d5db;font-size:12px;">© 2024 FloreaHub by Lisya Lane Empire</p>
    </div>
  </div>
</body>
</html>`;

  await send(email, "Reset your FloreaHub account password", html);
}

// ── Occasion reminder ──────────────────────────────────────────────────────────

export async function sendOccasionReminderEmail({
  name, email, occasionName, occasionDate, daysUntil,
}: {
  name: string; email: string; occasionName: string; occasionDate: string; daysUntil: number;
}) {
  const dateLabel = new Date(`${occasionDate}T00:00:00Z`).toLocaleDateString("en-MY", { day: "numeric", month: "long", timeZone: "UTC" });
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">
    <div style="background:linear-gradient(135deg,#b5294e,#7c1d35);padding:36px 32px;text-align:center;">
      ${LOGO_SVG}
    </div>
    <div style="padding:36px 32px;">
      <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">${occasionName} is coming up! 🌸</h2>
      <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
        Hi ${name.split(" ")[0]}, just a heads up — <strong>${occasionName}</strong> is on <strong>${dateLabel}</strong>, ${daysUntil} day${daysUntil === 1 ? "" : "s"} from now. Order your flowers early to make sure they arrive fresh and on time.
      </p>
      <a href="https://floriahub.vercel.app/shop" style="display:block;background:#b5294e;color:#fff;text-align:center;padding:14px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;margin-bottom:20px;">Shop Flowers Now →</a>
      <p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.6;">Manage your reminders anytime at <a href="https://floriahub.vercel.app/reminders" style="color:#b5294e;">floriahub.vercel.app/reminders</a></p>
    </div>
    <div style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #f3f4f6;">
      <p style="margin:0;color:#d1d5db;font-size:12px;">© 2024 FloreaHub by Lisya Lane Empire</p>
    </div>
  </div>
</body>
</html>`;

  await send(email, `Reminder: ${occasionName} is in ${daysUntil} day${daysUntil === 1 ? "" : "s"}`, html);
}

// ── New chat message ───────────────────────────────────────────────────────────

export async function sendNewChatMessageEmail({
  toEmail, toName, fromName, preview, conversationUrl,
}: { toEmail: string; toName: string; fromName: string; preview: string; conversationUrl: string }) {
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">
    <div style="background:linear-gradient(135deg,#b5294e,#7c1d35);padding:36px 32px;text-align:center;">
      ${LOGO_SVG}
    </div>
    <div style="padding:36px 32px;">
      <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111827;">New message from ${fromName}</h2>
      <p style="margin:0 0 20px;color:#6b7280;font-size:15px;line-height:1.6;">Hi ${toName.split(" ")[0]}, you've got a new message on FloreaHub:</p>
      <div style="background:#f9fafb;border-left:3px solid #b5294e;border-radius:8px;padding:16px 18px;margin-bottom:24px;">
        <p style="margin:0;color:#374151;font-size:14px;line-height:1.6;font-style:italic;">"${preview}"</p>
      </div>
      <a href="${conversationUrl}" style="display:block;background:#b5294e;color:#fff;text-align:center;padding:14px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">Reply Now →</a>
    </div>
    <div style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #f3f4f6;">
      <p style="margin:0;color:#d1d5db;font-size:12px;">© 2024 FloreaHub by Lisya Lane Empire</p>
    </div>
  </div>
</body>
</html>`;

  await send(toEmail, `New message from ${fromName}`, html);
}

// ── Florist rejected ──────────────────────────────────────────────────────────

export async function sendFloristRejectedEmail({ name, email }: { name: string; email: string }) {
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">
    <div style="background:linear-gradient(135deg,#7f1d1d,#991b1b);padding:36px 32px;text-align:center;">
      ${LOGO_SVG}
    </div>
    <div style="padding:32px;">
      <h2 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#111827;">Application Not Successful</h2>
      <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.6;">
        Hi ${name.split(" ")[0]}, after review, your florist application could not be approved at this time.
      </p>
      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:20px;margin-bottom:24px;">
        <p style="margin:0;color:#7f1d1d;font-size:14px;line-height:1.6;">
          This may be due to incomplete information or your shop not currently meeting our criteria. You can contact us for more details or reapply with updated information.
        </p>
      </div>
      <a href="mailto:${process.env.GMAIL_USER ?? ""}" style="display:block;background:#991b1b;color:#fff;text-align:center;padding:14px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">Contact Us</a>
    </div>
    <div style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #f3f4f6;">
      <p style="margin:0;color:#d1d5db;font-size:12px;">© 2024 FloreaHub by Lisya Lane Empire</p>
    </div>
  </div>
</body>
</html>`;

  await send(email, "Florist application update — FloreaHub", html);
}

// ── Commission/ToS update announcement (one-time, existing florists) ──────────

export async function sendCommissionUpdateEmail({ name, email }: { name: string; email: string }) {
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">
    <div style="background:linear-gradient(135deg,#1e40af,#1e3a8a);padding:32px;text-align:center;">
      ${LOGO_SVG}
      <p style="margin:12px 0 0;color:rgba(255,255,255,.85);font-size:13px;">Terms of Service Update</p>
    </div>
    <div style="padding:32px;">
      <h2 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#111827;">How your payment works is changing — and commission is going down</h2>
      <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.6;">
        Hi ${name.split(" ")[0]}, two important changes to your florist account:
      </p>
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:20px;margin-bottom:16px;">
        <p style="margin:0 0 6px;font-weight:600;color:#1e40af;font-size:14px;">1. Platform commission drops to 2%</p>
        <p style="margin:0;color:#1e3a8a;font-size:13px;line-height:1.6;">Down from the previous rate. Your share of every sale is now bigger.</p>
      </div>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin-bottom:24px;">
        <p style="margin:0 0 6px;font-weight:600;color:#166534;font-size:14px;">2. Payment is held until the buyer confirms receipt, then paid out to you</p>
        <p style="margin:0;color:#15803d;font-size:13px;line-height:1.6;">FloreaHub collects 100% of each order upfront and holds it until the buyer confirms they received it (or automatically after 3 days). Once confirmed, our team pays out your share (98% of the sale, plus 100% of the delivery fee) via bank transfer or ToyyibPay. Add your ToyyibPay username in <strong>Dashboard → Settings → Payout Setup</strong> for the fastest payout option.</p>
      </div>
      <a href="https://floriahub.vercel.app/dashboard" style="display:block;background:#1e40af;color:#fff;text-align:center;padding:14px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">Check Dashboard</a>
    </div>
    <div style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #f3f4f6;">
      <p style="margin:0;color:#d1d5db;font-size:12px;">Read the full terms at <a href="https://floriahub.vercel.app/terms" style="color:#9ca3af;">floriahub.vercel.app/terms</a></p>
    </div>
  </div>
</body>
</html>`;

  await send(email, "Important update: commission drops to 2% + automatic payments — FloreaHub", html);
}

// ── Subscription renewal reminder ────────────────────────────────────────────

export async function sendPlanRenewalReminderEmail({ name, email, plan, endsAt }: {
  name: string; email: string; plan: string; endsAt: string;
}) {
  const planLabel = plan === "elite" ? "Premium" : plan === "pro" ? "Pro" : plan;
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">
    <div style="background:linear-gradient(135deg,#b45309,#92400e);padding:32px;text-align:center;">
      ${LOGO_SVG}
      <p style="margin:12px 0 0;color:rgba(255,255,255,.85);font-size:13px;">Plan Renewal Reminder</p>
    </div>
    <div style="padding:32px;">
      <h2 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#111827;">Your ${planLabel} plan is ending soon</h2>
      <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.6;">
        Hi ${name.split(" ")[0]}, your <strong>${planLabel}</strong> plan will end on <strong>${new Date(endsAt).toLocaleDateString("en-MY", { day: "numeric", month: "long", year: "numeric" })}</strong>. FloreaHub doesn't auto-charge — you'll need to renew manually to keep this plan's benefits, otherwise your account will automatically drop to Starter after the end date.
      </p>
      <a href="https://floriahub.vercel.app/pricing" style="display:block;background:#b45309;color:#fff;text-align:center;padding:14px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">Renew Plan Now</a>
    </div>
    <div style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #f3f4f6;">
      <p style="margin:0;color:#d1d5db;font-size:12px;">© 2024 FloreaHub by Lisya Lane Empire</p>
    </div>
  </div>
</body>
</html>`;

  await send(email, `Your ${planLabel} plan ends in 3 days — FloreaHub`, html);
}

export async function sendPlanDowngradedEmail({ name, email, plan }: { name: string; email: string; plan: string }) {
  const planLabel = plan === "elite" ? "Premium" : plan === "pro" ? "Pro" : plan;
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">
    <div style="background:linear-gradient(135deg,#6b7280,#4b5563);padding:32px;text-align:center;">
      ${LOGO_SVG}
      <p style="margin:12px 0 0;color:rgba(255,255,255,.85);font-size:13px;">Plan Expired</p>
    </div>
    <div style="padding:32px;">
      <h2 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#111827;">Your ${planLabel} plan has expired</h2>
      <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.6;">
        Hi ${name.split(" ")[0]}, your <strong>${planLabel}</strong> plan has expired and your account is now on the Starter plan. Your listings and products are still active, but benefits like priority placement and higher listing limits no longer apply.
      </p>
      <a href="https://floriahub.vercel.app/pricing" style="display:block;background:#4b5563;color:#fff;text-align:center;padding:14px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">Upgrade Again</a>
    </div>
    <div style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #f3f4f6;">
      <p style="margin:0;color:#d1d5db;font-size:12px;">© 2024 FloreaHub by Lisya Lane Empire</p>
    </div>
  </div>
</body>
</html>`;

  await send(email, `Your ${planLabel} plan has expired — FloreaHub`, html);
}

// ── Payout setup reminder ────────────────────────────────────────────────────

export async function sendPayoutSetupReminderEmail({ name, email }: { name: string; email: string }) {
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">
    <div style="background:linear-gradient(135deg,#b45309,#92400e);padding:32px;text-align:center;">
      ${LOGO_SVG}
      <p style="margin:12px 0 0;color:rgba(255,255,255,.85);font-size:13px;">Payout Setup Needed</p>
    </div>
    <div style="padding:32px;">
      <h2 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#111827;">You have an order, but ToyyibPay payout isn't set up yet</h2>
      <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.6;">
        Hi ${name.split(" ")[0]}, we noticed your shop has received an order but your ToyyibPay account for payouts hasn't been set up yet. Once the buyer confirms receipt, we can still pay out your share via bank transfer — but adding your ToyyibPay username makes it faster.
      </p>
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:20px;margin-bottom:24px;">
        <p style="margin:0;color:#78350f;font-size:14px;line-height:1.6;">
          Go to <strong>Dashboard → Settings → Payout Setup</strong> and enter your ToyyibPay account username. Don't have an account yet? <a href="https://toyyibpay.com/e/586756306506121794" style="color:#92400e;font-weight:600;">Sign up for free here</a>.
        </p>
      </div>
      <a href="https://floriahub.vercel.app/dashboard" style="display:block;background:#b45309;color:#fff;text-align:center;padding:14px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">Set Up Payout Now</a>
    </div>
    <div style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #f3f4f6;">
      <p style="margin:0;color:#d1d5db;font-size:12px;">© 2024 FloreaHub by Lisya Lane Empire</p>
    </div>
  </div>
</body>
</html>`;

  await send(email, "Set up your payout — order waiting, FloreaHub", html);
}

// ── Contact form submission (admin notification) ───────────────────────────────

export async function sendContactFormEmail({ name, email, topic, message }: {
  name: string; email: string; topic?: string; message: string;
}) {
  const adminEmail = process.env.ADMIN_EMAIL ?? process.env.GMAIL_USER ?? "";
  if (!adminEmail) return;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">
    <div style="background:linear-gradient(135deg,#1e40af,#1e3a8a);padding:28px 32px;">
      ${LOGO_SVG}
      <p style="margin:12px 0 0;color:rgba(255,255,255,.8);font-size:13px;">Admin Notification</p>
    </div>
    <div style="padding:32px;">
      <h2 style="margin:0 0 4px;font-size:20px;font-weight:700;color:#111827;">New Contact Form Message</h2>
      <p style="margin:0 0 24px;color:#6b7280;font-size:14px;">Someone submitted the contact form on FloreaHub.</p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:24px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:6px 0;font-size:13px;color:#6b7280;width:100px;">Name</td><td style="padding:6px 0;font-size:14px;font-weight:600;color:#111827;">${name}</td></tr>
          <tr><td style="padding:6px 0;font-size:13px;color:#6b7280;">Email</td><td style="padding:6px 0;font-size:14px;color:#111827;">${email}</td></tr>
          ${topic ? `<tr><td style="padding:6px 0;font-size:13px;color:#6b7280;">Topic</td><td style="padding:6px 0;font-size:14px;color:#111827;">${topic}</td></tr>` : ""}
        </table>
      </div>
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:18px;margin-bottom:24px;">
        <p style="margin:0;color:#78350f;font-size:14px;line-height:1.6;white-space:pre-wrap;">${message}</p>
      </div>
      <a href="mailto:${email}" style="display:block;background:#1e40af;color:#fff;text-align:center;padding:14px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">Reply to ${name.split(" ")[0]}</a>
    </div>
    <div style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #f3f4f6;">
      <p style="margin:0;color:#d1d5db;font-size:12px;">FloreaHub Admin · floriahub.vercel.app/admin</p>
    </div>
  </div>
</body>
</html>`;

  await send(adminEmail, `[FloreaHub] Contact form — ${topic || "General"} — ${name}`, html);
}

// ── Order refunded (buyer) ───────────────────────────────────────────────────

export async function sendOrderRefundedEmail({ email, name, orderId, total }: {
  email: string; name: string; orderId: string; total: number;
}) {
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">
    <div style="background:linear-gradient(135deg,#6b7280,#4b5563);padding:32px;text-align:center;">
      ${LOGO_SVG}
      <h1 style="margin:12px 0 0;color:#fff;font-size:20px;font-weight:700;">Order Refunded</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,.7);font-size:13px;">${orderId}</p>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.6;">
        Hi ${name.split(" ")[0]}, your order has been refunded by our team. <strong>RM${total.toFixed(2)}</strong> will be returned to you via the same method you paid with.
      </p>
      <p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.6;">Refunds are processed manually and can take a few business days to appear, depending on your bank or ToyyibPay. If you have any questions, reply to this email.</p>
    </div>
    <div style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #f3f4f6;">
      <p style="margin:0;color:#d1d5db;font-size:12px;">© 2024 FloreaHub by Lisya Lane Empire</p>
    </div>
  </div>
</body>
</html>`;

  await send(email, `Order refunded — ${orderId}`, html);
}

// ── Payout sent (florist) ────────────────────────────────────────────────────

export async function sendPayoutSentEmail({ email, name, orderId, amount }: {
  email: string; name: string; orderId: string; amount: number;
}) {
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">
    <div style="background:linear-gradient(135deg,#2d6a4f,#1b4332);padding:32px;text-align:center;">
      ${LOGO_SVG_GREEN}
      <div style="width:48px;height:48px;background:rgba(255,255,255,0.15);border:2px solid rgba(255,255,255,0.4);border-radius:50%;display:inline-block;line-height:44px;text-align:center;margin:16px auto 10px;font-size:22px;color:#fff;font-weight:700;">&#10003;</div>
      <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">Payout Sent</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,.7);font-size:13px;">${orderId}</p>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.6;">
        Hi ${name.split(" ")[0]}, good news — your payout of <strong style="color:#2d6a4f;">RM${amount.toFixed(2)}</strong> for order ${orderId} has been sent via bank transfer or ToyyibPay.
      </p>
      <a href="https://floriahub.vercel.app/dashboard?tab=orders" style="display:block;background:#2d6a4f;color:#fff;text-align:center;padding:14px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">View in Dashboard →</a>
    </div>
    <div style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #f3f4f6;">
      <p style="margin:0;color:#d1d5db;font-size:12px;">© 2024 FloreaHub by Lisya Lane Empire</p>
    </div>
  </div>
</body>
</html>`;

  await send(email, `Payout sent — RM${amount.toFixed(2)} for ${orderId}`, html);
}

// ── Order auto-confirmed (buyer, 3-day grace period) ─────────────────────────

export async function sendOrderAutoConfirmedEmail({ email, name, orderId }: {
  email: string; name: string; orderId: string;
}) {
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">
    <div style="background:linear-gradient(135deg,#b5294e,#7c1d35);padding:32px;text-align:center;">
      ${LOGO_SVG}
      <h1 style="margin:12px 0 0;color:#fff;font-size:20px;font-weight:700;">Order Marked as Received</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,.7);font-size:13px;">${orderId}</p>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
        Hi ${name.split(" ")[0]}, it's been 3 days since your order was marked delivered and we didn't hear back, so we've automatically marked it as received. This releases payment to the florist.
      </p>
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:18px;margin-bottom:24px;">
        <p style="margin:0;color:#78350f;font-size:14px;line-height:1.6;">Didn't actually receive your order, or something's wrong with it? Reply to this email right away and we'll help sort it out.</p>
      </div>
      <a href="https://floriahub.vercel.app/orders" style="display:block;background:#b5294e;color:#fff;text-align:center;padding:14px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">View My Orders →</a>
    </div>
    <div style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #f3f4f6;">
      <p style="margin:0;color:#d1d5db;font-size:12px;">© 2024 FloreaHub by Lisya Lane Empire</p>
    </div>
  </div>
</body>
</html>`;

  await send(email, `Order auto-confirmed as received — ${orderId}`, html);
}
