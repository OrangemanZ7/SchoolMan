import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  // Protect all API routes except auth
  if (request.nextUrl.pathname.startsWith('/api/') && !request.nextUrl.pathname.startsWith('/api/auth/')) {
    const token = request.cookies.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    // We can't verify JWT in Edge runtime easily without a lightweight library,
    // so we just check for presence here. The real verification happens in the 
    // AuthProvider and individual API routes if needed.
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
