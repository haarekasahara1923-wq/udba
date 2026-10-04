'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export default function SportsPage() {
    const { token } = useAuth()
    const [sports, setSports] = useState<any[]>([])
    const [selectedSport, setSelectedSport] = useState('')
    const [sportStudents, setSportStudents] = useState<any[]>([])
    
    // Add Sport
    const [newSport, setNewSport] = useState('')
    
    // Selection for adding students
    const [courses, setCourses] = useState<any[]>([])
    const [batches, setBatches] = useState<any[]>([])
    const [selectedCourse, setSelectedCourse] = useState('')
    const [selectedBatch, setSelectedBatch] = useState('')
    
    // Students to add
    const [availableStudents, setAvailableStudents] = useState<any[]>([])
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
    
    useEffect(() => {
        if (!token) return
        fetchSports()
        fetchCourses()
    }, [token])
    
    useEffect(() => {
        if (selectedSport) fetchSportStudents()
    }, [selectedSport])

    useEffect(() => {
        if (selectedCourse) fetchBatches(selectedCourse)
    }, [selectedCourse])

    useEffect(() => {
        if (selectedBatch) fetchAvailableStudents(selectedBatch)
    }, [selectedBatch])
    
    const fetchSports = async () => {
        const res = await fetch('/api/sports', { headers: { Authorization: `Bearer ${token}` } })
        const d = await res.json()
        if (d.success) setSports(d.data)
    }

    const fetchCourses = async () => {
        const res = await fetch('/api/courses', { headers: { Authorization: `Bearer ${token}` } })
        const d = await res.json()
        if (d.success) setCourses(d.data)
    }

    const fetchBatches = async (courseId: string) => {
        const res = await fetch(`/api/batches?courseId=${courseId}`, { headers: { Authorization: `Bearer ${token}` } })
        const d = await res.json()
        if (d.success) setBatches(d.data)
    }

    const fetchAvailableStudents = async (batchId: string) => {
        const res = await fetch(`/api/students?batchId=${batchId}`, { headers: { Authorization: `Bearer ${token}` } })
        const d = await res.json()
        if (d.success) {
            setAvailableStudents(d.data)
        }
    }

    const fetchSportStudents = async () => {
        const res = await fetch(`/api/sports/students?sportId=${selectedSport}`, { headers: { Authorization: `Bearer ${token}` } })
        const d = await res.json()
        if (d.success) setSportStudents(d.data)
    }

    const addSport = async () => {
        if (!newSport) return
        const res = await fetch('/api/sports', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ name: newSport })
        })
        const d = await res.json()
        if (d.success) {
            setNewSport('')
            fetchSports()
        } else {
            alert(d.error)
        }
    }

    const addStudentsToSport = async () => {
        if (!selectedSport || selectedStudentIds.length === 0) return
        const res = await fetch('/api/sports/students', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ sportId: selectedSport, studentIds: selectedStudentIds })
        })
        const d = await res.json()
        if (d.success) {
            setSelectedStudentIds([])
            fetchSportStudents()
            alert('Students added to sport successfully!')
        } else {
            alert(d.error)
        }
    }

    const toggleStudentStatus = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE'
        const res = await fetch('/api/sports/students', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ id, status: newStatus })
        })
        const d = await res.json()
        if (d.success) {
            fetchSportStudents()
        }
    }

    return (
        <div style={{ padding: '20px' }}>
            <h1 className="page-title">🏆 Sports Management</h1>
            <p className="page-subtitle">Manage sports and add students to sports activities.</p>

            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginTop: '20px' }}>
                {/* Add Sport Section */}
                <div className="card" style={{ flex: '1', minWidth: '300px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>1. Add New Sport</h2>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <input
                            type="text"
                            className="input"
                            placeholder="e.g. Cricket, Football..."
                            value={newSport}
                            onChange={(e) => setNewSport(e.target.value)}
                            style={{ flex: 1 }}
                        />
                        <button className="btn btn-primary" onClick={addSport}>Add Sport</button>
                    </div>
                </div>

                {/* Select Sport Section */}
                <div className="card" style={{ flex: '1', minWidth: '300px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>2. Select Sport</h2>
                    <select className="input" value={selectedSport} onChange={e => setSelectedSport(e.target.value)} style={{ width: '100%' }}>
                        <option value="">-- Select a Sport --</option>
                        {sports.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {selectedSport && (
                <div className="card" style={{ marginTop: '24px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>3. Add Students to Selected Sport</h2>
                    
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
                        <select className="input" value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)} style={{ flex: 1, minWidth: '200px' }}>
                            <option value="">Select Class / Course</option>
                            {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        
                        <select className="input" value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)} style={{ flex: 1, minWidth: '200px' }} disabled={!selectedCourse}>
                            <option value="">Select Batch</option>
                            {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                    </div>

                    {availableStudents.length > 0 && (
                        <div style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '16px' }}>
                            <h3 style={{ marginBottom: '12px', fontWeight: 'bold' }}>Available Students in Batch</h3>
                            <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {availableStudents.map(student => (
                                    <label key={student.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                                        <input 
                                            type="checkbox" 
                                            checked={selectedStudentIds.includes(student.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) setSelectedStudentIds([...selectedStudentIds, student.id])
                                                else setSelectedStudentIds(selectedStudentIds.filter(id => id !== student.id))
                                            }}
                                        />
                                        <span>{student.fullName} ({student.phone})</span>
                                    </label>
                                ))}
                            </div>
                            <button 
                                className="btn btn-primary" 
                                onClick={addStudentsToSport} 
                                style={{ marginTop: '16px' }}
                                disabled={selectedStudentIds.length === 0}
                            >
                                Add {selectedStudentIds.length} Selected Student(s)
                            </button>
                        </div>
                    )}
                </div>
            )}

            {selectedSport && sportStudents.length > 0 && (
                <div className="card" style={{ marginTop: '24px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Students Enrolled in this Sport</h2>
                    <div className="table-responsive">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Student Name</th>
                                    <th>Class</th>
                                    <th>Batch</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sportStudents.map(ss => (
                                    <tr key={ss.id}>
                                        <td>{ss.student?.fullName}</td>
                                        <td>{ss.student?.course?.name}</td>
                                        <td>{ss.student?.batch?.name}</td>
                                        <td>
                                            <span style={{ 
                                                padding: '4px 8px', 
                                                borderRadius: '4px', 
                                                fontSize: '12px', 
                                                fontWeight: 'bold',
                                                background: ss.status === 'ACTIVE' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                                color: ss.status === 'ACTIVE' ? '#10b981' : '#ef4444'
                                            }}>
                                                {ss.status}
                                            </span>
                                        </td>
                                        <td>
                                            <button 
                                                className={`btn ${ss.status === 'ACTIVE' ? 'btn-danger' : 'btn-primary'}`} 
                                                onClick={() => toggleStudentStatus(ss.id, ss.status)}
                                                style={{ padding: '4px 8px', fontSize: '12px' }}
                                            >
                                                {ss.status === 'ACTIVE' ? 'Block' : 'Unblock'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            {selectedSport && sportStudents.length === 0 && (
                <div style={{ marginTop: '24px', textAlign: 'center', padding: '40px', background: 'var(--surface-1)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '40px', marginBottom: '12px' }}>🏃‍♂️</div>
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>No students in this sport yet</h3>
                    <p style={{ color: 'var(--text-muted)' }}>Select a class and batch above to add students to this sport.</p>
                </div>
            )}
        </div>
    )
}
