import PageStub from '@/components/ui/PageStub';

export const metadata = { title: 'Returns & Refunds – Dharsan Dresses' };

export default function ReturnsPage() {
  return (
    <PageStub eyebrow="Customer Care" title="Returns & Refunds">
      <div className="space-y-4 font-body text-gray-700 leading-relaxed">
        <h2 className="font-display text-xl text-navy-900">7-day return window</h2>
        <p>You can return any unused item in its original packaging within 7 days of delivery.</p>
        <h2 className="font-display text-xl text-navy-900 mt-6">Not eligible for return</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Custom-stitched garments</li>
          <li>Fabric cut to your specified length</li>
          <li>Inners, innerwear and intimate apparel</li>
          <li>Items returned with signs of wear or damage</li>
        </ul>
        <h2 className="font-display text-xl text-navy-900 mt-6">Refund timeline</h2>
        <p>Refunds are processed within 5–7 business days to the original payment method after we receive and inspect the returned item.</p>
        <h2 className="font-display text-xl text-navy-900 mt-6">How to initiate</h2>
        <p>Email info@dharsandresses.com with your order number and reason. Our team will share the return shipping label.</p>
      </div>
    </PageStub>
  );
}
