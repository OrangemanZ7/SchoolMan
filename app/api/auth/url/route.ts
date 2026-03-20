import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const baseUrl = appUrl.replace(/\/$/, '');
  const redirectUri = `${baseUrl}/api/auth/callback`;

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  return NextResponse.json({ url: authUrl });
}
