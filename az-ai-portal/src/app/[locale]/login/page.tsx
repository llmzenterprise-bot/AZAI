'use client';
import { FormEvent, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { login } from '@/lib/store';
import { showToast } from '@/lib/toast';

export default function Login() {
  const t = useTranslations();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (login(email, pw)) { showToast(t('toast.login'), 'ok'); router.push('/appointments'); }
    else showToast(t('login.fail'), 'err');
  };

  return (
    <section className="wrap app-shell">
      <div className="panel form-narrow">
        <h2 className="page-title">{t('login.h')}</h2>
        <p className="page-sub">{t('login.sub')}</p>
        <form onSubmit={submit}>
          <div className="field"><label>{t('login.email')}</label><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
          <div className="field"><label>{t('login.pw')}</label><input className="input" type="password" value={pw} onChange={(e) => setPw(e.target.value)} required /></div>
          <button className="btn btn-primary block">{t('login.btn')}</button>
        </form>
        <p className="lead" style={{ textAlign: 'center', marginTop: 18 }}>
          {t('login.no')} <Link href="/register" style={{ color: 'var(--app-accent)', fontWeight: 700 }}>{t('login.reg')}</Link>
        </p>
      </div>
    </section>
  );
}
