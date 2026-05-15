import Razorpay from 'razorpay';
import crypto from 'crypto';

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

/**
 * Create a Razorpay order
 */
export async function createRazorpayOrder(amount: number, orderId: string) {
  return await razorpay.orders.create({
    amount: Math.round(amount * 100), // Razorpay uses paise
    currency: 'INR',
    receipt: orderId,
    notes: {
      shop: 'Dharsan Dresses',
      orderId,
    },
  });
}

/**
 * Verify Razorpay payment signature
 * CRITICAL: Always verify on server-side before marking order as paid
 */
export function verifyRazorpaySignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  signature: string
): boolean {
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest('hex');
  return expectedSignature === signature;
}
