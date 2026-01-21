import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Lithos - Strategic Materials Price Tracker',
  description: 'Track prices for strategic metals, rare earths, and scientific collectibles. Real-time data for rhenium, gallium, meteorites, and more.',
  keywords: ['strategic metals', 'rare earth prices', 'meteorite prices', 'rhenium', 'gallium', 'lithium prices'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <footer className="border-t border-[var(--border)] py-8 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-br from-[var(--accent)] to-purple-500 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-xs">Li</span>
                </div>
                <span className="text-sm text-[var(--text-secondary)]">
                  Lithos - Strategic Materials Intelligence
                </span>
              </div>
              <div className="flex gap-6 text-sm text-[var(--text-secondary)]">
                <a href="/about" className="hover:text-[var(--text-primary)]">About</a>
                <a href="/pricing" className="hover:text-[var(--text-primary)]">Pricing</a>
                <a href="/api" className="hover:text-[var(--text-primary)]">API</a>
                <a href="/privacy" className="hover:text-[var(--text-primary)]">Privacy</a>
                <a href="/terms" className="hover:text-[var(--text-primary)]">Terms</a>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
