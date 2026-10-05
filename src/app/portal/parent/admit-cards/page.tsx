'use client'
import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function ParentAdmitCardsPage() {
  const { token, user } = useAuth()
  const [children, setChildren] = useState<any[]>([])
  const [admitCardsByStudent, setAdmitCardsByStudent] = useState<Record<string, any[]>>({})
  const [loading, setLoading] = useState(true)
  const [selectedAcs, setSelectedAcs] = useState<any>(null)
  const [tenant, setTenant] = useState<any>(null)

  const h = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    if (!token) return
    const storedTenant = typeof window !== 'undefined' ? localStorage.getItem('udba_tenant') : null
    if (storedTenant) setTenant(JSON.parse(storedTenant))
    // Fetch children via parent profile
    fetch('/api/parent', { headers: h }).then(r => r.json()).then(async d => {
      const kids = d.profile?.children || []
      setChildren(kids)
      // Fetch admit cards for each child
      const map: Record<string, any[]> = {}
      for (const kid of kids) {
        const res = await fetch(`/api/admit-cards?studentId=${kid.id}`, { headers: h })
        const data = await res.json()
        map[kid.id] = data.admitCardStudents || []
      }
      setAdmitCardsByStudent(map)
      setLoading(false)
    })
  }, [token])

  const handlePrint = (acs: any) => {
    setSelectedAcs(acs)
    setTimeout(() => window.print(), 300)
  }

  if (loading) return <div style={{ color: '#64748b', textAlign: 'center', padding: '40px' }}>Loading admit cards...</div>

  return (
    <div>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #admit-card-print, #admit-card-print * { visibility: visible !important; }
          #admit-card-print { position: fixed !important; inset: 0 !important; z-index: 9999 !important; padding: 20px !important; }
        }
      `}</style>

      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'white' }}>🎫 Admit Cards</h2>
        <p style={{ color: '#64748b', fontSize: '13px' }}>Download exam admit cards for your children.</p>
      </div>

      {children.length === 0 ? (
        <div style={{ background: '#1e293b', borderRadius: '16px', padding: '40px', textAlign: 'center', color: '#64748b' }}>No children linked to your account.</div>
      ) : (
        children.map(child => (
          <div key={child.id} style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                {child.photo ? <img src={child.photo} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }} /> : '👤'}
              </div>
              <div style={{ fontWeight: '700', color: 'white', fontSize: '15px' }}>{child.fullName}</div>
            </div>

            {!admitCardsByStudent[child.id]?.length ? (
              <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px', color: '#64748b', fontSize: '13px', textAlign: 'center' }}>
                No admit cards issued for {child.fullName} yet.
              </div>
            ) : (
              admitCardsByStudent[child.id].map(acs => (
                <div key={acs.id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: '16px 20px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ fontWeight: '700', color: 'white', fontSize: '14px' }}>🎫 {acs.admitCard?.examName}</div>
                    <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '4px' }}>
                      {acs.admitCard?.course?.name} › {acs.admitCard?.batch?.name} &nbsp;|&nbsp;
                      {new Date(acs.admitCard?.startDate).toLocaleDateString('en-IN')} – {new Date(acs.admitCard?.endDate).toLocaleDateString('en-IN')}
                    </div>
                  </div>
                  <button onClick={() => handlePrint({ ...acs, student: child })}
                    style={{ padding: '9px 18px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>
                    📥 Download / Print
                  </button>
                </div>
              ))
            )}
          </div>
        ))
      )}

      {/* Print */}
      {selectedAcs && (
        <div id="admit-card-print" style={{ display: 'none' }}>
          <AdmitCardPrintTemplate acs={selectedAcs} tenant={tenant} />
        </div>
      )}
    </div>
  )
}

function AdmitCardPrintTemplate({ acs, tenant }: { acs: any, tenant: any }) {
  const examCard = acs.admitCard
  const student = acs.student
  return (
    <div style={{ width: '800px', margin: '0 auto', fontFamily: 'Arial, sans-serif', border: '3px solid #1a5c38', borderRadius: '16px', overflow: 'hidden', background: 'white', color: '#0a0a0a' }}>
      <div style={{ background: 'linear-gradient(135deg, #1a5c38, #0f3d26)', padding: '24px 32px', display: 'flex', alignItems: 'center', gap: '20px' }}>
        {tenant?.logo && <img src={tenant.logo} alt="Logo" style={{ width: '70px', height: '70px', objectFit: 'contain', borderRadius: '12px', background: 'white', padding: '4px' }} />}
        <div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: 'white' }}>{tenant?.name || 'School Name'}</div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', marginTop: '4px' }}>{tenant?.address || ''}</div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>Phone: {tenant?.phone || ''}</div>
        </div>
      </div>
      <div style={{ background: '#f0fdf4', padding: '14px 32px', textAlign: 'center', borderBottom: '2px dashed #1a5c38' }}>
        <div style={{ fontSize: '18px', fontWeight: '900', color: '#1a5c38', letterSpacing: '2px' }}>ADMIT CARD</div>
        <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f3d26', marginTop: '4px' }}>{examCard?.examName}</div>
      </div>
      <div style={{ padding: '28px 32px', display: 'grid', gridTemplateColumns: '1fr 120px', gap: '28px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          {[
            { label: 'Student Name', value: student?.fullName },
            { label: "Father's Name", value: student?.fatherName || 'N/A' },
            { label: 'Student ID', value: student?.studentId || 'N/A' },
            { label: 'Gender', value: student?.gender },
            { label: 'Date of Birth', value: student?.dob ? new Date(student.dob).toLocaleDateString('en-IN') : 'N/A' },
            { label: 'Class / Batch', value: `${examCard?.course?.name} / ${examCard?.batch?.name}` },
            { label: 'Exam Start', value: new Date(examCard?.startDate).toLocaleDateString('en-IN') },
            { label: 'Exam End', value: new Date(examCard?.endDate).toLocaleDateString('en-IN') },
          ].map(({ label, value }) => (
            <div key={label} style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>{label}</div>
              <div style={{ fontSize: '14px', fontWeight: '700', marginTop: '4px' }}>{value}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '110px', height: '130px', border: '2px solid #1a5c38', borderRadius: '10px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', background: '#f0fdf4' }}>
            {student?.photo ? <img src={student.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👤'}
          </div>
          <div style={{ fontSize: '10px', color: '#64748b', textAlign: 'center' }}>Candidate Photo</div>
        </div>
      </div>
      <div style={{ padding: '16px 32px', background: '#f0fdf4', borderTop: '2px dashed #1a5c38', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div style={{ fontSize: '11px', color: '#64748b' }}>Generated: {new Date().toLocaleDateString('en-IN')}</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '100px', borderTop: '1px solid #0f172a', paddingTop: '4px', fontSize: '11px', color: '#64748b' }}>Authorized Signature</div>
        </div>
      </div>
    </div>
  )
}
