import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    buildTs: process.env.NEXT_PUBLIC_BUILD_TS || 'not-set',
    nodeEnv: process.env.NODE_ENV,
    allowedFrameAncestors: process.env.ALLOWED_FRAME_ANCESTORS || 'not-set (frame-ancestors: self only)',
  });
}
