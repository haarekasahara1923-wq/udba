'use client'
import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect } from 'react'

export default function StaffHomework() {
  const { token } = useAuth()
  const [homeworks, setHomeworks] = useState<any[]>([])
  const [batches, setBatches] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedBatch, setSelectedBatch] = useState('')
  
  const [form, setForm] = useState({ title: '', description: '', subject: '', dueDate: '' })
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  
  const [viewingSubmissions, setViewingSubmissions] = useState<any>(null) // homework object
  const [submissions, setSubmissions] = useState<any[]>([])
  
  const [gradingFeedback, setGradingFeedback] = useState<Record<string, { grade: string, feedback: string }>>({})

  const [msg, setMsg] = useState('')
  const h = { Authorization: `Bearer ${token}` }

  const load = () => {
    if (!token || !selectedBatch) return
    fetch(`/api/homework?batchId=${selectedBatch}`, { headers: h }).then(r => r.json()).then(d => setHomeworks(d.homeworks || []))
  }

  useEffect(() => {
    if (!token) return
    fetch('/api/courses', { headers: h }).then(r => r.json()).then(d => setCourses(d.data || []))
    fetch('/api/batches', { headers: h }).then(r => r.json()).then(d => setBatches(d.data || []))
  }, [token])

  useEffect(() => {
    load()
  }, [selectedBatch])

  const create = async () => {
    if (!selectedBatch || !form.title) { setMsg('Batch and title are required'); return }
    setCreating(true)
    const res = await fetch('/api/homework', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...h },
      body: JSON.stringify({ ...form, batchId: selectedBatch }),
    })
    const d = await res.json()
    setCreating(false)
    if (d.success) { setMsg('? Homework assigned!'); setForm({ title: '', description: '', subject: '', dueDate: '' }); setShowForm(false); load() }
    else setMsg(d.error || 'Failed')
  }

  const deleteHW = async (id: string) => {
    if (!confirm('Delete this homework?')) return
    await fetch(`/api/homework?id=${id}`, { method: 'DELETE', headers: h })
    load()
  }
  
  const viewSubmissions = async (hw: any) => {
    setViewingSubmissions(hw)
    const res = await fetch(`/api/homework/submit?homeworkId=${hw.id}`, { headers: h })
    const d = await res.json()
    setSubmissions(d.submissions || [])
    
    // prepopulate grading form
    const grads: Record<string, any> = {}
    ;(d.submissions || []).forEach((sub: any) => {
      grads[sub.id] = { grade: sub.grade || '', feedback: sub.feedback || '' }
    })
    setGradingFeedback(grads)
  }

  const submitGrade = async (subId: string) => {
    const { grade, feedback } = gradingFeedback[subId] || {}
    const res = await fetch('/api/homework/submit', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...h },
      body: JSON.stringify({ id: subId, grade, feedback })
    })
    const d = await res.json()
    if (d.success) {
      alert('Grade saved!')
    } else {
      alert('Failed: ' + d.error)
    }
  }

  const inputStyle = { width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '12px', color: 'white', fontSize: '14px', boxSizing: 'border-box' as const }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: '18px', fontWeight: '800', color: 'white', margin: 0 }}>?? Class Homework</h1>
        {selectedBatch && !viewingSubmissions && (
          <button onClick={() => { setShowForm(!showForm); setViewingSubmissions(null); }}
            style={{ background: '#6366f1', border: 'none', borderRadius: '10px', padding: '8px 16px', color: 'white', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
            {showForm ? 'Cancel' : '+ Assign'}
          </button>
        )}
      </div>
      
      {!viewingSubmissions && (
        <div style={{ display: 'flex', gap: '12px' }}>
          <select value={selectedCourse} onChange={e => { setSelectedCourse(e.target.value); setSelectedBatch(''); setHomeworks([]); }} style={inputStyle}>
            <option value="">-- Select Class --</option>
            {courses.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)} disabled={!selectedCourse} style={{...inputStyle, opacity: !selectedCourse ? 0.5 : 1}}>
            <option value="">-- Select Section --</option>
            {batches.filter(b => b.courseId === selectedCourse).map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      )}

      {msg && <div style={{ background: msg.startsWith('?') ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${msg.startsWith('?') ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius: '10px', padding: '12px', fontSize: '13px', color: msg.startsWith('?') ? '#10b981' : '#ef4444' }}>{msg}</div>}

      {showForm && !viewingSubmissions && selectedBatch && (
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ color: 'white', margin: 0, fontSize: '15px' }}>Assign New Homework</h3>
          <input placeholder="Title *" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} style={inputStyle} />
          <input placeholder="Subject" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} style={inputStyle} />
          <textarea placeholder="Description / Instructions" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} />
          <div>
            <label style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px', display: 'block' }}>Due Date</label>
            <input type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} style={inputStyle} />
          </div>
          <button onClick={create} disabled={creating}
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: '10px', padding: '12px', color: 'white', fontWeight: '700', fontSize: '14px', cursor: 'pointer', opacity: creating ? 0.6 : 1 }}>
            {creating ? 'Assigning...' : '?? Assign Homework'}
          </button>
        </div>
      )}

      {!viewingSubmissions ? (
        selectedBatch && (
          homeworks.length === 0 ? <div style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>No homework assigned yet</div> :
          homeworks.map((hw: any) => (
            <div key={hw.id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: 'white' }}>{hw.title}</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{hw.subject && `${hw.subject} • `}{hw.batch?.name}</div>
                  {hw.dueDate && <div style={{ fontSize: '12px', color: '#f59e0b', marginTop: '4px' }}>Due: {new Date(hw.dueDate).toLocaleDateString('en-IN')}</div>}
                  <button onClick={() => viewSubmissions(hw)} style={{ background: 'none', border: 'none', padding: 0, fontSize: '13px', color: '#818cf8', marginTop: '8px', cursor: 'pointer', textDecoration: 'underline' }}>View Submissions ({hw._count?.submissions || 0})</button>
                </div>
                <button onClick={() => deleteHW(hw.id)}
                  style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: '8px', padding: '6px 10px', fontSize: '12px', cursor: 'pointer' }}>???</button>
              </div>
            </div>
          ))
        )
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <button onClick={() => setViewingSubmissions(null)} style={{ alignSelf: 'flex-start', background: 'transparent', border: '1px solid #334155', borderRadius: '8px', padding: '6px 12px', color: 'white', cursor: 'pointer' }}>? Back to List</button>
          <div style={{ background: '#1e293b', padding: '16px', borderRadius: '14px', border: '1px solid #334155' }}>
            <h2 style={{ fontSize: '16px', margin: '0 0 8px 0', color: 'white' }}>{viewingSubmissions.title} - Submissions</h2>
            {submissions.length === 0 ? (
              <div style={{ color: '#64748b', fontSize: '13px' }}>No submissions yet.</div>
            ) : (
              submissions.map((sub: any) => (
                <div key={sub.id} style={{ borderTop: '1px solid #334155', paddingTop: '16px', marginTop: '16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#a7f3d0' }}>{sub.student?.fullName}</div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px' }}>Submitted: {new Date(sub.submittedAt).toLocaleString()}</div>
                  <div style={{ fontSize: '13px', color: 'white', background: '#0f172a', padding: '10px', borderRadius: '8px', marginBottom: '12px' }}>{sub.content}</div>
                  
                  <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input placeholder="Grade/Marks" value={gradingFeedback[sub.id]?.grade || ''} onChange={e => setGradingFeedback(p => ({...p, [sub.id]: {...p[sub.id], grade: e.target.value}}))} style={{...inputStyle, flex: 1, padding: '8px'}} />
                      <button onClick={() => submitGrade(sub.id)} style={{ background: '#10b981', border: 'none', borderRadius: '8px', padding: '8px 16px', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>Save Grade</button>
                    </div>
                    <textarea placeholder="Feedback" value={gradingFeedback[sub.id]?.feedback || ''} onChange={e => setGradingFeedback(p => ({...p, [sub.id]: {...p[sub.id], feedback: e.target.value}}))} style={{...inputStyle, padding: '8px', minHeight: '60px'}} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

