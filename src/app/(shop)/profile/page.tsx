import PageStub from '@/components/ui/PageStub';
import { User } from 'lucide-react';

export const metadata = { title: 'My Profile – Dharsan Dresses' };

export default function ProfilePage() {
  return (
    <PageStub eyebrow="Your Account" title="My Profile">
      <div className="text-center py-10">
        <User className="mx-auto text-gold-400 mb-4" size={48} />
        <p className="font-body text-gray-700 mb-2">Account management is coming soon.</p>
        <p className="font-body text-sm text-gray-500">
          You'll be able to update your name, email, phone, and saved addresses here.
        </p>
      </div>
    </PageStub>
  );
}
