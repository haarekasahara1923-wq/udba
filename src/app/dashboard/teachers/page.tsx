'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'

interface Teacher {
    id: string
    name: string
    email: string
    phone: string
    subject: string[]
    salary: number
    joinDate: string
    isActive: boolean
}

export default function TeachersPage() {
    const { token } = useAuth()
    const [teachers, setTeachers] = useState<Teacher[]>([])
    const [loading, setLoading] = useState(true)
    const [showAdd, setShowAdd] = useState(false)
    const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', salary: '', joinDate: new Date().toISOString().split('T')[0] })
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState('')

    const fetchTeachers = async () => {
        if (!token) return
        const res = await fetch('/api/teachers', { headers: { Authorization: `Bearer ${token}` } })
        const data = await res.json()
        if (data.success) setTeachers(data.data)
        setLoading(false)
    }

    useEffect(() => { fetchTeachers() }, [token])

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        const res = await fetch('/api/teachers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ ...form, subject: form.subject.split(',').map(s => s.trim()) }),
        })
        const data = await res.json()
        setSaving(false)
        if (data.success) {
            setToast('Teacher added!')
            setShowAdd(false)
            fetchTeachers()
            setTimeout(() => setToast(''), 3000)
        }
    }

    const totalSalary = teachers.reduce((s, t) => s + t.salary, 0)

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">👩‍🏫 Teacher Management</h1>
                    <p className="page-subtitle">{teachers.length} teachers • Monthly outflow: ₹{totalSalary.toLocaleString('en-IN')}</p>
                </div>
                <button onClick={() => setShowAdd(true)} className="btn btn-primary">➕ Add Teacher</button>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
                <Link href="/dashboard/teachers/attendance" style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '16px', flex: 1, minWidth: '150px', textAlign: 'center', textDecoration: 'none', color: 'white', transition: 'all 0.2s', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                    <div style={{ fontSize: '24px' }}>✅</div>
                    <div style={{ fontSize: '13px', fontWeight: '600', marginTop: '8px' }}>Attendance Logs</div>
                </Link>
                <Link href="/dashboard/teachers/leaves" style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '16px', flex: 1, minWidth: '150px', textAlign: 'center', textDecoration: 'none', color: 'white', transition: 'all 0.2s', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                    <div style={{ fontSize: '24px' }}>📅</div>
                    <div style={{ fontSize: '13px', fontWeight: '600', marginTop: '8px' }}>Leave Requests</div>
                </Link>
                <Link href="/dashboard/teachers/timetable" style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '16px', flex: 1, minWidth: '150px', textAlign: 'center', textDecoration: 'none', color: 'white', transition: 'all 0.2s', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                    <div style={{ fontSize: '24px' }}>⏰</div>
                    <div style={{ fontSize: '13px', fontWeight: '600', marginTop: '8px' }}>Schedules</div>
                </Link>
                <Link href="/dashboard/teachers/ledger" style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '16px', flex: 1, minWidth: '150px', textAlign: 'center', textDecoration: 'none', color: 'white', transition: 'all 0.2s', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                    <div style={{ fontSize: '24px' }}>💰</div>
                    <div style={{ fontSize: '13px', fontWeight: '600', marginTop: '8px' }}>Payroll & Ledger</div>
                </Link>
            </div>

            {toast && <div className="toast toast-success" style={{ position: 'relative', marginBottom: '16px', maxWidth: '100%' }}>✓ {toast}</div>}

            <div className="table-container">
                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Contact</th>
                                <th>Subjects</th>
                                <th>Joined</th>
                                <th>Salary</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {teachers.map(t => (
                                <tr key={t.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '14px' }}>{t.name.charAt(0)}</div>
                                            <div style={{ fontWeight: '600' }}>{t.name}</div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '13px' }}>{t.phone}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.email}</div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                            {t.subject.map(s => (
                                                <span key={s} style={{ padding: '2px 8px', background: 'var(--surface-2)', borderRadius: '12px', fontSize: '11px' }}>{s}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td style={{ fontSize: '13px' }}>{new Date(t.joinDate).toLocaleDateString()}</td>
                                    <td style={{ fontSize: '13px', fontWeight: '600', color: '#10b981' }}>₹{t.salary.toLocaleString('en-IN')}</td>
                                    <td>
                                        <span className={`badge ${t.isActive ? 'badge-success' : 'badge-gray'}`}>{t.isActive ? 'Active' : 'Blocked'}</span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <button onClick={() => alert('View Teacher Details')} style={{ background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>View</button>
                                            <button onClick={() => alert('Edit Teacher')} style={{ background: 'transparent', border: '1px solid #f59e0b', color: '#f59e0b', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Edit</button>
                                            <button onClick={() => alert('Block/Unblock')} style={{ background: 'transparent', border: '1px solid #64748b', color: '#64748b', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>{t.isActive ? 'Block' : 'Unblock'}</button>
                                            <button onClick={() => alert('Delete Teacher')} style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {showAdd && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3 style={{ fontWeight: '700' }}>👩‍🏫 Add Teacher</h3>
                            <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}>✕</button>
                        </div>
                        <form onSubmit={handleAdd}>
                            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <div><label className="label">Full Name *</label><input className="input" placeholder="Dr. Rajesh Kumar" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
                                <div className="grid-cols-2">
                                    <div><label className="label">Phone *</label><input className="input" type="tel" placeholder="917879337770" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required /></div>
                                    <div><label className="label">Email</label><input className="input" type="email" placeholder="teacher@coaching.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                                </div>
                                <div><label className="label">Subjects (comma separated)</label><input className="input" placeholder="Physics, Maths" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} /></div>
                                <div className="grid-cols-2">
                                    <div><label className="label">Monthly Salary (₹)</label><input className="input" type="number" placeholder="35000" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} /></div>
                                    <div><label className="label">Join Date</label><input className="input" type="date" value={form.joinDate} onChange={e => setForm({ ...form, joinDate: e.target.value })} /></div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowAdd(false)} className="btn btn-secondary">Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '⏳' : '✅ Add Teacher'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
