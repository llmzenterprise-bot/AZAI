import { groundedRespond, SERVICES, STAFF, type Locale } from '@/lib/data';
import { createCalendarEvent } from '@/lib/calendar';
import { sendEmail, bookingConfirmationEmail } from '@/lib/email';

// ─────────────────────────────────────────────────────────────────────
// Shared "tools" the phone voice AI can call, regardless of which
// provider (Vapi, Retell, ...) is wired up — each provider's webhook
// route just parses its own request/response shape and calls these.
// ─────────────────────────────────────────────────────────────────────

export async function answerQuestion(query: string, locale: Locale) {
  const result = groundedRespond(query, locale);
  return result.text;
}

export interface BookAppointmentArgs {
  service_name?: string; preferred_date?: string; preferred_time?: string;
  caller_name?: string; caller_email?: string; locale?: string;
}

export async function bookAppointment(args: BookAppointmentArgs) {
  const loc = (['en', 'es', 'fr'].includes(args.locale || '') ? args.locale : 'en') as Locale;
  if (!args.caller_email) return 'I need an email address to send the confirmation to — could you provide one?';

  const service = SERVICES[loc].find(
    (s) => s.name.toLowerCase().includes((args.service_name || '').toLowerCase())
  ) || SERVICES[loc][0];
  const staff = STAFF[loc][0]; // "no preference" — phone bookings don't ask staff choice

  // Expect the assistant to supply preferred_date as "YYYY-MM-DD" and
  // preferred_time as 24-hour "HH:MM" — both understood as business-local
  // (Phoenix) time, since that's what a caller means by "book me for 2pm".
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec((args.preferred_date || '').trim());
  const timeMatch = /^(\d{1,2}):(\d{2})$/.exec((args.preferred_time || '10:00').trim());
  if (!dateMatch || !timeMatch) {
    return "I couldn't quite understand that date — could you give me a specific day and time?";
  }
  const dateStr = args.preferred_date!.trim();
  const hour = parseInt(timeMatch[1], 10);
  const minute = parseInt(timeMatch[2], 10);

  const durationMinutes = parseInt(service.dur) || 30;
  const calendarResult = await createCalendarEvent({
    summary: `${service.name} — ${args.caller_name || args.caller_email} (phone booking)`,
    description: `Service: ${service.name}\nBooked via phone AI receptionist`,
    attendeeEmail: args.caller_email,
    dateStr, hour, minute,
    durationMinutes,
    locale: loc,
  }).catch((e) => ({ ok: false, error: String(e) }));

  const [y, m, d] = dateStr.split('-').map(Number);
  const dateLabel = new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(loc, {
    weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC',
  });
  const timeLabel = new Date(Date.UTC(2000, 0, 1, hour, minute)).toLocaleTimeString(loc, {
    hour: 'numeric', minute: '2-digit', timeZone: 'UTC',
  });
  const { subject, html } = bookingConfirmationEmail({
    name: args.caller_name || args.caller_email.split('@')[0],
    serviceName: service.name, staffName: staff.name, dateLabel, time: timeLabel, locale: loc,
  });
  await sendEmail({ to: args.caller_email, subject, html }).catch(() => {});

  if (!calendarResult.ok) {
    return `I've noted your request for ${service.name} on ${dateLabel} at ${timeLabel}, but our calendar system had an issue — someone from our team will confirm shortly.`;
  }
  return `You're booked for ${service.name} on ${dateLabel} at ${timeLabel}. A confirmation email is on its way to ${args.caller_email}.`;
}

export async function runTool(name: string, args: Record<string, any>, locale: Locale): Promise<string> {
  if (name === 'answer_question') return answerQuestion(args.query || '', locale);
  if (name === 'book_appointment') return bookAppointment(args);
  return "I'm not sure how to do that yet.";
}
