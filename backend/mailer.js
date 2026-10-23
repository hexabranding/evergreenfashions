import nodemailer from 'nodemailer';

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, SMTP_SECURE } = process.env;

export function isMailConfigured() {
  return Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);
}

function money(value) {
  return `€${Number(value || 0).toFixed(2)}`;
}

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return value;
  }
}

function orderHtml(order) {
  const shipping = order.shipping || {};
  const rows = (order.items || [])
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #eae7e0;font-size:13px;color:#1c1a17;">
          ${item.name}${item.size ? ` — Size ${item.size}` : ''}${item.color ? ` · ${item.color}` : ''}${item.isRental ? ' · Rental' : ''}
          <div style="font-size:11px;color:#7a756c;">Qty ${item.quantity}</div>
        </td>
        <td align="right" style="padding:10px 0;border-bottom:1px solid #eae7e0;font-size:13px;color:#1c1a17;">
          ${money(item.price * item.quantity)}
        </td>
      </tr>`
    )
    .join('');

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4f2ee;font-family:Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f2ee;padding:24px 0;">
      <tr><td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #eae7e0;">
          <tr>
            <td style="background:#1c1a17;padding:28px 32px;">
              <div style="font-size:20px;letter-spacing:0.28em;color:#f6f3ec;text-transform:uppercase;">Evergreen</div>
              <div style="font-size:11px;letter-spacing:0.2em;color:#9d978c;text-transform:uppercase;margin-top:6px;">Order Confirmation</div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h1 style="font-family:Georgia,serif;font-size:24px;margin:0 0 8px;color:#1c1a17;">Thank you, ${shipping.firstName || order.customerName || 'there'}.</h1>
              <p style="font-size:14px;color:#7a756c;margin:0 0 24px;line-height:1.6;">
                Your order has been confirmed and is being prepared with care in our atelier.
                Order number <strong style="color:#1c1a17;">${order._id}</strong>.
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #eae7e0;">
                <tr>
                  <td colspan="2" style="padding-top:16px;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#7a756c;">Items</td>
                </tr>
                ${rows}
                ${order.discount ? `<tr><td style="padding:8px 0;font-size:13px;color:#7a756c;">Discount (${order.coupon?.code || 'coupon'})</td><td align="right" style="padding:8px 0;font-size:13px;color:#b0413e;">-${money(order.discount)}</td></tr>` : ''}
                <tr>
                  <td style="padding:14px 0 0;font-size:14px;font-weight:bold;color:#1c1a17;">Total</td>
                  <td align="right" style="padding:14px 0 0;font-size:18px;font-family:Georgia,serif;color:#1c1a17;">${money(order.total)}</td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;background:#f8f7f4;border:1px solid #eae7e0;">
                <tr>
                  <td style="padding:18px 20px;">
                    <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#7a756c;margin-bottom:8px;">Shipping to</div>
                    <div style="font-size:13px;color:#1c1a17;line-height:1.7;">
                      ${shipping.firstName || ''} ${shipping.lastName || ''}<br/>
                      ${shipping.address || ''}<br/>
                      ${shipping.city || ''} ${shipping.zip || ''}${shipping.country ? `, ${shipping.country}` : ''}<br/>
                      ${shipping.phone ? `${shipping.phone}<br/>` : ''}
                      ${shipping.email || order.customerEmail || ''}
                    </div>
                  </td>
                  <td style="padding:18px 20px;border-left:1px solid #eae7e0;">
                    <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#7a756c;margin-bottom:8px;">Estimated delivery</div>
                    <div style="font-family:Georgia,serif;font-size:16px;color:#b0413e;">${formatDate(order.estimatedDelivery)}</div>
                  </td>
                </tr>
              </table>

              <p style="font-size:12px;color:#7a756c;margin-top:28px;line-height:1.7;">
                Questions about your order? Simply reply to this email — our atelier team is happy to help.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#1c1a17;padding:18px 32px;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#9d978c;text-align:center;">
              Evergreen Fashion · Crafted in France
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

let transporter = null;

function getTransporter() {
  if (!isMailConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT || 587),
      secure: SMTP_SECURE === 'true' || Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }
  return transporter;
}

export async function sendOrderConfirmationEmail(order) {
  const to = order?.customerEmail || order?.shipping?.email;
  const subject = `Your Evergreen order ${order?._id} is confirmed`;

  if (!isMailConfigured()) {
    console.log(`[mail] SMTP not configured — skipped confirmation for ${to || 'unknown recipient'} (${subject}). Set SMTP_HOST/SMTP_USER/SMTP_PASS in backend/.env to enable.`);
    return { skipped: true };
  }

  if (!to) {
    console.log(`[mail] no recipient email for order ${order?._id} — skipped.`);
    return { skipped: true };
  }

  const info = await getTransporter().sendMail({
    from: SMTP_FROM || `"Evergreen Fashion" <${SMTP_USER}>`,
    to,
    subject,
    html: orderHtml(order),
  });
  console.log(`[mail] confirmation sent to ${to} (${info.messageId})`);
  return info;
}
