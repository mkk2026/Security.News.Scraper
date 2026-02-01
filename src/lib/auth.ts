import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export function validateApiRequest(request: NextRequest): NextResponse | null {
  const authHeader = request.headers.get('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Missing or invalid token' },
      { status: 401 }
    )
  }

  const token = authHeader.split(' ')[1]
  const secretToken = process.env.API_SECRET_TOKEN

  if (!secretToken) {
    console.error('API_SECRET_TOKEN is not configured')
    return NextResponse.json(
      { success: false, error: 'Internal Server Error: Security configuration missing' },
      { status: 500 }
    )
  }

  try {
    const tokenBuffer = Buffer.from(token)
    const secretTokenBuffer = Buffer.from(secretToken)

    // Check length match first to avoid exception in timingSafeEqual
    if (tokenBuffer.length !== secretTokenBuffer.length) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid token' },
        { status: 401 }
      )
    }

    if (!crypto.timingSafeEqual(tokenBuffer, secretTokenBuffer)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid token' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Error verifying token:', error)
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Invalid token format' },
      { status: 401 }
    )
  }

  return null
}
