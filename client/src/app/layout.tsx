import type { Metadata } from 'next';
import { Manrope, Inter } from 'next/font/google';
import { Providers } from '@/components/layout/Providers';

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '700', '800'],
  variable: '--font-manrope',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Sanayi Marketi',
  description: 'Malzeme arayan kullanıcıları üreticiler ve satıcılarla buluşturan platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${manrope.variable} ${inter.variable}`}>
      <body style={{ fontFamily: 'var(--font-inter), sans-serif' }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
