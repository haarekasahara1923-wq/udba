'use client'
import { useState, useEffect, useRef } from 'react'
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

type SelectionMode = 'individual' | 'classwise'

export default function StudentsPage() {
    const { token, user, tenant } = useAuth()
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

    // courses and batches
    const [courses, setCourses] = useState<any[]>([])
    const [batches, setBatches] = useState<any[]>([])

    // Selection Bar States
    const [selectionMode, setSelectionMode] = useState<SelectionMode>('individual')
    const [individualSearch, setIndividualSearch] = useState('')
    const [individualResults, setIndividualResults] = useState<Student[]>([])
    const [individualLoading, setIndividualLoading] = useState(false)
    const [showIndividualDropdown, setShowIndividualDropdown] = useState(false)
    const individualRef = useRef<HTMLDivElement>(null)
    const [selectedCourseId, setSelectedCourseId] = useState('')
    const [selectedBatchId, setSelectedBatchId] = useState('')
    const [classwiseStudents, setClasswiseStudents] = useState<Student[]>([])
    const [classwiseLoading, setClasswiseLoading] = useState(false)
    const [classwiseLoaded, setClasswiseLoaded] = useState(false)
    const [pdfLoading, setPdfLoading] = useState(false)
    const printRef = useRef<HTMLDivElement>(null)

    const fetchStudents = async () => {
        if (!token) return
        const params = new URLSearchParams()
        if (search) params.set('search', search)
        const res = await fetch(`/api/students?${params}`, { headers: { Authorization: `Bearer ${token}` } })
        const data = await res.json()
        if (data.success) {
            setStudents(data.data)
            fetchSiblingStatus(data.data)
        }
        setLoading(false)
    }

    const fetchSiblingStatus = async (studentList: Student[]) => {
        if (!token || studentList.length === 0) return
        try {
            const siblingsRes = await fetch(`/api/students/siblings/all`, { headers: { Authorization: `Bearer ${token}` } })
            if (siblingsRes.ok) {
                const siblingsData = await siblingsRes.json()
                if (siblingsData.success) {
                    const siblingSet = new Set<string>(siblingsData.data)
                    setStudents(prev => prev.map(s => ({ ...s, hasSiblings: siblingSet.has(s.id) })))
                }
            }
        } catch (err) {}
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

    const searchIndividual = async (q: string) => {
        setIndividualSearch(q)
        if (q.trim().length < 2) { setIndividualResults([]); setShowIndividualDropdown(false); return }
        setIndividualLoading(true)
        try {
            const res = await fetch(`/api/students?search=${encodeURIComponent(q)}`, { headers: { Authorization: `Bearer ${token}` } })
            const data = await res.json()
            if (data.success) { setIndividualResults(data.data.slice(0, 10)); setShowIndividualDropdown(true) }
        } catch (err) {}
        setIndividualLoading(false)
    }

    const fetchClasswiseStudents = async (courseId: string, batchId: string) => {
        if (!token || !courseId) return
        setClasswiseLoading(true)
        setClasswiseLoaded(false)
        try {
            const params = new URLSearchParams()
            params.set('courseId', courseId)
            if (batchId) params.set('batchId', batchId)
            const res = await fetch(`/api/students?${params}`, { headers: { Authorization: `Bearer ${token}` } })
            const data = await res.json()
            if (data.success) { setClasswiseStudents(data.data); setClasswiseLoaded(true) }
        } catch (err) {}
        setClasswiseLoading(false)
    }

    useEffect(() => {
        if (selectionMode === 'classwise' && selectedCourseId) {
            fetchClasswiseStudents(selectedCourseId, selectedBatchId)
        }
    }, [selectedCourseId, selectedBatchId, selectionMode])

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (individualRef.current && !individualRef.current.contains(e.target as Node)) {
                setShowIndividualDropdown(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const downloadCSV = () => {
        const headers = ['Scholar No', 'Full Name', 'Father Name', 'Phone', 'Parent Phone', 'Class', 'Batch/Section', 'Total Fee', 'Paid Fee', 'Due Fee', 'Status', 'Admission Date']
        const rows = classwiseStudents.map(s => [
            s.scholarNo || '', s.fullName, s.fatherName, s.phone, s.parentPhone || '',
            s.courseName, s.batchName || '', s.totalFee, s.paidFee, s.totalFee - s.paidFee,
            s.status, s.admissionDate ? formatDate(s.admissionDate) : ''
        ])
        const csvContent = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `students_${courses.find(c => c.id === selectedCourseId)?.name || 'class'}_${batches.find(b => b.id === selectedBatchId)?.name || 'all'}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    const downloadExcel = () => {
        const headers = ['Scholar No', 'Full Name', 'Father Name', 'Phone', 'Parent Phone', 'Class', 'Batch/Section', 'Total Fee', 'Paid Fee', 'Due Fee', 'Status', 'Admission Date']
        const rows = classwiseStudents.map(s => [
            s.scholarNo || '', s.fullName, s.fatherName, s.phone, s.parentPhone || '',
            s.courseName, s.batchName || '', s.totalFee, s.paidFee, s.totalFee - s.paidFee,
            s.status, s.admissionDate ? formatDate(s.admissionDate) : ''
        ])
        const esc = (v: any) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        const xmlRows = [headers, ...rows].map(row =>
            `<Row>${row.map(cell => `<Cell><Data ss:Type="String">${esc(cell)}</Data></Cell>`).join('')}</Row>`
        ).join('')
        const xml = `<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Students"><Table>${xmlRows}</Table></Worksheet></Workbook>`
        const blob = new Blob([xml], { type: 'application/vnd.ms-excel' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `students_${courses.find(c => c.id === selectedCourseId)?.name || 'class'}_${batches.find(b => b.id === selectedBatchId)?.name || 'all'}.xls`
        a.click()
        URL.revokeObjectURL(url)
    }

    const downloadPDF = async () => {
        if (!classwiseStudents || classwiseStudents.length === 0) return
        setPdfLoading(true)
        try {
            const html2pdf = (await import('html2pdf.js')).default
            const cName = courses.find(c => c.id === selectedCourseId)?.name || 'Class'
            const bName = batches.find(b => b.id === selectedBatchId)?.name || 'All Sections'

            const esc = (str: any) => {
                if (str === null || str === undefined) return ''
                return String(str)
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
            }

            const schoolName = tenant?.name || 'UNIVERSAL DAY BOARDING ACADEMY'
            const schoolAddress = tenant?.address || ''
            const schoolPhone = tenant?.phone ? `Phone: ${tenant.phone}` : ''
            const schoolEmail = tenant?.email ? `Email: ${tenant.email}` : ''
            const printDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

            const totalStudents = classwiseStudents.length
            const activeStudents = classwiseStudents.filter(s => s.status === 'ACTIVE').length
            const duesStudents = classwiseStudents.filter(s => (s.totalFee || 0) > (s.paidFee || 0)).length
            const totalDueAmount = classwiseStudents.reduce((sum, s) => sum + Math.max(0, (s.totalFee || 0) - (s.paidFee || 0)), 0)

            const rowsHtml = classwiseStudents.map((s, idx) => {
                const totalFee = s.totalFee || 0
                const paidFee = s.paidFee || 0
                const dueFee = Math.max(0, totalFee - paidFee)
                const isEven = idx % 2 === 1
                const rowBg = isEven ? '#f8fafc' : '#ffffff'

                const statusBadgeBg = s.status === 'ACTIVE' ? '#dcfce7' : s.status === 'DROPOUT' ? '#fee2e2' : '#f1f5f9'
                const statusTextColor = s.status === 'ACTIVE' ? '#166534' : s.status === 'DROPOUT' ? '#991b1b' : '#475569'

                return `
                    <tr style="background-color: ${rowBg}; page-break-inside: avoid;">
                        <td style="padding: 7px 6px; border: 1px solid #cbd5e1; text-align: center; font-size: 11px; color: #475569;">${idx + 1}</td>
                        <td style="padding: 7px 6px; border: 1px solid #cbd5e1; text-align: center; font-weight: 700; font-size: 11px; color: #c2410c;">${esc(s.scholarNo || '—')}</td>
                        <td style="padding: 7px 8px; border: 1px solid #cbd5e1; text-align: left;">
                            <div style="font-weight: 700; font-size: 12px; color: #0f172a; line-height: 1.3;">${esc(s.fullName || '—')}</div>
                            ${s.studentId ? `<div style="font-size: 10px; color: #64748b;">ID: ${esc(s.studentId)}</div>` : ''}
                        </td>
                        <td style="padding: 7px 8px; border: 1px solid #cbd5e1; text-align: left; font-size: 12px; color: #1e293b; font-weight: 600;">
                            ${esc(s.fatherName || '—')}
                        </td>
                        <td style="padding: 7px 8px; border: 1px solid #cbd5e1; text-align: left; font-size: 11px; color: #334155;">
                            <div>${esc(s.phone || '—')}</div>
                            ${s.parentPhone ? `<div style="font-size: 10px; color: #64748b;">P: ${esc(s.parentPhone)}</div>` : ''}
                        </td>
                        <td style="padding: 7px 8px; border: 1px solid #cbd5e1; text-align: left; font-size: 11px; color: #1e293b;">
                            <div style="font-weight: 600;">${esc(s.courseName || cName)}</div>
                            <div style="font-size: 10px; color: #64748b;">${esc(s.batchName || bName)}</div>
                        </td>
                        <td style="padding: 7px 8px; border: 1px solid #cbd5e1; text-align: right; font-size: 11px;">
                            <div style="color: #334155; font-weight: 600;">₹${paidFee.toLocaleString('en-IN')} / ₹${totalFee.toLocaleString('en-IN')}</div>
                            ${dueFee > 0 
                                ? `<div style="font-weight: 700; color: #dc2626; font-size: 10px;">Due: ₹${dueFee.toLocaleString('en-IN')}</div>`
                                : `<div style="font-weight: 700; color: #16a34a; font-size: 10px;">Fully Paid</div>`
                            }
                        </td>
                        <td style="padding: 7px 6px; border: 1px solid #cbd5e1; text-align: center;">
                            <span style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 700; background-color: ${statusBadgeBg}; color: ${statusTextColor};">
                                ${esc(s.status || 'ACTIVE')}
                            </span>
                        </td>
                        <td style="padding: 7px 6px; border: 1px solid #cbd5e1; text-align: center; font-size: 11px; color: #475569;">
                            ${s.admissionDate ? esc(formatDate(s.admissionDate)) : '—'}
                        </td>
                    </tr>
                `
            }).join('')

            const container = document.createElement('div')
            container.id = 'classwise-pdf-export'
            container.style.position = 'fixed'
            container.style.top = '0'
            container.style.left = '0'
            container.style.width = '1120px'
            container.style.zIndex = '-99999'
            container.style.background = '#ffffff'
            container.style.color = '#0f172a'
            container.style.fontFamily = "'Segoe UI', Arial, sans-serif"
            container.style.padding = '24px 28px'
            container.style.boxSizing = 'border-box'

            container.innerHTML = `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #ffffff; color: #0f172a;">
                    <!-- School Header -->
                    <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px;">
                        <div style="flex: 1;">
                            <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: 0.5px; text-transform: uppercase;">
                                ${esc(schoolName)}
                            </h1>
                            <div style="font-size: 11px; color: #475569; margin-top: 3px;">
                                ${esc(schoolAddress)}${schoolAddress && (schoolPhone || schoolEmail) ? ' &bull; ' : ''}${esc(schoolPhone)} ${schoolEmail ? `&bull; ${esc(schoolEmail)}` : ''}
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <div style="display: inline-block; background: #0f172a; color: #ffffff; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px;">
                                Student Class List
                            </div>
                            <div style="font-size: 10px; color: #64748b; margin-top: 4px;">Date: ${esc(printDate)}</div>
                        </div>
                    </div>

                    <!-- Filter / Class Banner -->
                    <div style="display: flex; align-items: center; justify-content: space-between; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 14px; margin-bottom: 14px;">
                        <div>
                            <span style="font-size: 12px; font-weight: 600; color: #475569;">Class: </span>
                            <span style="font-size: 14px; font-weight: 800; color: #0f172a;">${esc(cName)}</span>
                            <span style="margin: 0 8px; color: #94a3b8;">|</span>
                            <span style="font-size: 12px; font-weight: 600; color: #475569;">Batch / Section: </span>
                            <span style="font-size: 14px; font-weight: 800; color: #0f172a;">${esc(bName)}</span>
                        </div>
                        <div style="font-size: 12px; font-weight: 700; color: #1e40af;">
                            Total Records: ${totalStudents}
                        </div>
                    </div>

                    <!-- Students Table -->
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
                        <thead>
                            <tr style="background: #0f172a; color: #ffffff;">
                                <th style="padding: 8px 6px; border: 1px solid #0f172a; font-size: 11px; font-weight: 700; text-align: center; width: 35px;">#</th>
                                <th style="padding: 8px 6px; border: 1px solid #0f172a; font-size: 11px; font-weight: 700; text-align: center; width: 85px;">Scholar No</th>
                                <th style="padding: 8px 8px; border: 1px solid #0f172a; font-size: 11px; font-weight: 700; text-align: left; width: 180px;">Student Name</th>
                                <th style="padding: 8px 8px; border: 1px solid #0f172a; font-size: 11px; font-weight: 700; text-align: left; width: 150px;">Father's Name</th>
                                <th style="padding: 8px 8px; border: 1px solid #0f172a; font-size: 11px; font-weight: 700; text-align: left; width: 110px;">Contact</th>
                                <th style="padding: 8px 8px; border: 1px solid #0f172a; font-size: 11px; font-weight: 700; text-align: left; width: 110px;">Class / Section</th>
                                <th style="padding: 8px 8px; border: 1px solid #0f172a; font-size: 11px; font-weight: 700; text-align: right; width: 115px;">Fee (Paid / Total)</th>
                                <th style="padding: 8px 6px; border: 1px solid #0f172a; font-size: 11px; font-weight: 700; text-align: center; width: 75px;">Status</th>
                                <th style="padding: 8px 6px; border: 1px solid #0f172a; font-size: 11px; font-weight: 700; text-align: center; width: 80px;">Admission</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHtml}
                        </tbody>
                    </table>

                    <!-- Summary Cards -->
                    <div style="display: flex; gap: 12px; margin-top: 14px;">
                        <div style="flex: 1; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 12px; background: #f8fafc; text-align: center;">
                            <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">Total Students</div>
                            <div style="font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 2px;">${totalStudents}</div>
                        </div>
                        <div style="flex: 1; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 12px; background: #f8fafc; text-align: center;">
                            <div style="font-size: 10px; font-weight: 700; color: #166534; text-transform: uppercase;">Active Students</div>
                            <div style="font-size: 18px; font-weight: 800; color: #166534; margin-top: 2px;">${activeStudents}</div>
                        </div>
                        <div style="flex: 1; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 12px; background: #f8fafc; text-align: center;">
                            <div style="font-size: 10px; font-weight: 700; color: #b45309; text-transform: uppercase;">Students with Dues</div>
                            <div style="font-size: 18px; font-weight: 800; color: #b45309; margin-top: 2px;">${duesStudents}</div>
                        </div>
                        <div style="flex: 1; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 12px; background: #f8fafc; text-align: center;">
                            <div style="font-size: 10px; font-weight: 700; color: #b91c1c; text-transform: uppercase;">Total Dues Amount</div>
                            <div style="font-size: 18px; font-weight: 800; color: #b91c1c; margin-top: 2px;">₹${totalDueAmount.toLocaleString('en-IN')}</div>
                        </div>
                    </div>

                    <!-- Footer Note -->
                    <div style="margin-top: 14px; padding-top: 8px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 9px; color: #94a3b8;">
                        <span>System Generated Report &bull; ${esc(schoolName)}</span>
                        <span>Generated on ${esc(printDate)}</span>
                    </div>
                </div>
            `

            document.body.appendChild(container)

            const opt = {
                margin: [8, 8, 8, 8] as [number, number, number, number],
                filename: `students_${cName.replace(/\s+/g, '_')}_${bName.replace(/\s+/g, '_')}.pdf`,
                image: { type: 'jpeg' as const, quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, logging: false },
                jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'landscape' as const },
                pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
            }

            await html2pdf().set(opt).from(container).save()
            if (container.parentNode) {
                container.parentNode.removeChild(container)
            }
        } catch (err) {
            console.error('PDF generation error:', err)
            alert('PDF generation failed. Please try CSV or Excel download.')
        } finally {
            setPdfLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this student?')) return
        setActionLoading(true)
        try {
            const res = await fetch(`/api/students?id=${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
            const data = await res.json()
            if (data.success) { alert('Student deleted successfully'); fetchStudents() }
            else alert(data.error || 'Failed to delete student')
        } catch (err) { alert('Error deleting student') }
        setActionLoading(false)
    }

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        setActionLoading(true)
        try {
            const res = await fetch('/api/students', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(editForm)
            })
            const data = await res.json()
            if (data.success) { alert('Student updated successfully'); setIsEditing(false); setSelectedStudent(data.data); fetchStudents() }
            else alert(data.error || 'Failed to update student')
        } catch (err) { alert('Error updating student') }
        setActionLoading(false)
    }

    const toggleBlock = async (student: Student) => {
        const newStatus = student.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
        if (!confirm(`Are you sure you want to ${newStatus === 'ACTIVE' ? 'unblock' : 'block'} this student?`)) return
        setActionLoading(true)
        try {
            const res = await fetch('/api/students', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ id: student.id, status: newStatus })
            })
            const data = await res.json()
            if (data.success) {
                alert(`Student ${newStatus === 'ACTIVE' ? 'unblocked' : 'blocked'} successfully`)
                if (selectedStudent?.id === student.id) setSelectedStudent(data.data)
                fetchStudents()
            }
        } catch (err) { alert('Error updating status') }
        setActionLoading(false)
    }

    const loadCurrentSiblings = async (studentId: string) => {
        if (!token) return
        setSiblingsLoading(true)
        try {
            const res = await fetch(`/api/students/siblings?studentId=${studentId}`, { headers: { Authorization: `Bearer ${token}` } })
            const data = await res.json()
            if (data.success) setCurrentSiblings(data.data)
        } catch (err) {}
        setSiblingsLoading(false)
    }

    const searchSiblings = async (q: string) => {
        if (!token || q.trim().length < 2) { setSiblingSearchResults([]); return }
        setSiblingSearchLoading(true)
        try {
            const res = await fetch(`/api/students/siblings?studentId=${selectedStudent?.id}&search=${encodeURIComponent(q)}`, { headers: { Authorization: `Bearer ${token}` } })
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
                setSiblingSearch(''); setSiblingSearchResults([])
                loadCurrentSiblings(selectedStudent.id); fetchStudents()
            } else alert(data.error || 'Failed to add sibling')
        } catch (err) { alert('Error adding sibling') }
        setSiblingActionLoading(false)
    }

    const removeSibling = async (siblingId: string) => {
        if (!token || !selectedStudent) return
        if (!confirm('Remove this sibling relationship?')) return
        setSiblingActionLoading(true)
        try {
            const res = await fetch(`/api/students/siblings?studentId=${selectedStudent.id}&siblingId=${siblingId}`, {
                method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
            })
            const data = await res.json()
            if (data.success) { loadCurrentSiblings(selectedStudent.id); fetchStudents() }
            else alert(data.error || 'Failed to remove sibling')
        } catch (err) { alert('Error removing sibling') }
        setSiblingActionLoading(false)
    }

    const openSiblingModal = () => {
        setSiblingSearch(''); setSiblingSearchResults([])
        if (selectedStudent) loadCurrentSiblings(selectedStudent.id)
        setShowSiblingModal(true)
    }

    useEffect(() => { fetchStudents() }, [token, search])
    useEffect(() => { fetchCoursesAndBatches() }, [token])

    const filteredBatches = batches.filter(b => !editForm.courseId || b.courseId === editForm.courseId)
    const classwiseBatches = batches.filter(b => b.courseId === selectedCourseId)
    const selectedCourseName = courses.find(c => c.id === selectedCourseId)?.name || ''
    const selectedBatchName = batches.find(b => b.id === selectedBatchId)?.name || 'All Sections'

    const modeBtnStyle = (active: boolean, color: string): React.CSSProperties => ({
        padding: '7px 18px', borderRadius: '20px',
        border: active ? `2px solid ${color}` : '1.5px solid var(--border)',
        background: active ? `${color}20` : 'var(--surface)',
        color: active ? color : 'var(--text-secondary)',
        fontWeight: '700', fontSize: '13px', cursor: 'pointer', transition: 'all 0.18s',
    })

    const dlBtnStyle = (color: string, border: string, disabled: boolean): React.CSSProperties => ({
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '8px 16px', borderRadius: '10px',
        border: `1.5px solid ${border}`,
        background: `${color}15`, color,
        fontWeight: '700', fontSize: '13px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1, transition: 'all 0.15s',
    })

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">&#x1F468;&#x200D;&#x1F393; Students</h1>
                    <p className="page-subtitle">{students.length} students registered</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <Link href="/dashboard/students/add" className="btn btn-primary">&#x2795; Add Student</Link>
                </div>
            </div>

            {/* Smart Selection Bar */}
            <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
                {/* Mode Toggle */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)', marginRight: '4px' }}>Select By:</span>
                    <button
                        onClick={() => { setSelectionMode('individual'); setClasswiseStudents([]); setClasswiseLoaded(false); }}
                        style={modeBtnStyle(selectionMode === 'individual', '#6366f1')}
                    >
                        &#x1F464; Student Name / Scholar No.
                    </button>
                    <button
                        onClick={() => { setSelectionMode('classwise'); setIndividualSearch(''); setShowIndividualDropdown(false); }}
                        style={modeBtnStyle(selectionMode === 'classwise', '#10b981')}
                    >
                        &#x1F3EB; Class-wise Selection
                    </button>
                </div>

                {/* Individual Student Search */}
                {selectionMode === 'individual' && (
                    <div ref={individualRef} style={{ position: 'relative', maxWidth: '520px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <div style={{ flex: 1, position: 'relative' }}>
                                <input
                                    className="input"
                                    style={{ width: '100%' }}
                                    placeholder="&#x1F50D; Search student by name or scholar no..."
                                    value={individualSearch}
                                    onChange={e => searchIndividual(e.target.value)}
                                    onFocus={() => individualResults.length > 0 && setShowIndividualDropdown(true)}
                                    autoComplete="off"
                                />
                                {individualLoading && (
                                    <div className="spinner" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px' }} />
                                )}
                            </div>
                            {individualSearch && (
                                <button className="btn btn-secondary" onClick={() => { setIndividualSearch(''); setIndividualResults([]); setShowIndividualDropdown(false); setSelectedStudent(null); }}>
                                    &#x2715; Clear
                                </button>
                            )}
                        </div>
                        {/* Dropdown Results */}
                        {showIndividualDropdown && individualResults.length > 0 && (
                            <div style={{
                                position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
                                background: 'var(--surface)', border: '1.5px solid var(--border)',
                                borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                                zIndex: 200, maxHeight: '320px', overflowY: 'auto'
                            }}>
                                {individualResults.map((s, idx) => (
                                    <div
                                        key={s.id}
                                        onClick={() => { setSelectedStudent(s); setIndividualSearch(s.fullName); setShowIndividualDropdown(false); }}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '12px',
                                            padding: '12px 16px', cursor: 'pointer',
                                            borderBottom: idx < individualResults.length - 1 ? '1px solid var(--border)' : 'none',
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                                        onMouseLeave={e => (e.currentTarget.style.background = '')}
                                    >
                                        <div className="avatar" style={{ width: '36px', height: '36px', fontSize: '15px', flexShrink: 0 }}>
                                            {s.fullName.charAt(0)}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: '600', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.fullName}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                Scholar: <strong style={{ color: '#f97316' }}>{s.scholarNo || '—'}</strong>
                                                {' '}• {s.courseName}{s.batchName ? ` • ${s.batchName}` : ''}
                                            </div>
                                        </div>
                                        <span className={`badge ${statusColors[s.status] || 'badge-gray'}`} style={{ fontSize: '10px' }}>{s.status}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        {showIndividualDropdown && individualSearch.length >= 2 && individualResults.length === 0 && !individualLoading && (
                            <div style={{
                                position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
                                background: 'var(--surface)', border: '1.5px solid var(--border)',
                                borderRadius: '12px', padding: '16px', textAlign: 'center',
                                color: 'var(--text-muted)', fontSize: '13px', zIndex: 200
                            }}>
                                No students found for &quot;{individualSearch}&quot;
                            </div>
                        )}
                    </div>
                )}

                {/* Classwise Dropdowns */}
                {selectionMode === 'classwise' && (
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                        <div style={{ minWidth: '200px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                Select Class *
                            </label>
                            <select
                                className="input"
                                value={selectedCourseId}
                                onChange={e => { setSelectedCourseId(e.target.value); setSelectedBatchId(''); setClasswiseStudents([]); setClasswiseLoaded(false); }}
                            >
                                <option value="">-- Choose Class --</option>
                                {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        {selectedCourseId && (
                            <div style={{ minWidth: '200px' }}>
                                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                    Batch / Section <span style={{ fontWeight: '400', textTransform: 'none' }}>(Optional)</span>
                                </label>
                                <select className="input" value={selectedBatchId} onChange={e => setSelectedBatchId(e.target.value)}>
                                    <option value="">-- All Sections --</option>
                                    {classwiseBatches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                            </div>
                        )}
                        {selectedCourseId && (
                            <button
                                className="btn btn-primary"
                                onClick={() => fetchClasswiseStudents(selectedCourseId, selectedBatchId)}
                                disabled={classwiseLoading}
                            >
                                {classwiseLoading ? '&#x23F3; Loading...' : '&#x1F50D; Get Students'}
                            </button>
                        )}
                        {classwiseLoaded && (
                            <button className="btn btn-secondary" onClick={() => { setSelectedCourseId(''); setSelectedBatchId(''); setClasswiseStudents([]); setClasswiseLoaded(false); }}>
                                &#x1F504; Reset
                            </button>
                        )}
                    </div>
                )}

                {/* Standard search (individual mode) */}
                {selectionMode === 'individual' && (
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '12px' }}>
                        <div style={{ flex: 1, minWidth: '200px', display: 'flex', gap: '8px' }}>
                            <input
                                className="input"
                                style={{ flex: 1 }}
                                placeholder="Or search all students by name / scholar no..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && fetchStudents()}
                            />
                            <button className="btn btn-primary" onClick={fetchStudents} style={{ whiteSpace: 'nowrap' }}>&#x1F50D; Search</button>
                        </div>
                        <button className="btn btn-secondary" onClick={() => { setSearch(''); setTimeout(fetchStudents, 0); }}>&#x1F504; Refresh</button>
                    </div>
                )}
            </div>

            {/* Classwise Student List */}
            {selectionMode === 'classwise' && classwiseLoaded && (
                <div className="card" style={{ marginBottom: '20px', padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                            <h2 style={{ fontWeight: '800', fontSize: '18px', color: 'var(--text-primary)', marginBottom: '4px' }}>
                                🏫 {selectedCourseName} — {selectedBatchName}
                            </h2>
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                                {classwiseStudents.length} student{classwiseStudents.length !== 1 ? 's' : ''} found
                            </p>
                        </div>
                        {/* Download Buttons */}
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <button onClick={downloadCSV} disabled={classwiseStudents.length === 0} style={dlBtnStyle('#10b981', 'rgba(16,185,129,0.4)', classwiseStudents.length === 0)}>
                                📄 Download CSV
                            </button>
                            <button onClick={downloadExcel} disabled={classwiseStudents.length === 0} style={dlBtnStyle('#16a34a', 'rgba(34,197,94,0.4)', classwiseStudents.length === 0)}>
                                📊 Download Excel
                            </button>
                            <button onClick={downloadPDF} disabled={classwiseStudents.length === 0 || pdfLoading} style={dlBtnStyle('#ef4444', 'rgba(239,68,68,0.4)', classwiseStudents.length === 0 || pdfLoading)}>
                                {pdfLoading ? '⏳ Generating PDF...' : '🖨️ Download PDF'}
                            </button>
                        </div>
                    </div>
                    {classwiseLoading ? (
                        <div style={{ padding: '40px', textAlign: 'center' }}>
                            <div className="spinner" style={{ margin: '0 auto 12px', width: '32px', height: '32px' }} />
                            <p style={{ color: 'var(--text-muted)' }}>Loading students...</p>
                        </div>
                    ) : classwiseStudents.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center' }}>
                            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🏫</div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>No students found in this class/section.</p>
                        </div>
                    ) : (
                        <div ref={printRef}>
                            <div style={{ marginBottom: '12px', padding: '12px 16px', background: 'rgba(99,102,241,0.06)', borderRadius: '10px', border: '1px solid rgba(99,102,241,0.15)' }}>
                                <div style={{ fontWeight: '800', fontSize: '15px', color: 'var(--text-primary)' }}>
                                    Student List — {selectedCourseName} | {selectedBatchName}
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                    Total: {classwiseStudents.length} students • Generated: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </div>
                            </div>
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th style={{ color: '#f97316' }}>Scholar No.</th>
                                            <th>Student Name</th>
                                            <th>Father Name</th>
                                            <th>Phone</th>
                                            <th>Class / Section</th>
                                            <th>Fee Status</th>
                                            <th>Status</th>
                                            <th>Admission</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {classwiseStudents.map((s, idx) => {
                                            const owing = s.totalFee - s.paidFee
                                            const pct = s.totalFee > 0 ? Math.round((s.paidFee / s.totalFee) * 100) : 0
                                            return (
                                                <tr key={s.id}>
                                                    <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{idx + 1}</td>
                                                    <td>
                                                        <div style={{ display: 'inline-flex', background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.3)', color: '#f97316', fontWeight: '700', fontSize: '13px', borderRadius: '8px', padding: '4px 10px' }}>
                                                            {s.scholarNo || '—'}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                            <div className="avatar">{s.fullName.charAt(0)}</div>
                                                            <div>
                                                                <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)' }}>{s.fullName}</div>
                                                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.studentId}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{s.fatherName || '—'}</td>
                                                    <td>
                                                        <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{s.phone}</div>
                                                        {s.parentPhone && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>P: {s.parentPhone}</div>}
                                                    </td>
                                                    <td>
                                                        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{s.courseName}</div>
                                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.batchName || '—'}</div>
                                                    </td>
                                                    <td>
                                                        <div className="progress-bar" style={{ height: '4px', marginBottom: '4px' }}>
                                                            <div className="progress-fill" style={{ width: `${pct}%`, background: pct >= 100 ? '#10b981' : pct > 50 ? '#f59e0b' : '#ef4444' }} />
                                                        </div>
                                                        <div style={{ fontSize: '11px', color: owing > 0 ? '#f59e0b' : '#10b981', fontWeight: '600' }}>
                                                            {pct}% paid {owing > 0 ? `• Due: ${formatCurrency(owing)}` : '✓'}
                                                        </div>
                                                    </td>
                                                    <td><span className={`badge ${statusColors[s.status] || 'badge-gray'}`}>{s.status}</span></td>
                                                    <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{s.admissionDate ? formatDate(s.admissionDate) : '—'}</td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            {/* Summary Stats */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '16px' }}>
                                {[
                                    { label: 'Total Students', value: classwiseStudents.length, color: '#6366f1' },
                                    { label: 'Active', value: classwiseStudents.filter(s => s.status === 'ACTIVE').length, color: '#10b981' },
                                    { label: 'With Dues', value: classwiseStudents.filter(s => s.totalFee > s.paidFee).length, color: '#f59e0b' },
                                    { label: 'Dropout', value: classwiseStudents.filter(s => s.status === 'DROPOUT').length, color: '#ef4444' },
                                ].map(stat => (
                                    <div key={stat.label} style={{ padding: '12px', background: 'var(--surface-2)', borderRadius: '10px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '22px', fontWeight: '800', color: stat.color }}>{stat.value}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Stats (individual mode) */}
            {selectionMode === 'individual' && (
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
            )}

            {/* Main table (individual mode) */}
            {selectionMode === 'individual' && (
                <div className="card" style={{ padding: 0 }}>
                    <div className="table-container">
                        {loading ? (
                            <div style={{ padding: '40px', textAlign: 'center' }}>
                                <div className="spinner" style={{ margin: '0 auto 12px', width: '32px', height: '32px' }} />
                                <p style={{ color: 'var(--text-muted)' }}>Loading students...</p>
                            </div>
                        ) : students.length === 0 ? (
                            <div style={{ padding: '60px', textAlign: 'center' }}>
                                <div style={{ fontSize: '48px', marginBottom: '16px' }}>&#x1F468;&#x200D;&#x1F393;</div>
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
                                                    <div style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.3)', color: '#f97316', fontWeight: '700', fontSize: '13px', borderRadius: '8px', padding: '4px 10px', whiteSpace: 'nowrap', letterSpacing: '0.5px' }}>
                                                        {s.scholarNo || '—'}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <div className="avatar">{s.fullName.charAt(0)}</div>
                                                        <div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <span style={{ fontWeight: '600', fontSize: '14px' }}>{s.fullName}</span>
                                                                {s.hasSiblings && (
                                                                    <span title="Has siblings" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.4)', color: '#6366f1', fontSize: '11px', fontWeight: '800' }}>+</span>
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
                                                    <div className="progress-bar" style={{ height: '4px', marginBottom: '4px' }}>
                                                        <div className="progress-fill" style={{ width: `${pct}%`, background: pct >= 100 ? '#10b981' : pct > 50 ? '#f59e0b' : '#ef4444' }} />
                                                    </div>
                                                    <div style={{ fontSize: '11px', color: owing > 0 ? '#f59e0b' : '#10b981', fontWeight: '600' }}>
                                                        {pct}% paid {owing > 0 ? `&#x2022; Due: ${formatCurrency(owing)}` : '&#x2713;'}
                                                    </div>
                                                </td>
                                                <td><span className={`badge ${statusColors[s.status] || 'badge-gray'}`}>{s.status}</span></td>
                                                <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{s.admissionDate ? formatDate(s.admissionDate) : '-'}</td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: '6px' }}>
                                                        <button onClick={() => setSelectedStudent(s)} className="btn btn-secondary btn-sm" title="View">&#x1F441;&#xFE0F;</button>
                                                        {canEditOrDelete && (
                                                            <>
                                                                <button onClick={() => { setSelectedStudent(s); setEditForm({ ...s }); setIsEditing(true); }} className="btn btn-secondary btn-sm" title="Edit">&#x270F;&#xFE0F;</button>
                                                                <button onClick={() => toggleBlock(s)} className={`btn btn-sm ${s.status === 'ACTIVE' ? 'btn-secondary' : 'btn-success'}`} title={s.status === 'ACTIVE' ? 'Block' : 'Unblock'}>
                                                                    {s.status === 'ACTIVE' ? '&#x1F6AB;' : '&#x2705;'}
                                                                </button>
                                                                <button onClick={() => handleDelete(s.id)} className="btn btn-secondary btn-sm" style={{ color: '#ef4444' }} title="Delete">&#x1F5D1;&#xFE0F;</button>
                                                            </>
                                                        )}
                                                        <a href={`https://wa.me/${s.parentPhone?.replace(/\D/g, '') || s.phone?.replace(/\D/g, '')}`} target="_blank" className="btn btn-sm" style={{ background: '#25d366', color: 'white', textDecoration: 'none' }} title="WhatsApp">&#x1F4AC;</a>
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
            )}

            {/* Student Detail / Edit Modal */}
            {selectedStudent && (
                <div className="modal-overlay" onClick={() => { setSelectedStudent(null); setIsEditing(false); setShowSiblingModal(false); }}>
                    <div className="modal" style={{ maxWidth: isEditing ? '640px' : '500px' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div className="avatar" style={{ width: '48px', height: '48px', fontSize: '20px' }}>{selectedStudent.fullName.charAt(0)}</div>
                                <div>
                                    <h3 style={{ fontWeight: '700', fontSize: '18px' }}>{isEditing ? 'Edit Student' : selectedStudent.fullName}</h3>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{selectedStudent.studentId} {selectedStudent.scholarNo ? `&#x2022; Scholar: ${selectedStudent.scholarNo}` : ''}</p>
                                </div>
                            </div>
                            <button onClick={() => { setSelectedStudent(null); setIsEditing(false); setShowSiblingModal(false); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}>&#x2715;</button>
                        </div>
                        <div className="modal-body">
                            {isEditing ? (
                                <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <label className="label">Full Name</label>
                                            <input className="input" value={editForm.fullName || ''} onChange={e => setEditForm({ ...editForm, fullName: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="label">Scholar No. (Editable)</label>
                                            <input className="input" value={editForm.scholarNo || ''} onChange={e => setEditForm({ ...editForm, scholarNo: e.target.value })} />
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
                                        <button type="submit" className="btn btn-primary" disabled={actionLoading} style={{ flex: 1 }}>{actionLoading ? 'Saving...' : '&#x1F4BE; Save Changes'}</button>
                                        <button type="button" onClick={() => setIsEditing(false)} className="btn btn-secondary">Cancel</button>
                                    </div>
                                    {canEditOrDelete && (
                                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '4px' }}>
                                            <button type="button" onClick={openSiblingModal} className="btn btn-secondary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'rgba(99,102,241,0.08)', border: '1.5px dashed rgba(99,102,241,0.5)', color: '#6366f1', fontWeight: '700', fontSize: '14px', padding: '12px' }}>
                                                &#x1F468;&#x200D;&#x1F469;&#x200D;&#x1F467;&#x200D;&#x1F466; Manage Siblings
                                                {currentSiblings.length > 0 && <span style={{ background: '#6366f1', color: 'white', borderRadius: '999px', padding: '1px 7px', fontSize: '11px', fontWeight: '800' }}>{currentSiblings.length}</span>}
                                            </button>
                                        </div>
                                    )}
                                </form>
                            ) : (
                                <div className="grid-cols-2">
                                    {[
                                        ['&#x1F393; Scholar No.', selectedStudent.scholarNo || 'N/A'],
                                        ['&#x1F4F1; Phone', selectedStudent.phone],
                                        ['&#x1F468; Father', selectedStudent.fatherName || 'N/A'],
                                        ['&#x1F4E7; Email', selectedStudent.email || 'N/A'],
                                        ['&#x1F4DE; Parent Phone', selectedStudent.parentPhone || 'N/A'],
                                        ['&#x1F4DA; Class', selectedStudent.courseName],
                                        ['&#x1F550; Section', selectedStudent.batchName],
                                        ['&#x1F4B0; Total Fee', formatCurrency(selectedStudent.totalFee)],
                                        ['&#x2705; Paid', formatCurrency(selectedStudent.paidFee)],
                                        ['&#x26A0;&#xFE0F; Pending', formatCurrency(selectedStudent.totalFee - selectedStudent.paidFee)],
                                        ['&#x1F4C5; Admission', selectedStudent.admissionDate ? formatDate(selectedStudent.admissionDate) : 'N/A'],
                                        ['&#x1F6A9; Status', selectedStudent.status],
                                        ['&#x1FAA6; Aadhaar No.', selectedStudent.aadhaarNo || 'N/A'],
                                        ['&#x1F194; PEN ID', selectedStudent.penId || 'N/A'],
                                        ['&#x1F194; APAR ID', selectedStudent.aparId || 'N/A'],
                                        ['&#x1F194; Samagra ID', selectedStudent.samagraId || 'N/A'],
                                    ].map(([label, value]) => (
                                        <div key={label} style={{ padding: '10px', background: 'var(--surface-2)', borderRadius: '8px' }}>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }} dangerouslySetInnerHTML={{ __html: label }} />
                                            <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{value}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        {!isEditing && (
                            <div className="modal-footer">
                                {canEditOrDelete && <button onClick={() => { setEditForm({ ...selectedStudent }); setIsEditing(true); }} className="btn btn-secondary">&#x270F;&#xFE0F; Edit Details</button>}
                                <a href={`https://wa.me/${(selectedStudent.parentPhone || selectedStudent.phone)?.replace(/\D/g, '')}?text=Dear Parent, This is regarding ${selectedStudent.fullName} from our school institute.`} target="_blank" className="btn btn-success">&#x1F4AC; WhatsApp Parent</a>
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
                                <h3 style={{ fontWeight: '700', fontSize: '18px' }}>&#x1F468;&#x200D;&#x1F469;&#x200D;&#x1F467;&#x200D;&#x1F466; Manage Siblings</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{selectedStudent.fullName} &#x2022; Max 3 siblings allowed</p>
                            </div>
                            <button onClick={() => setShowSiblingModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}>&#x2715;</button>
                        </div>
                        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.5px' }}>
                                    Current Siblings ({currentSiblings.length}/3)
                                </div>
                                {siblingsLoading ? (
                                    <div style={{ textAlign: 'center', padding: '20px' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
                                ) : currentSiblings.length === 0 ? (
                                    <div style={{ padding: '16px', background: 'var(--surface-2)', borderRadius: '10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>No siblings added yet</div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {currentSiblings.map(sib => (
                                            <div key={sib.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '10px' }}>
                                                <div>
                                                    <div style={{ fontWeight: '600', fontSize: '14px' }}>{sib.fullName}</div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Scholar: {sib.scholarNo || 'N/A'} &#x2022; {sib.courseName || 'N/A'} - {sib.batchName || 'N/A'}</div>
                                                </div>
                                                <button onClick={() => removeSibling(sib.id)} disabled={siblingActionLoading} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: '8px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>
                                                    &#x2715; Remove
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {currentSiblings.length < 3 && (
                                <div>
                                    <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.5px' }}>Add Sibling</div>
                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                                        <input className="input" style={{ flex: 1 }} placeholder="Search by name or scholar no..." value={siblingSearch} onChange={e => { setSiblingSearch(e.target.value); searchSiblings(e.target.value); }} />
                                        {siblingSearchLoading && <div className="spinner" style={{ width: '20px', height: '20px', alignSelf: 'center' }} />}
                                    </div>
                                    {siblingSearchResults.length > 0 && (
                                        <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            {siblingSearchResults.filter(r => r.id !== selectedStudent.id && !currentSiblings.find(s => s.id === r.id)).map(result => (
                                                <div key={result.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '10px' }}>
                                                    <div>
                                                        <div style={{ fontWeight: '600', fontSize: '14px' }}>{result.fullName}</div>
                                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Scholar: {result.scholarNo || 'N/A'} &#x2022; {result.courseName || 'N/A'}{result.batchName ? ` - ${result.batchName}` : ''}</div>
                                                    </div>
                                                    <button onClick={() => addSibling(result.id)} disabled={siblingActionLoading} className="btn btn-primary" style={{ padding: '5px 12px', fontSize: '12px', fontWeight: '700' }}>+ Add</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {siblingSearch.length >= 2 && siblingSearchResults.filter(r => r.id !== selectedStudent.id && !currentSiblings.find(s => s.id === r.id)).length === 0 && !siblingSearchLoading && (
                                        <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)', fontSize: '13px' }}>No students found for &quot;{siblingSearch}&quot;</div>
                                    )}
                                </div>
                            )}
                            {currentSiblings.length >= 3 && (
                                <div style={{ padding: '12px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '10px', color: '#d97706', fontSize: '13px', fontWeight: '600', textAlign: 'center' }}>
                                    &#x26A0;&#xFE0F; Maximum 3 siblings limit reached. Remove a sibling to add another.
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
