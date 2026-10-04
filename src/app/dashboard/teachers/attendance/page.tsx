'use client'
import { useState, useEffect } from 'react'

export default function AdminTeacherAttendance() {
    const [attendances, setAttendances] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])

    const fetchAttendance = () => {
        setLoading(true)
        fetch(`/api/teachers/attendance?date=${date}`)
            .then(r => r.json())
            .then(d => {
                setAttendances(d.data || [])
                setLoading(false)
            })
    }

    useEffect(() => {
        fetchAttendance()
    }, [date])

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'PRESENT': return '#10b981'
            case 'ABSENT': return '#ef4444'
            case 'LATE': return '#f59e0b'
            case 'LEAVE': return '#6366f1'
            default: return '#64748b'
        }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'white', margin: 0 }}>Teachers Attendance Log</h1>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '10px 16px', color: 'white' }} />
            </div>

            {loading ? (
                <div style={{ color: '#94a3b8', textAlign: 'center', padding: '40px' }}>Loading records...</div>
            ) : attendances.length === 0 ? (
                <div style={{ background: '#1e293b', border: '1px dashed #334155', borderRadius: '12px', padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    No teacher attendance records found for {date}.
                </div>
            ) : (
                <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: '#0f172a', borderBottom: '1px solid #334155' }}>
                                <th style={{ padding: '16px', color: '#94a3b8', fontSize: '13px', fontWeight: '600' }}>Teacher</th>
                                <th style={{ padding: '16px', color: '#94a3b8', fontSize: '13px', fontWeight: '600' }}>Status</th>
                                <th style={{ padding: '16px', color: '#94a3b8', fontSize: '13px', fontWeight: '600' }}>In Time</th>
                                <th style={{ padding: '16px', color: '#94a3b8', fontSize: '13px', fontWeight: '600' }}>Out Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {attendances.map((a: any) => (
                                <tr key={a.id} style={{ borderBottom: '1px solid #334155' }}>
                                    <td style={{ padding: '16px', color: 'white', fontSize: '14px', fontWeight: '500' }}>{a.teacher?.name}</td>
                                    <td style={{ padding: '16px' }}>
                                        <span style={{ background: `${getStatusColor(a.status)}20`, color: getStatusColor(a.status), padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                                            {a.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px', color: '#94a3b8', fontSize: '14px' }}>
                                        {a.inTime ? new Date(a.inTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                    </td>
                                    <td style={{ padding: '16px', color: '#94a3b8', fontSize: '14px' }}>
                                        {a.outTime ? new Date(a.outTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
