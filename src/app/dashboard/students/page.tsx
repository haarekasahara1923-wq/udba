'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { formatDate, formatCurrency } from '@/lib/utils'

interface Student {
    id: string
    studentId: string
    scholarNo: string
    fullName: string
    phone: string
    email: string
    gender: string
    courseName: string
    batchName: string
    courseId: string
    batchId?: string
    totalFee: number
    paidFee: number
    status: string
    admissionDate: string
    fatherName: string
    parentPhone: string
    aadhaarNo?: string
    penId?: string
    aparId?: string
    samagraId?: string
    hasSiblings?: boolean
}

interface SiblingStudent {
    id: string
    fullName: string
    scholarNo: string
    studentId: string
    fatherName: string
    phone: string
    courseName?: string
    batchName?: string
}

const statusColors: Record<string, string> = {
    ACTIVE: 'badge-success',
    INACTIVE: 'badge-gray',
    DROPOUT: 'badge-danger',
    PASSED: 'badge-info',
}

export default function StudentsPage() {
    const { token, user } = useAuth()
    const canEditOrDelete = user?.role === 'SUPER_ADMIN' || user?.role === 'COACHING_ADMIN'
    const [students, setStudents] = useState<Student[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
    const [isEditing, setIsEditing] = useState(false)
    const [editForm, setEditForm] = useState<any>({})
    const [actionLoading, setActionLoading] = useState(false)

    // Sibling states
    const [showSiblingModal, setShowSiblingModal] = useState(false)
    const [siblingSearch, setSiblingSearch] = useState('')
    const [siblingSearchResults, setSiblingSearchResults] = useState<SiblingStudent[]>([])
    const [siblingSearchLoading, setSiblingSearchLoading] = useState(false)
    const [currentSiblings, setCurrentSiblings] = useState<SiblingStudent[]>([])
    const [siblingsLoading, setSiblingsLoading] = useState(false)
    const [siblingActionLoading, setSiblingActionLoading] = useState(false)

    // courses and batches for edit form dropdowns
    const [courses, setCourses] = useState<any[]>([])
    const [batches, setBatches] = useState<any[]>([])

    const fetchStudents = async () => {
        if (!token) return
        const params = new URLSearchParams()
        if (search) params.set('search', search)
        const res = await fetch(`/api/students?${params}`, { headers: { Authorization: `Bearer ${token}` } })
        const data = await res.json()
        if (data.success) {
            setStudents(data.data)
            // Load sibling status to show + indicator
            fetchSiblingStatus(data.data)
        }
        setLoading(false)
    }

    const fetchSiblingStatus = async (studentList: Student[]) => {
        if (!token || studentList.length === 0) return
        // We'll just load all siblings for all students in parallel (batched)
        try {
            const siblingsRes = await fetch(`/api/students/siblings/all`, { headers: { Authorization: `Bearer ${token}` } })
            if (siblingsRes.ok) {
                const siblingsData = await siblingsRes.json()
                if (siblingsData.success) {
                    const siblingSet = new Set<string>(siblingsData.data)
                    setStudents(prev => prev.map(s => ({ ...s, hasSiblings: siblingSet.has(s.id) })))
                }
            }
        } catch (err) {
            // silently fail, not critical
        }
    }

    const fetchCoursesAndBatches = async () => {
        if (!token) return
        try {
            const [cRes, bRes] = await Promise.all([
                fetch('/api/courses', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/batches', { headers: { Authorization: `Bearer ${token}` } }),
            ])
            const [cData, bData] = await Promise.all([cRes.json(), bRes.json()])
            if (cData.success) setCourses(cData.data)
            if (bData.success) setBatches(bData.data)
        } catch (err) {}
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this student?')) return
        setActionLoading(true)
        try {
            const res = await fetch(`/api/students?id=${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            })
            const data = await res.json()
            if (data.success) {
                alert('Student deleted successfully')
                fetchStudents()
            } else {
                alert(data.error || 'Failed to delete student')
            }
        } catch (err) {
            alert('Error deleting student')
        }
        setActionLoading(false)
    }

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        setActionLoading(true)
        try {
            const res = await fetch('/api/students', {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}` 
                },
                body: JSON.stringify(editForm)
            })
            const data = await res.json()
            if (data.success) {
                alert('Student updated successfully')
                setIsEditing(false)
                setSelectedStudent(data.data)
                fetchStudents()
            } else {
                alert(data.error || 'Failed to update student')
            }
        } catch (err) {
            alert('Error updating student')
        }
        setActionLoading(false)
    }

    const toggleBlock = async (student: Student) => {
        const newStatus = student.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
        if (!confirm(`Are you sure you want to ${newStatus === 'ACTIVE' ? 'unblock' : 'block'} this student?`)) return
        
        setActionLoading(true)
        try {
            const res = await fetch('/api/students', {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}` 
                },
                body: JSON.stringify({ id: student.id, status: newStatus })
            })
            const data = await res.json()
            if (data.success) {
                alert(`Student ${newStatus === 'ACTIVE' ? 'unblocked' : 'blocked'} successfully`)
                if (selectedStudent?.id === student.id) setSelectedStudent(data.data)
                fetchStudents()
            }
        } catch (err) {
            alert('Error updating status')
        }
        setActionLoading(false)
    }

    // ─── Sibling Functions ────────────────────────────────────────────────────
    const loadCurrentSiblings = async (studentId: string) => {
        if (!token) return
        setSiblingsLoading(true)
        try {
            const res = await fetch(`/api/students/siblings?studentId=${studentId}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            const data = await res.json()
            if (data.success) setCurrentSiblings(data.data)
        } catch (err) {}
        setSiblingsLoading(false)
    }

    const searchSiblings = async (q: string) => {
        if (!token || q.trim().length < 2) { setSiblingSearchResults([]); return }
        setSiblingSearchLoading(true)
        try {
            const res = await fetch(`/api/students/siblings?studentId=${selectedStudent?.id}&search=${encodeURIComponent(q)}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            const data = await res.json()
            if (data.success) setSiblingSearchResults(data.data)
        } catch (err) {}
        setSiblingSearchLoading(false)
    }

    const addSibling = async (siblingId: string) => {
        if (!token || !selectedStudent) return
        setSiblingActionLoading(true)
        try {
            const res = await fetch('/api/students/siblings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ studentId: selectedStudent.id, siblingId })
            })
            const data = await res.json()
            if (data.success) {
                alert('Sibling added successfully!')
                setSiblingSearch('')
                setSiblingSearchResults([])
                loadCurrentSiblings(selectedStudent.id)
                fetchStudents()
            } else {
                alert(data.error || 'Failed to add sibling')
            }
        } catch (err) {
            alert('Error adding sibling')
        }
        setSiblingActionLoading(false)
    }

    const removeSibling = async (siblingId: string) => {
        if (!token || !selectedStudent) return
        if (!confirm('Remove this sibling relationship?')) return
        setSiblingActionLoading(true)
        try {
            const res = await fetch(`/api/students/siblings?studentId=${selectedStudent.id}&siblingId=${siblingId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            })
            const data = await res.json()
            if (data.success) {
                loadCurrentSiblings(selectedStudent.id)
                fetchStudents()
            } else {
                alert(data.error || 'Failed to remove sibling')
            }
        } catch (err) {
            alert('Error removing sibling')
        }
        setSiblingActionLoading(false)
    }

    const openSiblingModal = () => {
        setSiblingSearch('')
        setSiblingSearchResults([])
        if (selectedStudent) loadCurrentSiblings(selectedStudent.id)
        setShowSiblingModal(true)
    }

    useEffect(() => { fetchStudents() }, [token, search])
    useEffect(() => { fetchCoursesAndBatches() }, [token])

    const filteredBatches = batches.filter(b => !editForm.courseId || b.courseId === editForm.courseId)

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">👨‍🎓 Students</h1>
                    <p className="page-subtitle">{students.length} students registered</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <Link href="/dashboard/students/add" className="btn btn-primary">➕ Add Student</Link>
                </div>
            </div>

            {/* Search & Filter */}
            <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '200px', display: 'flex', gap: '8px' }}>
                        <input
                            className="input"
                            style={{ flex: 1 }}
                            placeholder="🔍 Search by student name / scholar no..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && fetchStudents()}
                        />
                        <button className="btn btn-primary" onClick={fetchStudents} style={{ whiteSpace: 'nowrap' }}>
                            🔍 Search
                        </button>
                    </div>
                    <button className="btn btn-secondary" onClick={() => { setSearch(''); setTimeout(fetchStudents, 0); }}>🔄 Refresh</button>
                </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
                {[
                    { label: 'Total', value: students.length, color: '#6366f1' },
                    { label: 'Active', value: students.filter(s => s.status === 'ACTIVE').length, color: '#10b981' },
                    { label: 'Dropout', value: students.filter(s => s.status === 'DROPOUT').length, color: '#ef4444' },
                    { label: 'With Dues', value: students.filter(s => s.totalFee > s.paidFee).length, color: '#f59e0b' },
                ].map(s => (
                    <div key={s.label} style={{ padding: '14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: '800', color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="card" style={{ padding: 0 }}>
                <div className="table-container">
                    {loading ? (
                        <div style={{ padding: '40px', textAlign: 'center' }}>
                            <div className="spinner" style={{ margin: '0 auto 12px', width: '32px', height: '32px' }} />
                            <p style={{ color: 'var(--text-muted)' }}>Loading students...</p>
                        </div>
                    ) : students.length === 0 ? (
                        <div style={{ padding: '60px', textAlign: 'center' }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>👨‍🎓</div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '16px', marginBottom: '16px' }}>No students found</p>
                            <Link href="/dashboard/students/add" className="btn btn-primary">Add First Student</Link>
                        </div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th style={{ color: '#f97316', whiteSpace: 'nowrap' }}>Scholar No.</th>
                                    <th>Student</th>
                                    <th>Class / Section</th>
                                    <th>Phone</th>
                                    <th>Fee Status</th>
                                    <th>Status</th>
                                    <th>Admission</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map(s => {
                                    const owing = s.totalFee - s.paidFee
                                    const pct = s.totalFee > 0 ? Math.round((s.paidFee / s.totalFee) * 100) : 0
                                    return (
                                        <tr key={s.id}>
                                            <td>
                                                <div style={{
                                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                    background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.3)',
                                                    color: '#f97316', fontWeight: '700', fontSize: '13px',
                                                    borderRadius: '8px', padding: '4px 10px', whiteSpace: 'nowrap',
                                                    letterSpacing: '0.5px',
                                                }}>
                                                    {s.scholarNo || '—'}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div className="avatar">
                                                        {s.fullName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <span style={{ fontWeight: '600', fontSize: '14px' }}>{s.fullName}</span>
                                                            {s.hasSiblings && (
                                                                <span title="Has siblings in this school" style={{
                                                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                                    width: '18px', height: '18px', borderRadius: '50%',
                                                                    background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.4)',
                                                                    color: '#6366f1', fontSize: '11px', fontWeight: '800', cursor: 'default',
                                                                }}>+</span>
                                                            )}
                                                        </div>
                                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.studentId}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ fontSize: '13px', fontWeight: '600' }}>{s.courseName}</div>
                                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.batchName}</div>
                                            </td>
                                            <td>
                                                <div style={{ fontSize: '13px' }}>{s.phone}</div>
                                                {s.parentPhone && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>P: {s.parentPhone}</div>}
                                            </td>
                                            <td>
                                                <div style={{ marginBottom: '4px' }}>
                                                    <div className="progress-bar" style={{ height: '4px' }}>
                                                        <div className="progress-fill" style={{ width: `${pct}%`, background: pct >= 100 ? '#10b981' : pct > 50 ? '#f59e0b' : '#ef4444' }} />
                                                    </div>
                                                </div>
                                                <div style={{ fontSize: '11px', color: owing > 0 ? '#f59e0b' : '#10b981', fontWeight: '600' }}>
                                                    {pct}% paid {owing > 0 ? `• Due: ${formatCurrency(owing)}` : '✓'}
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`badge ${statusColors[s.status] || 'badge-gray'}`}>{s.status}</span>
                                            </td>
                                            <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                                                {s.admissionDate ? formatDate(s.admissionDate) : '-'}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                    <button onClick={() => setSelectedStudent(s)} className="btn btn-secondary btn-sm" title="View">👁️</button>
                                                    {canEditOrDelete && (
                                                        <>
                                                            <button onClick={() => { setSelectedStudent(s); setEditForm({ ...s }); setIsEditing(true); }} className="btn btn-secondary btn-sm" title="Edit">✏️</button>
                                                            <button onClick={() => toggleBlock(s)} className={`btn btn-sm ${s.status === 'ACTIVE' ? 'btn-secondary' : 'btn-success'}`} title={s.status === 'ACTIVE' ? 'Block' : 'Unblock'}>
                                                                {s.status === 'ACTIVE' ? '🚫' : '✅'}
                                                            </button>
                                                            <button onClick={() => handleDelete(s.id)} className="btn btn-secondary btn-sm" style={{ color: '#ef4444' }} title="Delete">🗑️</button>
                                                        </>
                                                    )}
                                                    <a href={`https://wa.me/${s.parentPhone?.replace(/\D/g, '') || s.phone?.replace(/\D/g, '')}`} target="_blank" className="btn btn-sm" style={{ background: '#25d366', color: 'white', textDecoration: 'none' }} title="WhatsApp">💬</a>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Student Detail / Edit Modal */}
            {selectedStudent && (
                <div className="modal-overlay" onClick={() => { setSelectedStudent(null); setIsEditing(false); setShowSiblingModal(false); }}>
                    <div className="modal" style={{ maxWidth: isEditing ? '640px' : '500px' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div className="avatar" style={{ width: '48px', height: '48px', fontSize: '20px' }}>{selectedStudent.fullName.charAt(0)}</div>
                                <div>
                                    <h3 style={{ fontWeight: '700', fontSize: '18px' }}>{isEditing ? 'Edit Student' : selectedStudent.fullName}</h3>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{selectedStudent.studentId} {selectedStudent.scholarNo ? `• Scholar: ${selectedStudent.scholarNo}` : ''}</p>
                                </div>
                            </div>
                            <button onClick={() => { setSelectedStudent(null); setIsEditing(false); setShowSiblingModal(false); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}>✕</button>
                        </div>
                        <div className="modal-body">
                            {isEditing ? (
                                <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div className="col-span-2" style={{ gridColumn: '1 / -1' }}>
                                            <label className="label">Full Name</label>
                                            <input className="input" value={editForm.fullName || ''} onChange={e => setEditForm({ ...editForm, fullName: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="label">Scholar No. (Editable)</label>
                                            <input className="input" value={editForm.scholarNo || ''} onChange={e => setEditForm({ ...editForm, scholarNo: e.target.value })} placeholder="Scholar number" />
                                        </div>
                                        <div>
                                            <label className="label">Father's Name</label>
                                            <input className="input" value={editForm.fatherName || ''} onChange={e => setEditForm({ ...editForm, fatherName: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="label">Phone Number</label>
                                            <input className="input" value={editForm.phone || ''} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="label">Parent Phone</label>
                                            <input className="input" value={editForm.parentPhone || ''} onChange={e => setEditForm({ ...editForm, parentPhone: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="label">Class</label>
                                            <select className="input" value={editForm.courseId || ''} onChange={e => setEditForm({ ...editForm, courseId: e.target.value, batchId: '' })}>
                                                <option value="">Select Class</option>
                                                {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="label">Section</label>
                                            <select className="input" value={editForm.batchId || ''} onChange={e => setEditForm({ ...editForm, batchId: e.target.value })}>
                                                <option value="">Select Section</option>
                                                {filteredBatches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="label">Total Fee</label>
                                            <input type="number" className="input" value={editForm.totalFee || ''} onChange={e => setEditForm({ ...editForm, totalFee: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="label">Status</label>
                                            <select className="input" value={editForm.status || ''} onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
                                                <option value="ACTIVE">ACTIVE</option>
                                                <option value="INACTIVE">INACTIVE</option>
                                                <option value="DROPOUT">DROPOUT</option>
                                                <option value="PASSED">PASSED</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                                        <button type="submit" className="btn btn-primary" disabled={actionLoading} style={{ flex: 1 }}>
                                            {actionLoading ? 'Saving...' : '💾 Save Changes'}
                                        </button>
                                        <button type="button" onClick={() => setIsEditing(false)} className="btn btn-secondary">Cancel</button>
                                    </div>

                                    {/* Add Sibling CTA - only for SUPER_ADMIN */}
                                    {canEditOrDelete && (
                                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '4px' }}>
                                            <button
                                                type="button"
                                                onClick={openSiblingModal}
                                                className="btn btn-secondary"
                                                style={{
                                                    width: '100%',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                                    background: 'rgba(99,102,241,0.08)', border: '1.5px dashed rgba(99,102,241,0.5)',
                                                    color: '#6366f1', fontWeight: '700', fontSize: '14px', padding: '12px'
                                                }}
                                            >
                                                👨‍👩‍👧‍👦 Manage Siblings
                                                {currentSiblings.length > 0 && (
                                                    <span style={{
                                                        background: '#6366f1', color: 'white',
                                                        borderRadius: '999px', padding: '1px 7px', fontSize: '11px', fontWeight: '800'
                                                    }}>{currentSiblings.length}</span>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </form>
                            ) : (
                                <div className="grid-cols-2">
                                    {[
                                        ['🎓 Scholar No.', selectedStudent.scholarNo || 'N/A'],
                                        ['📱 Phone', selectedStudent.phone],
                                        ['👨 Father', selectedStudent.fatherName || 'N/A'],
                                        ['📧 Email', selectedStudent.email || 'N/A'],
                                        ['📞 Parent Phone', selectedStudent.parentPhone || 'N/A'],
                                        ['📚 Class', selectedStudent.courseName],
                                        ['🕐 Section', selectedStudent.batchName],
                                        ['💰 Total Fee', formatCurrency(selectedStudent.totalFee)],
                                        ['✅ Paid', formatCurrency(selectedStudent.paidFee)],
                                        ['⚠️ Pending', formatCurrency(selectedStudent.totalFee - selectedStudent.paidFee)],
                                        ['📅 Admission', selectedStudent.admissionDate ? formatDate(selectedStudent.admissionDate) : 'N/A'],
                                        ['🚩 Status', selectedStudent.status],
                                        ['🪪 Aadhaar No.', selectedStudent.aadhaarNo || 'N/A'],
                                        ['🆔 PEN ID', selectedStudent.penId || 'N/A'],
                                        ['🆔 APAR ID', selectedStudent.aparId || 'N/A'],
                                        ['🆔 Samagra ID', selectedStudent.samagraId || 'N/A'],
                                    ].map(([label, value]) => (
                                        <div key={label} style={{ padding: '10px', background: 'var(--surface-2)', borderRadius: '8px' }}>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</div>
                                            <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{value}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        {!isEditing && (
                            <div className="modal-footer">
                                {canEditOrDelete && (
                                    <button onClick={() => { setEditForm({ ...selectedStudent }); setIsEditing(true); }} className="btn btn-secondary">✏️ Edit Details</button>
                                )}
                                <a href={`https://wa.me/${(selectedStudent.parentPhone || selectedStudent.phone)?.replace(/\D/g, '')}?text=Dear Parent, This is regarding ${selectedStudent.fullName} from our school institute.`} target="_blank" className="btn btn-success">💬 WhatsApp Parent</a>
                                <button onClick={() => setSelectedStudent(null)} className="btn btn-secondary">Close</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Sibling Management Modal */}
            {showSiblingModal && selectedStudent && (
                <div className="modal-overlay" onClick={() => setShowSiblingModal(false)} style={{ zIndex: 1100 }}>
                    <div className="modal" style={{ maxWidth: '560px' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h3 style={{ fontWeight: '700', fontSize: '18px' }}>👨‍👩‍👧‍👦 Manage Siblings</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                                    {selectedStudent.fullName} • Max 3 siblings allowed
                                </p>
                            </div>
                            <button onClick={() => setShowSiblingModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}>✕</button>
                        </div>
                        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {/* Current Siblings */}
                            <div>
                                <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.5px' }}>
                                    Current Siblings ({currentSiblings.length}/3)
                                </div>
                                {siblingsLoading ? (
                                    <div style={{ textAlign: 'center', padding: '20px' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
                                ) : currentSiblings.length === 0 ? (
                                    <div style={{ padding: '16px', background: 'var(--surface-2)', borderRadius: '10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                                        No siblings added yet
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {currentSiblings.map(sib => (
                                            <div key={sib.id} style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                padding: '10px 14px', background: 'rgba(99,102,241,0.06)',
                                                border: '1px solid rgba(99,102,241,0.2)', borderRadius: '10px'
                                            }}>
                                                <div>
                                                    <div style={{ fontWeight: '600', fontSize: '14px' }}>{sib.fullName}</div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                        Scholar: {sib.scholarNo || 'N/A'} • {sib.courseName || 'N/A'} - {sib.batchName || 'N/A'}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => removeSibling(sib.id)}
                                                    disabled={siblingActionLoading}
                                                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: '8px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}
                                                >
                                                    ✕ Remove
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Add Sibling Search */}
                            {currentSiblings.length < 3 && (
                                <div>
                                    <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.5px' }}>
                                        Add Sibling
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                                        <input
                                            className="input"
                                            style={{ flex: 1 }}
                                            placeholder="Search by name or scholar no..."
                                            value={siblingSearch}
                                            onChange={e => { setSiblingSearch(e.target.value); searchSiblings(e.target.value); }}
                                        />
                                        {siblingSearchLoading && <div className="spinner" style={{ width: '20px', height: '20px', alignSelf: 'center' }} />}
                                    </div>
                                    {siblingSearchResults.length > 0 && (
                                        <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            {siblingSearchResults.filter(r => {
                                                // exclude already-added siblings and the student themselves
                                                return r.id !== selectedStudent.id && !currentSiblings.find(s => s.id === r.id)
                                            }).map(result => (
                                                <div key={result.id} style={{
                                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                    padding: '10px 14px', background: 'var(--surface-2)',
                                                    border: '1px solid var(--border)', borderRadius: '10px', cursor: 'pointer'
                                                }}>
                                                    <div>
                                                        <div style={{ fontWeight: '600', fontSize: '14px' }}>{result.fullName}</div>
                                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                            Scholar: {result.scholarNo || 'N/A'} • {result.courseName || 'N/A'} {result.batchName ? `- ${result.batchName}` : ''}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => addSibling(result.id)}
                                                        disabled={siblingActionLoading}
                                                        className="btn btn-primary"
                                                        style={{ padding: '5px 12px', fontSize: '12px', fontWeight: '700' }}
                                                    >
                                                        + Add
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {siblingSearch.length >= 2 && siblingSearchResults.filter(r => r.id !== selectedStudent.id && !currentSiblings.find(s => s.id === r.id)).length === 0 && !siblingSearchLoading && (
                                        <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)', fontSize: '13px' }}>
                                            No students found for "{siblingSearch}"
                                        </div>
                                    )}
                                </div>
                            )}
                            {currentSiblings.length >= 3 && (
                                <div style={{ padding: '12px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '10px', color: '#d97706', fontSize: '13px', fontWeight: '600', textAlign: 'center' }}>
                                    ⚠️ Maximum 3 siblings limit reached. Remove a sibling to add another.
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button onClick={() => setShowSiblingModal(false)} className="btn btn-secondary">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
