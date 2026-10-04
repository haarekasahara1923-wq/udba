'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export default function AdminTeacherLedger() {
    const [ledgers, setLedgers] = useState<any[]>([])
    const [teachers, setTeachers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState<string | null>(null)

    // Form states
    const [showForm, setShowForm] = useState(false)
    const [teacherId, setTeacherId] = useState('')
    const [month, setMonth] = useState(new Date().getMonth() + 1)
    const [year, setYear] = useState(new Date().getFullYear())
    const [deductions, setDeductions] = useState(0)
    
    const [selectedFilterTeacher, setSelectedFilterTeacher] = useState('')

    const { token } = useAuth()

    const fetchLedgers = () => {
        if (!token) return
        setLoading(true)
        const headers = { Authorization: `Bearer ${token}` }
        Promise.all([
            fetch('/api/teachers/ledger', { headers }).then(r => r.json()),
            fetch('/api/teachers', { headers }).then(r => r.json()) // assuming this returns all teachers
        ]).then(([ld, td]) => {
            setLedgers(ld.data || [])
            setTeachers(td.data || [])
            setLoading(false)
        })
    }

    useEffect(() => {
        fetchLedgers()
    }, [token])

    const handleGenerate = async () => {
        if(!teacherId || !month || !year) return alert('Fill all required fields')
        setProcessing('generate')
        const res = await fetch('/api/teachers/ledger', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ teacherId, month: Number(month), year: Number(year), deductions: Number(deductions) })
        })
        const data = await res.json()
        setProcessing(null)
        if(data.success) {
            setShowForm(false)
            fetchLedgers()
        } else {
            alert(data.error || 'Failed to generate ledger')
        }
    }

    const markPaid = async (id: string) => {
        if(!confirm('Mark this salary as PAID?')) return
        setProcessing(id)
        const res = await fetch('/api/teachers/ledger', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ id, status: 'PAID' })
        })
        const data = await res.json()
        setProcessing(null)
        if(data.success) {
            fetchLedgers()
        } else {
            alert(data.error || 'Failed to update')
        }
    }

    const getMonthName = (m: number) => {
        return new Date(2000, m - 1, 1).toLocaleString('default', { month: 'long' })
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'white', margin: 0 }}>Payroll & Ledger</h1>
                    <select value={selectedFilterTeacher} onChange={e => setSelectedFilterTeacher(e.target.value)} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '8px 12px', color: 'white' }}>
                        <option value="">All Teachers</option>
                        {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>
                <button onClick={() => setShowForm(!showForm)} style={{ background: '#6366f1', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                    {showForm ? 'Cancel' : '+ Generate Salary'}
                </button>
            </div>

            {showForm && (
                <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
                    <div style={{ flex: '1 1 200px' }}>
                        <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Teacher</label>
                        <select value={teacherId} onChange={e => setTeacherId(e.target.value)} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '10px', color: 'white' }}>
                            <option value="">-- Select Teacher --</option>
                            {teachers.map(t => <option key={t.id} value={t.id}>{t.name} (Base: ₹{t.salary})</option>)}
                        </select>
                    </div>
                    <div style={{ flex: '1 1 100px' }}>
                        <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Month</label>
                        <select value={month} onChange={e => setMonth(Number(e.target.value))} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '10px', color: 'white' }}>
                            {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>{getMonthName(m)}</option>)}
                        </select>
                    </div>
                    <div style={{ flex: '1 1 100px' }}>
                        <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Year</label>
                        <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '10px', color: 'white' }} />
                    </div>
                    <div style={{ flex: '1 1 150px' }}>
                        <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Deductions (₹)</label>
                        <input type="number" value={deductions} onChange={e => setDeductions(Number(e.target.value))} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '10px', color: 'white' }} />
                    </div>
                    <button onClick={handleGenerate} disabled={processing === 'generate'} style={{ background: '#10b981', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', height: '40px' }}>
                        {processing === 'generate' ? '...' : 'Generate'}
                    </button>
                </div>
            )}

            {loading ? (
                <div style={{ color: '#94a3b8', textAlign: 'center', padding: '40px' }}>Loading ledgers...</div>
            ) : ledgers.length === 0 ? (
                <div style={{ background: '#1e293b', border: '1px dashed #334155', borderRadius: '12px', padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    No payroll records found.
                </div>
            ) : (
                <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: '#0f172a', borderBottom: '1px solid #334155' }}>
                                <th style={{ padding: '16px', color: '#94a3b8', fontSize: '13px', fontWeight: '600' }}>Teacher</th>
                                <th style={{ padding: '16px', color: '#94a3b8', fontSize: '13px', fontWeight: '600' }}>Period</th>
                                <th style={{ padding: '16px', color: '#94a3b8', fontSize: '13px', fontWeight: '600' }}>Base</th>
                                <th style={{ padding: '16px', color: '#94a3b8', fontSize: '13px', fontWeight: '600' }}>Deductions</th>
                                <th style={{ padding: '16px', color: '#94a3b8', fontSize: '13px', fontWeight: '600' }}>Net Payable</th>
                                <th style={{ padding: '16px', color: '#94a3b8', fontSize: '13px', fontWeight: '600' }}>Status</th>
                                <th style={{ padding: '16px', color: '#94a3b8', fontSize: '13px', fontWeight: '600', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ledgers.filter(l => !selectedFilterTeacher || l.teacher?.id === selectedFilterTeacher).map((l: any) => (
                                <tr key={l.id} style={{ borderBottom: '1px solid #334155' }}>
                                    <td style={{ padding: '16px', color: 'white', fontSize: '14px', fontWeight: '500' }}>{l.teacher?.name}</td>
                                    <td style={{ padding: '16px', color: '#e2e8f0', fontSize: '14px' }}>{getMonthName(l.month)} {l.year}</td>
                                    <td style={{ padding: '16px', color: '#94a3b8', fontSize: '14px' }}>₹{l.baseSalary}</td>
                                    <td style={{ padding: '16px', color: '#ef4444', fontSize: '14px' }}>₹{l.deductions}</td>
                                    <td style={{ padding: '16px', color: '#10b981', fontSize: '14px', fontWeight: '700' }}>₹{l.netPayable}</td>
                                    <td style={{ padding: '16px' }}>
                                        <span style={{ background: l.status === 'PAID' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)', color: l.status === 'PAID' ? '#10b981' : '#f59e0b', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                                            {l.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px', textAlign: 'right' }}>
                                        {l.status === 'PENDING' && (
                                            <button onClick={() => markPaid(l.id)} disabled={processing === l.id} style={{ background: 'transparent', border: '1px solid #10b981', color: '#10b981', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                                                Mark Paid
                                            </button>
                                        )}
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
