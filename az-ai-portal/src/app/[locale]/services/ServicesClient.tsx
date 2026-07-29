'use client';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { SERVICES, type Locale } from '@/lib/data';

export default function ServicesClient() {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const router = useRouter();

  return (
    <section className="wrap app-shell">
      <div className="sec-head">
        <span className="eyebrow">{t('svc.eye')}</span>
        <h2>{t('svc.h')}</h2>
        <p className="lead">{t('svc.p')}</p>
      </div>
      <div className="grid g2">
        {SERVICES[locale].map((s) => (
          <div key={s.id} className="card">
            <div className="ic">✦</div>
            <h3>{s.name}</h3>
            <p>{s.desc}</p>
            <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--muted)', fontSize: '.85rem' }}>⏱ {s.dur} · {s.price}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => router.push(`/book?service=${s.id}`)}>{t('nav.book')}</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
