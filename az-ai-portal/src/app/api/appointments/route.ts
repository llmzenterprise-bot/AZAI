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
  let hour = parseInt(hourStr, 10);
  if (hour < 9) hour += 12; // "1:00"-"5:00" are PM in this booking flow
  const minute = parseInt(minStr || '0', 10);
  const dateStr = dateISO.slice(0, 10); // "YYYY-MM-DD" — the calendar day the visitor picked

  const calendarResult = await createCalendarEvent({
    summary: `${service.name} — ${userName || userEmail}`,
    description: `Service: ${service.name}\nStaff: ${staff.name}\nBooked via azaigeeks.com portal`,
    attendeeEmail: userEmail,
    dateStr, hour, minute,
    durationMinutes,
    locale: loc,
  }).catch((e) => ({ ok: false, error: String(e) }));

  // Format for the confirmation email using the date components directly
  // (via Date.UTC + timeZone:'UTC') so the displayed weekday/month/day can't
  // drift from what's actually on the calendar, regardless of server timezone.
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateLabel = new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(loc, {
    weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC',
  });
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
