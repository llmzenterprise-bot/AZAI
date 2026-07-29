import { groundedRespond, SERVICES, STAFF, type Locale } from '@/lib/data';
import {
  createCalendarEvent, checkAvailability, findAppointmentsByEmail,
  updateCalendarEvent, deleteCalendarEvent,
} from '@/lib/calendar';
import { sendEmail, bookingConfirmationEmail } from '@/lib/email';
import { sendSms } from '@/lib/sms';

// ─────────────────────────────────────────────────────────────────────
// Shared "tools" the phone voice AI can call, regardless of which
// provider (Vapi, Retell, ...) is wired up — each provider's webhook
// route just parses its own request/response shape and calls these.
// ─────────────────────────────────────────────────────────────────────

export async function answerQuestion(query: string, locale: Locale) {
  const result = groundedRespond(query, locale);
  return result.text;
}

function parseDateTime(dateStr?: string, timeStr?: string) {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec((dateStr || '').trim());
  const timeMatch = /^(\d{1,2}):(\d{2})$/.exec((timeStr || '').trim());
  if (!dateMatch || !timeMatch) return null;
  return {
    dateStr: dateStr!.trim(),
    hour: parseInt(timeMatch[1], 10),
    minute: parseInt(timeMatch[2], 10),
  };
}

function formatDateLabel(dateStr: string, locale: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(locale, {
    weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC',
  });
}

function formatTimeLabel(hour: number, minute: number, locale: string) {
  return new Date(Date.UTC(2000, 0, 1, hour, minute)).toLocaleTimeString(locale, {
    hour: 'numeric', minute: '2-digit', timeZone: 'UTC',
  });
}

// ─────────────────────────────────────────────────────────────────────
// check_availability — call this BEFORE book_appointment so the agent
// can offer real alternatives instead of booking blind and finding out
// later there was a conflict.
// ─────────────────────────────────────────────────────────────────────
export interface CheckAvailabilityArgs {
  preferred_date?: string; preferred_time?: string; service_name?: string; locale?: string;
}

export async function checkAvailabilityTool(args: CheckAvailabilityArgs) {
  const loc = (['en', 'es', 'fr'].includes(args.locale || '') ? args.locale : 'en') as Locale;
  const parsed = parseDateTime(args.preferred_date, args.preferred_time);
  if (!parsed) return "I couldn't quite understand that date and time — could you repeat the day and time you'd like?";

  const service = SERVICES[loc].find(
    (s) => s.name.toLowerCase().includes((args.service_name || '').toLowerCase())
  ) || SERVICES[loc][0];
  const durationMinutes = parseInt(service.dur) || 30;

  const result = await checkAvailability(parsed.dateStr, parsed.hour, parsed.minute, durationMinutes);
  if (!result.ok) return `I'm having trouble checking the calendar right now (${result.error}) — let's go ahead and I'll have a specialist confirm the time by email.`;

  const dateLabel = formatDateLabel(parsed.dateStr, loc);
  const timeLabel = formatTimeLabel(parsed.hour, parsed.minute, loc);

  if (result.available) return `${dateLabel} at ${timeLabel} is open.`;

  if (!result.suggestions || result.suggestions.length === 0) {
    return `${dateLabel} at ${timeLabel} is already booked, and I don't see another opening nearby — could you suggest a different day?`;
  }
  const options = result.suggestions
    .map((s) => `${formatDateLabel(s.dateStr, loc)} at ${s.label}`)
    .join(', or ');
  return `${dateLabel} at ${timeLabel} is already booked. I do have ${options} open — would one of those work?`;
}

// ─────────────────────────────────────────────────────────────────────
// book_appointment
// ─────────────────────────────────────────────────────────────────────
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
  const parsed = parseDateTime(args.preferred_date, args.preferred_time || '10:00');
  if (!parsed) return "I couldn't quite understand that date — could you give me a specific day and time?";
  const { dateStr, hour, minute } = parsed;

  const durationMinutes = parseInt(service.dur) || 30;

  // Guard against double-booking: re-check the slot right before writing it,
  // since the agent may not have called check_availability first.
  const availability = await checkAvailability(dateStr, hour, minute, durationMinutes).catch(() => null);
  if (availability?.ok && availability.available === false) {
    const dateLabel = formatDateLabel(dateStr, loc);
    const timeLabel = formatTimeLabel(hour, minute, loc);
    if (availability.suggestions && availability.suggestions.length > 0) {
      const options = availability.suggestions.map((s) => `${formatDateLabel(s.dateStr, loc)} at ${s.label}`).join(', or ');
      return `${dateLabel} at ${timeLabel} just got booked. I do have ${options} open — would one of those work instead?`;
    }
    return `${dateLabel} at ${timeLabel} is already booked and I don't see a nearby opening — could you suggest a different day?`;
  }

  const calendarResult = await createCalendarEvent({
    summary: `${service.name} — ${args.caller_name || args.caller_email} (phone booking)`,
    description: `Service: ${service.name}\nBooked via phone AI receptionist`,
    attendeeEmail: args.caller_email,
    dateStr, hour, minute,
    durationMinutes,
    locale: loc,
  }).catch((e) => ({ ok: false, error: String(e) }));

  const dateLabel = formatDateLabel(dateStr, loc);
  const timeLabel = formatTimeLabel(hour, minute, loc);
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

// ─────────────────────────────────────────────────────────────────────
// cancel_appointment — looks the caller up by email since there's no
// separate appointments database; the calendar itself is the source
// of truth for phone-booked appointments.
// ─────────────────────────────────────────────────────────────────────
export interface CancelAppointmentArgs { caller_email?: string; locale?: string; }

