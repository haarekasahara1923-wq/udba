'use client'
import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect } from 'react'

interface AttendanceRecord {
  id: string
  date: string
  status: string
  notes?: string
}

interface Child {
  id: string
  fullName: string
  studentId?: string
  course?: { name: string }
  batch?: { name: string }
  attendances: AttendanceRecord[]
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  PRESENT:  { label: 'Present',  color: '#10b981', bg: 'rgba(16,185,129,0.15)',  icon: '✅' },
  ABSENT:   { label: 'Absent',   color: '#ef4444', bg: 'rgba(239,68,68,0.15)',   icon: '❌' },
  LATE:     { label: 'Late',     color: '#f59e0b', bg: 'rgba(245,158,11,0.15)',  icon: '⏰' },
  HALF_DAY: { label: 'Half Day', color: '#06b6d4', bg: 'rgba(6,182,212,0.15)',   icon: '🌓' },
  LEAVE:    { label: 'Leave',    color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)',  icon: '🏖️' },
}

export default function ParentAttendancePage() {
  const { token } = useAuth()
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChild, setSelectedChild] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    fetch('/api/parent', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (d.profile?.children) {
          const enriched = d.profile.children.map((c: any) => ({
            ...c,
            attendances: (c.attendances || []).map((a: any) => ({
              ...a,
              date: a.date,
            }))
          }))
          setChildren(enriched)
          if (enriched.length > 0) setSelectedChild(enriched[0].id)
        }
        setLoading(false)
      })
  }, [token])

  const child = children.find(c => c.id === selectedChild)

  // Filter attendance for selected month
  const monthAttendances = (child?.attendances || []).filter(a => {
    const d = new Date(a.date)
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    return month === selectedMonth
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Summary counts
  const summary = monthAttendances.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  const totalDays = monthAttendances.length
  const presentDays = summary['PRESENT'] || 0
  const attendancePct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: '16px', padding: '20px' }}>
        <div style={{ fontSize: '20px', fontWeight: '800', color: 'white' }}>📅 Attendance</div>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', marginTop: '4px' }}>Monthly attendance records</div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
          Loading...
        </div>
      ) : children.length === 0 ? (
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: '30px', textAlign: 'center' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>👶</div>
          <div style={{ color: '#94a3b8', fontSize: '14px' }}>No children linked yet</div>
        </div>
      ) : (
        <>
          {/* Filters */}
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {children.length > 1 && (
              <div>
                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Select Child</div>
                <select
                  value={selectedChild}
                  onChange={e => setSelectedChild(e.target.value)}
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '10px 12px', color: 'white', fontSize: '14px' }}
                >
                  {children.map(c => (
                    <option key={c.id} value={c.id}>{c.fullName}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Month</div>
              <input
                type="month"
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '10px 12px', color: 'white', fontSize: '14px' }}
              />
            </div>
          </div>

          {/* Child Info */}
          {child && (
            <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: '14px' }}>
              <div style={{ fontSize: '15px', fontWeight: '700', color: 'white' }}>{child.fullName}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                {child.course?.name} • {child.batch?.name} {child.studentId ? `• ID: ${child.studentId}` : ''}
              </div>
            </div>
          )}

          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {[
              { label: 'Total Days', value: totalDays, color: '#6366f1' },
              { label: 'Present', value: presentDays, color: '#10b981' },
              { label: 'Absent', value: summary['ABSENT'] || 0, color: '#ef4444' },
              { label: 'Late', value: summary['LATE'] || 0, color: '#f59e0b' },
              { label: 'Leave', value: summary['LEAVE'] || 0, color: '#8b5cf6' },
              { label: 'Attendance %', value: `${attendancePct}%`, color: attendancePct >= 75 ? '#10b981' : '#ef4444' },
            ].map(s => (
              <div key={s.label} style={{ background: '#0f172a', border: `1px solid ${s.color}30`, borderRadius: '10px', padding: '10px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: '800', color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Attendance % bar */}
          {totalDays > 0 && (
            <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Overall Attendance</span>
                <span style={{ fontSize: '13px', fontWeight: '800', color: attendancePct >= 75 ? '#10b981' : '#ef4444' }}>{attendancePct}%</span>
              </div>
              <div style={{ background: '#0f172a', borderRadius: '100px', height: '8px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${attendancePct}%`, background: attendancePct >= 75 ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #ef4444, #dc2626)', borderRadius: '100px', transition: 'width 0.5s' }} />
              </div>
              {attendancePct < 75 && (
                <div style={{ fontSize: '11px', color: '#f59e0b', marginTop: '6px' }}>⚠️ Attendance below 75% minimum requirement</div>
              )}
            </div>
          )}

          {/* Attendance List */}
          {monthAttendances.length === 0 ? (
            <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: '30px', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>📭</div>
              <div style={{ color: '#64748b', fontSize: '13px' }}>No attendance records for this month</div>
            </div>
          ) : (
            <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '14px', overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #334155' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Day-wise Records</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {monthAttendances.map((record, i) => {
                  const cfg = statusConfig[record.status] || statusConfig.PRESENT
                  const date = new Date(record.date)
                  return (
                    <div key={record.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: i < monthAttendances.length - 1 ? '1px solid #1e293b' : 'none', background: i % 2 === 0 ? '#1e293b' : '#0f172a' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: 'white' }}>
                          {date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </div>
                        {record.notes && <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{record.notes}</div>}
                      </div>
                      <div style={{ background: cfg.bg, border: `1px solid ${cfg.color}30`, borderRadius: '8px', padding: '5px 12px', fontSize: '12px', fontWeight: '700', color: cfg.color, display: 'flex', alignItems: 'center', gap: '5px' }}>
                        {cfg.icon} {cfg.label}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
