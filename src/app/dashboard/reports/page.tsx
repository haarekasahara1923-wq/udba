'use client'
import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect } from 'react'

function downloadCSV(data: any[], filename: string) {
  if (!data.length) return
  const keys = Object.keys(data[0])
  const csv = [keys.join(','), ...data.map(row => keys.map(k => JSON.stringify(row[k] ?? '')).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

function downloadPDF(title: string, headers: string[], rows: string[][]) {
  const content = `<!DOCTYPE html><html><head><title>${title}</title><style>body{font-family:Arial,sans-serif;margin:20px}h1{color:#333;border-bottom:2px solid #6366f1;padding-bottom:10px}table{width:100%;border-collapse:collapse;margin-top:20px}th{background:#6366f1;color:white;padding:10px;text-align:left}td{padding:8px 10px;border-bottom:1px solid #eee}tr:nth-child(even){background:#f9f9f9}.footer{margin-top:20px;color:#666;font-size:12px}</style></head><body><h1>${title}</h1><p>Generated: ${new Date().toLocaleString('en-IN')}</p><table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table><div class="footer">UDBA Management System</div></body></html>`
  const blob = new Blob([content], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const w = window.open(url, '_blank')
  setTimeout(() => { w?.print() }, 500)
}

export default function ReportsPage() {
  const { token } = useAuth()
  const [activeTab, setActiveTab] = useState<'fee' | 'attendance' | 'students'>('fee')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const h = { Authorization: `Bearer ${token}` }

  const loadReport = async (type: string) => {
    setLoading(true)
    const res = await fetch(`/api/reports?type=${type}`, { headers: h })
    const d = await res.json()
    setData(d)
    setLoading(false)
  }

  useEffect(() => { if (token) loadReport(activeTab) }, [token, activeTab])

  const tabs = [
    { key: 'fee', label: '💰 Fee Report', icon: '💰' },
    { key: 'attendance', label: '✅ Attendance', icon: '✅' },
    { key: 'students', label: '👨‍🎓 Students', icon: '👨‍🎓' },
  ]

  const handleDownloadFeeCSV = () => {
    if (!data?.payments) return
    downloadCSV(data.payments.map((p: any) => ({
      'Student': p.student?.fullName || '-',
      'Student ID': p.student?.studentId || '-',
      'Amount (₹)': p.amount,
      'Mode': p.mode,
      'Date': new Date(p.createdAt).toLocaleDateString('en-IN'),
    })), 'fee-report.csv')
  }

  const handleDownloadFeePDF = () => {
    if (!data?.payments) return
    downloadPDF(
      'Fee Collection Report',
      ['Student', 'Student ID', 'Amount (₹)', 'Mode', 'Date'],
      data.payments.map((p: any) => [p.student?.fullName || '-', p.student?.studentId || '-', `₹${p.amount}`, p.mode, new Date(p.createdAt).toLocaleDateString('en-IN')])
    )
  }

  const handleDownloadAttendanceCSV = () => {
    if (!data?.records) return
    downloadCSV(data.records.map((r: any) => ({
      'Student': r.student?.fullName || '-',
      'Student ID': r.student?.studentId || '-',
      'Batch': r.batch?.name || '-',
      'Status': r.status,
      'Date': new Date(r.date).toLocaleDateString('en-IN'),
    })), 'attendance-report.csv')
  }

  const handleDownloadStudentsCSV = () => {
    if (!data?.students) return
    downloadCSV(data.students.map((s: any) => ({
      'Name': s.fullName,
      'ID': s.studentId || '-',
      'Class': s.course?.name || '-',
      'Section': s.batch?.name || '-',
      'Phone': s.phone,
      'Father': s.fatherName || '-',
      'Total Fee': s.totalFee,
      'Paid Fee': s.paidFee,
      'Status': s.status,
    })), 'students-report.csv')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">📊 Reports</h1>
          <p className="page-subtitle">Download fee, attendance and student reports</p>
        </div>
      </div>

      {/* Summary Cards for Fee */}
      {activeTab === 'fee' && data && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          <div className="stat-card" style={{ '--card-accent': '#10b981' } as React.CSSProperties}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Total Collection</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: 'white', margin: '8px 0' }}>₹{(data.totalCollection || 0).toLocaleString('en-IN')}</div>
          </div>
          <div className="stat-card" style={{ '--card-accent': '#f59e0b' } as React.CSSProperties}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>This Month</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: 'white', margin: '8px 0' }}>₹{(data.todayCollection || 0).toLocaleString('en-IN')}</div>
          </div>
          <div className="stat-card" style={{ '--card-accent': '#6366f1' } as React.CSSProperties}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Transactions</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: 'white', margin: '8px 0' }}>{data.payments?.length || 0}</div>
          </div>
        </div>
      )}

      {/* Attendance Summary */}
      {activeTab === 'attendance' && data && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          <div className="stat-card" style={{ '--card-accent': '#10b981' } as React.CSSProperties}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Present Today</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: 'white', margin: '8px 0' }}>{data.present}</div>
          </div>
          <div className="stat-card" style={{ '--card-accent': '#ef4444' } as React.CSSProperties}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Absent Today</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: 'white', margin: '8px 0' }}>{data.absent}</div>
          </div>
          <div className="stat-card" style={{ '--card-accent': '#6366f1' } as React.CSSProperties}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Total Records</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: 'white', margin: '8px 0' }}>{data.total}</div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '0' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as any)}
            style={{ padding: '10px 16px', border: 'none', background: 'transparent', color: activeTab === t.key ? 'var(--primary-light)' : 'var(--text-muted)', fontWeight: activeTab === t.key ? '700' : '400', fontSize: '14px', cursor: 'pointer', borderBottom: activeTab === t.key ? '2px solid var(--primary-light)' : '2px solid transparent', marginBottom: '-1px' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Download Buttons */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button className="btn btn-secondary" onClick={activeTab === 'fee' ? handleDownloadFeeCSV : activeTab === 'attendance' ? handleDownloadAttendanceCSV : handleDownloadStudentsCSV}>⬇️ Download CSV</button>
        {(activeTab === 'fee' || activeTab === 'students') && (
          <button className="btn btn-primary" onClick={activeTab === 'fee' ? handleDownloadFeePDF : () => {
            if (!data?.students) return
            downloadPDF('Student Directory', ['Name', 'ID', 'Class', 'Section', 'Phone', 'Status'], data.students.map((s: any) => [s.fullName, s.studentId || '-', s.course?.name || '-', s.batch?.name || '-', s.phone, s.status]))
          }}>🖨️ Print / PDF</button>
        )}
      </div>

      {/* Data Table */}
      {loading ? <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading report...</div> : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container">
            <table>
              {activeTab === 'fee' && data?.payments && (
                <><thead><tr><th>Student</th><th>Amount</th><th>Mode</th><th>Date</th></tr></thead>
                <tbody>{data.payments.map((p: any) => (
                  <tr key={p.id}>
                    <td><div>{p.student?.fullName}</div><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.student?.studentId}</div></td>
                    <td style={{ fontWeight: '700', color: '#10b981' }}>₹{p.amount.toLocaleString('en-IN')}</td>
                    <td><span style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', borderRadius: '6px', padding: '2px 8px', fontSize: '11px' }}>{p.mode}</span></td>
                    <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{new Date(p.createdAt).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}</tbody></>
              )}
              {activeTab === 'attendance' && data?.records && (
                <><thead><tr><th>Student</th><th>Batch</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>{data.records.map((r: any) => (
                  <tr key={r.id}>
                    <td>{r.student?.fullName || '-'}</td>
                    <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{r.batch?.name}</td>
                    <td><span style={{ background: r.status === 'PRESENT' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: r.status === 'PRESENT' ? '#10b981' : '#ef4444', borderRadius: '6px', padding: '2px 8px', fontSize: '11px' }}>{r.status}</span></td>
                    <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{new Date(r.date).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}</tbody></>
              )}
              {activeTab === 'students' && data?.students && (
                <><thead><tr><th>Student</th><th>Class</th><th>Section</th><th>Fee Status</th></tr></thead>
                <tbody>{data.students.map((s: any) => (
                  <tr key={s.id}>
                    <td><div>{s.fullName}</div><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.studentId}</div></td>
                    <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{s.course?.name}</td>
                    <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{s.batch?.name}</td>
                    <td>
                      <div style={{ fontSize: '12px' }}>Paid: <span style={{ color: '#10b981', fontWeight: '700' }}>₹{s.paidFee.toLocaleString()}</span></div>
                      <div style={{ fontSize: '12px' }}>Due: <span style={{ color: s.totalFee - s.paidFee > 0 ? '#ef4444' : '#10b981', fontWeight: '700' }}>₹{(s.totalFee - s.paidFee).toLocaleString()}</span></div>
                    </td>
                  </tr>
                ))}</tbody></>
              )}
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
