import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyLtiSession, SESSION_COOKIE } from '@/lib/lti/session';

/**
 * Check if AGS grade passback is available for the current LTI session.
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;

    if (!token) {
      return NextResponse.json({ available: false });
    }

    const session = await verifyLtiSession(token);
    if (!session) {
      return NextResponse.json({ available: false });
    }

    const available = !!(session.agsLineItem || session.agsEndpoint);

    return NextResponse.json({
      available,
      lineItem: session.agsLineItem || null,
      scope: session.agsScope || [],
    });
  } catch {
    return NextResponse.json({ available: false });
  }
}
