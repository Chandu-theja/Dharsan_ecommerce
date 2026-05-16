import PageStub from '@/components/ui/PageStub';
import { MapPin, Phone, Mail, Instagram } from 'lucide-react';

export const metadata = { title: 'Contact Us – Dharsan Dresses' };

export default function ContactPage() {
  return (
    <PageStub eyebrow="Get In Touch" title="Contact Us" description="We'd love to hear from you. Visit our store, give us a call, or send a message.">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        <div className="p-5 bg-white border border-cream-200 rounded">
          <MapPin className="text-gold-600 mb-2" size={20} />
          <p className="font-body font-semibold text-navy-900 mb-1">Store Address</p>
          <p className="font-body text-sm text-gray-700">
            Yadava St, Varadaraja Nagar,<br />Tirupati, Andhra Pradesh 517501
          </p>
        </div>
        <div className="p-5 bg-white border border-cream-200 rounded">
          <Phone className="text-gold-600 mb-2" size={20} />
          <p className="font-body font-semibold text-navy-900 mb-1">Phone</p>
          <a href="tel:+919440250863" className="font-body text-sm text-gray-700 hover:text-gold-600">
            +91 94402 50863
          </a>
        </div>
        <div className="p-5 bg-white border border-cream-200 rounded">
          <Mail className="text-gold-600 mb-2" size={20} />
          <p className="font-body font-semibold text-navy-900 mb-1">Email</p>
          <a href="mailto:Dharsangroups@gmail.com" className="font-body text-sm text-gray-700 hover:text-gold-600">
            Dharsangroups@gmail.com
          </a>
        </div>
        <div className="p-5 bg-white border border-cream-200 rounded">
          <Instagram className="text-gold-600 mb-2" size={20} />
          <p className="font-body font-semibold text-navy-900 mb-1">Instagram</p>
          <a href="https://www.instagram.com/dharsandresses/" target="_blank" rel="noopener noreferrer" className="font-body text-sm text-gray-700 hover:text-gold-600">
            @dharsandresses
          </a>
        </div>
      </div>
    </PageStub>
  );
}
