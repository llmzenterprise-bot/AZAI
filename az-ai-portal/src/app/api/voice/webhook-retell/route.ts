import { NextRequest, NextResponse } from 'next/server';
import { runTool } from '@/lib/voiceTools';
import type { Locale } from '@/lib/data';

// ─────────────────────────────────────────────────────────────────────
// Webhook for Retell AI's "Custom Function" tool type. Configure a
// Retell Agent (using Retell's own hosted LLM) with two Custom
// Functions — `answer_question` and `book_appointment` — pointing at
// this URL. Retell's LLM handles the conversation and natural-language
// understanding; this endpoint just executes what it asks for.
//
// NOTE: Retell's exact request/response field names have shifted across
// their API versions in the past, so this parses a few common shapes
// defensively (name/function_name/tool_name, args/arguments/parameters).
// If Retell's dashboard shows your function calls failing, check the
// "Inspect" / call-log payload in Retell and tell me the exact JSON
// shape it actually sent — this is a two-line fix to match it exactly.
// ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  const name: string = body.name || body.function_name || body.tool_name || '';
  const args: Record<string, any> = body.args || body.arguments || body.parameters || {};
  const locale: Locale = (body.locale || body.call?.metadata?.locale || 'en') as Locale;

  if (!name) {
    return NextResponse.json({ received: true, note: 'no function name found in request' });
  }

  const result = await runTool(name, args, locale);

  // Most common expected shape across Retell's custom-function docs.
  return NextResponse.json({ result });
}
