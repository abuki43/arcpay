import type { Metadata } from 'next';
import { Instrument_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { ToastProvider } from '@/components/toast';

const sans = Instrument_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
  weight: ['400', '500', '600'],
});

const display = Instrument_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
  weight: ['500', '600'],
});

export const metadata: Metadata = {
  title: 'ArcPay — The 1-Click USDC Checkout Protocol for Arc Network',
  description:
    'Accept native USDC payments with 0.40% protocol fees, ~600ms sub-second finality, and zero ERC-20 approvals. Built for SaaS founders, creator platforms, and developers on Circle’s Arc Layer-1.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${mono.variable} scroll-smooth`}
    >
      <body className="bg-canvas text-ink min-h-screen antialiased">
        <Providers>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <ToastProvider />
        </Providers>
      </body>
    </html>
  );
}
