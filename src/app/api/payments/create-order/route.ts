import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { createRazorpayOrder } from '@/lib/razorpay';
import { db } from '@/lib/db';

const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string(),
        variantId: z.string().optional(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),
  addressId: z.string(),
  couponCode: z.string().optional(),
  paymentMethod: z.enum(['RAZORPAY', 'COD', 'UPI']),
});

const FREE_SHIPPING_THRESHOLD = 1000;
const SHIPPING_CHARGE = 80;

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.errors }, { status: 400 });
    }

    const { items, addressId, couponCode, paymentMethod } = parsed.data;
    const userId = (session.user as any).id;

    // Validate address belongs to user
    const address = await db.address.findFirst({
      where: { id: addressId, userId },
    });
    if (!address) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    // Fetch product details and validate stock
    const productIds = items.map((i) => i.productId);
    const products = await db.product.findMany({
      where: { id: { in: productIds }, isPublished: true },
      include: { variants: true, images: { take: 1, orderBy: { sortOrder: 'asc' } } },
    });

    let subtotal = 0;
    const orderItemsData: any[] = [];
    const stockUpdates: Array<{ variantId: string; quantity: number }> = [];

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        return NextResponse.json({ error: `Product ${item.productId} not found` }, { status: 404 });
      }

      let variant = null;
      let unitPrice = product.price;

      if (item.variantId) {
        variant = product.variants.find((v) => v.id === item.variantId);
        if (!variant) {
          return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
        }
        if (variant.stock < item.quantity) {
          return NextResponse.json(
            { error: `Only ${variant.stock} left of ${product.name}` },
            { status: 400 }
          );
        }
        unitPrice = variant.price ?? product.price;
        stockUpdates.push({ variantId: variant.id, quantity: item.quantity });
      }

      const itemTotal = unitPrice * item.quantity;
      subtotal += itemTotal;

      orderItemsData.push({
        productId: product.id,
        variantId: variant?.id,
        productName: product.name,
        productImage: product.images[0]?.url,
        size: variant?.size,
        color: variant?.color,
        quantity: item.quantity,
        unitPrice,
        totalPrice: itemTotal,
      });
    }

    // Apply coupon
    let couponDiscount = 0;
    if (couponCode) {
      const coupon = await db.coupon.findUnique({ where: { code: couponCode.toUpperCase() } });
      if (
        coupon &&
        coupon.isActive &&
        (!coupon.validUntil || coupon.validUntil > new Date()) &&
        (!coupon.minOrderAmount || subtotal >= coupon.minOrderAmount) &&
        (!coupon.usageLimit || coupon.usageCount < coupon.usageLimit)
      ) {
        couponDiscount =
          coupon.discountType === 'PERCENTAGE'
            ? Math.min(
                (subtotal * coupon.discountValue) / 100,
                coupon.maxDiscount ?? Infinity
              )
            : coupon.discountValue;
      }
    }

    // Shipping
    const shipping = subtotal - couponDiscount >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_CHARGE;
    const totalAmount = subtotal - couponDiscount + shipping;

    // Generate order number
    const orderCount = await db.order.count();
    const orderNumber = `DD-${new Date().getFullYear()}-${String(orderCount + 1).padStart(5, '0')}`;

    // Create order in DB
    const order = await db.order.create({
      data: {
        orderNumber,
        userId,
        addressId,
        subtotal,
        shippingCharge: shipping,
        discount: couponDiscount,
        totalAmount,
        paymentMethod,
        couponCode: couponCode ?? null,
        couponDiscount: couponDiscount > 0 ? couponDiscount : null,
        paymentStatus: paymentMethod === 'COD' ? 'COD_PENDING' : 'PENDING',
        items: { create: orderItemsData },
        statusHistory: { create: { status: 'PENDING', note: 'Order created' } },
      },
    });

    // For Razorpay/UPI, create the gateway order
    if (paymentMethod === 'RAZORPAY' || paymentMethod === 'UPI') {
      const razorpayOrder = await createRazorpayOrder(totalAmount, order.id);
      await db.order.update({
        where: { id: order.id },
        data: { razorpayOrderId: razorpayOrder.id },
      });

      return NextResponse.json({
        success: true,
        orderId: order.id,
        orderNumber,
        razorpayOrderId: razorpayOrder.id,
        amount: totalAmount,
        currency: 'INR',
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      });
    }

    // For COD, deduct stock now and confirm
    for (const update of stockUpdates) {
      await db.productVariant.update({
        where: { id: update.variantId },
        data: { stock: { decrement: update.quantity } },
      });
    }
    await db.order.update({
      where: { id: order.id },
      data: { status: 'CONFIRMED' },
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber,
      paymentMethod: 'COD',
    });
  } catch (err: any) {
    console.error('Order creation error:', err);
    return NextResponse.json(
      { error: 'Failed to create order', details: err.message },
      { status: 500 }
    );
  }
}
