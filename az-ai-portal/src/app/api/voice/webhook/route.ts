import { NextRequest, NextResponse } from 'next/server';
import { groundedRespond, SERVICES, STAFF, type Locale } from '@/lib/data';
import { createCalendarEvent } from '@/lib/calendar';
import { sendEmail, bookingConfirmationEmail } from '@/lib/email';

// ─────────────────────────────────────────────────────────────────────
// Webhook for a real phone-line voice AI (Vapi). Configure a Vapi
// Assistant with this URL as its "Server URL" and define two tools —
// `answer_question` and `book_appointment` — matching the schemas
// below. The assistant (an LLM on Vapi's side) handles the actual
// conversation and natural-language understanding; this endpoint just
// executes the two actions it can ask for, reusing the same grounded
// knowledge base and calendar/email logic as the website.
//
// Required env vars: same as calendar.ts / email.ts, plus optionally
// VAPI_WEBHOOK_SECRET if you enable request signing in the Vapi dashboard.
// ─────────────────────────────────────────────────────────────────────

interface VapiFunctionCallMessage {
  type: string;
  functionCall?: { name: string; parameters: Record<string, any> };
  toolCalls?: { id: string; function: { name: string; arguments: Record<string, any> } }[];
}

async function answerQuestion(query: string, locale: Locale) {
  const result = groundedRespond(query, locale);
  return result.text;
}

async function bookAppointment(args: {
  service_name?: string; preferred_date?: string; preferred_time?: string;
  caller_name?: string; caller_email?: string; locale?: string;
}) {
  const loc = (['en', 'es', 'fr'].includes(args.locale || '') ? args.locale : 'en') as Locale;
  if (!args.caller_email) return 'I need an email address to send the confirmation to — could you provide one?';

  const service = SERVICES[loc].find(
    (s) => s.name.toLowerCase().includes((args.service_name || '').toLowerCase())
  ) || SERVICES[loc][0];
  const staff = STAFF[loc][0]; // "no preference" — phone bookings don't ask staff choice

  let start: Date;
  try {
    start = new Date(`${args.preferred_date} ${args.preferred_time || '10:00'}`);
    if (isNaN(start.getTime())) throw new Error('unparseable');
  } catch {
    return "I couldn't quite understand that date — could you give me a specific day and time?";
  }

  const durationMinutes = parseInt(service.dur) || 30;
  const calendarResult = await createCalendarEvent({
    summary: `${service.name} — ${args.caller_name || args.caller_email} (phone booking)`,
    description: `Service: ${service.name}\nBooked via phone AI receptionist`,
    attendeeEmail: args.caller_email,
    startISO: start.toISOString(),
    durationMinutes,
    locale: loc,
  }).catch((e) => ({ ok: false, error: String(e) }));

  const dateLabel = start.toLocaleDateString(loc, { weekday: 'long', month: 'long', day: 'numeric' });
  const timeLabel = start.toLocaleTimeString(loc, { hour: 'numeric', minute: '2-digit' });
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

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const message: VapiFunctionCallMessage = body.message || body;
  const locale: Locale = (body.locale || 'en') as Locale;

  // Newer Vapi format: message.toolCalls[]. Older format: message.functionCall.
  const calls = message.toolCalls
    ? message.toolCalls.map((tc) => ({ id: tc.id, name: tc.function.name, args: tc.function.arguments }))
    : message.functionCall
    ? [{ id: 'legacy', name: message.functionCall.name, args: message.functionCall.parameters }]
    : [];

  if (calls.length === 0) {
    return NextResponse.json({ received: true });
  }

  const results = await Promise.all(
    calls.map(async (call) => {
      let resultText: string;
      if (call.name === 'answer_question') {
        resultText = await answerQuestion(call.args.query || '', locale);
      } else if (call.name === 'book_appointment') {
        resultText = await bookAppointment(call.args);
      } else {
        resultText = "I'm not sure how to do that yet.";
      }
      return { toolCallId: call.id, result: resultText };
    })
  );

  // Vapi expects { results: [...] } for toolCalls, or a flat { result } for legacy functionCall.
  if (message.toolCalls) {
    return NextResponse.json({ results });
  }
  return NextResponse.json({ result: results[0]?.result });
}
