import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

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
    <html lang="en" className="scroll-smooth">
      <body className="bg-background text-foreground min-h-screen antialiased selection:bg-primary/20 selection:text-foreground">
        <Providers>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
