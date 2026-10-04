'use client'
import { useState, useEffect } from 'react'

export default function AdminTeacherTimetable() {
    const [timetables, setTimetables] = useState<any[]>([])
    const [teachers, setTeachers] = useState<any[]>([])
    const [selectedTeacher, setSelectedTeacher] = useState('')
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState<string | null>(null)

    const fetchTimetables = () => {
        setLoading(true)
        Promise.all([
            fetch('/api/teachers/timetable').then(r => r.json()),
            fetch('/api/teachers').then(r => r.json())
        ]).then(([ttData, tData]) => {
            setTimetables(ttData.data || [])
            setTeachers(tData.data || [])
            setLoading(false)
        })
    }

    useEffect(() => {
        fetchTimetables()
    }, [])

    const handleAction = async (id: string, status: string) => {
        setProcessing(id)
        const res = await fetch('/api/teachers/timetable', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status })
        })
        const data = await res.json()
        setProcessing(null)
        if(data.success) {
            fetchTimetables()
        } else {
            alert(data.error || 'Failed to update schedule status')
        }
    }

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'white', margin: 0 }}>Timetable Approvals</h1>
                <select value={selectedTeacher} onChange={e => setSelectedTeacher(e.target.value)} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '10px 16px', color: 'white' }}>
                    <option value="">All Teachers</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
            </div>

            {loading ? (
                <div style={{ color: '#94a3b8', textAlign: 'center', padding: '40px' }}>Loading schedules...</div>
            ) : timetables.length === 0 ? (
                <div style={{ background: '#1e293b', border: '1px dashed #334155', borderRadius: '12px', padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    No schedule requests found.
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                    {timetables.filter(t => !selectedTeacher || t.teacher?.id === selectedTeacher).map((t: any) => (
                        <div key={t.id} style={{ background: '#1e293b', border: '1px solid #334155', borderLeft: `4px solid ${t.status === 'APPROVED' ? '#10b981' : t.status === 'REJECTED' ? '#ef4444' : '#f59e0b'}`, borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ fontSize: '16px', fontWeight: '700', color: 'white' }}>{t.teacher?.name}</div>
                                    <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
                                        {days[t.dayOfWeek]} • {t.startTime} - {t.endTime}
                                    </div>
                                </div>
                                <span style={{ 
                                    fontSize: '11px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '4px',
                                    background: t.status === 'APPROVED' ? 'rgba(16,185,129,0.2)' : t.status === 'REJECTED' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)',
                                    color: t.status === 'APPROVED' ? '#10b981' : t.status === 'REJECTED' ? '#ef4444' : '#f59e0b'
                                 }}>
                                    {t.status}
                                </span>
                            </div>
                            
                            <div style={{ background: '#0f172a', padding: '12px', borderRadius: '8px', fontSize: '13px' }}>
                                <div style={{ color: '#e2e8f0', fontWeight: '600' }}>{t.subject}</div>
                                <div style={{ color: '#64748b', marginTop: '4px' }}>Class/Batch: {t.batch?.name}</div>
                            </div>

                            {t.status === 'PENDING' && (
                                <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                                    <button 
                                        onClick={() => handleAction(t.id, 'APPROVED')} 
                                        disabled={processing === t.id}
                                        style={{ flex: 1, padding: '8px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '6px', color: '#10b981', fontWeight: '600', cursor: 'pointer' }}
                                    >
                                        Approve
                                    </button>
                                    <button 
                                        onClick={() => handleAction(t.id, 'REJECTED')} 
                                        disabled={processing === t.id}
                                        style={{ flex: 1, padding: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', color: '#ef4444', fontWeight: '600', cursor: 'pointer' }}
                                    >
                                        Reject
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
