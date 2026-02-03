import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createNotificationConfig, getNotificationConfigs, initializeDefaultNotifications } from '@/lib/notifications/notification-service'
import { validateApiRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    if (!validateApiRequest(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const configs = await getNotificationConfigs()
    return NextResponse.json({
      success: true,
      notifications: configs,
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    if (!validateApiRequest(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()

    const config = await createNotificationConfig({
      type: body.type || 'webhook',
      config: body.config || {},
      minCvssScore: body.minCvssScore,
      severityLevel: body.severityLevel,
      keywords: body.keywords,
      cveIds: body.cveIds,
    })

    return NextResponse.json({
      success: true,
      message: 'Notification configuration created',
    })
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    )
  }
}
