import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyLtiSession, SESSION_COOKIE } from '@/lib/lti/session';

/**
 * Check if the current request has a valid LTI session.
 * Used by the client-side AccessCodeGuard to detect LTI users.
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;

    if (!token) {
      return NextResponse.json({ valid: false });
    }

    const session = await verifyLtiSession(token);
    if (!session) {
      return NextResponse.json({ valid: false });
    }

    return NextResponse.json({
      valid: true,
      userName: session.userName,
      userRoles: session.userRoles,
      contextTitle: session.contextTitle,
    });
  } catch {
    return NextResponse.json({ valid: false });
  }
}
