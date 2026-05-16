import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const brandHeader = `
  <div style="background:#0A1128;padding:24px 32px;text-align:center;">
    <h1 style="font-family:Georgia,serif;color:#C8991E;margin:0;font-size:28px;letter-spacing:2px;">
      DHARSAN DRESSES
    </h1>
    <p style="color:#9FADC7;font-family:sans-serif;font-size:13px;margin:6px 0 0;">
      Best Clothes · Best Stitch · Tirupati
    </p>
  </div>
`;

const brandFooter = `
  <div style="background:#0A1128;padding:20px 32px;text-align:center;margin-top:32px;">
    <p style="color:#9FADC7;font-family:sans-serif;font-size:12px;margin:0;">
      Yadava St, Varadaraja Nagar, Tirupati, Andhra Pradesh 517501<br/>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color:#C8991E;">dharsandresses.com</a>
    </p>
  </div>
`;

export async function sendOrderConfirmationEmail(params: {
  to: string;
  customerName: string;
  orderNumber: string;
  items: Array<{ name: string; quantity: number; price: number; size?: string }>;
  totalAmount: number;
  address: string;
  paymentMethod: string;
}) {
  const itemsHtml = params.items
    .map(
      (item) => `
      <tr>
        <td style="padding:12px;border-bottom:1px solid #F5EFE1;font-family:sans-serif;font-size:14px;color:#1A1A2E;">
          ${item.name}${item.size ? ` (${item.size})` : ''}
        </td>
        <td style="padding:12px;border-bottom:1px solid #F5EFE1;text-align:center;font-family:sans-serif;font-size:14px;">
          ${item.quantity}
        </td>
        <td style="padding:12px;border-bottom:1px solid #F5EFE1;text-align:right;font-family:sans-serif;font-size:14px;font-weight:600;">
          ₹${(item.price * item.quantity).toLocaleString('en-IN')}
        </td>
      </tr>
    `
    )
    .join('');

  const html = `
    <div style="max-width:600px;margin:0 auto;background:#FDFCF9;">
      ${brandHeader}
      <div style="padding:32px;">
        <h2 style="font-family:Georgia,serif;color:#0A1128;font-size:24px;margin:0 0 8px;">
          Order Confirmed! 🎉
        </h2>
        <p style="font-family:sans-serif;color:#4A5568;font-size:15px;margin:0 0 24px;">
          Hi ${params.customerName}, thank you for shopping with us!
        </p>
        
        <div style="background:#FAF7F0;border:1px solid #EDE2CC;border-radius:8px;padding:20px;margin-bottom:24px;">
          <p style="font-family:sans-serif;font-size:14px;color:#6B7280;margin:0 0 4px;">Order Number</p>
          <p style="font-family:Georgia,serif;font-size:22px;color:#C8991E;font-weight:600;margin:0;">
            #${params.orderNumber}
          </p>
        </div>

        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          <thead>
            <tr style="background:#0A1128;">
              <th style="padding:12px;text-align:left;font-family:sans-serif;font-size:12px;color:#C8991E;text-transform:uppercase;letter-spacing:1px;">Item</th>
              <th style="padding:12px;text-align:center;font-family:sans-serif;font-size:12px;color:#C8991E;text-transform:uppercase;letter-spacing:1px;">Qty</th>
              <th style="padding:12px;text-align:right;font-family:sans-serif;font-size:12px;color:#C8991E;text-transform:uppercase;letter-spacing:1px;">Price</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding:16px 12px 8px;font-family:sans-serif;font-size:15px;font-weight:700;color:#0A1128;">Total</td>
              <td style="padding:16px 12px 8px;text-align:right;font-family:Georgia,serif;font-size:18px;font-weight:700;color:#C8991E;">
                ₹${params.totalAmount.toLocaleString('en-IN')}
              </td>
            </tr>
          </tfoot>
        </table>

        <div style="display:flex;gap:16px;margin-bottom:24px;">
          <div style="flex:1;background:#FAF7F0;border-radius:8px;padding:16px;">
            <p style="font-family:sans-serif;font-size:12px;color:#6B7280;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Delivery Address</p>
            <p style="font-family:sans-serif;font-size:14px;color:#1A1A2E;margin:0;">${params.address}</p>
          </div>
          <div style="flex:1;background:#FAF7F0;border-radius:8px;padding:16px;">
            <p style="font-family:sans-serif;font-size:12px;color:#6B7280;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Payment</p>
            <p style="font-family:sans-serif;font-size:14px;color:#1A1A2E;margin:0;">${params.paymentMethod}</p>
          </div>
        </div>

        <p style="font-family:sans-serif;font-size:14px;color:#6B7280;text-align:center;">
          We'll send you tracking details once your order ships.
        </p>
      </div>
      ${brandFooter}
    </div>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: params.to,
    subject: `Order Confirmed – #${params.orderNumber} | Dharsan Dresses`,
    html,
  });
}

