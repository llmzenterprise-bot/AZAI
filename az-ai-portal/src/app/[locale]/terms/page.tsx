'use client';
import { useTranslations } from 'next-intl';

export default function Terms() {
  const t = useTranslations('terms');
  return (
    <section className="wrap app-shell legal">
      <h2 className="page-title">{t('h')}</h2>
      <p className="page-sub">Last updated: 2026</p>
      <p className="lead">{t('intro')}</p>
      <h3>{t('h1')}</h3><p>{t('p1')}</p>
      <h3>{t('h2')}</h3><p>{t('p2')}</p>
      <h3>{t('h3')}</h3><p>{t('p3')}</p>
      <h3>{t('h4')}</h3><p>{t('p4')}</p>
    </section>
  );
}
