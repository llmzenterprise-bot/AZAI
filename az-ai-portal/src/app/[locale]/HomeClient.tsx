'use client';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function HomeClient() {
  const t = useTranslations('home');
  const feats = [
    ['💬', t('f1t'), t('f1p')], ['🎙', t('f2t'), t('f2p')], ['📅', t('f3t'), t('f3p')],
    ['🌐', t('f4t'), t('f4p')], ['🔒', t('f5t'), t('f5p')], ['🤝', t('f6t'), t('f6p')],
  ];
  const openVoice = () => window.dispatchEvent(new Event('azaz-open-voice'));

  return (
    <>
      <section className="hero wrap">
        <span className="eyebrow">{t('eyebrow')}</span>
        <h1>{t('h1a')} <span className="gradient-text">{t('h1b')}</span></h1>
        <p className="lead">{t('lead')}</p>
        <div className="hero-cta">
          <Link href="/book" className="btn btn-primary">{t('cta1')}</Link>
          <button className="btn btn-ghost" onClick={openVoice}>{t('cta2')}</button>
        </div>
        <div className="trust">
          <span><b>24/7</b> {t('t1')}</span>
          <span><b>3</b> {t('t2')}</span>
          <span><b>60s</b> {t('t3')}</span>
        </div>
      </section>

      <section className="wrap">
        <div className="sec-head">
          <span className="eyebrow">{t('fEye')}</span>
          <h2>{t('fH')}</h2>
        </div>
        <div className="grid g3">
          {feats.map(([ic, h, p]) => (
            <div key={h} className="card"><div className="ic">{ic}</div><h3>{h}</h3><p>{p}</p></div>
          ))}
        </div>
      </section>

      <section className="wrap" style={{ paddingTop: 0 }}>
        <div className="panel" style={{ textAlign: 'center', background: 'linear-gradient(120deg,rgba(165,129,255,.18),rgba(84,236,255,.1))' }}>
          <h2 style={{ fontSize: '1.9rem', marginBottom: 10 }}>{t('ctaH')}</h2>
          <p className="lead" style={{ marginBottom: 22 }}>{t('ctaP')}</p>
          <Link href="/book" className="btn btn-primary">{t('ctaB')}</Link>
        </div>
      </section>
    </>
  );
}
