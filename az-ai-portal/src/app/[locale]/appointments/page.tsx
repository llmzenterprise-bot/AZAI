'use client';
import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { SERVICES, STAFF, type Locale } from '@/lib/data';
import { getUser, setUser, getAppts, setAppts, type User, type Appointment } from '@/lib/store';
import { showToast } from '@/lib/toast';

export default function Appointments() {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [user, setU] = useState<User | null>(null);
  const [appts, setA] = useState<Appointment[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = () => { setU(getUser()); setA(getAppts()); };
  useEffect(() => {
    refresh(); setReady(true);
    window.addEventListener('azaz-auth', refresh);
    window.addEventListener('azaz-appts', refresh);
    return () => { window.removeEventListener('azaz-auth', refresh); window.removeEventListener('azaz-appts', refresh); };
  }, []);

  if (!ready) return <section className="wrap app-shell"><div className="panel" style={{ maxWidth: 820, margin: '0 auto' }} /></section>;

  if (!user) {
    return (
      <section className="wrap app-shell">
        <div className="panel" style={{ maxWidth: 820, margin: '0 auto' }}>
          <h2 className="page-title">{t('nav.appts')}</h2>
          <p className="page-sub">{t('appt.loginReq')}</p>
          <Link href="/login" className="btn btn-primary">{t('appt.gotoLogin')}</Link>
        </div>
      </section>
    );
  }

  const mine = appts.filter((a) => a.user === user.email).sort((a, b) => +new Date(a.date) - +new Date(b.date));
  const svcName = (id: string) => SERVICES[locale].find((s) => s.id === id)?.name || id;
  const stfName = (id: string) => STAFF[locale].find((s) => s.id === id)?.name || id;

  const cancel = (id: string) => { setAppts(getAppts().filter((a) => a.id !== id)); showToast(t('toast.cancelled')); };
  const logout = () => { setUser(null); showToast(t('toast.logout')); router.push('/'); };

  return (
    <section className="wrap app-shell">
      <div className="panel" style={{ maxWidth: 820, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 8 }}>
          <div>
            <h2 className="page-title">{t('appt.h')}</h2>
            <p className="page-sub" style={{ marginBottom: 0 }}>{t('appt.welcome')} <b>{user.email}</b></p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={logout}>{t('appt.logout')}</button>
        </div>

        {mine.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0' }}>
            <p className="page-sub">{t('appt.none')}</p>
            <Link href="/book" className="btn btn-primary">{t('appt.book')}</Link>
          </div>
        ) : (
          <>
            <div style={{ marginTop: 18 }}>
              {mine.map((a) => {
                const d = new Date(a.date);
                return (
                  <div key={a.id} className="appt">
                    <div className="date-badge">
                      <div className="d">{d.getDate()}</div>
                      <div className="m">{d.toLocaleDateString(locale, { month: 'short' })}</div>
                    </div>
                    <div className="info">
                      <h4>{svcName(a.serviceId)} <span className="tag">✓</span></h4>
                      <div className="meta">{a.time} · {stfName(a.staff)}</div>
                    </div>
                    <div className="acts">
                      <button className="btn btn-ghost btn-sm" onClick={() => router.push(`/book?edit=${a.id}`)}>{t('appt.resched')}</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => cancel(a.id)}>{t('appt.cancel')}</button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 14 }}>
              <Link href="/book" className="btn btn-primary">{t('appt.book')}</Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
