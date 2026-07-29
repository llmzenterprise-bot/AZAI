import crypto from 'crypto';

// ─────────────────────────────────────────────────────────────────────
// Google Calendar integration via a service account (no OAuth popup —
// the business shares ONE calendar with the service account's email,
// and every booking creates an event there directly).
//
// Required env vars (set in Vercel → Settings → Environment Variables):
//   GOOGLE_SERVICE_ACCOUNT_EMAIL   — from the downloaded JSON key file
//   GOOGLE_SERVICE_ACCOUNT_KEY     — the "private_key" field (keep \n escapes)
//   GOOGLE_CALENDAR_ID             — the calendar to write to (often the
//                                    business's own Gmail address, once
//                                    shared with the service account)
//
// The calendar doubles as the only "appointments database" this system
// has (there's no separate table of bookings) — cancel/reschedule work
// by searching the calendar itself for an event whose description
// contains the customer's email, added at booking time.
// ─────────────────────────────────────────────────────────────────────

const SCOPE = 'https://www.googleapis.com/auth/calendar.events';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

// The business's local timezone. Events are sent to Google as a "floating"
// local time paired with this IANA zone name — Google resolves it correctly
// regardless of what timezone the server itself happens to run in, avoiding
// UTC-conversion bugs entirely. Arizona (Phoenix) does not observe daylight
// saving time, so this stays fixed at UTC-7 year-round.
export const BUSINESS_TIMEZONE = 'America/Phoenix';

// Standard bookable hours (24-hour), matching the website's own booking
// slots (9,10,11am, 1,2,3,4,5pm) — used to suggest alternatives when a
// requested time is already taken.
export const BUSINESS_HOUR_SLOTS = [9, 10, 11, 13, 14, 15, 16, 17];

function base64url(input: Buffer | string) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function getAccessToken(): Promise<{ token: string | null; error?: string }> {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim().replace(/^["']|["']$/g, '');
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.trim().replace(/^["']|["']$/g, '');
  if (!email || !key) return { token: null, error: 'env vars missing' };

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claims = {
    iss: email,
    scope: SCOPE,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  };
  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claims))}`;
  let jwt: string;
  try {
    const signer = crypto.createSign('RSA-SHA256');
    signer.update(unsigned);
    signer.end();
    const signature = signer.sign(key.replace(/\\n/g, '\n'));
    jwt = `${unsigned}.${base64url(signature)}`;
  } catch (e) {
    return { token: null, error: `JWT signing failed (key format issue): ${String(e)}` };
  }

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    return { token: null, error: `Google token exchange failed: ${res.status} ${text}` };
  }
  const data = await res.json();
  return { token: data.access_token as string };
}

// Resolves the calendar ID + a bearer token together, since every function
// below needs both — avoids repeating the same two checks everywhere.
async function auth(): Promise<{ calendarId: string; token: string } | { error: string }> {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  if (!calendarId) return { error: 'GOOGLE_CALENDAR_ID not configured' };
  const { token, error } = await getAccessToken();
  if (!token) return { error: error || 'Google service account not configured' };
  return { calendarId, token };
}

function pad2(n: number) {
  return n.toString().padStart(2, '0');
}

function localDateTime(dateStr: string, hour: number, minute: number) {
  return `${dateStr}T${pad2(hour)}:${pad2(minute)}:00`;
}

// Adds minutes to an {hour, minute} pair, rolling over into the next day if
// needed (not expected in practice for same-day appointment slots, but safe).
function addMinutes(dateStr: string, hour: number, minute: number, addMin: number) {
  const total = hour * 60 + minute + addMin;
  const dayOverflow = Math.floor(total / (24 * 60));
  const rem = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  let newDateStr = dateStr;
  if (dayOverflow !== 0) {
    const d = new Date(`${dateStr}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + dayOverflow);
    newDateStr = d.toISOString().slice(0, 10);
  }
  return { dateStr: newDateStr, hour: Math.floor(rem / 60), minute: rem % 60 };
}

function fmtHourLabel(hour: number, minute: number) {
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  const ampm = hour < 12 ? 'AM' : 'PM';
  return `${h12}:${pad2(minute)} ${ampm}`;
}

