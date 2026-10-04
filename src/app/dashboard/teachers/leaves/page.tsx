'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export default function AdminTeacherLeaves() {
    const [leaves, setLeaves] = useState<any[]>([])
    const [teachers, setTeachers] = useState<any[]>([])
    const [selectedTeacher, setSelectedTeacher] = useState('')
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState<string | null>(null)

    const { token } = useAuth()

    const fetchLeaves = () => {
        if (!token) return
        setLoading(true)
        const headers = { Authorization: `Bearer ${token}` }
        Promise.all([
            fetch('/api/teachers/leaves', { headers }).then(r => r.json()),
            fetch('/api/teachers', { headers }).then(r => r.json())
        ]).then(([leaveData, tData]) => {
            setLeaves(leaveData.data || [])
            setTeachers(tData.data || [])
            setLoading(false)
        })
    }

    useEffect(() => {
        fetchLeaves()
    }, [token])

    const handleAction = async (leaveId: string, status: string) => {
        setProcessing(leaveId)
        const res = await fetch('/api/teachers/leaves', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ leaveId, status })
        })
        const data = await res.json()
        setProcessing(null)
        if(data.success) {
            fetchLeaves()
        } else {
            alert(data.error || 'Failed to update leave status')
        }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'white', margin: 0 }}>Leave Applications</h1>
                <select value={selectedTeacher} onChange={e => setSelectedTeacher(e.target.value)} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '10px 16px', color: 'white' }}>
                    <option value="">All Teachers</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
            </div>

            {loading ? (
                <div style={{ color: '#94a3b8', textAlign: 'center', padding: '40px' }}>Loading leaves...</div>
            ) : leaves.length === 0 ? (
                <div style={{ background: '#1e293b', border: '1px dashed #334155', borderRadius: '12px', padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    No leave applications found.
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                    {leaves.filter(l => !selectedTeacher || l.teacher?.id === selectedTeacher).map((l: any) => (
                        <div key={l.id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ fontSize: '16px', fontWeight: '700', color: 'white' }}>{l.teacher?.name}</div>
                                    <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
                                        {new Date(l.startDate).toLocaleDateString()} to {new Date(l.endDate).toLocaleDateString()}
                                    </div>
                                </div>
                                <span style={{ 
                                    fontSize: '11px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '4px',
                                    background: l.status === 'APPROVED' ? 'rgba(16,185,129,0.2)' : l.status === 'REJECTED' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)',
                                    color: l.status === 'APPROVED' ? '#10b981' : l.status === 'REJECTED' ? '#ef4444' : '#f59e0b'
                                 }}>
                                    {l.status}
                                </span>
                            </div>
                            
                            <div style={{ background: '#0f172a', padding: '12px', borderRadius: '8px', fontSize: '13px', color: '#e2e8f0', minHeight: '60px' }}>
                                {l.reason}
                            </div>

                            {l.status === 'PENDING' && (
                                <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                                    <button 
                                        onClick={() => handleAction(l.id, 'APPROVED')} 
                                        disabled={processing === l.id}
                                        style={{ flex: 1, padding: '8px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '6px', color: '#10b981', fontWeight: '600', cursor: 'pointer' }}
                                    >
                                        Approve
                                    </button>
                                    <button 
                                        onClick={() => handleAction(l.id, 'REJECTED')} 
                                        disabled={processing === l.id}
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
