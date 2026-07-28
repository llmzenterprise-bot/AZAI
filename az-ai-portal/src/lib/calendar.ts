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
// ─────────────────────────────────────────────────────────────────────

const SCOPE = 'https://www.googleapis.com/auth/calendar.events';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

// The business's local timezone. Events are sent to Google as a "floating"
// local time paired with this IANA zone name — Google resolves it correctly
// regardless of what timezone the server itself happens to run in, avoiding
// UTC-conversion bugs entirely. Arizona (Phoenix) does not observe daylight
// saving time, so this stays fixed at UTC-7 year-round.
export const BUSINESS_TIMEZONE = 'America/Phoenix';

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

function pad2(n: number) {
  return n.toString().padStart(2, '0');
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

export async function createCalendarEvent(input: CalendarEventInput): Promise<{ ok: boolean; eventUrl?: string; error?: string }> {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  if (!calendarId) return { ok: false, error: 'GOOGLE_CALENDAR_ID not configured' };

  const { token, error: tokenError } = await getAccessToken();
  if (!token) return { ok: false, error: tokenError || 'Google service account not configured' };

  const startLocal = `${input.dateStr}T${pad2(input.hour)}:${pad2(input.minute)}:00`;
  const endParts = addMinutes(input.dateStr, input.hour, input.minute, input.durationMinutes);
  const endLocal = `${endParts.dateStr}T${pad2(endParts.hour)}:${pad2(endParts.minute)}:00`;

  // Note: plain service accounts (no Google Workspace domain-wide delegation)
  // are not allowed to invite attendees — the customer's email goes in the
  // description instead. The confirmation email (Resend) is what actually
  // reaches the customer.
  //
  // dateTime is sent WITHOUT a Z/offset suffix, paired with an explicit
  // timeZone field — Google resolves this as that exact local time in that
  // zone, regardless of what timezone this server process runs in.
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
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
  return { ok: true, eventUrl: data.htmlLink };
}

export async function deleteCalendarEvent(eventId: string): Promise<{ ok: boolean; error?: string }> {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  if (!calendarId) return { ok: false, error: 'GOOGLE_CALENDAR_ID not configured' };
  const { token, error: tokenError } = await getAccessToken();
  if (!token) return { ok: false, error: tokenError || 'Google service account not configured' };

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}?sendUpdates=all`,
    { method: 'DELETE', headers: { authorization: `Bearer ${token}` } }
  );
  if (!res.ok && res.status !== 410) {
    const text = await res.text().catch(() => '');
    return { ok: false, error: `Calendar API error: ${res.status} ${text}` };
  }
  return { ok: true };
}
