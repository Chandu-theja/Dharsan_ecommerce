'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import {
  CreditCard, Truck, ShieldCheck, Plus, MapPin, Phone, Loader2,
} from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import toast from 'react-hot-toast';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface Address {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { items, getTotalPrice, clearCart } = useCartStore();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    fullName: '', phone: '', addressLine1: '', addressLine2: '',
    city: '', state: 'Andhra Pradesh', pincode: '',
  });
  const [paymentMethod, setPaymentMethod] = useState<'RAZORPAY' | 'COD' | 'UPI'>('RAZORPAY');
  const [couponCode, setCouponCode] = useState('');
  const [processing, setProcessing] = useState(false);

  const subtotal = getTotalPrice();
  const shipping = subtotal >= 1000 ? 0 : 80;
  const total = subtotal + shipping;

  // Redirect if not logged in or cart is empty
  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login?callbackUrl=/checkout');
    if (status === 'authenticated' && items.length === 0) router.push('/');
  }, [status, items.length, router]);

  // Fetch addresses
  useEffect(() => {
    if (session?.user) {
      fetch('/api/addresses')
        .then((r) => r.json())
        .then((data) => {
          setAddresses(data.addresses || []);
          const defaultAddr = data.addresses?.find((a: Address) => a.isDefault);
          if (defaultAddr) setSelectedAddressId(defaultAddr.id);
          else if (data.addresses?.length > 0) setSelectedAddressId(data.addresses[0].id);
          else setShowAddressForm(true);
        })
        .catch(() => setShowAddressForm(true));
    }
  }, [session]);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleAddAddress = async () => {
    if (!newAddress.fullName || !newAddress.phone || !newAddress.addressLine1 ||
        !newAddress.city || !newAddress.pincode) {
      toast.error('Please fill all required fields');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(newAddress.phone)) {
      toast.error('Invalid phone number');
      return;
    }
    if (!/^\d{6}$/.test(newAddress.pincode)) {
      toast.error('Invalid pincode');
      return;
    }

    try {
      const res = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newAddress, isDefault: addresses.length === 0 }),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setAddresses([...addresses, data.address]);
      setSelectedAddressId(data.address.id);
      setShowAddressForm(false);
      toast.success('Address added');
    } catch {
      toast.error('Failed to add address');
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      toast.error('Please select a delivery address');
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            quantity: i.quantity,
          })),
          addressId: selectedAddressId,
          couponCode: couponCode.trim() || undefined,
          paymentMethod,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create order');

      if (paymentMethod === 'COD') {
        clearCart();
        router.push(`/order-success?orderNumber=${data.orderNumber}`);
        return;
      }

      // Razorpay flow
      const options = {
        key: data.keyId,
        amount: data.amount * 100,
        currency: data.currency,
        name: 'Dharsan Dresses',
        description: `Order #${data.orderNumber}`,
        image: '/images/logo.png',
        order_id: data.razorpayOrderId,
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId: data.orderId,
              }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.error);
            clearCart();
            router.push(`/order-success?orderNumber=${verifyData.orderNumber}`);
          } catch (err: any) {
            toast.error('Payment verification failed: ' + err.message);
            setProcessing(false);
          }
        },
        prefill: {
          name: session?.user?.name || '',
          email: session?.user?.email || '',
          contact: addresses.find((a) => a.id === selectedAddressId)?.phone || '',
        },
        theme: { color: '#C8991E' },
        modal: {
          ondismiss: () => setProcessing(false),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
      rzp.on('payment.failed', () => {
        toast.error('Payment failed. Please try again.');
        setProcessing(false);
      });
    } catch (err: any) {
      toast.error(err.message);
      setProcessing(false);
    }
  };

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-gold-500" size={32} /></div>;
  }

  return (
    <div className="bg-cream-50 min-h-screen py-12">
      <div className="container-custom">
        <h1 className="font-display text-4xl font-semibold text-navy-900 mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Address */}
            <section className="bg-white p-6 rounded-lg shadow-card">
              <h2 className="font-display text-xl font-semibold text-navy-900 mb-4 flex items-center gap-2">
                <MapPin size={20} className="text-gold-500" /> Delivery Address
              </h2>

              {addresses.length > 0 && !showAddressForm && (
                <div className="space-y-3">
                  {addresses.map((addr) => (
                    <label
                      key={addr.id}
                      className={`block border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        selectedAddressId === addr.id
                          ? 'border-gold-500 bg-cream-50'
                          : 'border-cream-200 hover:border-cream-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        checked={selectedAddressId === addr.id}
                        onChange={() => setSelectedAddressId(addr.id)}
                        className="sr-only"
                      />
                      <div className="flex justify-between">
                        <div className="text-sm font-body">
                          <p className="font-semibold text-navy-900">{addr.fullName}</p>
                          <p className="text-gray-600 mt-1">
                            {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                          </p>
                          <p className="text-gray-600">
                            {addr.city}, {addr.state} - {addr.pincode}
                          </p>
                          <p className="text-gray-600 flex items-center gap-1 mt-1">
                            <Phone size={11} /> {addr.phone}
                          </p>
                        </div>
                        {addr.isDefault && (
                          <span className="text-xs font-semibold text-gold-600 bg-gold-50 px-2 py-0.5 rounded h-fit">
                            Default
                          </span>
                        )}
                      </div>
                    </label>
                  ))}

                  <button
                    onClick={() => setShowAddressForm(true)}
                    className="w-full border-2 border-dashed border-cream-300 hover:border-gold-500 rounded-lg p-4 text-sm font-body text-navy-700 hover:text-gold-600 flex items-center justify-center gap-2 transition-colors"
                  >
                    <Plus size={16} /> Add new address
                  </button>
                </div>
              )}

              {(addresses.length === 0 || showAddressForm) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input className="input-field md:col-span-2" placeholder="Full Name *" value={newAddress.fullName} onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })} />
                  <input className="input-field" placeholder="Phone (10 digits) *" value={newAddress.phone} onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })} />
                  <input className="input-field" placeholder="Pincode (6 digits) *" value={newAddress.pincode} onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })} />
                  <input className="input-field md:col-span-2" placeholder="Address Line 1 *" value={newAddress.addressLine1} onChange={(e) => setNewAddress({ ...newAddress, addressLine1: e.target.value })} />
                  <input className="input-field md:col-span-2" placeholder="Address Line 2 (optional)" value={newAddress.addressLine2} onChange={(e) => setNewAddress({ ...newAddress, addressLine2: e.target.value })} />
                  <input className="input-field" placeholder="City *" value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} />
                  <input className="input-field" placeholder="State *" value={newAddress.state} onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })} />
                  <div className="md:col-span-2 flex gap-2">
                    <button onClick={handleAddAddress} className="btn-primary flex-1">Save Address</button>
                    {addresses.length > 0 && (
                      <button onClick={() => setShowAddressForm(false)} className="btn-secondary">Cancel</button>
                    )}
                  </div>
                </div>
              )}
            </section>

            {/* Payment Method */}
            <section className="bg-white p-6 rounded-lg shadow-card">
              <h2 className="font-display text-xl font-semibold text-navy-900 mb-4 flex items-center gap-2">
                <CreditCard size={20} className="text-gold-500" /> Payment Method
              </h2>
              <div className="space-y-2">
                {[
                  { value: 'RAZORPAY', title: 'Card / Net Banking / UPI', desc: 'Pay securely via Razorpay', recommended: true },
                  { value: 'UPI', title: 'UPI Direct (PhonePe / Gpay)', desc: 'Pay using your UPI ID' },
                  { value: 'COD', title: 'Cash on Delivery', desc: 'Pay when you receive the order' },
                ].map((pm) => (
                  <label
                    key={pm.value}
                    className={`block border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      paymentMethod === pm.value
                        ? 'border-gold-500 bg-cream-50'
                        : 'border-cream-200 hover:border-cream-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={pm.value}
                      checked={paymentMethod === pm.value}
                      onChange={() => setPaymentMethod(pm.value as any)}
                      className="sr-only"
                    />
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-body font-semibold text-navy-900 flex items-center gap-2">
                          {pm.title}
                          {pm.recommended && <span className="text-xs text-gold-600 font-semibold">RECOMMENDED</span>}
                        </p>
                        <p className="font-body text-xs text-gray-500 mt-0.5">{pm.desc}</p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </section>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow-card sticky top-24">
              <h2 className="font-display text-xl font-semibold text-navy-900 mb-4">Order Summary</h2>

              <div className="space-y-3 mb-5 max-h-80 overflow-y-auto">
                {items.map((item) => (
                  <div key={`${item.productId}-${item.variantId}`} className="flex gap-3">
                    <div className="relative w-14 h-16 flex-shrink-0 bg-cream-100 rounded overflow-hidden">
                      <Image src={item.image} alt={item.name} fill className="object-cover" />
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-navy-900 text-gold-400 text-xs rounded-full flex items-center justify-center font-body">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-xs font-medium text-navy-900 line-clamp-2">{item.name}</p>
                      {item.size && <p className="font-body text-xs text-gray-500 mt-0.5">Size: {item.size}</p>}
                      <p className="font-body text-sm font-semibold text-gold-600 mt-1">
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon */}
              <div className="flex gap-2 mb-5">
                <input
                  type="text"
                  placeholder="Coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="input-field flex-1"
                />
                <button className="btn-secondary text-sm">Apply</button>
              </div>

              {/* Totals */}
              <div className="space-y-2 pb-3 border-b border-cream-200">
                <div className="flex justify-between text-sm font-body">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-navy-900">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm font-body">
                  <span className="text-gray-600">Shipping</span>
                  <span className={shipping === 0 ? 'text-green-600 font-semibold' : 'text-navy-900'}>
                    {shipping === 0 ? 'FREE' : `₹${shipping}`}
                  </span>
                </div>
              </div>

              <div className="flex justify-between pt-3 pb-5">
                <span className="font-display text-lg font-semibold text-navy-900">Total</span>
                <span className="font-display text-2xl font-bold text-gold-600">
                  ₹{total.toLocaleString('en-IN')}
                </span>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={processing || !selectedAddressId}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processing ? (
                  <><Loader2 size={16} className="animate-spin" /> Processing...</>
                ) : (
                  `Place Order • ₹${total.toLocaleString('en-IN')}`
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-xs font-body text-gray-500 mt-3">
                <ShieldCheck size={12} /> Secure & encrypted payment
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
