import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const ROUTES_ID = '__itinerary_route_master__'

async function requireSignedInUser() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  if (!data.user?.id) throw new Error('Please sign in to access Route Master.')
  return data.user
}

function cleanRoutes(routes: unknown) {
  return Array.isArray(routes) ? routes : []
}

export async function GET() {
  try {
    await requireSignedInUser()
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('crm_leads')
      .select('lead, updated_at')
      .eq('id', ROUTES_ID)
      .maybeSingle()

    if (error) throw error

    return NextResponse.json({
      ok: true,
      routes: cleanRoutes(data?.lead?.routes),
      updatedAt: data?.updated_at || null,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load Route Master.'
    return NextResponse.json({ ok: false, error: message }, { status: message.includes('sign in') ? 401 : 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireSignedInUser()
    const body = await request.json()
    const routes = cleanRoutes(body.routes)
    const now = new Date().toISOString()
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('crm_leads')
      .upsert({
        id: ROUTES_ID,
        gmail_message_id: null,
        lead: {
          type: 'itinerary_route_master',
          routes,
          updatedBy: user.email || user.id,
          updatedAt: now,
        },
        updated_at: now,
      }, { onConflict: 'id' })
      .select('lead, updated_at')
      .single()

    if (error) throw error

    return NextResponse.json({
      ok: true,
      routes: cleanRoutes(data?.lead?.routes),
      updatedAt: data?.updated_at || now,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to save Route Master.'
    return NextResponse.json({ ok: false, error: message }, { status: message.includes('sign in') ? 401 : 500 })
  }
}
