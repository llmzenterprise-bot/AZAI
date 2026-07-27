'use client';
import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { SERVICES, STAFF, type Locale } from '@/lib/data';
import { getUser, getAppts, setAppts, type Appointment } from '@/lib/store';
import { showToast } from '@/lib/toast';

const TIMES = ['9:00', '10:00', '11:00', '1:00', '2:00', '3:00', '4:00', '5:00'];
function nextDays(n: number) {
  const arr: Date[] = [];
  const now = new Date();
  for (let i = 1; arr.length < n; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    if (d.getDay() !== 0) arr.push(d);
  }
  return arr;
}

export default function Book() {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [service, setService] = useState<string | null>(null);
  const [staff, setStaff] = useState('any');
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Read query params (?service=..., ?edit=...) client-side (no Suspense needed).
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const svc = q.get('service');
    const edit = q.get('edit');
    if (edit) {
      const appt = getAppts().find((a) => a.id === edit);
      if (appt) { setService(appt.serviceId); setStaff(appt.staff); setEditingId(edit); setStep(3); return; }
    }
    if (svc && SERVICES[locale].some((s) => s.id === svc)) { setService(svc); setStep(1); }
  }, [locale]);

  const days = nextDays(8);
  const fmt = (d: Date) => d.toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' });
  const steps = [t('book.s1'), t('book.s2'), t('book.s3'), t('book.s4')];

  function confirm() {
    if (!getUser()) { showToast(t('book.loginReq'), 'err'); router.push('/login?next=book'); return; }
    const svc = SERVICES.en.find((s) => s.id === service)!;
    let list = getAppts();
    if (editingId) list = list.filter((a) => a.id !== editingId);
    const appt: Appointment = {
      id: editingId || 'a' + Date.now(),
      user: getUser()!.email, serviceId: service!, serviceName: svc.name,
      staff, date: date!, time: time!,
    };
    list.push(appt);
    setAppts(list);
    showToast(editingId ? t('toast.resched') : t('toast.booked'), 'ok');
    router.push('/appointments');
  }

  return (
    <section className="wrap app-shell">
      <div className="panel" style={{ maxWidth: 760, margin: '0 auto' }}>
        <h2 className="page-title">{t('book.h')}</h2>
        <p className="page-sub">{t('book.sub')}</p>

        <div className="stepper">
          {steps.map((label, i) => (
            <div key={i} className={`st ${step === i + 1 ? 'on' : ''} ${step > i + 1 ? 'done' : ''}`}>{label}</div>
          ))}
        </div>

        {step === 1 && (
          <>
            <div className="opt-grid">
              {SERVICES[locale].map((s) => (
                <div key={s.id} className={`opt ${service === s.id ? 'sel' : ''}`} onClick={() => setService(s.id)}>
                  <h4>{s.name}</h4><div className="meta">⏱ {s.dur}</div><div className="price">{s.price}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 22, textAlign: 'right' }}>
              <button className="btn btn-primary" disabled={!service} onClick={() => setStep(2)}>{t('book.next')}</button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="opt-grid">
              {STAFF[locale].map((s) => (
                <div key={s.id} className={`opt ${staff === s.id ? 'sel' : ''}`} onClick={() => setStaff(s.id)}><h4>{s.name}</h4></div>
              ))}
            </div>
            <div style={{ marginTop: 22, display: 'flex', justifyContent: 'space-between' }}>
              <button className="btn btn-ghost" onClick={() => setStep(1)}>{t('book.back')}</button>
              <button className="btn btn-primary" onClick={() => setStep(3)}>{t('book.next')}</button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <label className="field"><span style={{ fontSize: '.85rem', fontWeight: 600 }}>{t('book.chooseDate')}</span></label>
            <div className="slot-grid" style={{ marginBottom: 20 }}>
              {days.map((d) => {
                const iso = d.toISOString();
                return <div key={iso} className={`slot ${date === iso ? 'sel' : ''}`} onClick={() => { setDate(iso); setTime(null); }}>{fmt(d)}</div>;
              })}
            </div>
            <div className="slot-grid" style={date ? {} : { opacity: .4, pointerEvents: 'none' }}>
              {TIMES.map((tm) => <div key={tm} className={`slot ${time === tm ? 'sel' : ''}`} onClick={() => setTime(tm)}>{tm}</div>)}
            </div>
            <div style={{ marginTop: 22, display: 'flex', justifyContent: 'space-between' }}>
              <button className="btn btn-ghost" onClick={() => setStep(2)}>{t('book.back')}</button>
              <button className="btn btn-primary" disabled={!date || !time} onClick={() => setStep(4)}>{t('book.next')}</button>
            </div>
          </>
        )}

        {step === 4 && service && date && time && (
          <>
            <div className="panel" style={{ background: 'rgba(165,129,255,.08)' }}>
              <h3 style={{ marginBottom: 14 }}>{t('book.summary')}</h3>
              <div style={{ display: 'grid', gap: 8, fontSize: '.95rem' }}>
                <div>✦ <b>{SERVICES[locale].find((s) => s.id === service)?.name}</b> · {SERVICES[locale].find((s) => s.id === service)?.dur}</div>
                <div>👤 {STAFF[locale].find((s) => s.id === staff)?.name}</div>
                <div>📅 {fmt(new Date(date))} · {time}</div>
                <div>💵 {SERVICES[locale].find((s) => s.id === service)?.price}</div>
              </div>
            </div>
            <div style={{ marginTop: 22, display: 'flex', justifyContent: 'space-between' }}>
              <button className="btn btn-ghost" onClick={() => setStep(3)}>{t('book.back')}</button>
              <button className="btn btn-primary" onClick={confirm}>{t('book.confirm')}</button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
