// ─────────────────────────────────────────────────────────────────────
// Twilio SMS — dependency-free, same pattern as email.ts/calendar.ts
// (plain fetch, no SDK). Used to text a live team member during a call
// (e.g. "hot lead on the line, wants to talk to a human now") — distinct
// from Retell's native transfer_call (which connects the caller's voice
// directly to a phone number).
//
// Required env vars:
//   TWILIO_ACCOUNT_SID
//   TWILIO_AUTH_TOKEN
//   TWILIO_FROM_NUMBER   — a Twilio number capable of sending SMS
// ─────────────────────────────────────────────────────────────────────

export async function sendSms(to: string, body: string): Promise<{ ok: boolean; error?: string }> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!sid || !token || !from) return { ok: false, error: 'Twilio env vars not configured' };

  const auth = Buffer.from(`${sid}:${token}`).toString('base64');
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      authorization: `Basic ${auth}`,
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: to, From: from, Body: body }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    return { ok: false, error: `Twilio API error: ${res.status} ${text}` };
  }
  return { ok: true };
}
