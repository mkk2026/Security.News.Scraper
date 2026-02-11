import { db } from '@/lib/db'
import { isSafeUrlAsync } from '@/lib/security'

export interface NotificationConfig {
  type: 'email' | 'webhook'
  enabled: boolean
  minCvssScore?: number
  severityLevel?: string
  keywords?: string[]
  cveIds?: string[]
  config: Record<string, any>
}

export interface VulnerabilityAlert {
  articleId: string
  articleTitle: string
  articleUrl: string
  source: string
  severityLevel: string
  cves: Array<{
    cveId: string
    cvssScore?: number
    severity?: string
  }>
  publishedAt: Date
}

/**
 * Check if a vulnerability matches notification criteria
 */
export function matchesNotificationCriteria(
  article: VulnerabilityAlert,
  notificationConfig: NotificationConfig
): boolean {
  const { minCvssScore, severityLevel, keywords, cveIds } = notificationConfig

  // Check CVSS score threshold
  if (minCvssScore) {
    const maxCvss = Math.max(...article.cves.map(c => c.cvssScore || 0))
    if (maxCvss < minCvssScore) {
      return false
    }
  }

  // Check severity level
  if (severityLevel && severityLevel !== 'all') {
    const severityMatch = article.severityLevel === severityLevel ||
      article.cves.some(c => c.severity === severityLevel)
    if (!severityMatch) {
      return false
    }
  }

  // Check keywords
  if (keywords && keywords.length > 0) {
    const title = article.articleTitle.toLowerCase()
    const keywordMatch = keywords.some(keyword => title.includes(keyword.toLowerCase()))
    if (!keywordMatch) {
      return false
    }
  }

  // Check specific CVE IDs
  if (cveIds && cveIds.length > 0) {
    const articleCveIds = article.cves.map(c => c.cveId)
    const cveMatch = cveIds.some(cveId => articleCveIds.includes(cveId))
    if (!cveMatch) {
      return false
    }
  }

  return true
}

/**
 * Send notification based on type
 */
export async function sendNotification(
  config: NotificationConfig,
  alert: VulnerabilityAlert
): Promise<boolean> {
  try {
    if (!config.enabled) {
      return false
    }

    console.log(`Sending ${config.type} notification for: ${alert.articleTitle}`)

    switch (config.type) {
      case 'email':
        return await sendEmailNotification(config, alert)
      case 'webhook':
        return await sendWebhookNotification(config, alert)
      default:
        console.error(`Unknown notification type: ${config.type}`)
        return false
    }
  } catch (error) {
    console.error('Error sending notification:', error)
    return false
  }
}

/**
 * Send email notification
 */
async function sendEmailNotification(
  config: NotificationConfig,
  alert: VulnerabilityAlert
): Promise<boolean> {
  // In a production environment, you would integrate with:
  // - SendGrid, AWS SES, Mailgun, or similar email service
  // - SMTP server
  // - Nodemailer library

  console.log('📧 Email Notification Details:')
  console.log(`   To: ${config.config.to || 'Not configured'}`)
  console.log(`   Subject: 🚨 Critical Security Alert: ${alert.articleTitle}`)
  console.log(`   Source: ${alert.source}`)
  console.log(`   Severity: ${alert.severityLevel}`)
  console.log(`   CVEs: ${alert.cves.map(c => c.cveId).join(', ')}`)
  console.log(`   URL: ${alert.articleUrl}`)

  // TODO: Implement actual email sending
  // const nodemailer = require('nodemailer')
  // const transporter = nodemailer.createTransport({ ... })
  // await transporter.sendMail({ ... })

  return true
}

/**
 * Send webhook notification
 */
