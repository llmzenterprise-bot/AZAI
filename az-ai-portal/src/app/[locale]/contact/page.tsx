import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { routing } from '@/i18n/routing';
import { pageMetadata } from '@/lib/seo';
import ContactClient from './ContactClient';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const loc = hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
  return pageMetadata('contact', loc);
}

export default function Contact() {
  return <ContactClient />;
}
