import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AssistantDock from '@/components/AssistantDock';
import BodyMode from '@/components/BodyMode';
import Toaster from '@/components/Toaster';
import '../globals.css';

export const metadata: Metadata = {
  title: 'AZ AI Geeks — AI Booking Portal',
  description:
    'Book, reschedule, and manage appointments with an AI assistant you can chat or talk to — 24/7, in English, Spanish, or French.',
  openGraph: {
    title: 'AZ AI Geeks — AI Booking Portal',
    description:
      'Book, reschedule, and manage appointments with an AI assistant you can chat or talk to — 24/7, in English, Spanish, or French.',
    images: ['/logo-full.png'],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/logo-full.png'],
  },
};

export const viewport: Viewport = {
  themeColor: '#0a0620',
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <div className="bg-fx" />
          <span className="orb a" />
          <span className="orb b" />
          <BodyMode />
          <Navbar />
          <main>{children}</main>
          <Footer />
          <AssistantDock />
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
