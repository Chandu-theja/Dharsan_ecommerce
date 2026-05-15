import PageStub from '@/components/ui/PageStub';

export const metadata = { title: 'Shipping Policy – Dharsan Dresses' };

export default function ShippingPolicyPage() {
  return (
    <PageStub eyebrow="Delivery" title="Shipping Policy">
      <div className="space-y-4 font-body text-gray-700 leading-relaxed">
        <h2 className="font-display text-xl text-navy-900">Free shipping</h2>
        <p>Orders above ₹1,000 ship free across India. Below that, a flat ₹80 shipping fee applies.</p>
        <h2 className="font-display text-xl text-navy-900 mt-6">Delivery time</h2>
        <p>3–7 business days depending on your pin code. Tirupati and surrounding areas usually deliver in 1–2 days.</p>
        <h2 className="font-display text-xl text-navy-900 mt-6">Tracking</h2>
        <p>You'll get a tracking link by email and WhatsApp as soon as your order is dispatched via Delhivery.</p>
        <h2 className="font-display text-xl text-navy-900 mt-6">Cash on Delivery</h2>
        <p>COD is available for orders up to ₹5,000 across most pin codes.</p>
      </div>
    </PageStub>
  );
}
