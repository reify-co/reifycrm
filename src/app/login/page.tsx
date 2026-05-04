'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
console.log('SUPABASE URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
const T = { navy:'#0d2d3a', teal:'#1a7a8a', border:'#cce4ea', faint:'#e8f4f7', muted:'#5a7d88', accent:'#c8e8ed' }

export default function LoginPage() {
  const supabase = createClient()
  const router   = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  const inp: React.CSSProperties = {
    width:'100%', padding:'9px 12px', borderRadius:8,
    border:`1.5px solid ${T.border}`, fontSize:13, color:T.navy,
    background:T.faint, outline:'none', boxSizing:'border-box',
    fontFamily:'inherit'
  }

  return (
    <div style={{ minHeight:'100vh', background:'#f0f7f9', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Segoe UI',sans-serif" }}>
      <div style={{ background:'#fff', borderRadius:16, padding:'40px 36px', width:380, boxShadow:'0 12px 48px rgba(13,45,58,0.12)' }}>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ width:52, height:52, borderRadius:'50%', background:T.navy, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
            <span style={{ fontFamily:'Georgia,serif', fontSize:28, fontWeight:700, color:T.accent }}>R</span>
          </div>
          <div style={{ fontFamily:'Georgia,serif', fontSize:22, fontWeight:700, color:T.navy }}>Reify Travels</div>
          <div style={{ fontSize:12, color:T.muted, marginTop:4, letterSpacing:'0.04em', textTransform:'uppercase' }}>CRM Dashboard</div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom:14 }}>
            <label style={{ display:'block', fontSize:12, fontWeight:600, color:T.muted, marginBottom:5 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@reifytravels.com"
              required
              style={inp}
            />
          </div>

          <div style={{ marginBottom:22 }}>
            <label style={{ display:'block', fontSize:12, fontWeight:600, color:T.muted, marginBottom:5 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={inp}
            />
          </div>

          {error && (
            <div style={{ fontSize:12, color:'#b91c1c', background:'#fee2e2', padding:'8px 12px', borderRadius:8, marginBottom:14 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ width:'100%', background:T.navy, color:'#fff', border:'none', borderRadius:8, padding:'11px 0', fontSize:14, fontWeight:600, cursor:loading?'not-allowed':'pointer', opacity:loading?0.7:1, fontFamily:'inherit' }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign:'center', marginTop:20, fontSize:11, color:T.muted }}>
          Reify Travels · Internal CRM
        </div>
      </div>
    </div>
  )
}