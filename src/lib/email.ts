import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }
  return transporter;
}

const SENDER_EMAIL = process.env.GMAIL_USER ?? "pretty.dalisya@gmail.com";
const SENDER_NAME = "FloreaHub";

// Inline SVG logo — works in all email clients without external image loading
const LOGO_SVG = `<table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 4px;">
  <tr>
    <td style="background:#b5294e;border-radius:10px;width:40px;height:40px;text-align:center;vertical-align:middle;padding:0;">
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="display:block;margin:9px auto 0;">
        <path d="M12 7.5a4.5 4.5 0 1 1 4.5 4.5M12 7.5A4.5 4.5 0 1 0 7.5 12M12 7.5V13m4.5-1a4.5 4.5 0 1 1-4.5 4.5M16.5 12A4.5 4.5 0 1 0 12 16.5M12 13v4.5"/>
      </svg>
    </td>
    <td style="padding-left:10px;vertical-align:middle;">
      <span style="color:#ffffff;font-size:20px;font-weight:700;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;letter-spacing:-0.3px;">Florea<span style="color:rgba(255,255,255,0.75);">Hub</span></span>
    </td>
  </tr>
</table>`;

const LOGO_SVG_GREEN = `<table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 4px;">
  <tr>
    <td style="background:#2d6a4f;border-radius:10px;width:40px;height:40px;text-align:center;vertical-align:middle;padding:0;">
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="display:block;margin:9px auto 0;">
        <path d="M12 7.5a4.5 4.5 0 1 1 4.5 4.5M12 7.5A4.5 4.5 0 1 0 7.5 12M12 7.5V13m4.5-1a4.5 4.5 0 1 1-4.5 4.5M16.5 12A4.5 4.5 0 1 0 12 16.5M12 13v4.5"/>
      </svg>
    </td>
    <td style="padding-left:10px;vertical-align:middle;">
      <span style="color:#ffffff;font-size:20px;font-weight:700;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;letter-spacing:-0.3px;">Florea<span style="color:rgba(255,255,255,0.75);">Hub</span></span>
    </td>
  </tr>
</table>`;

