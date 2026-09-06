'use client'
import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect } from 'react'

export default function StudentHomework() {
  const { token, user } = useAuth()
  const [homeworks, setHomeworks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [content, setContent] = useState<Record<string, string>>({})
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (!token) return
    fetch('/api/homework', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setHomeworks(d.homeworks || []); setLoading(false) })
  }, [token])

  const submit = async (homeworkId: string, studentId: string) => {
    if (!content[homeworkId]?.trim()) { setMsg('Please write your answer first'); return }
    setSubmitting(homeworkId)
    const res = await fetch('/api/homework/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ homeworkId, studentId, content: content[homeworkId] }),
    })
    const d = await res.json()
    setSubmitting(null)
    if (d.success) { setMsg('✅ Submitted successfully!'); setContent(prev => ({ ...prev, [homeworkId]: '' })) }
    else setMsg(d.error || 'Failed to submit')
  }

  if (loading) return <div style={{ color: '#64748b', textAlign: 'center', padding: '40px' }}>Loading...</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h1 style={{ fontSize: '18px', fontWeight: '800', color: 'white', margin: 0 }}>📚 My Homework</h1>
      {msg && <div style={{ background: msg.startsWith('✅') ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${msg.startsWith('✅') ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius: '10px', padding: '12px', fontSize: '13px', color: msg.startsWith('✅') ? '#10b981' : '#ef4444' }}>{msg}</div>}
      {homeworks.length === 0 ? <div style={{ color: '#64748b', textAlign: 'center', padding: '60px 20px', background: '#1e293b', borderRadius: '16px' }}>No homework assigned yet 🎉</div> :
        homeworks.map((hw: any) => {
          const submission = hw.submissions?.[0]
          return (
          <div key={hw.id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: 'white' }}>{hw.title}</div>
                {hw.subject && <div style={{ fontSize: '12px', color: '#818cf8', marginTop: '4px' }}>{hw.subject}</div>}
              </div>
              {submission && (
                <div style={{ background: submission.grade ? '#10b981' : '#f59e0b', color: 'white', padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold' }}>
                  {submission.grade ? `Graded: ${submission.grade}` : 'Submitted'}
                </div>
              )}
            </div>
            {hw.description && <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '8px' }}>{hw.description}</div>}
            {hw.dueDate && <div style={{ fontSize: '12px', color: '#f59e0b', marginTop: '6px' }}>⏰ Due: {new Date(hw.dueDate).toLocaleDateString('en-IN')}</div>}
            
            {submission ? (
              <div style={{ marginTop: '16px', background: '#0f172a', padding: '12px', borderRadius: '8px', border: '1px solid #334155' }}>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Your Submission:</div>
                <div style={{ fontSize: '13px', color: 'white' }}>{submission.content}</div>
                {submission.feedback && (
                  <div style={{ marginTop: '12px', borderTop: '1px solid #334155', paddingTop: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Teacher's Feedback:</div>
                    <div style={{ fontSize: '13px', color: '#a7f3d0' }}>{submission.feedback}</div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ marginTop: '12px' }}>
                <textarea
                  placeholder="Write your answer here..."
                  value={content[hw.id] || ''}
                  onChange={e => setContent(prev => ({ ...prev, [hw.id]: e.target.value }))}
                  style={{ width: '100%', minHeight: '80px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '10px', color: 'white', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box' }}
                />
                <button
                  onClick={() => submit(hw.id, user?.studentId || '')}
                  disabled={submitting === hw.id}
                  style={{ width: '100%', marginTop: '8px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: '10px', padding: '12px', color: 'white', fontWeight: '700', fontSize: '14px', cursor: 'pointer', opacity: submitting === hw.id ? 0.6 : 1 }}
                >
                  {submitting === hw.id ? 'Submitting...' : '📤 Submit Answer'}
                </button>
              </div>
            )}
          </div>
        )})
      }
    </div>
  )
}
