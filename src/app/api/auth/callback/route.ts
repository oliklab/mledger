// src/app/api/auth/callback/route.ts
import { NextResponse } from 'next/server'
import { NewSSRSassClient } from "@/lib/supabase/server";
import { AuthStore } from '@/storage/auth';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = await NewSSRSassClient()
    const client = supabase.SupabaseClient()

    await new AuthStore(supabase).ExchangeCodeForSession(code)

    // Check MFA status
    const { data: aal, error: aalError } = await client.auth.mfa.getAuthenticatorAssuranceLevel()

    if (aalError) {
      console.error('Error checking MFA status:', aalError)
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // If user needs to complete MFA verification
    if (aal.nextLevel === 'aal2' && aal.nextLevel !== aal.currentLevel) {
      return NextResponse.redirect(new URL('/auth/2fa', request.url))
    }

    // If MFA is not required or already verified, proceed to app
    return NextResponse.redirect(new URL('/app', request.url))
  }

  // If no code provided, redirect to login
  return NextResponse.redirect(new URL('/auth/login', request.url))
}