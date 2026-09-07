'use client'
import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function ParentExams() {
  const { token, user } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedChildId, setSelectedChildId] = useState<string>('')

  useEffect(() => {
    if (!token) return
    fetch('/api/parent', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        setProfile(d.profile)
        const kids = d.profile?.children || []
        if (kids.length > 0) {
          setSelectedChildId(kids[0].id)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [token])

  const children = profile?.children || []
  const currentChild = children.find((c: any) => c.id === selectedChildId) || children[0]
  const examResults = currentChild?.examResults || []

  // Overall statistics
  const totalExams = examResults.length
  let totalMarksScored = 0
  let totalMaxMarks = 0
  examResults.forEach((er: any) => {
    totalMarksScored += er.marksObtained || 0
    totalMaxMarks += er.exam?.maxMarks || 0
  })
  const overallPercentage = totalMaxMarks > 0 ? Math.round((totalMarksScored / totalMaxMarks) * 100) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #059669, #10b981)', borderRadius: '16px', padding: '20px', color: 'white' }}>
        <h1 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>📑 Children's Test & Exam Marks</h1>
        <p style={{ fontSize: '12px', opacity: 0.85, margin: '4px 0 0 0' }}>View monthly test marks, progress reports, and teacher remarks</p>
      </div>

      {loading ? (
        <div style={{ color: '#64748b', textAlign: 'center', padding: '40px' }}>Loading exam marks...</div>
      ) : children.length === 0 ? (
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '40px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>👶</div>
          <div style={{ fontSize: '15px', fontWeight: '700', color: 'white' }}>No children linked yet</div>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 16px 0' }}>Link your children to view their exam marks.</p>
          <Link href="/portal/parent/children" style={{ background: '#6366f1', color: 'white', textDecoration: 'none', padding: '10px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: '700' }}>
            Link Children
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Child Switcher Tabs */}
          {children.length > 1 && (
            <div style={{ display: 'flex', gap: '6px', background: '#1e293b', padding: '4px', borderRadius: '12px', border: '1px solid #334155' }}>
              {children.map((c: any) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedChildId(c.id)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: currentChild?.id === c.id ? '#10b981' : 'transparent',
                    color: currentChild?.id === c.id ? 'white' : '#94a3b8',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                  }}
                >
                  👶 {c.fullName}
                </button>
              ))}
            </div>
          )}

          {/* Child Info & Overall Score Card */}
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: '800', color: 'white', margin: 0 }}>{currentChild.fullName}</h2>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0 0' }}>
                  {currentChild.course?.name} • {currentChild.batch?.name} {currentChild.studentId ? `• Roll/ID: ${currentChild.studentId}` : ''}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '20px', fontWeight: '800', color: overallPercentage >= 60 ? '#10b981' : overallPercentage >= 40 ? '#f59e0b' : '#ef4444' }}>
                  {totalExams > 0 ? `${overallPercentage}%` : '—'}
                </div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>Average Score</div>
              </div>
            </div>

            {totalExams > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px', borderTop: '1px solid #334155', paddingTop: '10px' }}>
                <div style={{ background: '#0f172a', padding: '8px 12px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: 'white' }}>{totalExams}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Tests Taken</div>
                </div>
                <div style={{ background: '#0f172a', padding: '8px 12px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#10b981' }}>{totalMarksScored} / {totalMaxMarks}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Total Marks</div>
                </div>
              </div>
            )}
          </div>

          {/* Exam Results List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#cbd5e1', margin: '4px 0 0 0' }}>
              All Exam Marks ({examResults.length})
            </h3>

            {examResults.length === 0 ? (
              <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: '40px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📝</div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: 'white' }}>No exam marks published yet</div>
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  When the teacher evaluates tests for {currentChild.fullName}, marks will appear here.
                </p>
              </div>
            ) : (
              examResults.map((er: any) => {
                const max = er.exam?.maxMarks || 100
                const obtained = er.marksObtained || 0
                const pct = max > 0 ? Math.round((obtained / max) * 100) : 0
                const isPass = pct >= 40

                return (
                  <div key={er.id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: '700', color: 'white' }}>{er.exam?.title}</div>
                        <div style={{ fontSize: '12px', color: '#818cf8', fontWeight: '600', marginTop: '2px' }}>
                          Subject: {er.exam?.subject}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '18px', fontWeight: '800', color: isPass ? '#10b981' : '#ef4444' }}>
                          {obtained} <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '400' }}>/ {max}</span>
                        </div>
                        <span style={{ fontSize: '10px', background: isPass ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: isPass ? '#10b981' : '#ef4444', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>
                          {pct}% • {pct >= 75 ? 'Distinction' : pct >= 60 ? '1st Division' : isPass ? 'Passed' : 'Needs Improvement'}
                        </span>
                      </div>
                    </div>

                    {er.remarks && (
                      <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', padding: '8px 10px', borderRadius: '8px', fontSize: '12px', color: '#cbd5e1' }}>
                        <span style={{ color: '#a5b4fc', fontWeight: '600' }}>Teacher's Remarks: </span>
                        {er.remarks}
                      </div>
                    )}

                    <div style={{ fontSize: '11px', color: '#64748b', borderTop: '1px solid #334155', paddingTop: '6px', marginTop: '2px' }}>
                      📅 Test Date: {new Date(er.exam?.date || er.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
