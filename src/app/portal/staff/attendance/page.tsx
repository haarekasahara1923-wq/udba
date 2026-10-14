'use client'
import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect, useRef } from 'react'

export default function StaffAttendance() {
  const { token } = useAuth()
  const [batches, setBatches] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedBatch, setSelectedBatch] = useState('')
  
  const [students, setStudents] = useState<any[]>([])
  const [attendance, setAttendance] = useState<Record<string, string>>({})
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const tokenRef = useRef(token)
  useEffect(() => { tokenRef.current = token }, [token])

  const getHeaders = (): Record<string, string> => {
    const currentToken = token || tokenRef.current || (typeof window !== 'undefined' ? (localStorage.getItem('UDA_token') || localStorage.getItem('udba_token')) : null)
    return currentToken ? { Authorization: `Bearer ${currentToken}` } : {}
  }

  useEffect(() => {
    fetch('/api/courses', { headers: getHeaders() })
      .then(r => r.json())
      .then(d => setCourses(d.data || []))
      .catch(console.error)

    fetch('/api/batches', { headers: getHeaders() })
      .then(r => r.json())
      .then(d => setBatches(d.data || []))
      .catch(console.error)
  }, [token])

  // Load students as soon as Class is selected, and filter if Section is picked
  useEffect(() => {
    if (!selectedCourse) {
      setStudents([])
      setAttendance({})
      return
    }

    setLoading(true)
    const url = selectedBatch
      ? `/api/students?courseId=${selectedCourse}&batchId=${selectedBatch}`
      : `/api/students?courseId=${selectedCourse}`

    fetch(url, { headers: getHeaders() })
      .then(r => r.json())
      .then(d => {
        const stu = d.data || []
        setStudents(stu)
        const init: Record<string, string> = {}
        stu.forEach((s: any) => { init[s.id] = 'PRESENT' })
        setAttendance(init)
        setLoading(false)
      })
      .catch(err => {
        console.error('Fetch students error:', err)
        setLoading(false)
      })
  }, [selectedCourse, selectedBatch, token])

  const save = async () => {
    if (students.length === 0) return
    setSaving(true)
    setMsg('')
    const records = students.map(s => ({
      studentId: s.id,
      batchId: s.batchId || selectedBatch || null,
      date,
      status: attendance[s.id] || 'PRESENT'
    }))

    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getHeaders() },
        body: JSON.stringify({ records }),
      })
      const d = await res.json()
      setSaving(false)
      if (d.success) {
        setMsg('✅ Attendance saved and parents notified!')
      } else {
        setMsg(d.error || 'Failed to save attendance')
      }
    } catch (e) {
      setSaving(false)
      setMsg('Network error while saving attendance')
    }
  }

  const statusOptions = ['PRESENT', 'ABSENT', 'LATE', 'LEAVE']
  const statusColors: Record<string, string> = { PRESENT: '#10b981', ABSENT: '#ef4444', LATE: '#f59e0b', LEAVE: '#6366f1' }
  const inputStyle = { width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '12px', color: 'white', fontSize: '14px', boxSizing: 'border-box' as const }

  const availableBatches = batches.filter(b => b.courseId === selectedCourse)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h1 style={{ fontSize: '18px', fontWeight: '800', color: 'white', margin: 0 }}>📋 Mark Daily Attendance</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <label style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '6px', display: 'block' }}>Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '6px', display: 'block' }}>Class *</label>
            <select
              value={selectedCourse}
              onChange={e => {
                setSelectedCourse(e.target.value)
                setSelectedBatch('')
              }}
              style={inputStyle}
            >
              <option value="">-- Select Class --</option>
              {courses.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '6px', display: 'block' }}>
              Section {availableBatches.length === 0 ? '(Optional)' : ''}
            </label>
            <select
              value={selectedBatch}
              onChange={e => setSelectedBatch(e.target.value)}
              disabled={!selectedCourse || availableBatches.length === 0}
              style={{ ...inputStyle, opacity: !selectedCourse || availableBatches.length === 0 ? 0.6 : 1 }}
            >
              <option value="">
                {availableBatches.length > 0
                  ? '-- All Sections (Whole Class) --'
                  : '-- Whole Class (No Sections) --'}
              </option>
              {availableBatches.map((b: any) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {msg && (
        <div style={{
          background: msg.startsWith('✅') ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
          border: `1px solid ${msg.startsWith('✅') ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
          borderRadius: '10px',
          padding: '12px',
          fontSize: '13px',
          color: msg.startsWith('✅') ? '#10b981' : '#ef4444'
        }}>
          {msg}
        </div>
      )}

      {loading && <div style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>Loading students...</div>}

      {!loading && selectedCourse && students.length === 0 && (
        <div style={{ color: '#94a3b8', textAlign: 'center', padding: '24px', background: '#1e293b', borderRadius: '12px', border: '1px solid #334155' }}>
          ⚠️ No students found in this class{selectedBatch ? ' and section' : ''}.
        </div>
      )}

      {students.length > 0 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#94a3b8' }}>{students.length} Students</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => {
                  const all: Record<string, string> = {}
                  students.forEach(s => all[s.id] = 'PRESENT')
                  setAttendance(all)
                }}
                style={{
                  background: 'rgba(16,185,129,0.15)',
                  border: '1px solid rgba(16,185,129,0.3)',
                  color: '#10b981',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                All Present
              </button>
            </div>
          </div>
          {students.map((s: any) => (
            <div
              key={s.id}
              style={{
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '12px',
                padding: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}
            >
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: 'white' }}>{s.fullName}</div>
                {s.studentId && <div style={{ fontSize: '11px', color: '#64748b' }}>{s.studentId}</div>}
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {statusOptions.map(st => (
                  <button
                    key={st}
                    onClick={() => setAttendance(prev => ({ ...prev, [s.id]: st }))}
                    style={{
                      padding: '5px 8px',
                      borderRadius: '6px',
                      border: `1px solid ${attendance[s.id] === st ? statusColors[st] : '#334155'}`,
                      background: attendance[s.id] === st ? `${statusColors[st]}20` : 'transparent',
                      color: attendance[s.id] === st ? statusColors[st] : '#64748b',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    {st[0] + st.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <button
            onClick={save}
            disabled={saving}
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              border: 'none',
              borderRadius: '12px',
              padding: '14px',
              color: 'white',
              fontWeight: '700',
              fontSize: '15px',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1,
              marginTop: '8px'
            }}
          >
            {saving ? 'Publishing...' : '📢 Publish Attendance'}
          </button>
        </>
      )}
    </div>
  )
}
