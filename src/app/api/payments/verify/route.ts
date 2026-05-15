import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { verifyRazorpaySignature } from '@/lib/razorpay';
import { db } from '@/lib/db';
import { sendOrderConfirmationEmail } from '@/lib/email';
import { sendOrderConfirmationWhatsApp, sendNewOrderAlertToOwner } from '@/lib/whatsapp';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = await req.json();

    // CRITICAL: Verify the signature server-side
    const isValid = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      await db.order.update({
        where: { id: orderId },
        data: { paymentStatus: 'FAILED' },
      });
      return NextResponse.json(
        { error: 'Payment signature verification failed' },
        { status: 400 }
      );
    }

    // Fetch full order
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { variant: true } },
        user: true,
        address: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.razorpayOrderId !== razorpay_order_id) {
      return NextResponse.json({ error: 'Order mismatch' }, { status: 400 });
    }

    // Mark order as paid and confirmed
    await db.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'PAID',
        status: 'CONFIRMED',
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        statusHistory: { create: { status: 'CONFIRMED', note: 'Payment confirmed' } },
      },
    });

    // Deduct stock for variants
    for (const item of order.items) {
      if (item.variantId) {
        await db.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        });
      }
      await db.product.update({
        where: { id: item.productId },
        data: { totalSold: { increment: item.quantity } },
      });
    }

    // Generate invoice number
    const invoiceCount = await db.invoice.count();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(5, '0')}`;

    await db.invoice.create({
      data: {
        orderId: order.id,
        invoiceNumber,
      },
    });

    // Send notifications (don't block on these)
    const addressStr = `${order.address.fullName}, ${order.address.addressLine1}, ${order.address.city}, ${order.address.state} ${order.address.pincode}`;

    Promise.all([
      sendOrderConfirmationEmail({
        to: order.user.email,
        customerName: order.user.name,
        orderNumber: order.orderNumber,
        items: order.items.map((i) => ({
          name: i.productName,
          quantity: i.quantity,
          price: i.unitPrice,
          size: i.size ?? undefined,
        })),
        totalAmount: order.totalAmount,
        address: addressStr,
        paymentMethod: 'Razorpay (Online)',
      }),
      order.user.phone &&
        sendOrderConfirmationWhatsApp({
          phone: order.user.phone,
          customerName: order.user.name,
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          paymentMethod: 'Online',
        }),
      sendNewOrderAlertToOwner({
        orderNumber: order.orderNumber,
        customerName: order.user.name,
        totalAmount: order.totalAmount,
        itemCount: order.items.length,
      }),
    ]).catch((err) => console.error('Notification error:', err));

    // Low stock alerts
    for (const item of order.items) {
      if (item.variantId && item.variant) {
        const updated = await db.productVariant.findUnique({ where: { id: item.variantId } });
        if (updated && updated.stock <= 5) {
          // Trigger low-stock notification (handle in background)
          console.warn(`Low stock alert: variant ${item.variantId} stock=${updated.stock}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      orderNumber: order.orderNumber,
      invoiceNumber,
    });
  } catch (err: any) {
    console.error('Payment verification error:', err);
    return NextResponse.json(
      { error: 'Verification failed', details: err.message },
      { status: 500 }
    );
  }
}
