'use client'
import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect } from 'react'

export default function StaffSubmissions() {
  const { token } = useAuth()
  const [homeworks, setHomeworks] = useState<any[]>([])
  const [selected, setSelected] = useState('')
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [grading, setGrading] = useState<string | null>(null)
  const [grades, setGrades] = useState<Record<string, { grade: string; feedback: string }>>({})
  const h = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    if (!token) return
    fetch('/api/homework', { headers: h }).then(r => r.json()).then(d => setHomeworks(d.homeworks || []))
  }, [token])

  useEffect(() => {
    if (!selected || !token) return
    setLoading(true)
    fetch(`/api/homework/submit?homeworkId=${selected}`, { headers: h })
      .then(r => r.json())
      .then(d => { setSubmissions(d.submissions || []); setLoading(false) })
  }, [selected])

  const grade = async (id: string) => {
    setGrading(id)
    await fetch('/api/homework/submit', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...h },
      body: JSON.stringify({ id, grade: grades[id]?.grade || '', feedback: grades[id]?.feedback || '' }),
    })
    setGrading(null)
    const res = await fetch(`/api/homework/submit?homeworkId=${selected}`, { headers: h }).then(r => r.json())
    setSubmissions(res.submissions || [])
  }

  const statusColor: Record<string, string> = { SUBMITTED: '#6366f1', GRADED: '#10b981', LATE: '#f59e0b', MISSING: '#ef4444' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h1 style={{ fontSize: '18px', fontWeight: '800', color: 'white', margin: 0 }}>📋 Submissions</h1>
      <select value={selected} onChange={e => setSelected(e.target.value)}
        style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '12px', color: 'white', fontSize: '14px', boxSizing: 'border-box' }}>
        <option value="">-- Select Homework --</option>
        {homeworks.map((hw: any) => <option key={hw.id} value={hw.id}>{hw.title} ({hw.batch?.name})</option>)}
      </select>

      {loading && <div style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>Loading...</div>}

      {!loading && selected && submissions.length === 0 && <div style={{ color: '#64748b', textAlign: 'center', padding: '40px', background: '#1e293b', borderRadius: '14px' }}>No submissions yet</div>}

      {submissions.map((s: any) => (
        <div key={s.id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: 'white' }}>{s.student?.fullName}</div>
            <span style={{ fontSize: '11px', background: `${statusColor[s.status]}20`, color: statusColor[s.status], borderRadius: '6px', padding: '3px 8px' }}>{s.status}</span>
          </div>
          {s.content && <div style={{ fontSize: '13px', color: '#94a3b8', background: '#0f172a', borderRadius: '8px', padding: '10px' }}>{s.content}</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input placeholder="Grade (e.g. A, 85%, Good)" value={grades[s.id]?.grade || s.grade || ''}
              onChange={e => setGrades(p => ({ ...p, [s.id]: { ...p[s.id], grade: e.target.value } }))}
              style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '8px 12px', color: 'white', fontSize: '13px' }} />
            <input placeholder="Feedback" value={grades[s.id]?.feedback || s.feedback || ''}
              onChange={e => setGrades(p => ({ ...p, [s.id]: { ...p[s.id], feedback: e.target.value } }))}
              style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '8px 12px', color: 'white', fontSize: '13px' }} />
            <button onClick={() => grade(s.id)} disabled={grading === s.id}
              style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', borderRadius: '8px', padding: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: '600' }}>
              {grading === s.id ? 'Grading...' : '✓ Save Grade'}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
