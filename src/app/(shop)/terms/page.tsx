import PageStub from '@/components/ui/PageStub';

export const metadata = { title: 'Terms of Service – Dharsan Dresses' };

export default function TermsPage() {
  return (
    <PageStub eyebrow="Legal" title="Terms of Service">
      <div className="space-y-4 font-body text-gray-700 leading-relaxed">
        <p>
          By placing an order with Dharsan Dresses, you agree to the following terms. Please read them carefully.
        </p>
        <h2 className="font-display text-xl text-navy-900 mt-6">Orders</h2>
        <p>All orders are subject to availability and confirmation of the order price. We reserve the right to refuse any order.</p>
        <h2 className="font-display text-xl text-navy-900 mt-6">Pricing</h2>
        <p>All prices are in Indian Rupees (₹) and inclusive of applicable GST. Shipping is calculated at checkout.</p>
        <h2 className="font-display text-xl text-navy-900 mt-6">Returns</h2>
        <p>See our Returns & Refunds policy. Custom-stitched items are not eligible for return.</p>
        <h2 className="font-display text-xl text-navy-900 mt-6">Governing law</h2>
        <p>These terms are governed by the laws of India. Any disputes will be subject to the jurisdiction of Tirupati, Andhra Pradesh.</p>
      </div>
    </PageStub>
  );
}
