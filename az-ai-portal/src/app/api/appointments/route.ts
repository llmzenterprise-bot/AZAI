import { NextRequest, NextResponse } from 'next/server';
import { createCalendarEvent } from '@/lib/calendar';
import { sendEmail, bookingConfirmationEmail } from '@/lib/email';
import { SERVICES, STAFF, type Locale } from '@/lib/data';

// ─────────────────────────────────────────────────────────────────────
// Server-side side effects for a booking: sync to Google Calendar and
// send a confirmation email. Both are best-effort — if either isn't
// configured yet (missing env vars) or fails, the booking itself still
// succeeds client-side; this just reports what happened so the UI can
// show an accurate status if desired.
// ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { userEmail, userName, serviceId, staffId, dateISO, time, locale = 'en' } = body;

  if (!userEmail || !serviceId || !dateISO || !time) {
    return NextResponse.json({ error: 'missing required fields' }, { status: 400 });
  }
  const loc = (['en', 'es', 'fr'].includes(locale) ? locale : 'en') as Locale;
  const service = SERVICES[loc].find((s) => s.id === serviceId);
  const staff = STAFF[loc].find((s) => s.id === staffId) || STAFF[loc][0];
  if (!service) return NextResponse.json({ error: 'unknown service' }, { status: 400 });

  const durationMinutes = parseInt(service.dur) || 30;
  const [hourStr, minStr] = time.replace(/[^\d:]/g, '').split(':');
  const start = new Date(dateISO);
  let hour = parseInt(hourStr, 10);
  if (hour < 9) hour += 12; // "1:00"-"5:00" are PM in this booking flow
  start.setHours(hour, parseInt(minStr || '0', 10), 0, 0);

  const calendarResult = await createCalendarEvent({
    summary: `${service.name} — ${userName || userEmail}`,
    description: `Service: ${service.name}\nStaff: ${staff.name}\nBooked via azaigeeks.com portal`,
    attendeeEmail: userEmail,
    startISO: start.toISOString(),
    durationMinutes,
    locale: loc,
  }).catch((e) => ({ ok: false, error: String(e) }));

  const dateLabel = start.toLocaleDateString(loc, { weekday: 'long', month: 'long', day: 'numeric' });
  const { subject, html } = bookingConfirmationEmail({
    name: userName || userEmail.split('@')[0],
    serviceName: service.name,
    staffName: staff.name,
    dateLabel,
    time,
    locale: loc,
  });
  const emailResult = await sendEmail({ to: userEmail, subject, html }).catch((e) => ({ ok: false, error: String(e) }));

  return NextResponse.json({
    calendar: calendarResult,
    email: emailResult,
  });
}
