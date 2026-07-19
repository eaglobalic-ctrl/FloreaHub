// Email via Brevo (Sendinblue) — no custom domain needed, verify sender email only

const BREVO_API = "https://api.brevo.com/v3/smtp/email";

function getApiKey() {
  return process.env.BREVO_API_KEY ?? "";
}

const SENDER = {
  name: "FloreaHub",
  email: process.env.BREVO_SENDER_EMAIL ?? "eaglobalic@gmail.com",
};

async function send(to: string, subject: string, html: string) {
  const key = getApiKey();
  if (!key) return;
  try {
    const res = await fetch(BREVO_API, {
      method: "POST",
      headers: {
        "api-key": key,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: SENDER,
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });
    if (!res.ok) console.error("Brevo error:", await res.text());
  } catch (err) {
    console.error("Email send error (non-blocking):", err);
  }
}

// ── Welcome email ─────────────────────────────────────────────────────────────

export async function sendWelcomeEmail({ name, email, role }: { name: string; email: string; role: string }) {
  const isSeller = role === "florist" || role === "seller";

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">
    <div style="background:linear-gradient(135deg,${isSeller ? "#2d6a4f,#1b4332" : "#b5294e,#7c1d35"});padding:40px 32px;text-align:center;">
      <span style="font-size:36px;">🌸</span>
      <h1 style="margin:12px 0 0;color:#fff;font-size:22px;font-weight:700;">FloreaHub</h1>
    </div>
    <div style="padding:36px 32px;">
      <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">Welcome, ${name.split(" ")[0]}! 👋</h2>
      <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
        ${isSeller
          ? "Akaun florist FloreaHub kamu dah siap. Mula setup kedai dan capai ribuan pelanggan di seluruh Malaysia."
          : "Akaun FloreaHub kamu dah siap. Discover bunga-bunga segar dari florist terbaik seluruh Malaysia."}
      </p>
      ${isSeller ? `
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin-bottom:24px;">
        <p style="margin:0 0 10px;font-weight:600;color:#166534;font-size:14px;">Langkah seterusnya:</p>
        <ul style="margin:0;padding-left:18px;color:#15803d;font-size:14px;line-height:2;">
          <li>Pergi ke <a href="https://floriahub.vercel.app/dashboard" style="color:#2d6a4f;font-weight:600;">Dashboard</a></li>
          <li>Upload produk pertama kamu</li>
          <li>Pilih plan untuk tingkatkan visibility</li>
        </ul>
      </div>
      <a href="https://floriahub.vercel.app/dashboard" style="display:block;background:#2d6a4f;color:#fff;text-align:center;padding:14px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;margin-bottom:24px;">Buka Dashboard →</a>
      ` : `
      <div style="background:#fff5f7;border:1px solid #fecdd3;border-radius:12px;padding:20px;margin-bottom:24px;">
        <p style="margin:0 0 10px;font-weight:600;color:#9f1239;font-size:14px;">Apa yang kamu dapat:</p>
        <ul style="margin:0;padding-left:18px;color:#be185d;font-size:14px;line-height:2;">
          <li>🌹 Bunga segar dari florist tempatan yang verified</li>
          <li>📸 Real-photo bouquet sebelum hantar</li>
          <li>⏰ Peringatan untuk birthday & anniversary</li>
          <li>🚚 Same-day delivery di bandar utama</li>
        </ul>
      </div>
      <a href="https://floriahub.vercel.app/shop" style="display:block;background:#b5294e;color:#fff;text-align:center;padding:14px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;margin-bottom:24px;">Browse Flowers →</a>
      `}
      <p style="margin:0;color:#9ca3af;font-size:13px;text-align:center;">Ada soalan? Reply email ini atau lawati <a href="https://floriahub.vercel.app" style="color:#b5294e;">floriahub.vercel.app</a></p>
    </div>
    <div style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #f3f4f6;">
      <p style="margin:0;color:#d1d5db;font-size:12px;">© 2024 FloreaHub by Lisya Lane Empire · Malaysia's Premier Florist Marketplace</p>
    </div>
  </div>
</body>
</html>`;

  await send(email, isSeller ? "Welcome to FloreaHub — akaun florist kamu dah siap 🌿" : "Welcome to FloreaHub 🌸", html);
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
      <div style="width:56px;height:56px;background:#fff;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;font-size:24px;">✓</div>
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">Order Confirmed!</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,.7);font-size:13px;">${orderId}</p>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
        Hi ${name.split(" ")[0]}, terima kasih atas pesanan kamu! Florist telah diberitahu dan akan mula menyediakan bunga kamu.
      </p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px;"><tbody>${itemRows}</tbody></table>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr>
          <td style="padding:4px 0;font-size:14px;color:#6b7280;">Subtotal</td>
          <td style="padding:4px 0;font-size:14px;color:#6b7280;text-align:right;">RM${subtotal.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:14px;color:#6b7280;">Delivery fee</td>
          <td style="padding:4px 0;font-size:14px;color:#6b7280;text-align:right;">${deliveryFee > 0 ? `RM${deliveryFee.toFixed(2)}` : "Percuma"}</td>
        </tr>
        <tr>
          <td style="padding:8px 0 0;font-size:16px;font-weight:700;color:#111827;">Jumlah Dibayar</td>
          <td style="padding:8px 0 0;font-size:16px;font-weight:700;color:#b5294e;text-align:right;">RM${total.toFixed(2)}</td>
        </tr>
      </table>
      ${deliveryAddress ? `
      <div style="background:#f9fafb;border-radius:10px;padding:16px;margin-bottom:24px;">
        <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;">Hantar ke</p>
        <p style="margin:0;font-size:14px;color:#111827;font-weight:500;">${recipientName || name}</p>
        <p style="margin:2px 0 0;font-size:13px;color:#6b7280;">${deliveryAddress}</p>
      </div>` : ""}
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin-bottom:24px;">
        <p style="margin:0 0 12px;font-weight:600;color:#166534;font-size:14px;">Apa berlaku seterusnya:</p>
        ${["Florist confirm dan sediakan bouquet kamu", "Kamu mungkin terima foto bouquet sebelum dispatch", "Rider pick up dan hantar ke alamat kamu", "Nikmati bunga-bunga cantik kamu!"].map((step, i) => `
        <div style="display:flex;gap:10px;align-items:flex-start;margin-bottom:8px;">
          <div style="width:20px;height:20px;min-width:20px;background:#2d6a4f;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;">
            <span style="color:#fff;font-size:11px;font-weight:700;">${i + 1}</span>
          </div>
          <p style="margin:2px 0 0;font-size:13px;color:#15803d;">${step}</p>
        </div>`).join("")}
      </div>
      <a href="https://floriahub.vercel.app/orders" style="display:block;background:#b5294e;color:#fff;text-align:center;padding:14px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">Track Pesanan Saya →</a>
    </div>
    <div style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #f3f4f6;">
      <p style="margin:0;color:#d1d5db;font-size:12px;">© 2024 FloreaHub by Lisya Lane Empire · Ada soalan? Reply email ini.</p>
    </div>
  </div>
</body>
</html>`;

  await send(email, `Pesanan disahkan — ${orderId} 🌸`, html);
}
