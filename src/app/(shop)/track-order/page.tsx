import PageStub from '@/components/ui/PageStub';
import { Package } from 'lucide-react';

export const metadata = { title: 'Track Order – Dharsan Dresses' };

export default function TrackOrderPage() {
  return (
    <PageStub eyebrow="Order Status" title="Track Your Order" description="Enter your order ID and we'll show you where your package is.">
      <form className="bg-white border border-cream-200 rounded p-6 max-w-md mx-auto">
        <label className="block font-body text-sm text-navy-900 mb-2">Order ID</label>
        <input
          type="text"
          placeholder="e.g. DHR-2026-0123"
          className="w-full px-4 py-3 border border-navy-200 rounded font-body text-sm focus:outline-none focus:border-navy-900"
        />
        <button
          type="submit"
          disabled
          className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-navy-900 text-gold-400 rounded font-body font-medium opacity-60 cursor-not-allowed"
        >
          <Package size={18} />
          Track Order
        </button>
        <p className="mt-4 font-body text-xs text-gray-500 text-center">
          Live tracking via Delhivery is coming soon. Meanwhile, check the tracking link sent to your email or WhatsApp.
        </p>
      </form>
    </PageStub>
  );
}
