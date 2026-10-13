'use client'
import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export default function ParentFeeLedgerPage() {
  return (
    <Suspense fallback={<div style={{ color: '#64748b', textAlign: 'center', padding: '40px' }}>Loading fee details...</div>}>
      <ParentFeeLedgerContent />
    </Suspense>
  )
}

function ParentFeeLedgerContent() {
  const { token, user } = useAuth()
  const searchParams = useSearchParams()
  const queryStudentId = searchParams.get('studentId')

  const [children, setChildren] = useState<any[]>([])
  const [tenant, setTenant] = useState<any>(null)
  const [selectedChildId, setSelectedChildId] = useState<string>('')
  const [ledgerData, setLedgerData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [ledgerLoading, setLedgerLoading] = useState(false)

  const h = { Authorization: `Bearer ${token}` }

  // 1. Fetch parent profile & linked children
  useEffect(() => {
    if (!token) return
    const storedTenant = typeof window !== 'undefined' ? localStorage.getItem('udba_tenant') : null
    if (storedTenant) {
      try { setTenant(JSON.parse(storedTenant)) } catch {}
    }

    fetch('/api/parent', { headers: h })
      .then(r => r.json())
      .then(d => {
        const kids = d.profile?.children || []
        setChildren(kids)
        if (d.profile?.tenant) {
          setTenant(d.profile.tenant)
        }
        if (kids.length > 0) {
          const initialId = (queryStudentId && kids.some((k: any) => k.id === queryStudentId))
            ? queryStudentId
            : kids[0].id
          setSelectedChildId(initialId)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [token, queryStudentId])

  // 2. Fetch fee ledger for the selected child
  useEffect(() => {
    if (!token || !selectedChildId) return
    setLedgerLoading(true)

    fetch(`/api/reports/fee-ledger?studentId=${selectedChildId}`, { headers: h })
      .then(r => r.json())
      .then(d => {
        if (d.success && d.students && d.students.length > 0) {
          setLedgerData(d.students[0])
        } else {
          setLedgerData(null)
        }
        setLedgerLoading(false)
      })
      .catch(() => setLedgerLoading(false))
  }, [token, selectedChildId])

  const selectedChild = children.find(c => c.id === selectedChildId) || children[0]

  const totalFee = ledgerData ? ledgerData.totalFee : (selectedChild?.totalFee || 0)
  const totalPaid = ledgerData ? ledgerData.totalPaid : (selectedChild?.paidFee || 0)
  const remainingFee = ledgerData 
    ? ledgerData.outstanding 
    : (selectedChild?.remainingFee !== undefined ? selectedChild.remainingFee : Math.max(0, totalFee - totalPaid))

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return <div style={{ color: '#64748b', textAlign: 'center', padding: '40px' }}>Loading fee details...</div>
  }

  if (children.length === 0) {
    return (
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '36px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: '36px', marginBottom: '12px' }}>👶</div>
        <h2 style={{ fontSize: '16px', color: 'white', margin: 0 }}>No Children Linked Yet</h2>
        <p style={{ fontSize: '13px', color: '#94a3b8', margin: '8px 0 16px 0' }}>Please link your children to view their fee ledger and payment history.</p>
        <Link href="/portal/parent/children" style={{ background: '#6366f1', color: 'white', padding: '10px 20px', borderRadius: '10px', textDecoration: 'none', fontSize: '13px', fontWeight: 600, display: 'inline-block' }}>
          Link Children Now
        </Link>
      </div>
    )
  }

  return (
    <div>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #ledger-print-area, #ledger-print-area * { visibility: visible !important; }
          #ledger-print-area { position: fixed !important; inset: 0 !important; z-index: 9999 !important; padding: 20px !important; background: white !important; color: black !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: '800', color: 'white', margin: 0 }}>💰 Student Fee Ledger</h1>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>Complete statement of course fees, paid amounts, and remaining dues</p>
        </div>
        <button
          onClick={handlePrint}
          style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          🖨️ Print / Download
        </button>
      </div>

      {/* Child Switcher Tabs */}
      {children.length > 1 && (
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px', marginBottom: '16px' }}>
          {children.map(c => {
            const isSelected = c.id === selectedChildId
            const childRem = c.remainingFee !== undefined ? c.remainingFee : Math.max(0, (c.totalFee || 0) - (c.paidFee || 0))
            return (
              <button
                key={c.id}
                onClick={() => setSelectedChildId(c.id)}
                style={{
                  background: isSelected ? '#6366f1' : '#1e293b',
                  color: isSelected ? 'white' : '#94a3b8',
                  border: `1px solid ${isSelected ? '#6366f1' : '#334155'}`,
                  borderRadius: '12px',
                  padding: '10px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>👦 {c.fullName}</span>
                <span style={{
                  fontSize: '11px',
                  background: isSelected ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.3)',
                  padding: '2px 6px',
                  borderRadius: '6px',
                  color: childRem > 0 ? (isSelected ? '#fef08a' : '#f59e0b') : (isSelected ? '#a7f3d0' : '#10b981')
                }}>
                  {childRem > 0 ? `₹${childRem.toLocaleString('en-IN')} Due` : 'Paid ✅'}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Printable & Visible Ledger Container */}
      <div id="ledger-print-area">
        {/* Print Header (Only visible when printing) */}
        <div style={{ display: 'none' }} className="print-only">
          <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '12px', marginBottom: '16px' }}>
            <h2 style={{ margin: 0, textTransform: 'uppercase', fontSize: '20px' }}>{tenant?.name || 'School Name'}</h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>{tenant?.address || ''} | Ph: {tenant?.phone || ''}</p>
            <h3 style={{ margin: '10px 0 0 0', textDecoration: 'underline', fontSize: '15px' }}>STUDENT FEE STATEMENT / LEDGER</h3>
          </div>
        </div>

        {/* Child Profile Card */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: '16px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: 'white' }}>
                👦 {selectedChild?.fullName}
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <span>Class: <strong style={{ color: '#e2e8f0' }}>{selectedChild?.course?.name || ledgerData?.class || 'N/A'}</strong></span>
                <span>• Section: <strong style={{ color: '#e2e8f0' }}>{selectedChild?.batch?.name || ledgerData?.section || 'N/A'}</strong></span>
                {selectedChild?.studentId && <span>• Student ID: <strong style={{ color: '#e2e8f0' }}>{selectedChild.studentId}</strong></span>}
                {selectedChild?.fatherName && <span>• Father: <strong style={{ color: '#e2e8f0' }}>{selectedChild.fatherName}</strong></span>}
              </div>
            </div>
            <div>
              <span style={{
                fontSize: '12px',
                fontWeight: 700,
                padding: '4px 12px',
                borderRadius: '8px',
                background: remainingFee <= 0 ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                border: `1px solid ${remainingFee <= 0 ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`,
                color: remainingFee <= 0 ? '#10b981' : '#f59e0b'
              }}>
                {remainingFee <= 0 ? 'STATUS: PAID IN FULL ✅' : 'STATUS: PAYMENT PENDING ⚠️'}
              </span>
            </div>
          </div>

          {/* 3 Prominent Stat Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '16px' }}>
            <div style={{ background: '#0f172a', borderRadius: '12px', padding: '14px 10px', textAlign: 'center', border: '1px solid #334155' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Total Course Fee</div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#f8fafc', marginTop: '4px' }}>
                ₹{totalFee.toLocaleString('en-IN')}
              </div>
            </div>

            <div style={{ background: '#0f172a', borderRadius: '12px', padding: '14px 10px', textAlign: 'center', border: '1px solid #334155' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Total Amount Paid</div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#10b981', marginTop: '4px' }}>
                ₹{totalPaid.toLocaleString('en-IN')}
              </div>
            </div>

            <div style={{ 
              background: '#0f172a', 
              borderRadius: '12px', 
              padding: '14px 10px', 
              textAlign: 'center', 
              border: `1px solid ${remainingFee > 0 ? 'rgba(245,158,11,0.5)' : 'rgba(16,185,129,0.5)'}` 
            }}>
              <div style={{ fontSize: '11px', color: remainingFee > 0 ? '#f59e0b' : '#10b981', fontWeight: 600, textTransform: 'uppercase' }}>
                Remaining Balance Due
              </div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: remainingFee > 0 ? '#f59e0b' : '#10b981', marginTop: '4px' }}>
                ₹{remainingFee.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>

        {/* Ledger Transactions Table */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: '16px', overflowX: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'white', margin: 0 }}>
              📜 Detailed Transaction Ledger
            </h3>
            {ledgerLoading && <span style={{ fontSize: '11px', color: '#94a3b8' }}>Refreshing...</span>}
          </div>

          {ledgerLoading && !ledgerData ? (
            <div style={{ color: '#64748b', textAlign: 'center', padding: '30px' }}>Loading ledger entries...</div>
          ) : !ledgerData?.ledger || ledgerData.ledger.length === 0 ? (
            <div style={{ color: '#64748b', textAlign: 'center', padding: '30px' }}>
              No transactions recorded yet for this student.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', color: '#cbd5e1' }}>
              <thead>
                <tr style={{ background: '#0f172a', borderBottom: '1px solid #334155', textAlign: 'left' }}>
                  <th style={{ padding: '10px 8px', color: '#94a3b8', fontWeight: 600 }}>Date</th>
                  <th style={{ padding: '10px 8px', color: '#94a3b8', fontWeight: 600 }}>Particulars</th>
                  <th style={{ padding: '10px 8px', color: '#94a3b8', fontWeight: 600 }}>Receipt #</th>
                  <th style={{ padding: '10px 8px', color: '#94a3b8', fontWeight: 600 }}>Mode</th>
                  <th style={{ padding: '10px 8px', color: '#94a3b8', fontWeight: 600, textAlign: 'right' }}>Debit (₹)</th>
                  <th style={{ padding: '10px 8px', color: '#94a3b8', fontWeight: 600, textAlign: 'right' }}>Credit (₹)</th>
                  <th style={{ padding: '10px 8px', color: '#94a3b8', fontWeight: 600, textAlign: 'right' }}>Balance (₹)</th>
                </tr>
              </thead>
              <tbody>
                {ledgerData.ledger.map((entry: any, index: number) => {
                  const isDebit = entry.type === 'DEBIT'
                  return (
                    <tr 
                      key={index} 
                      style={{ 
                        borderBottom: '1px solid #334155', 
                        background: index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' 
                      }}
                    >
                      <td style={{ padding: '10px 8px', whiteSpace: 'nowrap' }}>
                        {entry.date ? new Date(entry.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                      </td>
                      <td style={{ padding: '10px 8px', color: 'white', fontWeight: 500 }}>
                        {entry.particulars}
                      </td>
                      <td style={{ padding: '10px 8px' }}>
                        {entry.receiptNo ? (
                          <span style={{ background: 'rgba(99,102,241,0.2)', color: '#818cf8', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                            {entry.receiptNo}
                          </span>
                        ) : '-'}
                      </td>
                      <td style={{ padding: '10px 8px' }}>
                        {entry.mode ? (
                          <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>
                            {entry.mode}
                          </span>
                        ) : '-'}
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', color: entry.debit > 0 ? '#f87171' : '#64748b', fontWeight: entry.debit > 0 ? 600 : 400 }}>
                        {entry.debit > 0 ? `₹${entry.debit.toLocaleString('en-IN')}` : '-'}
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', color: entry.credit > 0 ? '#34d399' : '#64748b', fontWeight: entry.credit > 0 ? 700 : 400 }}>
                        {entry.credit > 0 ? `₹${entry.credit.toLocaleString('en-IN')}` : '-'}
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 700, color: entry.balance > 0 ? '#f59e0b' : '#10b981' }}>
                        ₹{entry.balance.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
