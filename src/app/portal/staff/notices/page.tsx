'use client'
import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect } from 'react'

export default function StaffNotices() {
  const { token, user } = useAuth()
  const [notices, setNotices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const [courses, setCourses] = useState<any[]>([])
  const [batches, setBatches] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  
  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedBatch, setSelectedBatch] = useState('')
  const [selectedStudent, setSelectedStudent] = useState('')
  
  const [form, setForm] = useState({ title: '', message: '' })
  const [showForm, setShowForm] = useState(false)
  const [sending, setSending] = useState(false)
  const [msg, setMsg] = useState('')
  
  const h = { Authorization: `Bearer ${token}` }

  const loadNotices = () => {
    if (!token) return
    fetch('/api/notices', { headers: h }).then(r => r.json()).then(d => { setNotices(d.notices || []); setLoading(false) })
  }

  useEffect(() => {
    loadNotices()
    fetch('/api/courses', { headers: h }).then(r => r.json()).then(d => setCourses(d.data || []))
    fetch('/api/batches', { headers: h }).then(r => r.json()).then(d => setBatches(d.data || []))
  }, [token])

  useEffect(() => {
    if (!selectedBatch) {
      setStudents([])
      return
    }
    fetch(`/api/students?batchId=${selectedBatch}`, { headers: h })
      .then(r => r.json())
      .then(d => setStudents(d.data || []))
  }, [selectedBatch])

  const sendNotice = async () => {
    if (!form.title || !form.message || !selectedStudent) {
      setMsg('Please fill all fields and select a student.')
      return
    }
    setSending(true)
    
    // We send a targeted notification to the student's parent
    const res = await fetch('/api/notices/targeted', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...h },
      body: JSON.stringify({ 
        title: form.title, 
        message: form.message, 
        studentId: selectedStudent 
      })
    })
    
    const d = await res.json()
    setSending(false)
    if (d.success) {
      setMsg('? Notice sent to parent successfully!')
      setForm({ title: '', message: '' })
      setShowForm(false)
      loadNotices()
    } else {
      setMsg(d.error || 'Failed to send notice')
    }
  }

  const inputStyle = { width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '12px', color: 'white', fontSize: '14px', boxSizing: 'border-box' as const }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: '18px', fontWeight: '800', color: 'white', margin: 0 }}>?? School Notices</h1>
        <button onClick={() => setShowForm(!showForm)}
          style={{ background: '#ec4899', border: 'none', borderRadius: '10px', padding: '8px 16px', color: 'white', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
          {showForm ? 'Cancel' : '+ Send to Parent'}
        </button>
      </div>

      {msg && <div style={{ background: msg.startsWith('?') ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${msg.startsWith('?') ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius: '10px', padding: '12px', fontSize: '13px', color: msg.startsWith('?') ? '#10b981' : '#ef4444' }}>{msg}</div>}

      {showForm && (
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ color: 'white', margin: 0, fontSize: '15px' }}>Send Targeted Notice</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <select value={selectedCourse} onChange={e => { setSelectedCourse(e.target.value); setSelectedBatch(''); setSelectedStudent(''); }} style={inputStyle}>
              <option value="">-- Class --</option>
              {courses.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={selectedBatch} onChange={e => { setSelectedBatch(e.target.value); setSelectedStudent(''); }} disabled={!selectedCourse} style={{...inputStyle, opacity: !selectedCourse ? 0.5 : 1}}>
              <option value="">-- Section --</option>
              {batches.filter(b => b.courseId === selectedCourse).map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)} disabled={!selectedBatch} style={{...inputStyle, opacity: !selectedBatch ? 0.5 : 1}}>
            <option value="">-- Select Student --</option>
            {students.map((s: any) => <option key={s.id} value={s.id}>{s.fullName}</option>)}
          </select>

          <input placeholder="Notice Title" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} style={inputStyle} />
          <textarea placeholder="Write message to parent..." value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} />
          
          <button onClick={sendNotice} disabled={sending}
            style={{ background: 'linear-gradient(135deg, #ec4899, #d946ef)', border: 'none', borderRadius: '10px', padding: '12px', color: 'white', fontWeight: '700', fontSize: '14px', cursor: 'pointer', opacity: sending ? 0.6 : 1 }}>
            {sending ? 'Sending...' : '?? Send Notice'}
          </button>
        </div>
      )}

      {loading ? <div style={{ color: '#64748b', textAlign: 'center', padding: '40px' }}>Loading...</div> :
        notices.length === 0 ? <div style={{ color: '#64748b', textAlign: 'center', padding: '60px', background: '#1e293b', borderRadius: '16px' }}>No notices</div> :
        notices.map((n: any) => (
          <div key={n.id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: '16px' }}>
            <div style={{ fontSize: '15px', fontWeight: '700', color: 'white' }}>?? {n.title}</div>
            <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '8px' }}>{n.message}</div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '8px' }}>{new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
          </div>
        ))
      }
    </div>
  )
}

