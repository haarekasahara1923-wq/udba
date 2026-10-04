'use client'
import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect } from 'react'

export default function MyLedger() {
  const { token } = useAuth()
  const [ledgers, setLedgers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const h = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    if (!token) return
    fetch('/api/teachers/ledger', { headers: h })
      .then(r => r.json())
      .then(d => {
        setLedgers(d.data || [])
        setLoading(false)
      })
      .catch(e => {
          console.error(e)
          setLoading(false)
      })
  }, [token])

  const getMonthName = (m: number) => {
      return new Date(2000, m - 1, 1).toLocaleString('default', { month: 'long' })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h1 style={{ fontSize: '20px', fontWeight: '800', color: 'white', margin: 0 }}>💰 My Salary Ledger</h1>

      {loading && <div style={{ color: '#94a3b8', textAlign: 'center', padding: '20px' }}>Loading ledger...</div>}

      {!loading && ledgers.length === 0 && (
          <div style={{ background: '#1e293b', border: '1px dashed #334155', borderRadius: '12px', padding: '30px', textAlign: 'center', color: '#64748b' }}>
              No salary records found.
          </div>
      )}

      {!loading && ledgers.map((l: any) => (
          <div key={l.id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: 'white' }}>
                      {getMonthName(l.month)} {l.year}
                  </div>
                  <span style={{ 
                      fontSize: '11px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '4px',
                      background: l.status === 'PAID' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)',
                      color: l.status === 'PAID' ? '#10b981' : '#f59e0b'
                   }}>
                      {l.status}
                  </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: '#0f172a', padding: '12px', borderRadius: '8px' }}>
                  <div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Base Salary</div>
                      <div style={{ fontSize: '14px', color: 'white', fontWeight: '500' }}>₹{l.baseSalary}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Deductions</div>
                      <div style={{ fontSize: '14px', color: '#ef4444', fontWeight: '500' }}>-₹{l.deductions}</div>
                  </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                  <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '500' }}>Net Payable</div>
                  <div style={{ fontSize: '18px', color: '#10b981', fontWeight: '800' }}>₹{l.netPayable}</div>
              </div>
          </div>
      ))}
    </div>
  )
}
