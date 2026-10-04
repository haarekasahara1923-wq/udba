'use client'
import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function StaffHome() {
  const { user, token } = useAuth()
  const [stats, setStats] = useState({ homeworks: 0, notices: 0 })
  const [loading, setLoading] = useState(true)
  const [marking, setMarking] = useState(false)
  const [attendanceMsg, setAttendanceMsg] = useState('')

  useEffect(() => {
    if (!token) return
    const h = { Authorization: `Bearer ${token}` }
    Promise.all([
      fetch('/api/homework', { headers: h }).then(r => r.json()),
      fetch('/api/notices', { headers: h }).then(r => r.json()),
    ]).then(([hw, n]) => {
      setStats({ homeworks: hw.homeworks?.length || 0, notices: n.notices?.length || 0 })
      setLoading(false)
    }).catch(e => {
        console.error(e)
        setLoading(false)
    })
  }, [token])

  const markAttendance = async (action: 'MARK_IN' | 'MARK_OUT') => {
      if(!token) return
      setMarking(true)
      setAttendanceMsg('')
      try {
          const res = await fetch('/api/teachers/attendance', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({ action, status: 'PRESENT' })
          })
          const data = await res.json()
          if(data.success) {
              setAttendanceMsg(`Successfully marked ${action === 'MARK_IN' ? 'IN' : 'OUT'}!`)
          } else {
              setAttendanceMsg(data.error || 'Failed to mark attendance')
          }
      } catch (err) {
          setAttendanceMsg('Error communicating with server')
      }
      setMarking(false)
      setTimeout(() => setAttendanceMsg(''), 4000)
  }

  const actions = [
    { href: '/portal/staff/attendance', icon: '📝', label: 'Class Attendance', color: '#10b981' },
    { href: '/portal/staff/leaves', icon: '📅', label: 'Apply Leave', color: '#6366f1' },
    { href: '/portal/staff/ledger', icon: '💰', label: 'My Salary', color: '#8b5cf6' },
    { href: '/portal/staff/timetable', icon: '⏰', label: 'Schedule', color: '#ec4899' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', borderRadius: '16px', padding: '24px', boxShadow: '0 10px 25px rgba(99,102,241,0.3)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'relative', zIndex: 10 }}>
            <div style={{ fontSize: '24px', fontWeight: '800', color: 'white' }}>Welcome back, 👨‍🏫</div>
            <div style={{ fontSize: '16px', color: 'rgba(255,255,255,0.9)', marginTop: '4px' }}>{user?.name}</div>
            
            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                <button onClick={() => markAttendance('MARK_IN')} disabled={marking} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', fontWeight: 'bold', cursor: marking ? 'not-allowed' : 'pointer', backdropFilter: 'blur(10px)', transition: 'all 0.2s' }}>
                    👋 Mark IN
                </button>
                <button onClick={() => markAttendance('MARK_OUT')} disabled={marking} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontWeight: 'bold', cursor: marking ? 'not-allowed' : 'pointer', backdropFilter: 'blur(10px)', transition: 'all 0.2s' }}>
                    🚪 Mark OUT
                </button>
            </div>
            {attendanceMsg && (
                <div style={{ marginTop: '12px', padding: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '13px', textAlign: 'center' }}>
                    {attendanceMsg}
                </div>
            )}
        </div>
        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)', borderRadius: '50%' }}></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {actions.map(a => (
          <Link key={a.href} href={a.href} style={{ textDecoration: 'none' }}>
            <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: '18px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '10px', transition: 'all 0.2s', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '32px' }}>{a.icon}</div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: 'white' }}>{a.label}</div>
            </div>
          </Link>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#6366f1' }}>{loading ? '...' : stats.homeworks}</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Homeworks Assigned</div>
        </div>
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#ec4899' }}>{loading ? '...' : stats.notices}</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Notices Received</div>
        </div>
      </div>
    </div>
  )
}
