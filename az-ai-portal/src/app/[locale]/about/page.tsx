import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { routing } from '@/i18n/routing';
import { pageMetadata } from '@/lib/seo';
import AboutClient from './AboutClient';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const loc = hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
  return pageMetadata('about', loc);
}

export default function About() {
  return <AboutClient />;
}
