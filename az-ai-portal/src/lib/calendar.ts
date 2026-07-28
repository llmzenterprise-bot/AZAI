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

function base64url(input: Buffer | string) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function getAccessToken(): Promise<string | null> {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!email || !key) return null;

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
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(unsigned);
  signer.end();
  const signature = signer.sign(key.replace(/\\n/g, '\n'));
  const jwt = `${unsigned}.${base64url(signature)}`;

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.access_token as string;
}

export interface CalendarEventInput {
  summary: string;
  description: string;
  attendeeEmail: string;
  startISO: string; // full ISO datetime
  durationMinutes: number;
  locale: string;
}

export async function createCalendarEvent(input: CalendarEventInput): Promise<{ ok: boolean; eventUrl?: string; error?: string }> {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  if (!calendarId) return { ok: false, error: 'GOOGLE_CALENDAR_ID not configured' };

  const token = await getAccessToken();
  if (!token) return { ok: false, error: 'Google service account not configured' };

  const start = new Date(input.startISO);
  const end = new Date(start.getTime() + input.durationMinutes * 60000);

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?sendUpdates=all`,
    {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        summary: input.summary,
        description: input.description,
        start: { dateTime: start.toISOString() },
        end: { dateTime: end.toISOString() },
        attendees: [{ email: input.attendeeEmail }],
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
  const token = await getAccessToken();
  if (!token) return { ok: false, error: 'Google service account not configured' };

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
