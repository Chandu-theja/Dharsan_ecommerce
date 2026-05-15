'use client';

import { Quote, Star } from 'lucide-react';

const TESTIMONIALS = [
  {
    name: 'Priya Reddy',
    location: 'Tirupati',
    rating: 5,
    text: 'Best place for sarees in Tirupati! Bought a Pattu saree for my daughter\'s wedding — quality and stitching were perfect. Highly recommend.',
  },
  {
    name: 'Ramesh Kumar',
    location: 'Renigunta',
    rating: 5,
    text: 'I get all my formal shirts and pants stitched here. The fitting is always excellent and the fabric quality is top-notch. Trusted them for years.',
  },
  {
    name: 'Lakshmi Devi',
    location: 'Chittoor',
    rating: 5,
    text: 'Bought fabric by the meter for my churidars. The variety they have is amazing and prices are very reasonable. Their stitching is the best!',
  },
  {
    name: 'Suresh Babu',
    location: 'Tirupati',
    rating: 5,
    text: 'Got my son\'s sherwani made here for his wedding. The craftsmanship was beautiful and they delivered exactly on time. Will come again!',
  },
];

export default function Testimonials() {
  return (
    <section className="py-20 bg-white">
      <div className="container-custom">
        <div className="text-center mb-12">
          <p className="font-body text-xs text-gold-600 tracking-[0.3em] uppercase mb-3">
            Customer Love
          </p>
          <h2 className="section-heading mb-3">What Our Customers Say</h2>
          <div className="gold-divider" />
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={i}
              className="relative bg-cream-50 border border-cream-200 rounded-lg p-6 hover:shadow-card-hover transition-shadow duration-300"
            >
              <Quote
                size={36}
                className="absolute -top-3 -left-1 text-gold-500/20"
                fill="currentColor"
              />
              
              {/* Rating */}
              <div className="flex gap-0.5 mb-3 relative">
                {[...Array(5)].map((_, idx) => (
                  <Star
                    key={idx}
                    size={14}
                    className={idx < t.rating ? 'text-gold-500' : 'text-gray-300'}
                    fill="currentColor"
                  />
                ))}
              </div>

              <p className="font-body text-sm text-gray-700 mb-4 leading-relaxed italic relative">
                "{t.text}"
              </p>

              <div className="pt-4 border-t border-cream-200">
                <p className="font-display text-base font-semibold text-navy-900">{t.name}</p>
                <p className="font-body text-xs text-gold-600 tracking-wider">{t.location}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
