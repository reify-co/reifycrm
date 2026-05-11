import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const SETTINGS_ID = '__crm_settings__'

const DEFAULT_SETTINGS = {
  activeLeadTaker: null,
}

export async function GET() {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('crm_leads')
      .select('lead')
      .eq('id', SETTINGS_ID)
      .maybeSingle()

    if (error) throw error

    return NextResponse.json({
      ok: true,
      settings: { ...DEFAULT_SETTINGS, ...(data?.lead?.settings || {}) },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load CRM settings.'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = createAdminClient()
    const now = new Date().toISOString()
    const { data: existing, error: readError } = await supabase
      .from('crm_leads')
      .select('lead')
      .eq('id', SETTINGS_ID)
      .maybeSingle()

    if (readError) throw readError

    const settings = {
      ...DEFAULT_SETTINGS,
      ...(existing?.lead?.settings || {}),
      ...(body.settings || {}),
    }

    const { data, error } = await supabase
      .from('crm_leads')
      .upsert({
        id: SETTINGS_ID,
        gmail_message_id: null,
        lead: { type: 'crm_settings', settings },
        updated_at: now,
      }, { onConflict: 'id' })
      .select('lead')
      .single()

    if (error) throw error

    return NextResponse.json({
      ok: true,
      settings: { ...DEFAULT_SETTINGS, ...(data?.lead?.settings || {}) },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to save CRM settings.'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
