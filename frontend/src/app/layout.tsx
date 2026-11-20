import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AkaBotWidget } from '@/components/layout/AkaBotWidget';

export const metadata: Metadata = {
  title: 'UtilityHub | Soft Neo-Brutalism Modern Utility Studio',
  description: 'All-in-One Media Downloader, Alight Motion Preset Finder, Image Studio, and PDF Studio',
  manifest: '/manifest.json',
  icons: {
    icon: [{ url: '/favicon.ico' }],
  },
};

export const viewport: Viewport = {
  themeColor: '#0D0D0D',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark" data-theme="dark" suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-screen bg-[var(--neo-bg)] text-[var(--neo-text)] antialiased transition-colors duration-200" suppressHydrationWarning>
        {children}
        <AkaBotWidget />
      </body>
    </html>
  );
}
