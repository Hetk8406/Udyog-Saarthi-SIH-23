import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});
import { AccessibilityProvider } from '@/context/AccessibilityContext';
import { AuthProvider } from '@/context/AuthContext';
import SkipLink from '@/components/common/SkipLink';
import AccessibilityBar from '@/components/layout/AccessibilityBar';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CookieConsent from '@/components/layout/CookieConsent';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Udyog Saarthi — Accessible Employment Platform for Persons with Disabilities',
    template: '%s | Udyog Saarthi',
  },
  description:
    'Comprehensive career, learning, and examination support portal designed for persons with disabilities (PwDs).',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Udyog Saarthi — Accessible Employment Platform for Persons with Disabilities',
    description:
      'Accessible career discovery, competitive exam preparation, accommodation assistance, and dedicated job coaching for Persons with Disabilities.',
    url: '/',
    siteName: 'Udyog Saarthi',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Udyog Saarthi — Empowering Every Ability',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Udyog Saarthi — Accessible Employment Platform',
    description:
      'Accessible career discovery, competitive exam preparation, and coaching for Persons with Disabilities.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/icon.svg',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased`}>
        <AccessibilityProvider>
          <AuthProvider>
            {/* Skip to Main Content Link for screen readers & keyboard navigation */}
            <SkipLink />

            {/* Persistent Accessibility Control Bar */}
            <AccessibilityBar />

            {/* Main Navigation Header */}
            <Navbar />

            {/* Main Page Landmark */}
            <main id="main-content" tabIndex={-1} className="flex-grow focus:outline-none">
              {children}
            </main>

            {/* Cookie Consent Banner */}
            <CookieConsent />

            {/* Global Accessible Footer */}
            <Footer />
          </AuthProvider>
        </AccessibilityProvider>
      </body>
    </html>
  );
}
