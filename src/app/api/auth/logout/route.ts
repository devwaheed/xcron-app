import { NextResponse } from 'next/server';

/**
 * POST /api/auth/logout
 * Ends the session by clearing the auth cookie.
 */
export async function POST() {
  const response = NextResponse.json({ success: true });

  response.cookies.set('sb-access-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}
