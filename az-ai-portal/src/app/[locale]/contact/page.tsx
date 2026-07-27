'use client';
import { FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { showToast } from '@/lib/toast';

export default function Contact() {
  const t = useTranslations();
  const submit = (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); e.currentTarget.reset(); showToast(t('toast.sent'), 'ok'); };
  return (
    <section className="wrap app-shell">
      <div className="panel form-narrow">
        <h2 className="page-title">{t('contact.h')}</h2>
        <p className="page-sub">{t('contact.sub')}</p>
        <form onSubmit={submit}>
          <div className="field"><label>{t('contact.name')}</label><input className="input" required /></div>
          <div className="field"><label>{t('contact.email')}</label><input className="input" type="email" required /></div>
          <div className="field"><label>{t('contact.msg')}</label><textarea className="input" rows={4} required /></div>
          <button className="btn btn-primary block">{t('contact.send')}</button>
        </form>
        <div style={{ marginTop: 22, textAlign: 'center' }} className="lead">
          {t('contact.or')} <a href="mailto:hello@azaigeeks.com" style={{ color: 'var(--app-accent)', fontWeight: 700 }}>hello@azaigeeks.com</a>
        </div>
      </div>
    </section>
  );
}
