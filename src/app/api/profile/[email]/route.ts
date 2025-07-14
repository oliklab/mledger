import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(
  request: Request,
  { params }: { params: { email: string } }
) {
  const { email } = await params;

  if (!email) {
    return NextResponse.json({ error: 'Identifier is required' }, { status: 400 });
  }

  try {
    const hash = crypto
      .createHash('sha256')
      .update(email.trim().toLowerCase())
      .digest('hex');

    const gravatarApiUrl = `https://api.gravatar.com/v3/profiles/${hash}`;
    const apiKey = process.env.NEXT_APP_GRAVATER_API_KEY;

    if (!apiKey) {
      console.error('GRAVATAR_API_KEY environment variable is not set.');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const response = await fetch(gravatarApiUrl, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });

    const data = await response.json();

    // Forward Gravatar's response, including its status code and body
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Gravatar API proxy error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

