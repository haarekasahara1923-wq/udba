'use client'
import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect } from 'react'

export default function MyTimetable() {
  const { token } = useAuth()
  const [timetables, setTimetables] = useState<any[]>([])
  const [batches, setBatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const [showModal, setShowModal] = useState(false)
  const [batchId, setBatchId] = useState('')
  const [subject, setSubject] = useState('')
  const [dayOfWeek, setDayOfWeek] = useState(1)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const h = { Authorization: `Bearer ${token}` }

  const fetchData = () => {
    setLoading(true)
    Promise.all([
        fetch('/api/teachers/timetable', { headers: h }).then(r => r.json()),
        fetch('/api/batches', { headers: h }).then(r => r.json())
    ]).then(([tt, b]) => {
        setTimetables(tt.data || [])
        setBatches(b.data || [])
        setLoading(false)
    }).catch(e => {
        console.error(e)
        setLoading(false)
    })
  }

  useEffect(() => {
    if (token) fetchData()
  }, [token])

  const submitTimetable = async () => {
      if(!batchId || !subject || !startTime || !endTime) return alert('Fill all fields')
      setSubmitting(true)
      const res = await fetch('/api/teachers/timetable', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...h },
          body: JSON.stringify({ batchId, subject, dayOfWeek: Number(dayOfWeek), startTime, endTime })
      })
      const data = await res.json()
      setSubmitting(false)
      if(data.success) {
          setShowModal(false)
          setBatchId('')
          setSubject('')
          setStartTime('')
          setEndTime('')
          fetchData()
      } else {
          alert(data.error || 'Failed to submit')
      }
  }

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '20px', fontWeight: '800', color: 'white', margin: 0 }}>⏰ My Schedule</h1>
          <button onClick={() => setShowModal(true)} style={{ background: '#ec4899', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>+ Request Slot</button>
      </div>

      {loading && <div style={{ color: '#94a3b8', textAlign: 'center', padding: '20px' }}>Loading schedule...</div>}

      {!loading && timetables.length === 0 && (
          <div style={{ background: '#1e293b', border: '1px dashed #334155', borderRadius: '12px', padding: '30px', textAlign: 'center', color: '#64748b' }}>
              No scheduled classes found.
          </div>
      )}

      {!loading && timetables.map((t: any) => (
          <div key={t.id} style={{ background: '#1e293b', border: '1px solid #334155', borderLeft: `4px solid ${t.status === 'APPROVED' ? '#10b981' : t.status === 'REJECTED' ? '#ef4444' : '#f59e0b'}`, borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: 'white' }}>
                      {days[t.dayOfWeek]}
                  </div>
                  <span style={{ 
                      fontSize: '11px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '4px',
                      background: t.status === 'APPROVED' ? 'rgba(16,185,129,0.2)' : t.status === 'REJECTED' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)',
                      color: t.status === 'APPROVED' ? '#10b981' : t.status === 'REJECTED' ? '#ef4444' : '#f59e0b'
                   }}>
                      {t.status}
                  </span>
              </div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#6366f1' }}>{t.startTime} - {t.endTime}</div>
              <div style={{ fontSize: '14px', color: '#e2e8f0' }}>{t.subject} <span style={{ color: '#64748b', fontSize: '12px' }}>({t.batch?.name})</span></div>
          </div>
      ))}

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', width: '100%', maxWidth: '400px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ margin: 0, color: 'white', fontSize: '18px' }}>Request Schedule Slot</h2>
            
            <div>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Day of Week</label>
              <select value={dayOfWeek} onChange={e => setDayOfWeek(Number(e.target.value))} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '10px', color: 'white' }}>
                  {days.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Batch / Section</label>
              <select value={batchId} onChange={e => setBatchId(e.target.value)} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '10px', color: 'white' }}>
                  <option value="">-- Select Batch --</option>
                  {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Subject</label>
              <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Mathematics" style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '10px', color: 'white' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Start Time</label>
                  <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '10px', color: 'white' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>End Time</label>
                  <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '10px', color: 'white' }} />
                </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid #334155', borderRadius: '8px', color: 'white', cursor: 'pointer' }}>Cancel</button>
              <button onClick={submitTimetable} disabled={submitting} style={{ flex: 1, padding: '12px', background: '#ec4899', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>{submitting ? 'Submitting...' : 'Request Slot'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
