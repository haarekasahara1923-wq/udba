'use client'
import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect } from 'react'

export default function ParentChildren() {
  const { token } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [allStudents, setAllStudents] = useState<any[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const h = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    if (!token) return
    Promise.all([
      fetch('/api/parent', { headers: h }).then(r => r.json()),
      fetch('/api/reports?type=students', { headers: h }).then(r => r.json()),
    ]).then(([p, s]) => {
      setProfile(p.profile)
      setAllStudents(s.students || [])
      setSelected(p.profile?.children?.map((c: any) => c.id) || [])
      setLoading(false)
    })
  }, [token])

  const toggleStudent = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : prev.length < 3 ? [...prev, id] : prev)
  }

  const save = async () => {
    setSaving(true)
    const res = await fetch('/api/parent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...h },
      body: JSON.stringify({ studentIds: selected }),
    })
    const d = await res.json()
    setSaving(false)
    if (d.success) setMsg('✅ Children linked successfully!')
    else setMsg(d.error || 'Failed')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h1 style={{ fontSize: '18px', fontWeight: '800', color: 'white', margin: 0 }}>👶 Link Children</h1>
        <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Select up to 3 children from the list below</p>
      </div>
      {msg && <div style={{ background: msg.startsWith('✅') ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${msg.startsWith('✅') ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius: '10px', padding: '12px', fontSize: '13px', color: msg.startsWith('✅') ? '#10b981' : '#ef4444' }}>{msg}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {loading ? <div style={{ color: '#64748b', textAlign: 'center', padding: '40px' }}>Loading...</div> :
          allStudents.map((s: any) => (
            <div key={s.id} onClick={() => toggleStudent(s.id)}
              style={{ background: selected.includes(s.id) ? 'rgba(99,102,241,0.15)' : '#1e293b', border: `1px solid ${selected.includes(s.id) ? '#6366f1' : '#334155'}`, borderRadius: '12px', padding: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '6px', border: `2px solid ${selected.includes(s.id) ? '#6366f1' : '#475569'}`, background: selected.includes(s.id) ? '#6366f1' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>
                {selected.includes(s.id) ? '✓' : ''}
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: 'white' }}>{s.fullName}</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>{s.course?.name} • {s.batch?.name} {s.studentId ? `• ID: ${s.studentId}` : ''}</div>
              </div>
            </div>
          ))
        }
      </div>
      <button onClick={save} disabled={saving || selected.length === 0}
        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: '12px', padding: '14px', color: 'white', fontWeight: '700', fontSize: '15px', cursor: 'pointer', opacity: saving || selected.length === 0 ? 0.6 : 1 }}>
        {saving ? 'Saving...' : `💾 Save (${selected.length} selected)`}
      </button>
    </div>
  )
}
