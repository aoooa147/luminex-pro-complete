import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Security headers
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "img-src 'self' data: blob: https:; " +
    "style-src 'self' 'unsafe-inline'; " +
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'; " +
    "connect-src 'self' https://developer.worldcoin.org https://*.optimism.io wss://*.optimism.io; " +
    "frame-src 'self' https://verify.worldcoin.org;"
  )
  
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
