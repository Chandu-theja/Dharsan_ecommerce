import PageStub from '@/components/ui/PageStub';

export const metadata = { title: 'About Us – Dharsan Dresses' };

export default function AboutPage() {
  return (
    <PageStub
      eyebrow="Our Story"
      title="About Dharsan Dresses"
      description="Tirupati's premier clothing house — known for premium fabrics, expert stitching, and timeless designs across men's, women's, and kids' wear. Since our founding, we've been the trusted destination for sarees, suits, dhotis, and custom tailoring."
    >
      <p className="font-body text-gray-700 leading-relaxed mb-4">
        Visit us at our flagship store on Yadava Street, Varadaraja Nagar, Tirupati for personalized service,
        private viewings, and our signature stitching craftsmanship.
      </p>
      <p className="font-body text-gold-700 italic">Best Clothes. Best Stitch.</p>
    </PageStub>
  );
}
