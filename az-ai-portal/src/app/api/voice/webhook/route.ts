import { NextRequest, NextResponse } from 'next/server';
import { runTool } from '@/lib/voiceTools';
import type { Locale } from '@/lib/data';

// ─────────────────────────────────────────────────────────────────────
// Webhook for Vapi. Configure a Vapi Assistant with this URL as its
// "Server URL" and define two tools — `answer_question` and
// `book_appointment` — matching the schemas in .env.example. The
// assistant (an LLM on Vapi's side) handles the actual conversation;
// this endpoint just executes the two actions it can ask for.
// ─────────────────────────────────────────────────────────────────────

interface VapiFunctionCallMessage {
  type: string;
  functionCall?: { name: string; parameters: Record<string, any> };
  toolCalls?: { id: string; function: { name: string; arguments: Record<string, any> } }[];
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
    calls.map(async (call) => ({ toolCallId: call.id, result: await runTool(call.name, call.args, locale) }))
  );

  // Vapi expects { results: [...] } for toolCalls, or a flat { result } for legacy functionCall.
  if (message.toolCalls) {
    return NextResponse.json({ results });
  }
  return NextResponse.json({ result: results[0]?.result });
}
