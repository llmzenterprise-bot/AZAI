'use client';
import { FormEvent, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { register } from '@/lib/store';
import { showToast } from '@/lib/toast';

export default function Register() {
  const t = useTranslations();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    register(name, email, pw);
    showToast(t('toast.reg'), 'ok');
    router.push('/appointments');
  };

  return (
    <section className="wrap app-shell">
      <div className="panel form-narrow">
        <h2 className="page-title">{t('reg.h')}</h2>
        <p className="page-sub">{t('reg.sub')}</p>
        <form onSubmit={submit}>
          <div className="field"><label>{t('reg.name')}</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} required /></div>
          <div className="field"><label>{t('reg.email')}</label><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
          <div className="field"><label>{t('reg.pw')}</label><input className="input" type="password" minLength={4} value={pw} onChange={(e) => setPw(e.target.value)} required /></div>
          <button className="btn btn-primary block">{t('reg.btn')}</button>
        </form>
        <p className="lead" style={{ textAlign: 'center', marginTop: 18 }}>
          {t('reg.have')} <Link href="/login" style={{ color: 'var(--app-accent)', fontWeight: 700 }}>{t('reg.login')}</Link>
        </p>
      </div>
    </section>
  );
}
