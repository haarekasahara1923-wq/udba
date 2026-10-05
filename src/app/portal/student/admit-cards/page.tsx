'use client'
import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect, useRef } from 'react'

export default function StudentAdmitCardsPage() {
  const { token, user } = useAuth()
  const [admitCardStudents, setAdmitCardStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAcs, setSelectedAcs] = useState<any>(null)
  const [tenant, setTenant] = useState<any>(null)
  const printRef = useRef<HTMLDivElement>(null)

  const h = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    if (!token || !user) return
    const storedTenant = typeof window !== 'undefined' ? localStorage.getItem('udba_tenant') : null
    if (storedTenant) setTenant(JSON.parse(storedTenant))

    // Fetch student profile to get student record ID
    fetch('/api/students/me', { headers: h })
      .then(r => r.json())
      .then(d => {
        const sid = d.student?.id
        if (sid) {
          return fetch(`/api/admit-cards?studentId=${sid}`, { headers: h }).then(r => r.json())
        }
        return { admitCardStudents: [] }
      })
      .then(d => {
        setAdmitCardStudents(d.admitCardStudents || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [token, user])

  const handlePrint = (acs: any) => {
    setSelectedAcs(acs)
    setTimeout(() => {
      window.print()
    }, 300)
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
        <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'white', margin: 0 }}>🎫 My Admit Cards</h2>
        <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>Download your exam admit cards issued by your school.</p>
      </div>

      {admitCardStudents.length === 0 ? (
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '48px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎫</div>
          <div style={{ color: 'white', fontWeight: '700', fontSize: '16px' }}>No admit cards issued yet</div>
          <div style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>Your admit cards will appear here once published by your school.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {admitCardStudents.map(acs => (
            <div key={acs.id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', overflow: 'hidden' }}>
              {/* Card Header */}
              <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ fontWeight: '700', color: 'white', fontSize: '15px' }}>🎫 {acs.admitCard?.examName}</div>
                  <div style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px' }}>
                    {acs.admitCard?.course?.name} › {acs.admitCard?.batch?.name}
                  </div>
                  <div style={{ color: '#64748b', fontSize: '12px', marginTop: '2px' }}>
                    {new Date(acs.admitCard?.startDate).toLocaleDateString('en-IN')} – {new Date(acs.admitCard?.endDate).toLocaleDateString('en-IN')}
                  </div>
                </div>
                <button onClick={() => handlePrint(acs)}
                  style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  📥 Download / Print
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Print Template */}
      {selectedAcs && (
        <div id="admit-card-print" ref={printRef} style={{ display: 'none' }}>
          <AdmitCardTemplate acs={selectedAcs} tenant={tenant} />
        </div>
      )}
    </div>
  )
}

function AdmitCardTemplate({ acs, tenant }: { acs: any, tenant: any }) {
  const examCard = acs.admitCard
  const student = acs.student

  return (
    <div style={{
      width: '800px', margin: '0 auto', fontFamily: 'Arial, sans-serif',
      border: '3px solid #1a5c38', borderRadius: '16px', overflow: 'hidden',
      background: 'white', color: '#0a0a0a'
    }}>
      {/* School Header */}
      <div style={{ background: 'linear-gradient(135deg, #1a5c38, #0f3d26)', padding: '24px 32px', display: 'flex', alignItems: 'center', gap: '20px' }}>
        {tenant?.logo && (
          <img src={tenant.logo} alt="School Logo" style={{ width: '70px', height: '70px', objectFit: 'contain', borderRadius: '12px', background: 'white', padding: '4px' }} />
        )}
        <div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: 'white', letterSpacing: '0.5px' }}>{tenant?.name || 'School Name'}</div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', marginTop: '4px' }}>{tenant?.address || ''}</div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>Phone: {tenant?.phone || ''} {tenant?.email ? `| Email: ${tenant.email}` : ''}</div>
        </div>
      </div>

      {/* Title */}
      <div style={{ background: '#f0fdf4', padding: '14px 32px', textAlign: 'center', borderBottom: '2px dashed #1a5c38' }}>
        <div style={{ fontSize: '18px', fontWeight: '900', color: '#1a5c38', letterSpacing: '2px', textTransform: 'uppercase' }}>
          ADMIT CARD
        </div>
        <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f3d26', marginTop: '4px' }}>{examCard?.examName}</div>
      </div>

      {/* Body */}
      <div style={{ padding: '28px 32px', display: 'grid', gridTemplateColumns: '1fr 120px', gap: '28px', alignItems: 'start' }}>
        {/* Student Info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          {[
            { label: 'Student Name', value: student?.fullName },
            { label: 'Father\'s Name', value: student?.fatherName || 'N/A' },
            { label: 'Student ID', value: student?.studentId || 'N/A' },
            { label: 'Gender', value: student?.gender },
            { label: 'Date of Birth', value: student?.dob ? new Date(student.dob).toLocaleDateString('en-IN') : 'N/A' },
            { label: 'Class / Batch', value: `${examCard?.course?.name} / ${examCard?.batch?.name}` },
            { label: 'Exam Start Date', value: new Date(examCard?.startDate).toLocaleDateString('en-IN') },
            { label: 'Exam End Date', value: new Date(examCard?.endDate).toLocaleDateString('en-IN') },
          ].map(({ label, value }) => (
            <div key={label} style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
              <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: '700', marginTop: '4px' }}>{value || 'N/A'}</div>
            </div>
          ))}
        </div>

        {/* Photo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '110px', height: '130px', border: '2px solid #1a5c38', borderRadius: '10px', overflow: 'hidden', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px' }}>
            {student?.photo ? (
              <img src={student.photo} alt={student.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : '👤'}
          </div>
          <div style={{ fontSize: '10px', color: '#64748b', textAlign: 'center' }}>Candidate Photo</div>
          {tenant?.schoolCode && <div style={{ fontSize: '10px', color: '#1a5c38', fontWeight: '700' }}>School Code: {tenant.schoolCode}</div>}
          {tenant?.diseCode && <div style={{ fontSize: '10px', color: '#1a5c38', fontWeight: '700' }}>DISE: {tenant.diseCode}</div>}
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '16px 32px', background: '#f0fdf4', borderTop: '2px dashed #1a5c38', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>Generated on: {new Date().toLocaleDateString('en-IN')}</div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>This admit card is computer generated and does not require physical signature.</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '100px', borderTop: '1px solid #0f172a', paddingTop: '4px', fontSize: '11px', color: '#64748b' }}>
            Authorized Signature
          </div>
        </div>
      </div>
    </div>
  )
}
