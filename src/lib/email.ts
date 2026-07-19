import { Resend } from "resend";

let resend: Resend | null = null;

function getResend() {
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
}

const FROM = "FloreaHub <onboarding@resend.dev>";

// ── Welcome email ─────────────────────────────────────────────────────────────

export async function sendWelcomeEmail({ name, email, role }: { name: string; email: string; role: string }) {
  if (!process.env.RESEND_API_KEY) return;
  const isSeller = role === "florist" || role === "seller";

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,${isSeller ? "#2d6a4f,#1b4332" : "#b5294e,#7c1d35"});padding:40px 32px;text-align:center;">
      <div style="display:inline-flex;align-items:center;gap:10px;margin-bottom:4px;">
        <div style="width:36px;height:36px;background:rgba(255,255,255,.2);border-radius:10px;display:inline-flex;align-items:center;justify-content:center;">
          <span style="font-size:18px;">🌸</span>
        </div>
        <span style="color:#fff;font-size:20px;font-weight:600;">FloreaHub</span>
      </div>
    </div>

    <!-- Body -->
    <div style="padding:36px 32px;">
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111827;">
        Welcome, ${name.split(" ")[0]}! 👋
      </h1>
      <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
        ${isSeller
          ? "Your florist account on FloreaHub is ready. Start setting up your shop and reach thousands of customers across Malaysia."
          : "Your FloreaHub account is ready. Discover beautiful fresh flowers from the finest florists across Malaysia."}
      </p>

      ${isSeller ? `
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin-bottom:24px;">
        <p style="margin:0 0 12px;font-weight:600;color:#166534;font-size:14px;">Get started as a florist:</p>
        <ul style="margin:0;padding-left:20px;color:#15803d;font-size:14px;line-height:2;">
          <li>Go to your <a href="https://floriahub.vercel.app/dashboard" style="color:#2d6a4f;font-weight:600;">Dashboard</a></li>
          <li>Upload your first product</li>
          <li>Choose a subscription plan to boost visibility</li>
        </ul>
      </div>
      <a href="https://floriahub.vercel.app/dashboard" style="display:block;background:#2d6a4f;color:#fff;text-align:center;padding:14px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;margin-bottom:24px;">
        Open Dashboard →
      </a>
      ` : `
      <div style="background:#fff5f7;border:1px solid #fecdd3;border-radius:12px;padding:20px;margin-bottom:24px;">
        <p style="margin:0 0 12px;font-weight:600;color:#9f1239;font-size:14px;">What you get with FloreaHub:</p>
        <ul style="margin:0;padding-left:20px;color:#be185d;font-size:14px;line-height:2;">
          <li>🌹 Fresh flowers from verified local florists</li>
          <li>📸 Real-photo bouquet promise before delivery</li>
          <li>⏰ Occasion reminders so you never miss a date</li>
          <li>🚚 Same-day delivery in major cities</li>
        </ul>
      </div>
      <a href="https://floriahub.vercel.app/shop" style="display:block;background:#b5294e;color:#fff;text-align:center;padding:14px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;margin-bottom:24px;">
        Browse Flowers →
      </a>
      `}

      <p style="margin:0;color:#9ca3af;font-size:13px;text-align:center;">
        Questions? Reply to this email or visit our <a href="https://floriahub.vercel.app" style="color:#b5294e;">website</a>.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #f3f4f6;">
      <p style="margin:0;color:#d1d5db;font-size:12px;">
        © 2024 FloreaHub by Lisya Lane Empire · Malaysia's Premier Florist Marketplace
      </p>
    </div>
  </div>
</body>
</html>`;

  try {
    await getResend().emails.send({
      from: FROM,
      to: email,
      subject: isSeller ? "Welcome to FloreaHub — your florist account is ready" : "Welcome to FloreaHub 🌸",
      html,
    });
  } catch (err) {
    console.error("Welcome email error (non-blocking):", err);
  }
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
  if (!process.env.RESEND_API_KEY) return;

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

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#2d6a4f,#1b4332);padding:32px;text-align:center;">
      <div style="width:56px;height:56px;background:#fff;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;">
        <span style="font-size:24px;">✓</span>
      </div>
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">Order Confirmed!</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,.75);font-size:14px;">${orderId}</p>
    </div>

    <!-- Body -->
    <div style="padding:32px;">
      <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
        Hi ${name.split(" ")[0]}, thank you for your order! Your florist has been notified and will start preparing your flowers.
      </p>

      <!-- Items -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
        <tbody>${itemRows}</tbody>
      </table>

      <!-- Totals -->
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
        <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;">Deliver to</p>
        <p style="margin:0;font-size:14px;color:#111827;font-weight:500;">${recipientName || name}</p>
        <p style="margin:2px 0 0;font-size:13px;color:#6b7280;">${deliveryAddress}</p>
      </div>
      ` : ""}

      <!-- Status steps -->
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin-bottom:24px;">
        <p style="margin:0 0 12px;font-weight:600;color:#166534;font-size:14px;">What happens next:</p>
        <div style="display:flex;flex-direction:column;gap:10px;">
          ${["Florist confirms and prepares your bouquet", "You may receive a photo before dispatch", "Rider picks up and delivers to your address", "Enjoy your beautiful flowers!"].map((step, i) => `
          <div style="display:flex;gap:10px;align-items:flex-start;">
            <div style="width:20px;height:20px;background:#2d6a4f;border-radius:50%;flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;">
              <span style="color:#fff;font-size:11px;font-weight:700;">${i + 1}</span>
            </div>
            <p style="margin:2px 0 0;font-size:13px;color:#15803d;">${step}</p>
          </div>`).join("")}
        </div>
      </div>

      <a href="https://floriahub.vercel.app/orders" style="display:block;background:#b5294e;color:#fff;text-align:center;padding:14px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">
        Track My Order →
      </a>
    </div>

    <!-- Footer -->
    <div style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #f3f4f6;">
      <p style="margin:0;color:#d1d5db;font-size:12px;">
        © 2024 FloreaHub by Lisya Lane Empire · Questions? Reply to this email.
      </p>
    </div>
  </div>
</body>
</html>`;

  try {
    await getResend().emails.send({
      from: FROM,
      to: email,
      subject: `Order confirmed — ${orderId} 🌸`,
      html,
    });
  } catch (err) {
    console.error("Order confirmation email error (non-blocking):", err);
  }
}
