import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import Link from 'next/link';
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister';
import { FooterInstallPwa } from '@/components/FooterInstallPwa';
import { TermsAcceptanceModal } from '@/components/TermsAcceptanceModal';
import { LocalReminderNotifier } from '@/components/LocalReminderNotifier';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  themeColor: '#090d16',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://toujours-vivant.fr'),
  title: 'Toujours Vivant • Dispositif d\'Alerte & Check-in',
  description: 'Application pour rassurer vos proches au quotidien. Signalement en 1-tap ou détection passive de mouvement.',
  manifest: '/manifest.json',
  openGraph: {
    title: 'Toujours Vivant • Dispositif d\'Alerte et Check-in Sécurisé',
    description: 'Rassurez vos proches automatiquement. Signalement en 1-tap, détection passive de mouvements et alertes d\'urgence.',
    url: 'https://toujours-vivant.fr',
    siteName: 'Toujours Vivant',
    locale: 'fr_FR',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Toujours Vivant - Dispositif d\'Alerte et Check-in Sécurisé',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Toujours Vivant • Dispositif d\'Alerte & Check-in',
    description: 'Signalement de sécurité 1-tap et alertes automatiques pour vos proches.',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full dark">
      <body className={`${inter.className} min-h-full bg-[#090d16] text-slate-100 flex flex-col antialiased selection:bg-emerald-500 selection:text-white`}>
        <ServiceWorkerRegister />
        <TermsAcceptanceModal />
        <LocalReminderNotifier />
        <Navbar />
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 pb-24 sm:pb-12">
          {children}
        </main>

        <footer className="border-t border-slate-800/80 bg-[#090d16]/90 pt-6 pb-24 sm:pb-6 text-center text-xs text-slate-400">
          <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span><strong>Toujours Vivant</strong> &bull; Dispositif d'Alerte et de Check-in Sécurisé</span>
            </div>

            <div className="flex items-center gap-4 flex-wrap justify-center">
              <FooterInstallPwa />
              <Link href="/legal" className="hover:text-emerald-400 transition-colors underline font-medium">
                Mentions Légales & RGPD
              </Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