export interface CalendarEventInput {
  summary: string;
  description: string;
  attendeeEmail: string;
  dateStr: string; // "YYYY-MM-DD", in business-local calendar terms
  hour: number;    // 0-23, business-local (e.g. Phoenix time)
  minute: number;  // 0-59, business-local
  durationMinutes: number;
  locale: string;
}

export async function createCalendarEvent(input: CalendarEventInput): Promise<{ ok: boolean; eventUrl?: string; eventId?: string; error?: string }> {
  const a = await auth();
  if ('error' in a) return { ok: false, error: a.error };

  const startLocal = localDateTime(input.dateStr, input.hour, input.minute);
  const endParts = addMinutes(input.dateStr, input.hour, input.minute, input.durationMinutes);
  const endLocal = localDateTime(endParts.dateStr, endParts.hour, endParts.minute);

  // Note: plain service accounts (no Google Workspace domain-wide delegation)
  // are not allowed to invite attendees — the customer's email goes in the
  // description instead (and is how cancel/reschedule find the event again).
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(a.calendarId)}/events`,
    {
      method: 'POST',
      headers: { authorization: `Bearer ${a.token}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        summary: input.summary,
        description: `${input.description}\nCustomer email: ${input.attendeeEmail}`,
        start: { dateTime: startLocal, timeZone: BUSINESS_TIMEZONE },
        end: { dateTime: endLocal, timeZone: BUSINESS_TIMEZONE },
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    return { ok: false, error: `Calendar API error: ${res.status} ${text}` };
  }
  const data = await res.json();
  return { ok: true, eventUrl: data.htmlLink, eventId: data.id };
}

export async function updateCalendarEvent(
  eventId: string,
  input: { dateStr: string; hour: number; minute: number; durationMinutes: number }
): Promise<{ ok: boolean; eventUrl?: string; error?: string }> {
  const a = await auth();
  if ('error' in a) return { ok: false, error: a.error };

  const startLocal = localDateTime(input.dateStr, input.hour, input.minute);
  const endParts = addMinutes(input.dateStr, input.hour, input.minute, input.durationMinutes);
  const endLocal = localDateTime(endParts.dateStr, endParts.hour, endParts.minute);

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(a.calendarId)}/events/${eventId}`,
    {
      method: 'PATCH',
      headers: { authorization: `Bearer ${a.token}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        start: { dateTime: startLocal, timeZone: BUSINESS_TIMEZONE },
        end: { dateTime: endLocal, timeZone: BUSINESS_TIMEZONE },
      }),
    }
  );
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    return { ok: false, error: `Calendar API error: ${res.status} ${text}` };
  }
  const data = await res.json();
  return { ok: true, eventUrl: data.htmlLink };
}

export async function deleteCalendarEvent(eventId: string): Promise<{ ok: boolean; error?: string }> {
  const a = await auth();
  if ('error' in a) return { ok: false, error: a.error };

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(a.calendarId)}/events/${eventId}`,
    { method: 'DELETE', headers: { authorization: `Bearer ${a.token}` } }
  );
  if (!res.ok && res.status !== 410) {
    const text = await res.text().catch(() => '');
    return { ok: false, error: `Calendar API error: ${res.status} ${text}` };
  }
  return { ok: true };
}

// Lists raw events on the calendar between two ISO date boundaries (used
// internally by availability-checking).
async function listEvents(timeMinISO: string, timeMaxISO: string, query?: string) {
  const a = await auth();
  if ('error' in a) return { ok: false as const, error: a.error };

  const params = new URLSearchParams({
    timeMin: timeMinISO,
    timeMax: timeMaxISO,
    singleEvents: 'true',
    orderBy: 'startTime',
  });
  if (query) params.set('q', query);

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(a.calendarId)}/events?${params.toString()}`,
    { headers: { authorization: `Bearer ${a.token}` } }
  );
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    return { ok: false as const, error: `Calendar API error: ${res.status} ${text}` };
  }
  const data = await res.json();
  return { ok: true as const, items: (data.items || []) as any[] };
}

export interface AvailabilityResult {
  ok: boolean;
  available?: boolean;
  conflictSummary?: string;
  suggestions?: { dateStr: string; hour: number; minute: number; label: string }[];
  error?: string;
}

