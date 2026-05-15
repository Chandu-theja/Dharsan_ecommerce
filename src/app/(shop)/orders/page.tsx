import PageStub from '@/components/ui/PageStub';
import { Package } from 'lucide-react';

export const metadata = { title: 'My Orders – Dharsan Dresses' };

export default function OrdersPage() {
  return (
    <PageStub eyebrow="Order History" title="My Orders">
      <div className="text-center py-10">
        <Package className="mx-auto text-gold-400 mb-4" size={48} />
        <p className="font-body text-gray-700 mb-2">You haven't placed any orders yet.</p>
        <p className="font-body text-sm text-gray-500">
          Once you order, your purchase history will appear here.
        </p>
      </div>
    </PageStub>
  );
}
