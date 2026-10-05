'use client'
import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect } from 'react'

export default function SuperAdminAdmitCardsPage() {
  const { token } = useAuth()
  const [admitCards, setAdmitCards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCard, setSelectedCard] = useState<any>(null)
  const [actionMsg, setActionMsg] = useState('')

  const h = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

  useEffect(() => {
    if (!token) return
    loadAdmitCards()
  }, [token])

  const loadAdmitCards = async () => {
    setLoading(true)
    const res = await fetch('/api/admit-cards', { headers: h })
    const data = await res.json()
    setAdmitCards(data.admitCards || [])
    setLoading(false)
  }

  const approveStudent = async (acsId: string, cardId: string) => {
    const res = await fetch('/api/admit-cards', {
      method: 'PATCH', headers: h,
      body: JSON.stringify({ action: 'approve_student', admitCardStudentId: acsId })
    })
    const data = await res.json()
    if (data.success) {
      setActionMsg('✅ Student approved! Teacher can now publish.')
      await loadAdmitCards()
      const fresh = (await fetch('/api/admit-cards', { headers: h }).then(r => r.json())).admitCards
      const fc = (fresh || []).find((c: any) => c.id === cardId)
      if (fc) setSelectedCard(fc)
      setTimeout(() => setActionMsg(''), 3000)
    }
  }

  const statusBadge = (acs: any) => {
    if (acs.isPublished) return { label: 'Published ✅', color: '#10b981', bg: 'rgba(16,185,129,0.15)' }
    if (acs.isBlocked && acs.isApproved) return { label: 'Approved – Pending Publish', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' }
    if (acs.isBlocked) return { label: 'Blocked – Needs Approval ⛔', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' }
    return { label: 'Ready', color: '#6366f1', bg: 'rgba(99,102,241,0.15)' }
  }

  // Filter cards that have blocked students
  const cardsWithBlocked = admitCards.filter(c => c.students?.some((s: any) => s.isBlocked && !s.isApproved))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: '800' }}>🎫 Admit Cards – Admin View</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>Approve blocked student admit cards. Once approved, teacher can publish them.</p>
      </div>

      {actionMsg && (
        <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', padding: '12px 16px', color: '#10b981', fontWeight: '600' }}>
          {actionMsg}
        </div>
      )}

      {/* Pending Approvals Section */}
      {cardsWithBlocked.length > 0 && (
        <div className="card" style={{ border: '1px solid rgba(239,68,68,0.3)', borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'rgba(239,68,68,0.05)' }}>
            <h3 style={{ color: '#ef4444', fontWeight: '700' }}>⚠️ Pending Approvals ({cardsWithBlocked.reduce((sum, c) => sum + c.students.filter((s: any) => s.isBlocked && !s.isApproved).length, 0)})</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>These students were blocked by teacher. Approve to allow teacher to publish their admit card.</p>
          </div>
          <div style={{ padding: '16px' }}>
            {cardsWithBlocked.map(card => (
              <div key={card.id} style={{ marginBottom: '16px' }}>
                <div style={{ fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px', fontSize: '14px' }}>
                  🎫 {card.examName} — {card.course?.name} › {card.batch?.name}
                </div>
                {card.students.filter((s: any) => s.isBlocked && !s.isApproved).map((acs: any) => (
                  <div key={acs.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', background: 'var(--surface-2)', borderRadius: '12px', padding: '12px 16px', marginBottom: '8px', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--surface)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                      {acs.student?.photo ? <img src={acs.student.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👤'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '14px' }}>{acs.student?.fullName}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>ID: {acs.student?.studentId || 'N/A'}</div>
                      {acs.blockReason && <div style={{ color: '#f59e0b', fontSize: '12px', marginTop: '2px' }}>Block reason: {acs.blockReason}</div>}
                    </div>
                    <button onClick={() => approveStudent(acs.id, card.id)}
                      style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', whiteSpace: 'nowrap' }}>
                      ✅ Approve
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Admit Cards */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontWeight: '700' }}>📋 All Admit Card Batches ({admitCards.length})</h3>
        </div>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
        ) : admitCards.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No admit cards generated yet.</div>
        ) : (
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {admitCards.map(card => (
              <div key={card.id} style={{ border: `1px solid ${selectedCard?.id === card.id ? 'var(--primary)' : 'var(--border)'}`, borderRadius: '14px', overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', flexWrap: 'wrap', gap: '10px', background: 'var(--surface-2)' }}
                  onClick={() => setSelectedCard(selectedCard?.id === card.id ? null : card)}>
                  <div>
                    <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '14px' }}>🎫 {card.examName}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '3px' }}>
                      {card.course?.name} › {card.batch?.name} | {card.students?.length} students |
                      {new Date(card.startDate).toLocaleDateString('en-IN')} – {new Date(card.endDate).toLocaleDateString('en-IN')}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', background: card.isPublished ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.1)', color: card.isPublished ? '#10b981' : '#6366f1' }}>
                      {card.isPublished ? 'Published' : 'Draft'}
                    </span>
                    <span style={{ fontSize: '16px', color: 'var(--text-muted)' }}>{selectedCard?.id === card.id ? '▲' : '▼'}</span>
                  </div>
                </div>

                {selectedCard?.id === card.id && (
                  <div style={{ padding: '16px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {card.students?.map((acs: any) => {
                      const badge = statusBadge(acs)
                      return (
                        <div key={acs.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: 'var(--surface-2)', borderRadius: '10px', border: `1px solid ${acs.isBlocked && !acs.isApproved ? 'rgba(239,68,68,0.2)' : 'var(--border)'}` }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', background: 'var(--surface)', flexShrink: 0 }}>
                            {acs.student?.photo ? <img src={acs.student.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👤'}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text-primary)' }}>{acs.student?.fullName}</div>
                            {acs.blockReason && <div style={{ color: '#f59e0b', fontSize: '11px' }}>Reason: {acs.blockReason}</div>}
                          </div>
                          <span style={{ padding: '3px 10px', borderRadius: '20px', background: badge.bg, color: badge.color, fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap' }}>{badge.label}</span>
                          {acs.isBlocked && !acs.isApproved && (
                            <button onClick={() => approveStudent(acs.id, card.id)}
                              style={{ padding: '6px 12px', background: 'rgba(16,185,129,0.2)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                              Approve
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
