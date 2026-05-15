import PageStub from '@/components/ui/PageStub';

export const metadata = { title: 'Privacy Policy – Dharsan Dresses' };

export default function PrivacyPage() {
  return (
    <PageStub eyebrow="Legal" title="Privacy Policy">
      <div className="space-y-4 font-body text-gray-700 leading-relaxed">
        <p>
          At Dharsan Dresses, we respect your privacy. This policy explains how we collect, use and protect
          your personal information when you shop with us.
        </p>
        <h2 className="font-display text-xl text-navy-900 mt-6">What we collect</h2>
        <p>Name, email, phone number, shipping address, and order history. Payment details are processed securely by Razorpay and never stored on our servers.</p>
        <h2 className="font-display text-xl text-navy-900 mt-6">How we use it</h2>
        <p>To fulfil orders, send shipping updates, respond to your queries, and (with consent) share offers.</p>
        <h2 className="font-display text-xl text-navy-900 mt-6">Your rights</h2>
        <p>You can request access, correction or deletion of your data at any time by emailing info@dharsandresses.com.</p>
      </div>
    </PageStub>
  );
}
