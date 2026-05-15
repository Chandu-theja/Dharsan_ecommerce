import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, DM_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';
import { Toaster } from 'react-hot-toast';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://dharsandresses.com'),
  title: {
    template: '%s | Dharsan Dresses',
    default: 'Dharsan Dresses – Best Clothes & Stitching in Tirupati',
  },
  description:
    'Dharsan Dresses – Premium readymade and plain clothes for men, women & kids. Expert stitching, ethnic wear, sarees, shirts, pants, suits and more. Located in Tirupati, Andhra Pradesh.',
  keywords: [
    'Dharsan Dresses', 'Tirupati clothes', 'sarees Tirupati',
    'men shirts Tirupati', 'stitching Tirupati', 'ethnic wear',
    'readymade clothes', 'plain shirts', 'plain pants', 'dhotis',
    'salwar suits', 'lehengas', 'kurtas', 'dharsandresses',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://dharsandresses.com',
    siteName: 'Dharsan Dresses',
    title: 'Dharsan Dresses – Best Clothes & Stitching in Tirupati',
    description: 'Premium readymade and plain clothes for men, women & kids. Expert stitching in Tirupati.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Dharsan Dresses' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dharsan Dresses',
    description: 'Premium clothes & expert stitching in Tirupati.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0A1128',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${dmSans.variable}`}>
      <body className="font-body bg-cream-50 text-navy-900">
        <Providers>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#0A1128',
                color: '#FAF7F0',
                fontFamily: 'var(--font-dm-sans)',
                borderRadius: '8px',
                border: '1px solid rgba(200,153,30,0.3)',
              },
              success: {
                iconTheme: { primary: '#C8991E', secondary: '#FAF7F0' },
              },
              error: {
                style: { background: '#991B1B', color: '#FAF7F0' },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
