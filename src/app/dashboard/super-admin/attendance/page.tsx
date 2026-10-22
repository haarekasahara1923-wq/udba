'use client'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

interface Batch {
    id: string
    name: string
    courseId: string
    courseName: string
}

interface StudentAttendance {
    studentId: string
    studentCode?: string
    fullName: string
    photo?: string
    status: string | null
    notes?: string | null
    attendanceId?: string | null
}

interface AttendanceSummary {
    total: number
    present: number
    absent: number
    late: number
    leave: number
    halfDay: number
    notMarked: number
    attendancePercentage: number
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: string }> = {
    PRESENT:  { label: 'Present',  color: '#10b981', bg: 'rgba(16,185,129,0.15)',  icon: '✅' },
    ABSENT:   { label: 'Absent',   color: '#ef4444', bg: 'rgba(239,68,68,0.15)',   icon: '❌' },
    LATE:     { label: 'Late',     color: '#f59e0b', bg: 'rgba(245,158,11,0.15)',  icon: '⏰' },
    HALF_DAY: { label: 'Half Day', color: '#06b6d4', bg: 'rgba(6,182,212,0.15)',   icon: '🌓' },
    LEAVE:    { label: 'Leave',    color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)',  icon: '🏖️' },
}

export default function SuperAdminAttendancePage() {
    const { user, token } = useAuth()
    const router = useRouter()
    const [batches, setBatches] = useState<Batch[]>([])
    const [selectedBatch, setSelectedBatch] = useState('')
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
    const [students, setStudents] = useState<StudentAttendance[]>([])
    const [summary, setSummary] = useState<AttendanceSummary | null>(null)
    const [batchInfo, setBatchInfo] = useState<{ name: string; courseName: string } | null>(null)
    const [loading, setLoading] = useState(false)
    const [batchesLoading, setBatchesLoading] = useState(true)
    const printRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (user && user.role !== 'SUPER_ADMIN') router.push('/dashboard')
    }, [user, router])

    useEffect(() => {
        if (!token) return
        fetch('/api/super-admin/batches', { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(d => {
                if (d.success) setBatches(d.data)
                setBatchesLoading(false)
            })
    }, [token])

    const fetchAttendance = async () => {
        if (!selectedBatch || !selectedDate || !token) return
        setLoading(true)
        try {
            const res = await fetch(
                `/api/super-admin/attendance?batchId=${selectedBatch}&date=${selectedDate}`,
                { headers: { Authorization: `Bearer ${token}` } }
            )
            const data = await res.json()
            if (data.success) {
                setStudents(data.students)
                setSummary(data.summary)
                setBatchInfo(data.batch)
            }
        } catch (e) {
            console.error(e)
        }
        setLoading(false)
    }

    useEffect(() => {
        if (selectedBatch && selectedDate) {
            fetchAttendance()
        }
    }, [selectedBatch, selectedDate])

    const downloadPDF = () => {
        if (!printRef.current) return
        const printWindow = window.open('', '_blank')
        if (!printWindow) return

        const batch = batches.find(b => b.id === selectedBatch)
        const dateFormatted = new Date(selectedDate).toLocaleDateString('en-IN', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        })

        const rows = students.map((s, i) => {
            const cfg = s.status ? statusConfig[s.status] : null
            return `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 8px 12px; text-align: center; color: #64748b; font-size: 13px;">${i + 1}</td>
                    <td style="padding: 8px 12px;">
                        <div style="font-weight: 600; font-size: 14px; color: #1e293b;">${s.fullName}</div>
                        ${s.studentCode ? `<div style="font-size: 11px; color: #94a3b8;">ID: ${s.studentCode}</div>` : ''}
                    </td>
                    <td style="padding: 8px 12px; text-align: center;">
                        ${cfg
                            ? `<span style="background: ${cfg.bg}; color: ${cfg.color}; border: 1px solid ${cfg.color}40; border-radius: 6px; padding: 3px 10px; font-size: 12px; font-weight: 700;">${cfg.icon} ${cfg.label}</span>`
                            : `<span style="color: #94a3b8; font-size: 12px;">Not Marked</span>`
                        }
                    </td>
                    <td style="padding: 8px 12px; text-align: center; font-size: 12px; color: #64748b;">${s.notes || '-'}</td>
                </tr>
            `
        }).join('')

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Attendance Report - ${dateFormatted}</title>
                <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; color: #1e293b; }
                    @media print {
                        body { padding: 0; }
                        .no-print { display: none; }
                    }
                    table { width: 100%; border-collapse: collapse; }
                    th { background: #f1f5f9; padding: 10px 12px; text-align: left; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
                    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
                    .summary-card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; text-align: center; }
                </style>
            </head>
            <body>
                <div style="text-align: center; margin-bottom: 24px; border-bottom: 2px solid #6366f1; padding-bottom: 16px;">
                    <h1 style="margin: 0; font-size: 22px; color: #1e293b;">📅 Attendance Report</h1>
                    <p style="margin: 6px 0 0; color: #64748b; font-size: 14px;">
                        <strong>${batchInfo?.name || batch?.name}</strong> (${batchInfo?.courseName || batch?.courseName}) &bull; ${dateFormatted}
                    </p>
                </div>

                <div class="summary-grid">
                    <div class="summary-card" style="border-color: #10b98140;">
                        <div style="font-size: 24px; font-weight: 800; color: #10b981;">${summary?.present || 0}</div>
                        <div style="font-size: 11px; color: #64748b; margin-top: 4px;">PRESENT</div>
                    </div>
                    <div class="summary-card" style="border-color: #ef444440;">
                        <div style="font-size: 24px; font-weight: 800; color: #ef4444;">${summary?.absent || 0}</div>
                        <div style="font-size: 11px; color: #64748b; margin-top: 4px;">ABSENT</div>
                    </div>
                    <div class="summary-card" style="border-color: #f59e0b40;">
                        <div style="font-size: 24px; font-weight: 800; color: #f59e0b;">${summary?.late || 0}</div>
                        <div style="font-size: 11px; color: #64748b; margin-top: 4px;">LATE</div>
                    </div>
                    <div class="summary-card" style="border-color: #8b5cf640;">
                        <div style="font-size: 24px; font-weight: 800; color: #8b5cf6;">${summary?.leave || 0}</div>
                        <div style="font-size: 11px; color: #64748b; margin-top: 4px;">LEAVE</div>
                    </div>
                    <div class="summary-card" style="border-color: #06b6d440;">
                        <div style="font-size: 24px; font-weight: 800; color: #06b6d4;">${summary?.halfDay || 0}</div>
                        <div style="font-size: 11px; color: #64748b; margin-top: 4px;">HALF DAY</div>
                    </div>
                    <div class="summary-card" style="border-color: #94a3b840;">
                        <div style="font-size: 24px; font-weight: 800; color: #94a3b8;">${summary?.notMarked || 0}</div>
                        <div style="font-size: 11px; color: #64748b; margin-top: 4px;">NOT MARKED</div>
                    </div>
                    <div class="summary-card" style="border-color: #6366f140;">
                        <div style="font-size: 24px; font-weight: 800; color: #6366f1;">${summary?.total || 0}</div>
                        <div style="font-size: 11px; color: #64748b; margin-top: 4px;">TOTAL</div>
                    </div>
                    <div class="summary-card" style="border-color: #10b98140; background: #f0fdf4;">
                        <div style="font-size: 24px; font-weight: 800; color: #10b981;">${summary?.attendancePercentage || 0}%</div>
                        <div style="font-size: 11px; color: #64748b; margin-top: 4px;">ATTENDANCE</div>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th style="width: 40px; text-align: center;">#</th>
                            <th>Student Name</th>
                            <th style="text-align: center;">Status</th>
                            <th style="text-align: center;">Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>

                <div style="margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 16px; display: flex; justify-content: space-between; font-size: 12px; color: #94a3b8;">
                    <span>Generated on: ${new Date().toLocaleString('en-IN')}</span>
                    <span>Total Students: ${summary?.total || 0} | Attendance: ${summary?.attendancePercentage || 0}%</span>
                </div>

                <button class="no-print" onclick="window.print()" style="margin-top: 20px; background: #6366f1; color: white; border: none; border-radius: 8px; padding: 10px 24px; font-size: 14px; cursor: pointer; font-weight: 600;">🖨️ Print / Save as PDF</button>
            </body>
            </html>
        `
        printWindow.document.write(html)
        printWindow.document.close()
        setTimeout(() => printWindow.print(), 500)
    }

    if (!user || user.role !== 'SUPER_ADMIN') return null

    const summaryItems = [
        { label: 'Total Students', value: summary?.total ?? '-', color: '#6366f1', icon: '👨‍🎓' },
        { label: 'Present', value: summary?.present ?? '-', color: '#10b981', icon: '✅' },
        { label: 'Absent', value: summary?.absent ?? '-', color: '#ef4444', icon: '❌' },
        { label: 'Late', value: summary?.late ?? '-', color: '#f59e0b', icon: '⏰' },
        { label: 'Leave', value: summary?.leave ?? '-', color: '#8b5cf6', icon: '🏖️' },
        { label: 'Half Day', value: summary?.halfDay ?? '-', color: '#06b6d4', icon: '🌓' },
        { label: 'Not Marked', value: summary?.notMarked ?? '-', color: '#94a3b8', icon: '📋' },
        { label: 'Attendance %', value: summary ? `${summary.attendancePercentage}%` : '-', color: summary && summary.attendancePercentage >= 75 ? '#10b981' : '#ef4444', icon: '📊' },
    ]

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">✅ Attendance Viewer</h1>
                    <p className="page-subtitle">View class attendance by date — Super Admin Panel</p>
                </div>
            </div>

            {/* Filters Card */}
            <div className="card" style={{ marginBottom: '20px', padding: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '16px', alignItems: 'flex-end' }}>
                    <div>
                        <label className="label">Select Class / Batch</label>
                        {batchesLoading ? (
                            <div style={{ padding: '10px', color: 'var(--text-muted)', fontSize: '13px' }}>Loading batches...</div>
                        ) : (
                            <select
                                className="input"
                                value={selectedBatch}
                                onChange={e => setSelectedBatch(e.target.value)}
                            >
                                <option value="">— Choose a class —</option>
                                {batches.map(b => (
                                    <option key={b.id} value={b.id}>{b.name} ({b.courseName})</option>
                                ))}
                            </select>
                        )}
                    </div>
                    <div>
                        <label className="label">📅 Date</label>
                        <input
                            className="input"
                            type="date"
                            value={selectedDate}
                            onChange={e => setSelectedDate(e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                        />
                    </div>
                    {students.length > 0 && (
                        <button
                            onClick={downloadPDF}
                            className="btn btn-secondary"
                            style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                            📄 Download PDF
                        </button>
                    )}
                </div>
            </div>

            {/* No selection state */}
            {!selectedBatch && (
                <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>Select a class and date to view attendance</p>
                </div>
            )}

            {/* Loading */}
            {loading && selectedBatch && (
                <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
                    <div className="spinner" style={{ margin: '0 auto 16px' }} />
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading attendance data...</p>
                </div>
            )}

            {/* Results */}
            {!loading && selectedBatch && students.length >= 0 && summary && (
                <>
                    {/* Batch Info Banner */}
                    <div style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '16px', padding: '16px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontSize: '16px', fontWeight: '800', color: 'white' }}>
                                {batchInfo?.name || batches.find(b => b.id === selectedBatch)?.name}
                            </div>
                            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', marginTop: '2px' }}>
                                {batchInfo?.courseName || batches.find(b => b.id === selectedBatch)?.courseName} &bull; {new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </div>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '12px', padding: '8px 16px', textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: '900', color: 'white' }}>{summary.attendancePercentage}%</div>
                            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>Attendance</div>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
                        {summaryItems.map(s => (
                            <div key={s.label} style={{ padding: '14px', background: 'var(--surface)', border: `1px solid ${s.color}25`, borderRadius: '12px', textAlign: 'center', borderLeft: `3px solid ${s.color}` }}>
                                <div style={{ fontSize: '18px', marginBottom: '2px' }}>{s.icon}</div>
                                <div style={{ fontSize: '20px', fontWeight: '800', color: s.color }}>{s.value}</div>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '2px' }}>{s.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Attendance % bar */}
                    <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Class Attendance Rate</span>
                            <span style={{ fontSize: '14px', fontWeight: '800', color: summary.attendancePercentage >= 75 ? '#10b981' : '#ef4444' }}>{summary.attendancePercentage}%</span>
                        </div>
                        <div style={{ background: 'var(--bg)', borderRadius: '100px', height: '10px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${summary.attendancePercentage}%`, background: summary.attendancePercentage >= 75 ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #ef4444, #dc2626)', borderRadius: '100px', transition: 'width 0.5s ease' }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>0%</span>
                            <span style={{ fontSize: '11px', color: '#f59e0b' }}>75% target</span>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>100%</span>
                        </div>
                    </div>

                    {/* Download Button (mobile) */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px', gap: '10px' }}>
                        <button onClick={downloadPDF} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            📄 Download PDF Report
                        </button>
                    </div>

                    {/* Students Table */}
                    {students.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>👨‍🎓</div>
                            <p style={{ color: 'var(--text-secondary)' }}>No students found in this batch</p>
                        </div>
                    ) : (
                        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>📋 Student Attendance List</h3>
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{students.length} students</span>
                            </div>
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Student</th>
                                            <th style={{ textAlign: 'center' }}>Status</th>
                                            <th>Notes</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.map((student, i) => {
                                            const cfg = student.status ? statusConfig[student.status] : null
                                            return (
                                                <tr key={student.studentId}>
                                                    <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{i + 1}</td>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                            <div className="avatar" style={{ width: '34px', height: '34px', fontSize: '13px', flexShrink: 0 }}>
                                                                {student.fullName.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <div style={{ fontWeight: '600', fontSize: '14px' }}>{student.fullName}</div>
                                                                {student.studentCode && (
                                                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ID: {student.studentCode}</div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        {cfg ? (
                                                            <span style={{ background: cfg.bg, border: `1px solid ${cfg.color}30`, borderRadius: '8px', padding: '5px 12px', fontSize: '12px', fontWeight: '700', color: cfg.color, whiteSpace: 'nowrap' }}>
                                                                {cfg.icon} {cfg.label}
                                                            </span>
                                                        ) : (
                                                            <span style={{ color: 'var(--text-muted)', fontSize: '12px', fontStyle: 'italic' }}>Not Marked</span>
                                                        )}
                                                    </td>
                                                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                        {student.notes || '—'}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
