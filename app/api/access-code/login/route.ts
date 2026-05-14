import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  const { code } = await req.json();
  const ACCESS_CODE = process.env.ACCESS_CODE;

  if (!ACCESS_CODE || code !== ACCESS_CODE) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // Set the secure cookie
  (await cookies()).set('openmaic_access', 'true', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });

  return NextResponse.json({ success: true });
}
