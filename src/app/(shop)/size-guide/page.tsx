import PageStub from '@/components/ui/PageStub';

export const metadata = { title: 'Size Guide – Dharsan Dresses' };

const WOMEN_SIZES = [
  { size: 'S', bust: '32"', waist: '26"', hip: '36"' },
  { size: 'M', bust: '34"', waist: '28"', hip: '38"' },
  { size: 'L', bust: '36"', waist: '30"', hip: '40"' },
  { size: 'XL', bust: '38"', waist: '32"', hip: '42"' },
  { size: '2XL', bust: '40"', waist: '34"', hip: '44"' },
  { size: '3XL', bust: '42"', waist: '36"', hip: '46"' },
];

const MEN_SIZES = [
  { size: 'S', chest: '36"', waist: '30"' },
  { size: 'M', chest: '38"', waist: '32"' },
  { size: 'L', chest: '40"', waist: '34"' },
  { size: 'XL', chest: '42"', waist: '36"' },
  { size: '2XL', chest: '44"', waist: '38"' },
];

export default function SizeGuidePage() {
  return (
    <PageStub eyebrow="Fit Help" title="Size Guide" description="Find your perfect fit. All measurements are in inches.">
      <h2 className="font-display text-xl text-navy-900 mb-3">Women</h2>
      <div className="overflow-x-auto mb-8">
        <table className="w-full text-sm font-body border border-cream-200">
          <thead className="bg-navy-900 text-gold-400">
            <tr>
              <th className="px-4 py-2 text-left">Size</th>
              <th className="px-4 py-2 text-left">Bust</th>
              <th className="px-4 py-2 text-left">Waist</th>
              <th className="px-4 py-2 text-left">Hip</th>
            </tr>
          </thead>
          <tbody>
            {WOMEN_SIZES.map((r) => (
              <tr key={r.size} className="border-t border-cream-200 odd:bg-white even:bg-cream-50">
                <td className="px-4 py-2 font-semibold text-navy-900">{r.size}</td>
                <td className="px-4 py-2 text-gray-700">{r.bust}</td>
                <td className="px-4 py-2 text-gray-700">{r.waist}</td>
                <td className="px-4 py-2 text-gray-700">{r.hip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="font-display text-xl text-navy-900 mb-3">Men</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm font-body border border-cream-200">
          <thead className="bg-navy-900 text-gold-400">
            <tr>
              <th className="px-4 py-2 text-left">Size</th>
              <th className="px-4 py-2 text-left">Chest</th>
              <th className="px-4 py-2 text-left">Waist</th>
            </tr>
          </thead>
          <tbody>
            {MEN_SIZES.map((r) => (
              <tr key={r.size} className="border-t border-cream-200 odd:bg-white even:bg-cream-50">
                <td className="px-4 py-2 font-semibold text-navy-900">{r.size}</td>
                <td className="px-4 py-2 text-gray-700">{r.chest}</td>
                <td className="px-4 py-2 text-gray-700">{r.waist}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageStub>
  );
}
