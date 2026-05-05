import { google } from 'googleapis'

function getEnv(...names: string[]) {
  for (const name of names) {
    const value = process.env[name]?.trim()
    if (value) return value
  }
  return ''
}

export function getGmailConfig() {
  return {
    clientId: getEnv('GMAIL_CLIENT_ID', 'GOOGLE_CLIENT_ID'),
    clientSecret: getEnv('GMAIL_CLIENT_SECRET', 'GOOGLE_CLIENT_SECRET'),
    refreshToken: getEnv('GMAIL_REFRESH_TOKEN', 'GOOGLE_REFRESH_TOKEN'),
    user: getEnv('GMAIL_TARGET_EMAIL', 'GMAIL_USER') || 'me',
  }
}

export function getGmail() {
  const config = getGmailConfig()

  if (!config.clientId || !config.clientSecret || !config.refreshToken) {
    throw new Error('Gmail sync is not configured. Add Gmail OAuth variables in Vercel.')
  }

  const oauth2Client = new google.auth.OAuth2(
    config.clientId,
    config.clientSecret
  )

  oauth2Client.setCredentials({
    refresh_token: config.refreshToken,
  })

  return google.gmail({ version: 'v1', auth: oauth2Client })
}
