import PageStub from '@/components/ui/PageStub';

export const metadata = { title: 'FAQ – Dharsan Dresses' };

const FAQS = [
  { q: 'Do you ship across India?', a: 'Yes, we ship pan-India via Delhivery. Orders above ₹1,000 ship free.' },
  { q: 'How long does delivery take?', a: 'Typically 3–7 business days depending on your location.' },
  { q: 'Can I return or exchange a product?', a: 'Yes, we accept returns within 7 days of delivery for unused items in original packaging.' },
  { q: 'Do you offer custom stitching?', a: 'Yes! Book a stitching appointment from our Custom Stitching page or visit the store.' },
  { q: 'What payment methods do you accept?', a: 'We accept all major cards, UPI, net banking and Cash on Delivery.' },
  { q: 'Is the saree exactly as shown in the photo?', a: 'Yes — we use real product photos. Minor variations in colour due to screen calibration are possible.' },
];

export default function FAQPage() {
  return (
    <PageStub eyebrow="Help Centre" title="Frequently Asked Questions">
      <div className="space-y-4">
        {FAQS.map((f, i) => (
          <details key={i} className="group p-5 bg-white border border-cream-200 rounded">
            <summary className="font-body font-semibold text-navy-900 cursor-pointer">{f.q}</summary>
            <p className="mt-3 font-body text-sm text-gray-700 leading-relaxed">{f.a}</p>
          </details>
        ))}
      </div>
    </PageStub>
  );
}
