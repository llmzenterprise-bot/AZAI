'use client';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function Footer() {
  const t = useTranslations();
  return (
    <footer>
      <div className="wrap">
        <div className="foot-grid">
          <div>
            <Link href="/" className="logo" style={{ marginBottom: 12 }}><span className="mk"><img src="/logo-icon.png" alt="AZ AI Geeks logo" width={71} height={38} /></span> AZ AI Geeks</Link>
            <p className="lead" style={{ fontSize: '.9rem', maxWidth: '32ch' }}>{t('foot.tag')}</p>
          </div>
          <div>
            <h5>{t('foot.explore')}</h5>
            <Link href="/">{t('nav.home')}</Link>
            <Link href="/services">{t('nav.services')}</Link>
            <Link href="/book">{t('nav.book')}</Link>
            <Link href="/faq">{t('nav.faq')}</Link>
          </div>
          <div>
            <h5>{t('foot.account')}</h5>
            <Link href="/login">{t('nav.login')}</Link>
            <Link href="/register">{t('foot.register')}</Link>
            <Link href="/appointments">{t('nav.appts')}</Link>
            <Link href="/contact">{t('nav.contact')}</Link>
          </div>
          <div>
            <h5>{t('foot.legal')}</h5>
            <Link href="/privacy">{t('priv.h')}</Link>
            <Link href="/terms">{t('terms.h')}</Link>
          </div>
        </div>
        <div className="foot-bottom">
          <span>© 2026 AZ AI Geeks.</span>
          <span>{t('foot.rights')}</span>
        </div>
      </div>
    </footer>
  );
}
