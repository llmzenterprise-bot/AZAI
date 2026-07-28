import { NextResponse } from 'next/server';

// TEMPORARY diagnostic route — reports only whether env vars are present and
// their length, never the actual values. Delete after use.
export async function GET() {
  const check = (name: string) => {
    const v = process.env[name];
    return { present: !!v, length: v ? v.length : 0 };
  };
  return NextResponse.json({
    GOOGLE_SERVICE_ACCOUNT_EMAIL: check('GOOGLE_SERVICE_ACCOUNT_EMAIL'),
    GOOGLE_SERVICE_ACCOUNT_KEY: check('GOOGLE_SERVICE_ACCOUNT_KEY'),
    GOOGLE_CALENDAR_ID: check('GOOGLE_CALENDAR_ID'),
  });
}
