import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Explicitly allow public LTI, Health, and Access Code endpoints
  if (
    pathname.startsWith('/api/lti/') ||
    pathname.startsWith('/api/health') ||
    pathname.startsWith('/api/access-code/')
  ) {
    return NextResponse.next();
  }

  // 2. Protect creation routes (Home, Preview, Classroom Generation API)
  const isCreationRoute = 
    pathname === '/' || 
    pathname.startsWith('/generation-preview') ||
    pathname.startsWith('/api/classroom');

  if (isCreationRoute) {
    const accessCookie = request.cookies.get('openmaic_access');
    
    // Validate the cookie (simple check for this iteration)
    if (!accessCookie || accessCookie.value !== 'true') {
      // Redirect to a simple login page or return 401
      return NextResponse.redirect(new URL('/api/access-code/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
