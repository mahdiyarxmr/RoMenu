import './globals.css';
import { Providers } from './providers';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'بوفه رُکاد | RoMenu',
  description: 'فروشگاه و بوفه هوشمند اکوسیستم رُکاد — سریع، خوشمزه و بدون معطلی',
  icons: {
    icon: '/src/assets/logos/Sign-01.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" className="theme-neo-brutal" data-theme="ecosystem">
      <head>
        <link rel="icon" type="image/svg+xml" href="/src/assets/logos/Sign-01.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      <body className="bg-[#F8FAFC] dark:bg-[#0B0F17] text-[#1E293B] dark:text-[#F8FAFC] antialiased selection:bg-[#59BBAF] selection:text-[#1F413D]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
