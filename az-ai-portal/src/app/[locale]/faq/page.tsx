import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { routing } from '@/i18n/routing';
import { pageMetadata } from '@/lib/seo';
import { FAQ } from '@/lib/data';
import FaqClient from './FaqClient';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const loc = hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
  return pageMetadata('faq', loc);
}

export default async function Faq({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const loc = hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ[loc].map(([q, a]) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <FaqClient />
    </>
  );
}
