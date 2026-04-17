import type { Metadata } from 'next';
import { Providers } from '@/components/layout/Providers';

export const metadata: Metadata = {
  title: 'Sanayi Marketi',
  description: 'Malzeme arayan kullanıcıları üreticiler ve satıcılarla buluşturan platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
