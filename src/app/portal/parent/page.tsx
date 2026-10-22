'use client'
import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function ParentHome() {
  const { user, token } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [notices, setNotices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    const h = { Authorization: `Bearer ${token}` }
    Promise.all([
      fetch('/api/parent', { headers: h }).then(r => r.json()),
      fetch('/api/notices', { headers: h }).then(r => r.json()),
    ]).then(([p, n]) => {
      setProfile(p.profile)
      setNotices(n.notices?.slice(0, 3) || [])
      setLoading(false)
    })
  }, [token])

  const children = profile?.children || []
  const totalRemainingFee = children.reduce((acc: number, c: any) => {
    const rem = c.remainingFee !== undefined ? c.remainingFee : Math.max(0, (c.totalFee || 0) - (c.paidFee || 0))
    return acc + rem
  }, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', borderRadius: '16px', padding: '20px' }}>
        <div style={{ fontSize: '20px', fontWeight: '800', color: 'white' }}>Welcome! 👨‍👩‍👧‍👦</div>
        <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', marginTop: '4px' }}>{user?.name}</div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>Parent Portal</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
        <Link href="/portal/parent/children" style={{ textDecoration: 'none' }}>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: '14px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>👶</div>
            <div style={{ fontSize: '11px', fontWeight: '600', color: 'white' }}>Children</div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#ec4899', marginTop: '2px' }}>{children.length}</div>
          </div>
        </Link>
        <Link href="/portal/parent/fees" style={{ textDecoration: 'none' }}>
          <div style={{ background: '#1e293b', border: `1px solid ${totalRemainingFee > 0 ? 'rgba(245,158,11,0.5)' : '#334155'}`, borderRadius: '14px', padding: '14px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>💰</div>
            <div style={{ fontSize: '11px', fontWeight: '600', color: 'white' }}>Fee Ledger</div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: totalRemainingFee > 0 ? '#f59e0b' : '#10b981', marginTop: '2px' }}>
              ₹{totalRemainingFee.toLocaleString('en-IN')}
            </div>
          </div>
        </Link>
        <Link href="/portal/parent/homework" style={{ textDecoration: 'none' }}>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: '14px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>📚</div>
            <div style={{ fontSize: '11px', fontWeight: '600', color: 'white' }}>Homework</div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#8b5cf6', marginTop: '2px' }}>View</div>
          </div>
        </Link>
        <Link href="/portal/parent/exams" style={{ textDecoration: 'none' }}>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: '14px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>📑</div>
            <div style={{ fontSize: '11px', fontWeight: '600', color: 'white' }}>Test Marks</div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#10b981', marginTop: '2px' }}>
              {children.reduce((acc: number, c: any) => acc + (c.examResults?.length || 0), 0)}
            </div>
          </div>
        </Link>
        <Link href="/portal/parent/notices" style={{ textDecoration: 'none' }}>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: '14px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>📢</div>
            <div style={{ fontSize: '11px', fontWeight: '600', color: 'white' }}>Notices</div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#6366f1', marginTop: '2px' }}>{notices.length}</div>
          </div>
        </Link>
        <Link href="/portal/parent/attendance" style={{ textDecoration: 'none' }}>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: '14px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>✅</div>
            <div style={{ fontSize: '11px', fontWeight: '600', color: 'white' }}>Attendance</div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#10b981', marginTop: '2px' }}>View</div>
          </div>
        </Link>
        <Link href="/portal/parent/children" style={{ textDecoration: 'none' }}>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: '14px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>👶</div>
            <div style={{ fontSize: '11px', fontWeight: '600', color: 'white' }}>Children</div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#ec4899', marginTop: '2px' }}>{children.length}</div>
          </div>
        </Link>
      </div>

      {children.length > 0 && (
        <div>
          <div style={{ fontSize: '14px', fontWeight: '700', color: '#94a3b8', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Children Summary</div>
          {children.map((child: any) => {
            const todayAttendances = child.attendances?.filter((a: any) => new Date(a.date).toDateString() === new Date().toDateString())
            const presentToday = todayAttendances?.find((a: any) => a.status === 'PRESENT')
            const totalFee = child.totalFee || 0
            const paidFee = child.paidFee || 0
            const remainingFee = child.remainingFee !== undefined ? child.remainingFee : Math.max(0, totalFee - paidFee)
            
            return (
              <div key={child.id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: '16px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: 'white' }}>{child.fullName}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{child.course?.name} • {child.batch?.name} {child.studentId ? `• ID: ${child.studentId}` : ''}</div>
                  </div>
                  <div style={{ background: presentToday ? 'rgba(16,185,129,0.15)' : 'rgba(148,163,184,0.15)', border: `1px solid ${presentToday ? 'rgba(16,185,129,0.3)' : 'rgba(148,163,184,0.3)'}`, borderRadius: '8px', padding: '4px 10px', fontSize: '11px', color: presentToday ? '#10b981' : '#94a3b8', fontWeight: 600 }}>
                    {presentToday ? '✅ Present Today' : '❓ Att. Not Marked'}
                  </div>
                </div>

                {/* Prominent Fee Summary Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '12px' }}>
                  <div style={{ background: '#0f172a', borderRadius: '10px', padding: '10px 8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Total Fee</div>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#e2e8f0', marginTop: '3px' }}>
                      ₹{totalFee.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div style={{ background: '#0f172a', borderRadius: '10px', padding: '10px 8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Paid Fee</div>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#10b981', marginTop: '3px' }}>
                      ₹{paidFee.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div style={{ background: '#0f172a', borderRadius: '10px', padding: '10px 8px', textAlign: 'center', border: `1px solid ${remainingFee > 0 ? 'rgba(245,158,11,0.4)' : 'rgba(16,185,129,0.4)'}` }}>
                    <div style={{ fontSize: '11px', color: remainingFee > 0 ? '#f59e0b' : '#10b981', fontWeight: 600 }}>Remaining Fee</div>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: remainingFee > 0 ? '#f59e0b' : '#10b981', marginTop: '3px' }}>
                      ₹{remainingFee.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {/* Fee Status & View Ledger Button */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #334155' }}>
                  <span style={{ fontSize: '11px', color: remainingFee > 0 ? '#f59e0b' : '#10b981', fontWeight: 600 }}>
                    {remainingFee > 0 ? `⚠️ ₹${remainingFee.toLocaleString('en-IN')} Balance Pending` : '✅ All Fees Paid'}
                  </span>
                  <Link href={`/portal/parent/fees?studentId=${child.id}`} style={{ fontSize: '12px', color: '#818cf8', textDecoration: 'none', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(99,102,241,0.15)', padding: '5px 12px', borderRadius: '6px' }}>
                    📄 View Fee Ledger →
                  </Link>
                </div>

                {child.examResults && child.examResults.length > 0 && (
                    <div style={{ marginTop: '16px', borderTop: '1px solid #334155', paddingTop: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Recent Exam Marks</span>
                          <Link href="/portal/parent/exams" style={{ fontSize: '11px', color: '#10b981', textDecoration: 'none', fontWeight: 600 }}>View All Marks →</Link>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {child.examResults.map((er: any) => (
                                <div key={er.id} style={{ display: 'flex', justifyContent: 'space-between', background: '#0f172a', padding: '8px 12px', borderRadius: '8px' }}>
                                    <div>
                                        <div style={{ fontSize: '13px', color: 'white', fontWeight: 600 }}>{er.exam?.title}</div>
                                        <div style={{ fontSize: '11px', color: '#64748b' }}>{er.exam?.subject} • {new Date(er.exam?.date).toLocaleDateString('en-IN')}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '14px', fontWeight: 800, color: er.marksObtained >= (er.exam?.maxMarks * 0.4) ? '#10b981' : '#ef4444' }}>
                                            {er.marksObtained} <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 400 }}>/ {er.exam?.maxMarks}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {children.length === 0 && !loading && (
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: '24px', textAlign: 'center' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>👶</div>
          <div style={{ fontSize: '14px', color: '#94a3b8' }}>No children linked yet</div>
          <Link href="/portal/parent/children" style={{ textDecoration: 'none', display: 'inline-block', marginTop: '12px', background: '#6366f1', color: 'white', borderRadius: '10px', padding: '10px 20px', fontSize: '13px', fontWeight: '600' }}>Link Children</Link>
        </div>
      )}
    </div>
  )
}