async function sendWebhookNotification(
  config: NotificationConfig,
  alert: VulnerabilityAlert
): Promise<boolean> {
  const webhookUrl = config.config.url

  if (!webhookUrl) {
    console.error('Webhook URL not configured')
    return false
  }

  if (!(await isSafeUrlAsync(webhookUrl))) {
    console.error('Security Warning: Blocked unsafe webhook URL (SSRF protection):', webhookUrl)
    return false
  }

  const payload = {
    alert: {
      type: 'vulnerability',
      severity: alert.severityLevel,
      article: {
        id: alert.articleId,
        title: alert.articleTitle,
        url: alert.articleUrl,
        source: alert.source,
        publishedAt: alert.publishedAt.toISOString(),
      },
      cves: alert.cves,
    },
    timestamp: new Date().toISOString(),
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SecurityMonitor/1.0',
        ...(config.config.headers || {}),
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    console.log('✅ Webhook notification sent successfully')
    return true
  } catch (error) {
    console.error('❌ Webhook notification failed:', error)
    return false
  }
}

/**
 * Check all active notifications for a new vulnerability
 */
export async function processVulnerabilityAlert(
  alert: VulnerabilityAlert
): Promise<void> {
  try {
    const notifications = await db.notification.findMany({
      where: { enabled: true },
    })

    console.log(`Processing alert against ${notifications.length} active notification configs`)

    for (const notification of notifications) {
      try {
        const config: NotificationConfig = {
          type: notification.type as 'email' | 'webhook',
          enabled: notification.enabled,
          config: JSON.parse(notification.config),
          minCvssScore: notification.minCvssScore ?? undefined,
          severityLevel: notification.severityLevel ?? undefined,
          keywords: notification.keywords?.split(',').map(k => k.trim()).filter(Boolean) ?? undefined,
          cveIds: notification.cveIds?.split(',').map(c => c.trim()).filter(Boolean) ?? undefined,
        }

        if (matchesNotificationCriteria(alert, config)) {
          const sent = await sendNotification(config, alert)

          if (sent) {
            await db.notification.update({
              where: { id: notification.id },
              data: { lastNotifiedAt: new Date() },
            })
          }
        }
      } catch (error) {
        console.error(`Error processing notification ${notification.id}:`, error)
      }
    }
  } catch (error) {
    console.error('Error processing vulnerability alert:', error)
  }
}

/**
 * Create a new notification configuration
 */
export async function createNotificationConfig(
  config: Omit<NotificationConfig, 'enabled'>
): Promise<void> {
  try {
    if (config.type === 'webhook' && config.config?.url) {
      if (!(await isSafeUrlAsync(config.config.url))) {
        throw new Error('Invalid or unsafe webhook URL')
      }
    }

    await db.notification.create({
      data: {
        type: config.type,
        enabled: true,
        config: JSON.stringify(config.config),
        minCvssScore: config.minCvssScore,
        severityLevel: config.severityLevel,
        keywords: config.keywords?.join(','),
        cveIds: config.cveIds?.join(','),
      },
    })

    console.log('✅ Notification config created successfully')
  } catch (error) {
    console.error('Error creating notification config:', error)
    throw error
  }
}

/**
 * Get all notification configurations
 */
export async function getNotificationConfigs(): Promise<NotificationConfig[]> {
  try {
    const notifications = await db.notification.findMany()

    return notifications.map(n => ({
      type: n.type as 'email' | 'webhook',
      enabled: n.enabled,
      config: JSON.parse(n.config),
      minCvssScore: n.minCvssScore ?? undefined,
      severityLevel: n.severityLevel ?? undefined,
      keywords: n.keywords?.split(',').map(k => k.trim()).filter(Boolean) ?? undefined,
      cveIds: n.cveIds?.split(',').map(c => c.trim()).filter(Boolean) ?? undefined,
    }))
  } catch (error) {
    console.error('Error fetching notification configs:', error)
    throw error
  }
}

/**
 * Initialize default notification configurations
 */
export async function initializeDefaultNotifications(): Promise<void> {
  try {
    const existing = await db.notification.count()

    if (existing > 0) {
      console.log('Notifications already configured')
      return
    }

    // Create default critical vulnerability notification
    await db.notification.create({
      data: {
        type: 'webhook',
        enabled: false, // Disabled by default, user needs to configure
        config: JSON.stringify({
          url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL',
        }),
        minCvssScore: 7.0,
        severityLevel: 'HIGH',
      },
    })

    console.log('✅ Default notification configs initialized')
  } catch (error) {
    console.error('Error initializing default notifications:', error)
  }
}
