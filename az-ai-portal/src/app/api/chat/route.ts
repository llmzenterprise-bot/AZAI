import { NextRequest, NextResponse } from 'next/server';
import { groundedRespond, KB, type Locale } from '@/lib/data';

// ─────────────────────────────────────────────────────────────────────
// AI chat endpoint. Two modes:
//  • DEMO (no ANTHROPIC_API_KEY): deterministic grounded engine.
//  • LIVE (key set): calls Claude, hard-grounded to the knowledge base via a
//    system prompt so it NEVER fabricates business info.
// Response shape is identical either way: { intent, text }.
// ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { message, locale = 'en' } = await req.json();
  const loc = (['en', 'es', 'fr'].includes(locale) ? locale : 'en') as Locale;

  if (!message || typeof message !== 'string') {
    return NextResponse.json({ error: 'message required' }, { status: 400 });
  }

  // Always compute the grounded intent (routing: book/cancel/reschedule/answer).
  const base = groundedRespond(message, loc);

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    // DEMO mode — return the grounded engine's answer.
    return NextResponse.json(base);
  }

  // LIVE mode — let Claude phrase the answer, but only from the KB context.
  try {
    const kbContext = Object.values(KB[loc]).join('\n');
    const system =
      `You are the AZ AI Geeks booking assistant. Reply in the user's language (${loc}). ` +
      `Answer ONLY using the knowledge base below. If the answer isn't in it, say you don't know ` +
      `and offer to connect a human (hello@azaigeeks.com). Never invent hours, prices, or promises. ` +
      `Keep replies short and friendly.\n\nKNOWLEDGE BASE:\n${kbContext}`;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 400,
        system,
        messages: [{ role: 'user', content: message }],
      }),
    });
    if (!res.ok) return NextResponse.json(base);
    const data = await res.json();
    const text = data?.content?.[0]?.text?.trim() || base.text;
    // Keep the deterministic intent so the UI still routes book/cancel/reschedule.
    return NextResponse.json({ intent: base.intent, text });
  } catch {
    return NextResponse.json(base);
  }
}
