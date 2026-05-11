import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

function rowFromLead(lead: any) {
  return {
    id: lead.id,
    gmail_message_id: lead.gmailMessageId || null,
    lead,
    updated_at: new Date().toISOString(),
  }
}

export async function GET() {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('crm_leads')
      .select('lead')
      .neq('id', '__crm_settings__')
      .order('updated_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({
      ok: true,
      leads: (data || []).map((row: any) => row.lead),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load leads.'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const leads = Array.isArray(body.leads) ? body.leads : body.lead ? [body.lead] : []
    if (!leads.length) return NextResponse.json({ ok: true, leads: [] })

    const supabase = createAdminClient()
    const gmailIds = leads.map((lead: any) => lead.gmailMessageId).filter(Boolean)
    let existingGmailIds = new Set<string>()

    if (gmailIds.length) {
      const { data, error } = await supabase
        .from('crm_leads')
        .select('gmail_message_id')
        .in('gmail_message_id', gmailIds)
      if (error) throw error
      existingGmailIds = new Set((data || []).map((row: any) => row.gmail_message_id).filter(Boolean))
    }

    const fresh = leads.filter((lead: any) => !lead.gmailMessageId || !existingGmailIds.has(lead.gmailMessageId))
    if (!fresh.length) return NextResponse.json({ ok: true, leads: [], skipped: leads.length })

    const { data, error } = await supabase
      .from('crm_leads')
      .upsert(fresh.map(rowFromLead), { onConflict: 'id' })
      .select('lead')

    if (error) throw error

    return NextResponse.json({
      ok: true,
      leads: (data || []).map((row: any) => row.lead),
      skipped: leads.length - fresh.length,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to save leads.'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { lead } = await request.json()
    if (!lead?.id) return NextResponse.json({ ok: false, error: 'Missing lead id.' }, { status: 400 })

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('crm_leads')
      .upsert(rowFromLead(lead), { onConflict: 'id' })
      .select('lead')
      .single()

    if (error) throw error

    return NextResponse.json({ ok: true, lead: data?.lead })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to update lead.'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ ok: false, error: 'Missing lead id.' }, { status: 400 })

    const supabase = createAdminClient()
    const { error } = await supabase.from('crm_leads').delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to delete lead.'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
