import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { routing } from '@/i18n/routing';
import { pageMetadata } from '@/lib/seo';
import HomeClient from './HomeClient';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const loc = hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
  return pageMetadata('home', loc);
}

export default function Home() {
  return <HomeClient />;
}
