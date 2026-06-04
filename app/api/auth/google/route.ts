import { type NextRequest } from 'next/server'
import { createGoogleLoginResponse } from '@/lib/google-oauth'

export function GET(request: NextRequest) {
  return createGoogleLoginResponse(request)
}
