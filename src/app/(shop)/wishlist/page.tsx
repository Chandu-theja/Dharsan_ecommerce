import PageStub from '@/components/ui/PageStub';
import { Heart } from 'lucide-react';

export const metadata = { title: 'Wishlist – Dharsan Dresses' };

export default function WishlistPage() {
  return (
    <PageStub eyebrow="Saved For You" title="My Wishlist">
      <div className="text-center py-10">
        <Heart className="mx-auto text-gold-400 mb-4" size={48} />
        <p className="font-body text-gray-700 mb-2">Your wishlist is empty.</p>
        <p className="font-body text-sm text-gray-500">
          Tap the heart on any product to save it here for later.
        </p>
      </div>
    </PageStub>
  );
}
