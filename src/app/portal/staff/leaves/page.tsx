'use client'
import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect } from 'react'

export default function MyLeaves() {
  const { token } = useAuth()
  const [leaves, setLeaves] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const [showModal, setShowModal] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const h = { Authorization: `Bearer ${token}` }

  const fetchLeaves = () => {
    setLoading(true)
    fetch('/api/teachers/leaves', { headers: h })
      .then(r => r.json())
      .then(d => {
        setLeaves(d.data || [])
        setLoading(false)
      })
      .catch(e => {
          console.error(e)
          setLoading(false)
      })
  }

  useEffect(() => {
    if (token) fetchLeaves()
  }, [token])

  const submitLeave = async () => {
      if(!startDate || !endDate || !reason) return alert('Fill all fields')
      setSubmitting(true)
      const res = await fetch('/api/teachers/leaves', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...h },
          body: JSON.stringify({ startDate, endDate, reason })
      })
      const data = await res.json()
      setSubmitting(false)
      if(data.success) {
          setShowModal(false)
          setStartDate('')
          setEndDate('')
          setReason('')
          fetchLeaves()
      } else {
          alert(data.error || 'Failed to apply')
      }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '20px', fontWeight: '800', color: 'white', margin: 0 }}>📅 My Leaves</h1>
          <button onClick={() => setShowModal(true)} style={{ background: '#6366f1', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>+ Apply Leave</button>
      </div>

      {loading && <div style={{ color: '#94a3b8', textAlign: 'center', padding: '20px' }}>Loading leaves...</div>}

      {!loading && leaves.length === 0 && (
          <div style={{ background: '#1e293b', border: '1px dashed #334155', borderRadius: '12px', padding: '30px', textAlign: 'center', color: '#64748b' }}>
              No leave applications found.
          </div>
      )}

      {!loading && leaves.map((l: any) => (
          <div key={l.id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: 'white' }}>
                      {new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()}
                  </div>
                  <span style={{ 
                      fontSize: '11px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '4px',
                      background: l.status === 'APPROVED' ? 'rgba(16,185,129,0.2)' : l.status === 'REJECTED' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)',
                      color: l.status === 'APPROVED' ? '#10b981' : l.status === 'REJECTED' ? '#ef4444' : '#f59e0b'
                   }}>
                      {l.status}
                  </span>
              </div>
              <div style={{ fontSize: '13px', color: '#94a3b8' }}>{l.reason}</div>
          </div>
      ))}

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', width: '100%', maxWidth: '400px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ margin: 0, color: 'white', fontSize: '18px' }}>Apply for Leave</h2>
            
            <div>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '10px', color: 'white' }} />
            </div>
            
            <div>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>End Date</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '10px', color: 'white' }} />
            </div>

            <div>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Reason</label>
              <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '10px', color: 'white' }} placeholder="State your reason..." />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid #334155', borderRadius: '8px', color: 'white', cursor: 'pointer' }}>Cancel</button>
              <button onClick={submitLeave} disabled={submitting} style={{ flex: 1, padding: '12px', background: '#6366f1', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>{submitting ? 'Submitting...' : 'Submit'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
