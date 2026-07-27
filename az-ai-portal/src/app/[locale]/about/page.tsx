'use client';
import { useTranslations } from 'next-intl';

export default function About() {
  const t = useTranslations('about');
  const cards = [['🎯', t('m1t'), t('m1p')], ['⚡', t('m2t'), t('m2p')], ['🛡', t('m3t'), t('m3p')]];
  return (
    <section className="wrap app-shell">
      <div className="sec-head">
        <span className="eyebrow">{t('eye')}</span>
        <h2>{t('h')}</h2>
      </div>
      <div style={{ maxWidth: 760, margin: '0 auto 40px', textAlign: 'center' }}>
        <p className="lead">{t('p1')}</p>
      </div>
      <div className="grid g3">
        {cards.map(([ic, h, p]) => (
          <div key={h} className="card"><div className="ic">{ic}</div><h3>{h}</h3><p>{p}</p></div>
        ))}
      </div>
    </section>
  );
}
