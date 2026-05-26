import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const OWNER_EMAIL = 'owner@reifytravels.com'

async function requireOwner() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  const email = data.user?.email?.toLowerCase()
  if (email !== OWNER_EMAIL) {
    throw new Error('Only owner can manage CRM logins.')
  }
}

async function findUserByEmail(admin: any, email: string) {
  let page = 1
  while (page < 20) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 })
    if (error) throw error
    const user = data?.users?.find((item: any) => item.email?.toLowerCase() === email)
    if (user || !data?.users?.length || data.users.length < 100) return user || null
    page += 1
  }
  return null
}

function validateInput(body: any) {
  const email = String(body.email || '').trim().toLowerCase()
  const password = String(body.password || '')
  const fullName = String(body.fullName || '').trim()
  if (!email || !email.includes('@')) throw new Error('Valid email is required.')
  if (!password || password.length < 6) throw new Error('Password should be at least 6 characters.')
  return { email, password, fullName }
}

export async function POST(request: NextRequest) {
  try {
    await requireOwner()
    const { email, password, fullName } = validateInput(await request.json())
    const admin = createAdminClient()
    const existing = await findUserByEmail(admin, email)

    if (existing?.id) {
      const { error } = await admin.auth.admin.updateUserById(existing.id, {
        password,
        user_metadata: fullName ? { full_name: fullName, name: fullName } : undefined,
      })
      if (error) throw error
      return NextResponse.json({ ok: true, created: false, userId: existing.id })
    }

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: fullName ? { full_name: fullName, name: fullName } : undefined,
    })
    if (error) throw error
    return NextResponse.json({ ok: true, created: true, userId: data.user?.id })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create CRM login.'
    return NextResponse.json({ ok: false, error: message }, { status: message.includes('Only owner') ? 403 : 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireOwner()
    const { email, password } = validateInput(await request.json())
    const admin = createAdminClient()
    const existing = await findUserByEmail(admin, email)
    if (!existing?.id) {
      return NextResponse.json({ ok: false, error: 'Login not found. Use Create Login first.' }, { status: 404 })
    }

    const { error } = await admin.auth.admin.updateUserById(existing.id, { password })
    if (error) throw error
    return NextResponse.json({ ok: true, userId: existing.id })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to change password.'
    return NextResponse.json({ ok: false, error: message }, { status: message.includes('Only owner') ? 403 : 500 })
  }
}
