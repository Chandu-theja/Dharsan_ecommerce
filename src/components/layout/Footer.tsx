'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  Instagram, Youtube, Facebook, Phone, Mail, MapPin,
  ShieldCheck, Truck, RefreshCw, CreditCard,
} from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-navy-900 text-cream-100 mt-20">
      {/* Trust Badges Strip */}
      <div className="border-b border-navy-700">
        <div className="container-custom py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: Truck, title: 'Free Shipping', sub: 'Orders above ₹1,000' },
            { icon: RefreshCw, title: 'Easy Returns', sub: '7-day return policy' },
            { icon: ShieldCheck, title: 'Secure Payment', sub: '100% safe checkout' },
            { icon: CreditCard, title: 'COD Available', sub: 'Pay on delivery' },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gold-500/10 border border-gold-500/30 flex items-center justify-center flex-shrink-0">
                <f.icon size={20} className="text-gold-400" />
              </div>
              <div>
                <h4 className="font-display text-base font-semibold text-gold-400">{f.title}</h4>
                <p className="font-body text-xs text-navy-300">{f.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="/images/logo.png"
                alt="Dharsan Dresses"
                width={56}
                height={56}
                className="rounded-full"
              />
              <div>
                <h3 className="font-display text-2xl font-semibold text-gold-400">
                  Dharsan Dresses
                </h3>
                <p className="font-body text-xs text-navy-300 tracking-widest uppercase">
                  Tirupati • Est. for Quality
                </p>
              </div>
            </div>
            <p className="font-body text-sm text-navy-200 leading-relaxed mb-5 max-w-md">
              Tirupati's trusted destination for premium readymade clothes, plain wear and 
              expert stitching. From sarees and shirts to dhotis and dresses — for every member 
              of your family, in every size from S to 6XL.
            </p>

            <div className="space-y-2.5 mb-5">
              <a
                href="https://www.google.com/maps/search/?api=1&query=DHARSAN+DRESSES+Yadava+St,+Varadaraja+Nagar,+Tirupati,+Andhra+Pradesh+517501"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 text-sm text-navy-200 hover:text-gold-400 transition-colors group"
              >
                <MapPin size={16} className="text-gold-500 flex-shrink-0 mt-0.5" />
                <span className="font-body group-hover:underline">
                  Yadava St, Varadaraja Nagar,<br />Tirupati, Andhra Pradesh 517501
                </span>
              </a>
              <a href="tel:+91XXXXXXXXXX" className="flex items-center gap-2 text-sm text-navy-200 hover:text-gold-400 font-body">
                <Phone size={16} className="text-gold-500" />
                +91 XXXXXXXXXX
              </a>
              <a href="mailto:info@dharsandresses.com" className="flex items-center gap-2 text-sm text-navy-200 hover:text-gold-400 font-body">
                <Mail size={16} className="text-gold-500" />
                info@dharsandresses.com
              </a>
            </div>

            {/* Social */}
            <div className="flex items-center gap-3">
              <a
                href="https://www.instagram.com/dharsandresses/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-navy-700 hover:bg-gold-500 hover:text-navy-900 text-gold-400 flex items-center justify-center transition-all duration-300 hover:scale-110"
                aria-label="Instagram"
              >
                <Instagram size={17} />
              </a>
              <a
                href="https://www.youtube.com/@dharsandresses"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-navy-700 hover:bg-gold-500 hover:text-navy-900 text-gold-400 flex items-center justify-center transition-all duration-300 hover:scale-110"
                aria-label="YouTube"
              >
                <Youtube size={17} />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-navy-700 hover:bg-gold-500 hover:text-navy-900 text-gold-400 flex items-center justify-center transition-all duration-300 hover:scale-110"
                aria-label="Facebook"
              >
                <Facebook size={17} />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-display text-lg font-semibold text-gold-400 mb-4">Shop</h4>
            <ul className="space-y-2.5 font-body text-sm">
              <li><Link href="/category/sarees" className="text-navy-200 hover:text-gold-400 transition-colors">Sarees</Link></li>
              <li><Link href="/category/salwar-suits-stitched" className="text-navy-200 hover:text-gold-400 transition-colors">Salwar Suits</Link></li>
              <li><Link href="/category/formal-shirts" className="text-navy-200 hover:text-gold-400 transition-colors">Men's Shirts</Link></li>
              <li><Link href="/category/dhotis-panchas" className="text-navy-200 hover:text-gold-400 transition-colors">Dhotis & Panchas</Link></li>
              <li><Link href="/category/fabric-by-meter" className="text-navy-200 hover:text-gold-400 transition-colors">Fabric by the Meter</Link></li>
              <li><Link href="/products?filter=new" className="text-navy-200 hover:text-gold-400 transition-colors">New Arrivals</Link></li>
              <li><Link href="/products?filter=sale" className="text-red-400 hover:text-red-300 transition-colors font-medium">Sale</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-display text-lg font-semibold text-gold-400 mb-4">Services</h4>
            <ul className="space-y-2.5 font-body text-sm">
              <li><Link href="/stitching" className="text-navy-200 hover:text-gold-400 transition-colors">Custom Stitching</Link></li>
              <li><Link href="/private-viewing" className="text-navy-200 hover:text-gold-400 transition-colors">Private Viewing</Link></li>
              <li><Link href="/size-guide" className="text-navy-200 hover:text-gold-400 transition-colors">Size Guide</Link></li>
              <li><Link href="/track-order" className="text-navy-200 hover:text-gold-400 transition-colors">Track Order</Link></li>
              <li><Link href="/contact" className="text-navy-200 hover:text-gold-400 transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="font-display text-lg font-semibold text-gold-400 mb-4">Help</h4>
            <ul className="space-y-2.5 font-body text-sm">
              <li><Link href="/about" className="text-navy-200 hover:text-gold-400 transition-colors">About Us</Link></li>
              <li><Link href="/shipping-policy" className="text-navy-200 hover:text-gold-400 transition-colors">Shipping Policy</Link></li>
              <li><Link href="/returns" className="text-navy-200 hover:text-gold-400 transition-colors">Returns & Refunds</Link></li>
              <li><Link href="/privacy" className="text-navy-200 hover:text-gold-400 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-navy-200 hover:text-gold-400 transition-colors">Terms of Service</Link></li>
              <li><Link href="/faq" className="text-navy-200 hover:text-gold-400 transition-colors">FAQ</Link></li>
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div className="mt-12 pt-8 border-t border-navy-700">
          <div className="max-w-2xl mx-auto text-center">
            <h4 className="font-display text-2xl font-semibold text-gold-400 mb-2">
              Stay in the loop
            </h4>
            <p className="font-body text-sm text-navy-200 mb-5">
              Get exclusive offers, new arrivals & festive collection alerts.
            </p>
            <form className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                required
                className="flex-1 bg-navy-800 border border-navy-700 rounded px-4 py-3 text-cream-100 placeholder-navy-400 focus:outline-none focus:border-gold-500 font-body text-sm"
              />
              <button
                type="submit"
                className="bg-gold-500 hover:bg-gold-600 text-navy-900 font-semibold px-6 py-3 rounded font-body transition-all duration-200 shadow-gold"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-navy-700 py-5">
        <div className="container-custom flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="font-body text-xs text-navy-300">
            © {new Date().getFullYear()} Dharsan Dresses. All rights reserved.
          </p>
          <p className="font-body text-xs text-navy-400 italic">
            Crafted with care • Best Clothes • Best Stitch
          </p>
        </div>
      </div>
    </footer>
  );
}