export async function sendShippingEmail(params: {
  to: string;
  customerName: string;
  orderNumber: string;
  trackingNumber: string;
  trackingUrl: string;
  carrier: string;
}) {
  const html = `
    <div style="max-width:600px;margin:0 auto;background:#FDFCF9;">
      ${brandHeader}
      <div style="padding:32px;text-align:center;">
        <div style="font-size:48px;margin-bottom:16px;">🚚</div>
        <h2 style="font-family:Georgia,serif;color:#0A1128;font-size:24px;margin:0 0 12px;">
          Your order is on its way!
        </h2>
        <p style="font-family:sans-serif;color:#4A5568;margin:0 0 24px;">
          Hi ${params.customerName}, your order <strong>#${params.orderNumber}</strong> has been shipped.
        </p>
        
        <div style="background:#FAF7F0;border:1px solid #EDE2CC;border-radius:8px;padding:20px;margin-bottom:24px;text-align:left;">
          <p style="font-family:sans-serif;font-size:13px;color:#6B7280;margin:0 0 4px;">Tracking Number (${params.carrier})</p>
          <p style="font-family:Georgia,serif;font-size:20px;color:#C8991E;font-weight:600;margin:0 0 16px;">
            ${params.trackingNumber}
          </p>
          <a href="${params.trackingUrl}" 
             style="display:inline-block;background:#0A1128;color:#C8991E;padding:12px 24px;border-radius:6px;font-family:sans-serif;font-size:14px;font-weight:600;text-decoration:none;">
            Track Your Order
          </a>
        </div>
      </div>
      ${brandFooter}
    </div>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: params.to,
    subject: `Your Order #${params.orderNumber} Has Shipped | Dharsan Dresses`,
    html,
  });
}

export async function sendPasswordResetEmail(params: {
  to: string;
  customerName: string;
  resetUrl: string;
  expiresInMinutes: number;
}) {
  const html = `
    <div style="max-width:600px;margin:0 auto;background:#FDFCF9;">
      ${brandHeader}
      <div style="padding:32px;">
        <h2 style="font-family:Georgia,serif;color:#0A1128;font-size:24px;margin:0 0 8px;">
          Reset your password
        </h2>
        <p style="font-family:sans-serif;color:#4A5568;font-size:15px;margin:0 0 24px;">
          Hi ${params.customerName || 'there'}, we received a request to reset the password for your Dharsan Dresses account.
          Click the button below to choose a new password.
        </p>

        <div style="text-align:center;margin:32px 0;">
          <a href="${params.resetUrl}"
             style="display:inline-block;background:#0A1128;color:#C8991E;padding:14px 36px;border-radius:6px;font-family:sans-serif;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:1px;">
            Reset Password
          </a>
        </div>

        <div style="background:#FAF7F0;border:1px solid #EDE2CC;border-radius:8px;padding:16px;margin-bottom:24px;">
          <p style="font-family:sans-serif;font-size:13px;color:#6B7280;margin:0;">
            This link expires in <strong>${params.expiresInMinutes} minutes</strong>.
            If the button above doesn't work, copy and paste this URL into your browser:
          </p>
          <p style="font-family:'Courier New',monospace;font-size:12px;color:#0A1128;background:#fff;padding:10px;margin:8px 0 0;border-radius:4px;word-break:break-all;">
            ${params.resetUrl}
          </p>
        </div>

        <p style="font-family:sans-serif;font-size:13px;color:#9CA3AF;text-align:center;margin:24px 0 0;">
          Didn't request this? You can safely ignore this email — your password won't change unless you click the link above.
          <br/><br/>
          For instant help, WhatsApp us at
          <a href="https://wa.me/919440250863" style="color:#C8991E;">+91 94402 50863</a>.
        </p>
      </div>
      ${brandFooter}
    </div>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: params.to,
    subject: 'Reset your Dharsan Dresses password',
    html,
  });
}

export async function sendLowStockAlert(params: {
  productName: string;
  variant: string;
  currentStock: number;
}) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: process.env.SMTP_USER!, // Alert goes to shop owner
    subject: `⚠️ Low Stock Alert: ${params.productName}`,
    html: `
      <div style="max-width:500px;margin:0 auto;font-family:sans-serif;">
        ${brandHeader}
        <div style="padding:24px;">
          <h2 style="color:#DC2626;">⚠️ Low Stock Alert</h2>
          <p><strong>Product:</strong> ${params.productName}</p>
          <p><strong>Variant:</strong> ${params.variant}</p>
          <p><strong>Current Stock:</strong> <span style="color:#DC2626;font-weight:700;">${params.currentStock} units</span></p>
          <p>Please restock soon to avoid missing orders.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/inventory" 
             style="display:inline-block;background:#C8991E;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;margin-top:16px;">
            Manage Inventory
          </a>
        </div>
      </div>
    `,
  });
}
