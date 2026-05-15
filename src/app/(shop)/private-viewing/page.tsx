import PageStub from '@/components/ui/PageStub';
import { Calendar, Phone } from 'lucide-react';

export const metadata = { title: 'Private Viewing – Dharsan Dresses' };

export default function PrivateViewingPage() {
  return (
    <PageStub
      eyebrow="By Appointment"
      title="Private Viewing"
      description="Reserve our store for a dedicated, unhurried browsing experience. Perfect for wedding shopping or trousseau."
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="p-5 bg-white border border-cream-200 rounded">
          <Calendar className="text-gold-600 mb-2" size={20} />
          <p className="font-body font-semibold text-navy-900 mb-1">Book a slot</p>
          <p className="font-body text-sm text-gray-700">Available daily, 10am – 8pm. Slots are 60 minutes.</p>
        </div>
        <div className="p-5 bg-white border border-cream-200 rounded">
          <Phone className="text-gold-600 mb-2" size={20} />
          <p className="font-body font-semibold text-navy-900 mb-1">To reserve</p>
          <p className="font-body text-sm text-gray-700">Call us at +91 XXXXX XXXXX or WhatsApp to confirm.</p>
        </div>
      </div>
      <p className="font-body text-sm text-gray-600 italic">
        Online booking with Google Calendar integration is coming soon.
      </p>
    </PageStub>
  );
}
