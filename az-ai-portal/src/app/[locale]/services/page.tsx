import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { routing } from '@/i18n/routing';
import { pageMetadata } from '@/lib/seo';
import { SERVICES } from '@/lib/data';
import ServicesClient from './ServicesClient';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const loc = hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
  return pageMetadata('services', loc);
}

export default async function Services({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const loc = hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'OfferCatalog',
    name: 'AZ AI Geeks Bookable Services',
    itemListElement: SERVICES[loc].map((s) => ({
      '@type': 'Offer',
      name: s.name,
      description: `${s.desc} (${s.dur}, ${s.price})`,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ServicesClient />
    </>
  );
}