// Checks whether a specific slot is free, and if not, suggests the next few
// open slots (same day first, then the following day) from the standard
// business-hour list.
export async function checkAvailability(
  dateStr: string, hour: number, minute: number, durationMinutes: number
): Promise<AvailabilityResult> {
  const startLocal = localDateTime(dateStr, hour, minute);
  const endParts = addMinutes(dateStr, hour, minute, durationMinutes);
  const endLocal = localDateTime(endParts.dateStr, endParts.hour, endParts.minute);

  // Google wants proper offsets for timeMin/timeMax range queries — since
  // Phoenix never observes DST, -07:00 is always correct.
  const dayStart = `${dateStr}T00:00:00-07:00`;
  const dayEnd = `${dateStr}T23:59:59-07:00`;

  const dayEvents = await listEvents(dayStart, dayEnd);
  if (!dayEvents.ok) return { ok: false, error: dayEvents.error };

  const reqStart = new Date(`${startLocal}-07:00`).getTime();
  const reqEnd = new Date(`${endLocal}-07:00`).getTime();

  const conflict = dayEvents.items.find((ev) => {
    const s = ev.start?.dateTime ? new Date(ev.start.dateTime).getTime() : null;
    const e = ev.end?.dateTime ? new Date(ev.end.dateTime).getTime() : null;
    if (s === null || e === null) return false;
    return s < reqEnd && e > reqStart;
  });

  if (!conflict) return { ok: true, available: true };

  // Busy — build a small pool of candidate slots (rest of today, then
  // tomorrow) and check each against the day's events to find open ones.
  const suggestions: AvailabilityResult['suggestions'] = [];
  const candidateDays = [dateStr, addMinutes(dateStr, 23, 59, 1).dateStr];
  for (const day of candidateDays) {
    const events = day === dateStr ? dayEvents : await listEvents(`${day}T00:00:00-07:00`, `${day}T23:59:59-07:00`);
    if (!('items' in events) || !events.ok) continue;
    for (const slotHour of BUSINESS_HOUR_SLOTS) {
      if (day === dateStr && slotHour <= hour) continue; // don't suggest earlier-than-requested on the same day
      const slotStart = new Date(`${localDateTime(day, slotHour, 0)}-07:00`).getTime();
      const slotEnd = slotStart + durationMinutes * 60000;
      const busy = events.items.some((ev) => {
        const s = ev.start?.dateTime ? new Date(ev.start.dateTime).getTime() : null;
        const e = ev.end?.dateTime ? new Date(ev.end.dateTime).getTime() : null;
        return s !== null && e !== null && s < slotEnd && e > slotStart;
      });
      if (!busy) {
        suggestions.push({ dateStr: day, hour: slotHour, minute: 0, label: fmtHourLabel(slotHour, 0) });
      }
      if (suggestions.length >= 3) break;
    }
    if (suggestions.length >= 3) break;
  }

  return {
    ok: true,
    available: false,
    conflictSummary: conflict.summary || 'an existing appointment',
    suggestions,
  };
}

export interface FoundAppointment {
  eventId: string;
  summary: string;
  startISO: string;
  label: string; // human-readable date + time
}

// Finds upcoming events whose description mentions this email — the only
// way to look up "a caller's appointment" without a separate database.
export async function findAppointmentsByEmail(email: string, locale = 'en'): Promise<{ ok: boolean; appointments?: FoundAppointment[]; error?: string }> {
  const now = new Date().toISOString();
  const future = new Date(Date.now() + 1000 * 60 * 60 * 24 * 90).toISOString(); // 90-day lookahead
  const result = await listEvents(now, future, email);
  if (!result.ok) return { ok: false, error: result.error };

  const appointments = result.items
    .filter((ev) => (ev.description || '').includes(email))
    .map((ev) => {
      const start = ev.start?.dateTime ? new Date(ev.start.dateTime) : null;
      const label = start
        ? start.toLocaleString(locale, { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: BUSINESS_TIMEZONE })
        : 'unknown time';
      return { eventId: ev.id, summary: ev.summary || 'Appointment', startISO: ev.start?.dateTime || '', label };
    });

  return { ok: true, appointments };
}
