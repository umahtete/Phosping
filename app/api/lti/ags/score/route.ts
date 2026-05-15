import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { submitScore, type ScorePayload } from '@/lib/lti/ags';
import { verifyLtiSession, SESSION_COOKIE } from '@/lib/lti/session';

/**
 * Grade passback endpoint — submits quiz scores to the LMS via LTI AGS.
 *
 * POST body:
 *   scoreGiven: number     — Points earned
 *   scoreMaximum: number   — Total possible points
 *   comment?: string       — Optional comment
 *   activityProgress?: string — Default: 'Completed'
 *   gradingProgress?: string  — Default: 'FullyGraded'
 */
export async function POST(req: Request) {
  try {
    // Verify LTI session
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;

    if (!token) {
      return NextResponse.json({ error: 'No LTI session' }, { status: 401 });
    }

    const session = await verifyLtiSession(token);
    if (!session) {
      return NextResponse.json({ error: 'Invalid LTI session' }, { status: 401 });
    }

    // Check AGS availability
    if (!session.agsLineItem && !session.agsEndpoint) {
      return NextResponse.json(
        { error: 'AGS not available for this launch (no lineitem endpoint)' },
        { status: 400 },
      );
    }

    // Parse request body
    const body = await req.json();
    const { scoreGiven, scoreMaximum, comment, activityProgress, gradingProgress } = body;

    if (typeof scoreGiven !== 'number' || typeof scoreMaximum !== 'number') {
      return NextResponse.json(
        { error: 'Missing required fields: scoreGiven, scoreMaximum' },
        { status: 400 },
      );
    }

    // Build score payload
    const lineItemUrl = session.agsLineItem || session.agsEndpoint || '';

    const score: ScorePayload = {
      scoreGiven,
      scoreMaximum,
      comment: comment || undefined,
      activityProgress: activityProgress || 'Completed',
      gradingProgress: gradingProgress || 'FullyGraded',
      userId: session.userId,
      timestamp: new Date().toISOString(),
    };

    // Submit to platform
    const result = await submitScore(session.platformIssuer, lineItemUrl, score);

    if (!result.success) {
      return NextResponse.json(
        { error: `Grade passback failed: ${result.error}` },
        { status: 502 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Grade passback error:', error);
    return NextResponse.json(
      { error: `Internal error: ${error instanceof Error ? error.message : 'Unknown'}` },
      { status: 500 },
    );
  }
}
