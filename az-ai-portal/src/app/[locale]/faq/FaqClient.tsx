'use client';
import { useLocale, useTranslations } from 'next-intl';
import { FAQ, type Locale } from '@/lib/data';

export default function FaqClient() {
  const t = useTranslations('faq');
  const locale = useLocale() as Locale;
  return (
    <section className="wrap app-shell">
      <div className="sec-head">
        <span className="eyebrow">{t('eye')}</span>
        <h2>{t('h')}</h2>
      </div>
      <div style={{ maxWidth: 780, margin: '0 auto' }}>
        {FAQ[locale].map(([q, a]) => (
          <details key={q}>
            <summary>{q}<span className="plus">+</span></summary>
            <div className="a">{a}</div>
          </details>
        ))}
      </div>
    </section>
  );
}
