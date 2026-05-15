import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createAccessToken } from '@/lib/auth/access-code';

export async function POST(req: Request) {
  const { code } = await req.json();
  const ACCESS_CODE = process.env.ACCESS_CODE;

  if (!ACCESS_CODE || code !== ACCESS_CODE) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  (await cookies()).set('luxup_access', createAccessToken(ACCESS_CODE), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });

  return NextResponse.json({ success: true });
}
