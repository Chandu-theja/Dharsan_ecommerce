'use client';

import { useState } from 'react';
import { Scissors, Award, Users, Clock, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StitchingPage() {
  const [form, setForm] = useState({
    name: '', phone: '', email: '',
    description: '', budget: 'medium',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/stitching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setSubmitted(true);
      toast.success('Request submitted! We\'ll contact you within 24 hours.');
    } catch {
      toast.error('Failed to submit. Please try again or call us.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center px-4">
        <div className="max-w-md text-center bg-white p-8 rounded-2xl shadow-card-hover">
          <div className="text-6xl mb-4">✂️</div>
          <h1 className="font-display text-3xl font-semibold text-navy-900 mb-3">
            Request Received!
          </h1>
          <p className="font-body text-base text-gray-600 mb-6">
            Thank you! Our master tailor will contact you within 24 hours to schedule a measurement appointment.
          </p>
          <a href="/" className="btn-primary inline-block">Return Home</a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-cream-50 min-h-screen">
      {/* Hero */}
      <section className="bg-navy-gradient py-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
             style={{ backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, #C8991E 35px, #C8991E 36px)` }} />
        <div className="container-custom relative z-10 text-center">
          <Scissors size={32} className="text-gold-400 mx-auto mb-4" />
          <p className="font-body text-xs text-gold-400 tracking-[0.3em] uppercase mb-3">Master Craftsmanship</p>
          <h1 className="font-display text-5xl md:text-6xl font-light text-white mb-4">
            Custom <span className="text-gold-gradient italic font-medium">Stitching</span>
          </h1>
          <p className="font-body text-base text-navy-200 max-w-2xl mx-auto">
            Tirupati's most trusted tailoring service — where every stitch tells a story of craftsmanship handed down through generations.
          </p>
        </div>
      </section>

      <div className="container-custom py-16">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left: Info */}
          <div>
            <h2 className="font-display text-3xl font-semibold text-navy-900 mb-4">
              Why Choose Our Tailors?
            </h2>
            <p className="font-body text-base text-gray-700 leading-relaxed mb-8">
              For years, families across Tirupati have trusted us for their most important garments — 
              from wedding silks and business suits to everyday wear. Our master tailors combine 
              traditional techniques with modern precision.
            </p>

            <div className="space-y-5">
              {[
                { icon: Award, title: 'Expert Craftsmanship', desc: 'Master tailors with decades of experience in formal and traditional wear.' },
                { icon: Users, title: 'Personalized Fitting', desc: 'Every measurement taken to perfection. Trial sessions to ensure ideal fit.' },
                { icon: Clock, title: 'On-Time Delivery', desc: 'Reliable timelines — we honor every commitment, especially for events.' },
              ].map((f, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-11 h-11 rounded-full bg-gold-100 flex items-center justify-center flex-shrink-0">
                    <f.icon size={18} className="text-gold-600" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-navy-900 mb-1">{f.title}</h3>
                    <p className="font-body text-sm text-gray-600">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Form */}
          <div className="bg-white p-8 rounded-2xl shadow-card-hover">
            <h2 className="font-display text-2xl font-semibold text-navy-900 mb-2">
              Request a Tailor Appointment
            </h2>
            <p className="font-body text-sm text-gray-600 mb-6">
              Fill in the form and we'll call you back to discuss your requirements.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input className="input-field" placeholder="Your Name *" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input className="input-field" type="tel" pattern="[6-9][0-9]{9}" placeholder="Phone Number *" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <input className="input-field" type="email" placeholder="Email (optional)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />

              <textarea
                className="input-field min-h-[120px] resize-y"
                placeholder="Describe what you want stitched — type of garment, fabric, style, occasion, deadline, etc. *"
                required
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />

              <div>
                <label className="block font-body text-xs font-semibold text-navy-900 uppercase tracking-wider mb-2">
                  Budget Range
                </label>
                <select className="input-field" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })}>
                  <option value="low">Below ₹2,000</option>
                  <option value="medium">₹2,000 – ₹5,000</option>
                  <option value="high">₹5,000 – ₹15,000</option>
                  <option value="premium">Above ₹15,000</option>
                  <option value="discuss">Let's discuss</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                Request Appointment
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
