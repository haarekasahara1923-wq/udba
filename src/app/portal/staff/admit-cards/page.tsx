'use client'
import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect } from 'react'

export default function AdmitCardsStaffPage() {
  const { token, user } = useAuth()
  const [courses, setCourses] = useState<any[]>([])
  const [batches, setBatches] = useState<any[]>([])
  const [admitCards, setAdmitCards] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [selectedCard, setSelectedCard] = useState<any>(null)
  const [publishing, setPublishing] = useState(false)

  const [form, setForm] = useState({
    courseId: '',
    batchId: '',
    examName: '',
    startDate: '',
    endDate: '',
  })

  const [allBatches, setAllBatches] = useState<any[]>([])

  const h = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

  useEffect(() => {
    if (!token) return
    fetch('/api/courses', { headers: h }).then(r => r.json()).then(d => setCourses(d.data || []))
    fetch('/api/batches', { headers: h }).then(r => r.json()).then(d => setAllBatches(d.data || []))
    loadAdmitCards()
  }, [token])

  useEffect(() => {
    if (!form.courseId) { setBatches([]); return }
    setBatches(allBatches.filter((b: any) => b.courseId === form.courseId))
  }, [form.courseId, allBatches])

  const loadAdmitCards = async () => {
    setLoading(true)
    const res = await fetch('/api/admit-cards', { headers: h })
    const data = await res.json()
    setAdmitCards(data.admitCards || [])
    setLoading(false)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    const res = await fetch('/api/admit-cards', { method: 'POST', headers: h, body: JSON.stringify(form) })
    const data = await res.json()
    if (data.success) {
      setShowForm(false)
      setForm({ courseId: '', batchId: '', examName: '', startDate: '', endDate: '' })
      await loadAdmitCards()
      setSelectedCard(data.admitCard)
    } else {
      alert(data.error || 'Failed to create')
    }
    setCreating(false)
  }

  const toggleBlock = async (acs: any) => {
    if (acs.isBlocked) {
      await fetch('/api/admit-cards', { method: 'PATCH', headers: h, body: JSON.stringify({ action: 'unblock_student', admitCardStudentId: acs.id }) })
    } else {
      await fetch('/api/admit-cards', { method: 'PATCH', headers: h, body: JSON.stringify({ action: 'block_student', admitCardStudentId: acs.id, blockReason: 'Fee pending or other issue' }) })
    }
    // Refresh selected card
    const res = await fetch('/api/admit-cards', { headers: h })
    const data = await res.json()
    setAdmitCards(data.admitCards || [])
    const fresh = (data.admitCards || []).find((c: any) => c.id === selectedCard?.id)
    if (fresh) setSelectedCard(fresh)
  }

  const publishStudent = async (acsId: string) => {
    const res = await fetch('/api/admit-cards', { method: 'PATCH', headers: h, body: JSON.stringify({ action: 'publish_student', admitCardStudentId: acsId }) })
    const data = await res.json()
    if (!data.success) { alert(data.error || 'Cannot publish - requires Super Admin approval'); return }
    await loadAndRefresh()
  }

  const publishAll = async (admitCardId: string) => {
    setPublishing(true)
    await fetch('/api/admit-cards', { method: 'PATCH', headers: h, body: JSON.stringify({ action: 'publish_all', admitCardId }) })
    await loadAndRefresh()
    setPublishing(false)
  }

  const loadAndRefresh = async () => {
    const res = await fetch('/api/admit-cards', { headers: h })
    const data = await res.json()
    setAdmitCards(data.admitCards || [])
    const fresh = (data.admitCards || []).find((c: any) => c.id === selectedCard?.id)
    if (fresh) setSelectedCard(fresh)
  }

  const statusBadge = (acs: any) => {
    if (acs.isPublished) return { label: 'Published ✅', color: '#10b981', bg: 'rgba(16,185,129,0.15)' }
    if (acs.isBlocked && acs.isApproved) return { label: 'Approved 👍', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' }
    if (acs.isBlocked) return { label: 'Blocked ⛔', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' }
    return { label: 'Ready', color: '#6366f1', bg: 'rgba(99,102,241,0.15)' }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'white', margin: 0 }}>🎫 Admit Card Generator</h2>
          <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>Generate and manage exam admit cards class & batch wise</p>
        </div>
        <button onClick={() => setShowForm(true)}
          style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}>
          + Generate Admit Cards
        </button>
      </div>

      {/* Create Form Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#1e293b', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '480px', border: '1px solid #334155' }}>
            <h3 style={{ color: 'white', marginBottom: '20px', fontWeight: '800' }}>📋 New Admit Card Batch</h3>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600' }}>Select Class *</label>
                <select required value={form.courseId} onChange={e => setForm({ ...form, courseId: e.target.value, batchId: '' })}
                  style={{ width: '100%', marginTop: '6px', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', color: 'white', fontSize: '14px' }}>
                  <option value=''>-- Select Class --</option>
                  {courses.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600' }}>Select Batch *</label>
                <select required value={form.batchId} onChange={e => setForm({ ...form, batchId: e.target.value })}
                  style={{ width: '100%', marginTop: '6px', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', color: 'white', fontSize: '14px' }}>
                  <option value=''>-- Select Batch --</option>
                  {batches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600' }}>Exam Name *</label>
                <input required value={form.examName} onChange={e => setForm({ ...form, examName: e.target.value })}
                  placeholder="e.g. Half Yearly Examination 2025"
                  style={{ width: '100%', marginTop: '6px', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', color: 'white', fontSize: '14px', outline: 'none' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600' }}>Start Date *</label>
                  <input type='date' required value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })}
                    style={{ width: '100%', marginTop: '6px', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', color: 'white', fontSize: '14px', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600' }}>End Date *</label>
                  <input type='date' required value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })}
                    style={{ width: '100%', marginTop: '6px', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', color: 'white', fontSize: '14px', outline: 'none' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type='button' onClick={() => setShowForm(false)}
                  style={{ flex: 1, padding: '12px', background: '#334155', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
                <button type='submit' disabled={creating}
                  style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700' }}>
                  {creating ? 'Generating...' : '🚀 Generate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admit Card List */}
      {loading ? <div style={{ color: '#64748b', textAlign: 'center', padding: '40px' }}>Loading...</div> : (
        <div style={{ display: 'grid', gap: '14px' }}>
          {admitCards.length === 0 && (
            <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '40px', textAlign: 'center', color: '#64748b' }}>
              No admit cards generated yet. Click "Generate Admit Cards" to start.
            </div>
          )}
          {admitCards.map(card => (
            <div key={card.id} style={{ background: '#1e293b', border: `1px solid ${selectedCard?.id === card.id ? '#6366f1' : '#334155'}`, borderRadius: '16px', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', flexWrap: 'wrap', gap: '10px' }}
                onClick={() => setSelectedCard(selectedCard?.id === card.id ? null : card)}>
                <div>
                  <div style={{ fontWeight: '700', color: 'white', fontSize: '15px' }}>🎫 {card.examName}</div>
                  <div style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px' }}>
                    {card.course?.name} › {card.batch?.name} &nbsp;|&nbsp; {card.students.length} students &nbsp;|&nbsp;
                    {new Date(card.startDate).toLocaleDateString('en-IN')} – {new Date(card.endDate).toLocaleDateString('en-IN')}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {card.isPublished && <span style={{ padding: '4px 10px', borderRadius: '20px', background: 'rgba(16,185,129,0.15)', color: '#10b981', fontSize: '12px', fontWeight: '700' }}>Published</span>}
                  <span style={{ color: '#6366f1', fontSize: '20px' }}>{selectedCard?.id === card.id ? '▲' : '▼'}</span>
                </div>
              </div>

              {selectedCard?.id === card.id && (
                <div style={{ borderTop: '1px solid #334155', padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ color: '#94a3b8', fontSize: '13px' }}>
                      Check ✅ to <strong style={{ color: 'white' }}>allow</strong> admit card. Click ⛔ to <strong style={{ color: '#ef4444' }}>block</strong> (requires Super Admin approval to re-publish).
                    </div>
                    <button onClick={() => publishAll(card.id)} disabled={publishing}
                      style={{ padding: '8px 18px', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '13px' }}>
                      {publishing ? 'Publishing...' : '📢 Publish All (Eligible)'}
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {card.students.map((acs: any) => {
                      const badge = statusBadge(acs)
                      return (
                        <div key={acs.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', background: '#0f172a', borderRadius: '12px', padding: '12px 16px', border: `1px solid ${acs.isBlocked ? 'rgba(239,68,68,0.3)' : '#1e293b'}` }}>
                          {/* Block/Allow Checkbox */}
                          <button onClick={() => toggleBlock(acs)}
                            style={{ width: '28px', height: '28px', borderRadius: '8px', border: `2px solid ${acs.isBlocked ? '#ef4444' : '#10b981'}`, background: acs.isBlocked ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {acs.isBlocked ? '✗' : '✓'}
                          </button>

                          {/* Photo */}
                          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#1e293b', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                            {acs.student?.photo ? <img src={acs.student.photo} alt={acs.student.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👤'}
                          </div>

                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '700', color: 'white', fontSize: '14px' }}>{acs.student?.fullName}</div>
                            <div style={{ color: '#64748b', fontSize: '12px' }}>ID: {acs.student?.studentId || 'N/A'}</div>
                            {acs.blockReason && <div style={{ color: '#f59e0b', fontSize: '11px', marginTop: '2px' }}>Reason: {acs.blockReason}</div>}
                          </div>

                          <span style={{ padding: '4px 10px', borderRadius: '20px', background: badge.bg, color: badge.color, fontSize: '12px', fontWeight: '700', whiteSpace: 'nowrap' }}>{badge.label}</span>

                          {/* Publish individually (for previously blocked+approved) */}
                          {acs.isBlocked && acs.isApproved && !acs.isPublished && (
                            <button onClick={() => publishStudent(acs.id)}
                              style={{ padding: '6px 12px', background: 'rgba(245,158,11,0.2)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                              Publish Now
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
