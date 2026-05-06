import { NextRequest, NextResponse } from 'next/server'
import { getGmail, getGmailConfig } from '@/lib/gmailAuth'
import { parseGmailLead } from '@/lib/parseEmail'
import { createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const LEAD_AGENT_IDS = ['nikitha', 'aman']

function indiaDateKey(value: string | number | Date) {
  return new Date(value).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
}

function rotationAgent(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00+05:30`)
  const day = Math.floor(date.getTime() / 86400000)
  return LEAD_AGENT_IDS[day % LEAD_AGENT_IDS.length]
}

function buildLead(parsed: any, dateKey: string) {
  return {
    id: `L${Number(new Date(parsed.receivedAt))}.${parsed.gmailMessageId || Math.random()}`,
    name: parsed.name,
    phone: parsed.phone,
    email: parsed.email || '',
    source: parsed.source || 'Ads-Email',
    status: 'New',
    assignedTo: rotationAgent(dateKey),
    landingPage: parsed.landingPage || parsed.destination || '',
    destination: parsed.destination || parsed.landingPage || '',
    packageType: parsed.packageType || '',
    tripDate: parsed.tripDate || '',
    days: Number(parsed.days || 0),
    paxCount: Number(parsed.paxCount || 1),
    budget: Number(parsed.budget || 0),
    message: parsed.message || '',
    gclid: parsed.gclid || '',
    gmailMessageId: parsed.gmailMessageId || '',
    createdAt: new Date().toISOString(),
    lastContact: '',
    nextFollowUp: '',
    daysInPipeline: 0,
    isOverdue: false,
    tags: [],
    notes: `Auto synced from Gmail. Landing page: ${parsed.landingPage || ''}`,
    followUpLog: [],
    reminders: [],
  }
}

function rowFromLead(lead: any) {
  return {
    id: lead.id,
    gmail_message_id: lead.gmailMessageId || null,
    lead,
    updated_at: new Date().toISOString(),
  }
}

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return request.headers.get('authorization') === `Bearer ${secret}`
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 })
  }

  try {
    const targetDate = request.nextUrl.searchParams.get('date') || indiaDateKey(new Date())
    const gmail = getGmail()
    const { user } = getGmailConfig()
    const supabase = createAdminClient()

    const list = await gmail.users.messages.list({
      userId: user,
      maxResults: 50,
      q: 'newer_than:2d ("New Travel Enquiry" OR "Travel Enquiry")',
    })

    const messages = list.data.messages || []
    const parsedLeads = []

    for (const item of messages) {
      if (!item.id) continue
      const response = await gmail.users.messages.get({
        userId: user,
        id: item.id,
        format: 'full',
      })
      const parsed = parseGmailLead(response.data)
      if (parsed.name && parsed.phone && indiaDateKey(parsed.receivedAt) === targetDate) {
        parsedLeads.push(parsed)
      }
    }

    const gmailIds = parsedLeads.map((lead: any) => lead.gmailMessageId).filter(Boolean)
    let existingGmailIds = new Set<string>()

    if (gmailIds.length) {
      const { data, error } = await supabase
        .from('crm_leads')
        .select('gmail_message_id')
        .in('gmail_message_id', gmailIds)
      if (error) throw error
      existingGmailIds = new Set((data || []).map((row: any) => row.gmail_message_id).filter(Boolean))
    }

    const freshLeads = parsedLeads
      .filter((lead: any) => !lead.gmailMessageId || !existingGmailIds.has(lead.gmailMessageId))
      .map((lead: any) => buildLead(lead, targetDate))

    if (freshLeads.length) {
      const { error } = await supabase
        .from('crm_leads')
        .upsert(freshLeads.map(rowFromLead), { onConflict: 'id' })
      if (error) throw error
    }

    return NextResponse.json({
      ok: true,
      date: targetDate,
      checked: parsedLeads.length,
      imported: freshLeads.length,
      skipped: parsedLeads.length - freshLeads.length,
      checkedAt: new Date().toISOString(),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to sync Gmail.'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
