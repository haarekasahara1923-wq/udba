'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export default function AdminTeacherTimetable() {
    const [timetables, setTimetables] = useState<any[]>([])
    const [teachers, setTeachers] = useState<any[]>([])
    const [selectedTeacher, setSelectedTeacher] = useState('')
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState<string | null>(null)

    const { token, tenant } = useAuth()
    const [currentTenant, setCurrentTenant] = useState<any>(tenant)

    const fetchTimetables = () => {
        if (!token) return
        setLoading(true)
        const headers = { Authorization: `Bearer ${token}` }
        Promise.all([
            fetch('/api/teachers/timetable', { headers }).then(r => r.json()),
            fetch('/api/teachers', { headers }).then(r => r.json()),
            fetch('/api/tenant', { headers }).then(r => r.json())
        ]).then(([ttData, tData, tnData]) => {
            setTimetables(ttData.data || [])
            setTeachers(tData.data || [])
            if (tnData.success && tnData.tenant) setCurrentTenant(tnData.tenant)
            setLoading(false)
        })
    }

    useEffect(() => {
        fetchTimetables()
    }, [token])

    const handleAction = async (id: string, status: string) => {
        setProcessing(id)
        const res = await fetch('/api/teachers/timetable', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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

    const handlePrintTimetable = () => {
        const filtered = timetables.filter(t => !selectedTeacher || t.teacher?.id === selectedTeacher)
        const tObj = currentTenant || tenant || {}
        const teacherName = teachers.find(t => t.id === selectedTeacher)?.name || 'All Faculty'

        const rowsHtml = filtered.map(t => `
            <tr>
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>${t.teacher?.name || '-'}</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">${days[t.dayOfWeek]}</td>
                <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; color: #166534;">${t.startTime} - ${t.endTime}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${t.subject}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${t.batch?.name || '-'}</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${t.status}</td>
            </tr>
        `).join('')

        const fullHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Time Table - ${tObj.name || 'School'}</title>
            <style>
                @page { size: A4 landscape; margin: 15mm; }
                body { font-family: Arial, sans-serif; margin: 0; padding: 0; color: #000; }
                .box { border: 2px solid #000; padding: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
                th { background: #1a5c38; color: white; padding: 10px; border: 1px solid #1a5c38; text-align: left; }
            </style>
        </head>
        <body>
            <div class="box">
                <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 20px;">
                    ${tObj.logo ? `<img src="${tObj.logo}" style="height: 70px; margin-bottom: 5px;" />` : ''}
                    <h1 style="margin: 5px 0; text-transform: uppercase; font-size: 24px;">${tObj.name || 'UNIVERSAL DAY BOARDING ACADEMY'}</h1>
                    <p style="margin: 0; font-size: 13px;">${tObj.address || ''} | Ph: ${tObj.phone || ''} | Email: ${tObj.email || ''}${tObj.website ? ` | Web: ${tObj.website}` : ''}</p>
                    <p style="margin: 5px 0 0 0; font-size: 13px; font-weight: bold;">School Code: ${tObj.schoolCode || '---'} &nbsp;&nbsp;&nbsp; UDISE No: ${tObj.diseCode || '---'}</p>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h2 style="margin: 0; font-size: 18px; text-decoration: underline;">OFFICIAL TIME TABLE (${teacherName})</h2>
                    <span style="font-size: 12px;">Generated: ${new Date().toLocaleDateString('en-IN')}</span>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Faculty Name</th>
                            <th>Day</th>
                            <th>Time Slot</th>
                            <th>Subject</th>
                            <th>Class / Batch</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml || '<tr><td colspan="6" style="text-align: center; padding: 20px;">No schedule records found</td></tr>'}
                    </tbody>
                </table>

                <div style="margin-top: 50px; display: flex; justify-content: space-between;">
                    <div style="text-align: center;"><div style="border-top: 1px solid #000; width: 160px; padding-top: 5px;">Time Table Incharge</div></div>
                    <div style="text-align: center;"><div style="border-top: 1px solid #000; width: 160px; padding-top: 5px;">Principal / Director</div></div>
                </div>
            </div>
            <script>
                window.onload = function() { setTimeout(function() { window.print(); }, 400); };
            </script>
        </body>
        </html>
        `
        const win = window.open('', '_blank')
        if (win) {
            win.document.open()
            win.document.write(fullHtml)
            win.document.close()
        }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'white', margin: 0 }}>Timetable Approvals</h1>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <select value={selectedTeacher} onChange={e => setSelectedTeacher(e.target.value)} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '10px 16px', color: 'white' }}>
                        <option value="">All Teachers</option>
                        {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    <button 
                        onClick={handlePrintTimetable}
                        style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 18px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        🖨️ Print Timetable
                    </button>
                </div>
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