async function send(to: string, subject: string, html: string) {
  if (!process.env.GMAIL_APP_PASSWORD) return;
  try {
    await getTransporter().sendMail({
      from: `"${SENDER_NAME}" <${SENDER_EMAIL}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error("Email send error (non-blocking):", err);
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
          ? "Akaun florist FloreaHub kamu dah siap. Mula setup kedai dan capai ribuan pelanggan di seluruh Malaysia."
          : "Akaun FloreaHub kamu dah siap. Discover bunga-bunga segar dari florist terbaik seluruh Malaysia."}
      </p>
      ${isSeller ? (isPending ? `
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:20px;margin-bottom:24px;">
        <p style="margin:0 0 8px;font-weight:700;color:#92400e;font-size:14px;">Permohonan sedang dalam semakan</p>
        <p style="margin:0;color:#78350f;font-size:14px;line-height:1.6;">Team FloreaHub akan semak maklumat kedai kamu dan maklumkan dalam masa <strong>1-2 hari bekerja</strong>. Semak email ini untuk updates.</p>
      </div>
      <div style="background:#f9fafb;border-radius:10px;padding:16px;margin-bottom:24px;">
        <p style="margin:0 0 10px;font-weight:600;color:#374151;font-size:13px;">Apa berlaku seterusnya:</p>
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${["Team semak permohonan dan maklumat kedai kamu", "Kamu akan dapat email approval atau request for info", "Selepas approved, login dan setup produk pertama kamu", "Mula terima pesanan dari pelanggan seluruh Malaysia"].map((s, i) => `
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
        <p style="margin:0 0 10px;font-weight:600;color:#166534;font-size:14px;">Langkah seterusnya:</p>
        <ul style="margin:0;padding-left:18px;color:#15803d;font-size:14px;line-height:2;">
          <li>Pergi ke <a href="https://floriahub.vercel.app/dashboard" style="color:#2d6a4f;font-weight:600;">Dashboard</a></li>
          <li>Upload produk pertama kamu</li>
          <li>Pilih plan untuk tingkatkan visibility</li>
        </ul>
      </div>
      <a href="https://floriahub.vercel.app/dashboard" style="display:block;background:#2d6a4f;color:#fff;text-align:center;padding:14px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;margin-bottom:24px;">Buka Dashboard →</a>
      `) : `
      <div style="background:#fff5f7;border:1px solid #fecdd3;border-radius:12px;padding:20px;margin-bottom:24px;">
        <p style="margin:0 0 10px;font-weight:600;color:#9f1239;font-size:14px;">Apa yang kamu dapat:</p>
        <ul style="margin:0;padding-left:18px;color:#be185d;font-size:14px;line-height:2;">
          <li>Bunga segar dari florist tempatan yang verified</li>
          <li>Real-photo bouquet sebelum hantar</li>
          <li>Peringatan untuk birthday &amp; anniversary</li>
          <li>Same-day delivery di bandar utama</li>
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

  await send(email, isSeller ? "Welcome to FloreaHub — akaun florist kamu dah siap" : "Welcome to FloreaHub", html);
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

  await send(email, `Pesanan disahkan — ${orderId}`, html);
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
      <h2 style="margin:0 0 4px;font-size:20px;font-weight:700;color:#111827;">Permohonan Florist Baru</h2>
      <p style="margin:0 0 24px;color:#6b7280;font-size:14px;">Seorang florist baru telah mendaftar dan menunggu semakan.</p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:24px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:6px 0;font-size:13px;color:#6b7280;width:120px;">Nama</td><td style="padding:6px 0;font-size:14px;font-weight:600;color:#111827;">${name}</td></tr>
          <tr><td style="padding:6px 0;font-size:13px;color:#6b7280;">Email</td><td style="padding:6px 0;font-size:14px;color:#111827;">${email}</td></tr>
          ${shopCity ? `<tr><td style="padding:6px 0;font-size:13px;color:#6b7280;">Bandar</td><td style="padding:6px 0;font-size:14px;color:#111827;">${shopCity}</td></tr>` : ""}
          ${shopPhone ? `<tr><td style="padding:6px 0;font-size:13px;color:#6b7280;">Telefon</td><td style="padding:6px 0;font-size:14px;color:#111827;">${shopPhone}</td></tr>` : ""}
        </table>
      </div>
      <a href="https://floriahub.vercel.app/admin" style="display:block;background:#1e40af;color:#fff;text-align:center;padding:14px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">Semak &amp; Approve Sekarang</a>
    </div>
    <div style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #f3f4f6;">
      <p style="margin:0;color:#d1d5db;font-size:12px;">FloreaHub Admin · floriahub.vercel.app/admin</p>
    </div>
  </div>
</body>
</html>`;

  await send(adminEmail, `[FloreaHub] Florist baru menunggu approval — ${name}`, html);
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
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">Tahniah! Akaun Diluluskan</h1>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.6;">
        Hi ${name.split(" ")[0]}, permohonan florist kamu untuk FloreaHub telah <strong style="color:#2d6a4f;">diluluskan</strong>. Kamu boleh mula setup kedai dan jual bunga sekarang!
      </p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin-bottom:24px;">
        <p style="margin:0 0 10px;font-weight:600;color:#166534;font-size:14px;">Mula sekarang:</p>
        <ul style="margin:0;padding-left:18px;color:#15803d;font-size:14px;line-height:2.2;">
          <li>Login ke akaun kamu di <a href="https://floriahub.vercel.app/login" style="color:#2d6a4f;font-weight:600;">floriahub.vercel.app</a></li>
          <li>Upload produk pertama kamu dalam Dashboard</li>
          <li>Set harga, gambar, dan butiran delivery</li>
          <li>Pilih plan subscription untuk tingkatkan visibility</li>
        </ul>
      </div>
      <a href="https://floriahub.vercel.app/login" style="display:block;background:#2d6a4f;color:#fff;text-align:center;padding:14px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">Login &amp; Mula Jual</a>
    </div>
    <div style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #f3f4f6;">
      <p style="margin:0;color:#d1d5db;font-size:12px;">© 2024 FloreaHub by Lisya Lane Empire</p>
    </div>
  </div>
</body>
</html>`;

  await send(email, "Akaun florist kamu telah diluluskan — FloreaHub", html);
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
        Hi ${name.split(" ")[0]}, kami terima permintaan untuk reset password akaun FloreaHub kamu. Klik butang di bawah untuk set password baru — link ini sah selama <strong>1 jam</strong>.
      </p>
      <a href="${resetUrl}" style="display:block;background:#b5294e;color:#fff;text-align:center;padding:14px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;margin-bottom:20px;">Set Password Baru</a>
      <p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.6;">Kalau kamu tak minta reset ni, abaikan sahaja email ini — password kamu tidak akan berubah.</p>
    </div>
    <div style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #f3f4f6;">
      <p style="margin:0;color:#d1d5db;font-size:12px;">© 2024 FloreaHub by Lisya Lane Empire</p>
    </div>
  </div>
</body>
</html>`;

  await send(email, "Reset password akaun FloreaHub anda", html);
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
      <h2 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#111827;">Permohonan Tidak Berjaya</h2>
      <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.6;">
        Hi ${name.split(" ")[0]}, selepas semakan, permohonan florist kamu tidak dapat diluluskan pada masa ini.
      </p>
      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:20px;margin-bottom:24px;">
        <p style="margin:0;color:#7f1d1d;font-size:14px;line-height:1.6;">
          Ini mungkin disebabkan maklumat yang tidak lengkap atau kedai tidak memenuhi kriteria semasa. Kamu boleh hubungi kami untuk maklumat lanjut atau mendaftar semula dengan maklumat yang dikemaskini.
        </p>
      </div>
      <a href="mailto:${process.env.GMAIL_USER ?? ""}" style="display:block;background:#991b1b;color:#fff;text-align:center;padding:14px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">Hubungi Kami</a>
    </div>
    <div style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #f3f4f6;">
      <p style="margin:0;color:#d1d5db;font-size:12px;">© 2024 FloreaHub by Lisya Lane Empire</p>
    </div>
  </div>
</body>
</html>`;

  await send(email, "Update permohonan florist — FloreaHub", html);
}
