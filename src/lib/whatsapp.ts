/**
 * WhatsApp Notifications via Twilio WhatsApp Business API
 * Sends order updates to customers and alerts to shop owner
 */

async function sendWhatsApp(to: string, message: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;

  if (!accountSid || !authToken || !from) {
    console.warn('Twilio credentials not configured. Skipping WhatsApp notification.');
    return;
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

  const body = new URLSearchParams({
    From: from,
    To: `whatsapp:${to}`,
    Body: message,
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const err = await response.json();
    console.error('WhatsApp send error:', err);
    // Don't throw — WhatsApp failure shouldn't break the order flow
  }
}

export async function sendOrderConfirmationWhatsApp(params: {
  phone: string;
  customerName: string;
  orderNumber: string;
  totalAmount: number;
  paymentMethod: string;
}) {
  const message =
    `✅ *Order Confirmed!*\n\n` +
    `Namaste ${params.customerName}! 🙏\n\n` +
    `Your order *#${params.orderNumber}* has been confirmed.\n\n` +
    `💰 Total: *₹${params.totalAmount.toLocaleString('en-IN')}*\n` +
    `💳 Payment: ${params.paymentMethod}\n\n` +
    `We'll notify you once it's shipped.\n\n` +
    `Thank you for shopping with *Dharsan Dresses* 🛍️\n` +
    `Tirupati's Best Clothes & Stitching`;

  await sendWhatsApp(params.phone, message);
}

export async function sendShippingWhatsApp(params: {
  phone: string;
  customerName: string;
  orderNumber: string;
  trackingNumber: string;
  carrier: string;
  trackingUrl: string;
}) {
  const message =
    `🚚 *Your Order is Shipped!*\n\n` +
    `Hi ${params.customerName}! Your order *#${params.orderNumber}* is on its way.\n\n` +
    `📦 Carrier: ${params.carrier}\n` +
    `🔍 Tracking: *${params.trackingNumber}*\n\n` +
    `Track here: ${params.trackingUrl}\n\n` +
    `- *Dharsan Dresses Team* 🙏`;

  await sendWhatsApp(params.phone, message);
}

export async function sendNewOrderAlertToOwner(params: {
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  itemCount: number;
}) {
  const ownerPhone = process.env.SHOP_WHATSAPP_NUMBER;
  if (!ownerPhone) return;

  const message =
    `🛍️ *New Order Received!*\n\n` +
    `Order: *#${params.orderNumber}*\n` +
    `Customer: ${params.customerName}\n` +
    `Items: ${params.itemCount}\n` +
    `Total: *₹${params.totalAmount.toLocaleString('en-IN')}*\n\n` +
    `Login to admin panel to manage this order.`;

  // Send to owner's number (extract just the number)
  const ownerNum = ownerPhone.replace('whatsapp:', '');
  await sendWhatsApp(ownerNum, message);
}
