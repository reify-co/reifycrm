import { NextResponse } from 'next/server'
import { getGmail, getGmailConfig } from '@/lib/gmailAuth'
import { parseGmailLead } from '@/lib/parseEmail'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const gmail = getGmail()
    const { user } = getGmailConfig()

    const list = await gmail.users.messages.list({
      userId: user,
      maxResults: 20,
      q: 'newer_than:14d ("New Travel Enquiry" OR "Travel Enquiry")',
    })

    const messages = list.data.messages || []
    const leads = []

    for (const item of messages) {
      if (!item.id) continue

      const response = await gmail.users.messages.get({
        userId: user,
        id: item.id,
        format: 'full',
      })

      const lead = parseGmailLead(response.data)
      if (lead.name && lead.phone) {
        leads.push(lead)
      }
    }

    return NextResponse.json({
      ok: true,
      leads,
      count: leads.length,
      checkedAt: new Date().toISOString(),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to search Gmail.'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
