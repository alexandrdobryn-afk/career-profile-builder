import { type NextRequest } from 'next/server'
import { handleGoogleCallback } from '@/lib/google-oauth'

export async function GET(request: NextRequest) {
  return handleGoogleCallback(request)
}