export async function cancelAppointment(args: CancelAppointmentArgs) {
  const loc = (['en', 'es', 'fr'].includes(args.locale || '') ? args.locale : 'en') as Locale;
  if (!args.caller_email) return 'What email address was used to book the appointment?';

  const found = await findAppointmentsByEmail(args.caller_email, loc);
  if (!found.ok) return `I'm having trouble reaching the calendar right now (${found.error}) — a specialist will follow up to confirm the cancellation.`;
  if (!found.appointments || found.appointments.length === 0) {
    return `I couldn't find an upcoming appointment under ${args.caller_email} — could you double check the email, or the appointment may have been under a different address?`;
  }
  if (found.appointments.length > 1) {
    const list = found.appointments.map((a) => a.label).join(', or ');
    return `I found more than one upcoming appointment for that email: ${list}. Which one would you like to cancel?`;
  }

  const appt = found.appointments[0];
  const result = await deleteCalendarEvent(appt.eventId);
  if (!result.ok) return `I found the appointment but ran into an issue canceling it (${result.error}) — a specialist will take care of it shortly.`;
  return `Done — your appointment on ${appt.label} has been canceled.`;
}

// ─────────────────────────────────────────────────────────────────────
// reschedule_appointment — find by email, verify the new slot is open,
// then move the existing event rather than delete+recreate (keeps the
// same event/description intact).
// ─────────────────────────────────────────────────────────────────────
export interface RescheduleAppointmentArgs {
  caller_email?: string; new_date?: string; new_time?: string; locale?: string;
}

export async function rescheduleAppointment(args: RescheduleAppointmentArgs) {
  const loc = (['en', 'es', 'fr'].includes(args.locale || '') ? args.locale : 'en') as Locale;
  if (!args.caller_email) return 'What email address was used to book the appointment?';

  const parsed = parseDateTime(args.new_date, args.new_time);
  if (!parsed) return "What new day and time would you like — and I'll need it as a specific date and time.";

  const found = await findAppointmentsByEmail(args.caller_email, loc);
  if (!found.ok) return `I'm having trouble reaching the calendar right now (${found.error}) — a specialist will follow up to confirm.`;
  if (!found.appointments || found.appointments.length === 0) {
    return `I couldn't find an upcoming appointment under ${args.caller_email} — could you double check the email?`;
  }
  if (found.appointments.length > 1) {
    const list = found.appointments.map((a) => a.label).join(', or ');
    return `I found more than one upcoming appointment for that email: ${list}. Which one would you like to reschedule?`;
  }

  const appt = found.appointments[0];
  const durationMinutes = 30; // standard slot length; the original event's own duration isn't re-derived here
  const availability = await checkAvailability(parsed.dateStr, parsed.hour, parsed.minute, durationMinutes).catch(() => null);
  const dateLabel = formatDateLabel(parsed.dateStr, loc);
  const timeLabel = formatTimeLabel(parsed.hour, parsed.minute, loc);

  if (availability?.ok && availability.available === false) {
    if (availability.suggestions && availability.suggestions.length > 0) {
      const options = availability.suggestions.map((s) => `${formatDateLabel(s.dateStr, loc)} at ${s.label}`).join(', or ');
      return `${dateLabel} at ${timeLabel} is already booked. I do have ${options} open — would one of those work instead?`;
    }
    return `${dateLabel} at ${timeLabel} is already booked and I don't see a nearby opening — could you suggest a different day?`;
  }

  const result = await updateCalendarEvent(appt.eventId, { dateStr: parsed.dateStr, hour: parsed.hour, minute: parsed.minute, durationMinutes });
  if (!result.ok) return `I found the appointment but ran into an issue moving it (${result.error}) — a specialist will confirm the new time shortly.`;

  return `Done — your appointment has been moved to ${dateLabel} at ${timeLabel}. A confirmation will follow by email.`;
}

// ─────────────────────────────────────────────────────────────────────
// notify_team_sms — texts a live team member during the call (e.g. an
// urgent request, an angry caller, someone insisting on a human right
// now). This is separate from Retell's native transfer_call: that
// connects the caller's *voice* to a phone number; this just fires a
// background text alert so a human can follow up, without interrupting
// the live call.
// ─────────────────────────────────────────────────────────────────────
export interface NotifyTeamSmsArgs { reason?: string; caller_name?: string; caller_number?: string; }

export async function notifyTeamSms(args: NotifyTeamSmsArgs) {
  const teamNumber = process.env.TEAM_ALERT_PHONE_NUMBER;
  if (!teamNumber) return "I'm unable to send that alert right now — let's continue and a specialist will follow up.";

  const body = `AZ AI Geeks call alert: ${args.caller_name || 'A caller'} (${args.caller_number || 'unknown number'}) needs attention — ${args.reason || 'requested a live person'}.`;
  const result = await sendSms(teamNumber, body);
  if (!result.ok) return "I tried to alert the team but ran into an issue — let's continue and I'll have someone follow up.";
  return "I've just sent an alert to our team — someone will reach out shortly.";
}

export async function runTool(name: string, args: Record<string, any>, locale: Locale): Promise<string> {
  if (name === 'answer_question') return answerQuestion(args.query || '', locale);
  if (name === 'check_availability') return checkAvailabilityTool(args);
  if (name === 'book_appointment') return bookAppointment(args);
  if (name === 'cancel_appointment') return cancelAppointment(args);
  if (name === 'reschedule_appointment') return rescheduleAppointment(args);
  if (name === 'notify_team_sms') return notifyTeamSms(args);
  return "I'm not sure how to do that yet.";
}
