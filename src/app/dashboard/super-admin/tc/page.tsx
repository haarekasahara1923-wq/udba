'use client'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { formatDate } from '@/lib/utils'

export default function TCGenerationPage() {
    const { token, tenant } = useAuth()
    const [courses, setCourses] = useState<any[]>([])
    const [batches, setBatches] = useState<any[]>([])
    const [students, setStudents] = useState<any[]>([])
    const [selectedCourse, setSelectedCourse] = useState('')
    const [selectedBatch, setSelectedBatch] = useState('')
    const [selectedSubjectGroup, setSelectedSubjectGroup] = useState('')
    const [selectedStudentId, setSelectedStudentId] = useState('')
    const [studentData, setStudentData] = useState<any>(null)

    const [form, setForm] = useState({
        attendance: 'Whole',
        accountsClearance: 'Clear',
        reasonForLeaving: 'Parents Request',
        conduct: 'Good',
        tcIssueDate: new Date().toISOString().split('T')[0],
        tcNumber: `TC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
    })

    const tcRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!token) return
        Promise.all([
            fetch('/api/courses', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
            fetch('/api/batches', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
            fetch('/api/students', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
        ]).then(([cRes, bRes, sRes]) => {
            if (cRes.success) setCourses(cRes.data)
            if (bRes.success) setBatches(bRes.data)
            if (sRes.success) setStudents(sRes.data)
        })
    }, [token])

    const isHighSchool = ['Class 11', 'Class 12'].includes(courses.find(c => c.id === selectedCourse)?.name)

    const filteredStudents = students.filter(s => {
        if (selectedCourse && s.courseId !== selectedCourse) return false
        if (selectedBatch && s.batchId !== selectedBatch) return false
        if (isHighSchool && selectedSubjectGroup && s.subjectGroup !== selectedSubjectGroup) return false
        return true
    })

    useEffect(() => {
        if (selectedStudentId) {
            const student = students.find(s => s.id === selectedStudentId)
            setStudentData(student)
        } else {
            setStudentData(null)
        }
    }, [selectedStudentId, students])

    const downloadPDF = async () => {
        if (!tcRef.current || !studentData) return

        // Save TC to Backend first
        try {
            const res = await fetch('/api/super-admin/tc', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    studentId: studentData.id,
                    studentName: studentData.fullName,
                    fatherName: studentData.fatherName || 'Unknown',
                    scholarNo: studentData.scholarNo || studentData.studentId
                })
            });
            const data = await res.json();
            if (!res.ok) {
                alert(data.error || 'Failed to generate TC');
                return;
            }
        } catch (err) {
            alert('Failed to connect to server');
            return;
        }

        try {
            const html2pdf = (await import('html2pdf.js')).default;
            const element = tcRef.current;
            const opt = {
                margin: 10,
                filename: `TC_${studentData?.fullName || 'Student'}.pdf`,
                image: { type: 'jpeg' as const, quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm' as const, format: 'a4', orientation: 'portrait' as const }
            };
            html2pdf().set(opt).from(element).save();
        } catch (err) {
            console.error('PDF export failed:', err)
        }
    }

    const downloadDocx = async () => {
        if (!tcRef.current || !studentData) return

        // Save TC to Backend first
        try {
            const res = await fetch('/api/super-admin/tc', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    studentId: studentData.id,
                    studentName: studentData.fullName,
                    fatherName: studentData.fatherName || 'Unknown',
                    scholarNo: studentData.scholarNo || studentData.studentId
                })
            });
            const data = await res.json();
            if (!res.ok) {
                alert(data.error || 'Failed to generate TC');
                return;
            }
        } catch (err) {
            alert('Failed to connect to server');
            return;
        }

        const preHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>Transfer Certificate</title>
        <style>
            body { font-family: 'Times New Roman', Times, serif; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            td { padding: 8px; border: 1px solid #ddd; }
            .header-text { text-align: center; }
        </style>
        </head><body>`;
        const postHtml = "</body></html>";
        const html = preHtml + tcRef.current.innerHTML + postHtml;

        const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
        const downloadLink = document.createElement("a");
        downloadLink.download = `TC_${studentData?.fullName || 'Student'}.doc`;
        downloadLink.href = URL.createObjectURL(blob);
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    }

    return (
        <div className="card fade-in">
            <h2 className="section-title">📜 Generate Transfer Certificate (TC)</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div>
                    <label className="label">Class</label>
                    <select className="input" value={selectedCourse} onChange={e => { setSelectedCourse(e.target.value); setSelectedStudentId('') }}>
                        <option value="">All Classes</option>
                        {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="label">Batch</label>
                    <select className="input" value={selectedBatch} onChange={e => { setSelectedBatch(e.target.value); setSelectedStudentId('') }}>
                        <option value="">All Batches</option>
                        {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                </div>
                {isHighSchool && (
                    <div>
                        <label className="label">Subject Group</label>
                        <select className="input" value={selectedSubjectGroup} onChange={e => { setSelectedSubjectGroup(e.target.value); setSelectedStudentId('') }}>
                            <option value="">All Groups</option>
                            <option value="Science Bio">Science Bio</option>
                            <option value="Science Maths">Science Maths</option>
                            <option value="Arts">Arts</option>
                            <option value="Commerce">Commerce</option>
                        </select>
                    </div>
                )}
                <div>
                    <label className="label">Select Student</label>
                    <select className="input" value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)}>
                        <option value="">-- Choose Student --</option>
                        {filteredStudents.map(s => <option key={s.id} value={s.id}>{s.fullName} ({s.scholarNo || s.studentId})</option>)}
                    </select>
                </div>
            </div>

            {studentData && (
                <div style={{ background: 'var(--surface-2)', padding: '20px', borderRadius: '12px', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>TC Details</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                        <div>
                            <label className="label">Attendance</label>
                            <select className="input" value={form.attendance} onChange={e => setForm({ ...form, attendance: e.target.value })}>
                                <option value="Whole">Whole</option>
                                <option value="Compulsory">Compulsory</option>
                                <option value="Short">Short</option>
                            </select>
                        </div>
                        <div>
                            <label className="label">Accounts Clearance</label>
                            <select className="input" value={form.accountsClearance} onChange={e => setForm({ ...form, accountsClearance: e.target.value })}>
                                <option value="Clear">Clear</option>
                                <option value="Dues">Dues</option>
                            </select>
                        </div>
                        <div>
                            <label className="label">Conduct</label>
                            <select className="input" value={form.conduct} onChange={e => setForm({ ...form, conduct: e.target.value })}>
                                <option value="Good">Good</option>
                                <option value="Satisfactory">Satisfactory</option>
                                <option value="Poor">Poor</option>
                            </select>
                        </div>
                        <div>
                            <label className="label">Reason for leaving</label>
                            <input className="input" type="text" value={form.reasonForLeaving} onChange={e => setForm({ ...form, reasonForLeaving: e.target.value })} />
                        </div>
                        <div>
                            <label className="label">TC Issue Date</label>
                            <input className="input" type="date" value={form.tcIssueDate} onChange={e => setForm({ ...form, tcIssueDate: e.target.value })} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                        <button onClick={downloadPDF} className="btn btn-primary">📄 Download PDF</button>
                        <button onClick={downloadDocx} className="btn btn-secondary" style={{ background: '#2b579a', color: 'white' }}>📝 Download DOCX</button>
                    </div>
                </div>
            )}

            {/* Hidden / Printable TC Template */}
            {studentData && (
                <div style={{ display: 'none' }}>
                    <div ref={tcRef} style={{
                        padding: '40px',
                        background: 'white',
                        color: 'black',
                        fontFamily: 'serif',
                        maxWidth: '800px',
                        margin: '0 auto',
                        position: 'relative'
                    }}>
                        {/* School Header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '3px solid #1e293b', paddingBottom: '20px', marginBottom: '30px' }}>
                            {tenant?.logo ? (
                                <img src={tenant.logo} alt="School Logo" style={{ width: '100px', height: '100px', objectFit: 'contain' }} crossOrigin="anonymous" />
                            ) : <div style={{ width: '100px' }} />}
                            
                            <div style={{ flex: 1, textAlign: 'center', padding: '0 20px' }}>
                                <h1 style={{ margin: '0 0 10px 0', fontSize: '28px', color: '#1e293b', textTransform: 'uppercase' }}>{tenant?.name || 'UNIVERSAL DAY BOARDING ACADEMY'}</h1>
                                <p style={{ margin: '0 0 5px 0', fontSize: '14px' }}>{tenant?.address || 'School Address Not Provided'}</p>
                                <p style={{ margin: 0, fontSize: '14px' }}>Phone: {tenant?.phone || 'N/A'} | Email: {tenant?.email || 'N/A'}</p>
                                <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}><strong>School Code:</strong> {tenant?.schoolCode || '___'} &nbsp;&nbsp;&nbsp; <strong>DISE Code:</strong> {tenant?.diseCode || '___'}</p>
                            </div>

                            {studentData.photo ? (
                                <img src={studentData.photo} alt="Student" style={{ width: '100px', height: '100px', objectFit: 'cover', border: '1px solid #ccc' }} crossOrigin="anonymous" />
                            ) : (
                                <div style={{ width: '100px', height: '100px', border: '1px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#666' }}>Photo</div>
                            )}
                        </div>

                        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                            <h2 style={{ fontSize: '22px', textDecoration: 'underline', margin: 0 }}>TRANSFER CERTIFICATE</h2>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', fontWeight: 'bold' }}>
                            <div>TC No: {form.tcNumber}</div>
                            <div>Scholar No: {studentData.scholarNo || studentData.studentId}</div>
                        </div>

                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '15px' }}>
                            <tbody>
                                {[
                                    ['1. Name of Pupil', studentData.fullName],
                                    ['2. Father\'s / Guardian\'s Name', studentData.fatherName || '-'],
                                    ['3. Mother\'s Name', studentData.motherName || '-'],
                                    ['4. Nationality', 'Indian'],
                                    ['5. Caste / Category', studentData.caste || '-'],
                                    ['6. Date of First Admission in School with Class', `${studentData.firstAdmissionDate ? formatDate(studentData.firstAdmissionDate) : '-'} (Class: ${studentData.firstAdmissionClass || '-'})`],
                                    ['7. Date of Birth (in Christian Era)', `${studentData.dob ? formatDate(studentData.dob) : '-'}`],
                                    ['8. Date of Birth (in words)', studentData.dobInWords || '-'],
                                    ['9. Current Class & Admission Date', `${studentData.courseName} (${studentData.admissionDate ? formatDate(studentData.admissionDate) : '-'})`],
                                    ['10. Subjects Studied', studentData.course?.subjects || studentData.subjectGroup || '-'],
                                    ['11. Medium of Instruction', studentData.medium || '-'],
                                    ['12. Attendance', form.attendance],
                                    ['13. Accounts / Fee Clearance', form.accountsClearance],
                                    ['14. General Conduct', form.conduct],
                                    ['15. Reason for leaving the school', form.reasonForLeaving],
                                    ['16. Date of issue of certificate', formatDate(form.tcIssueDate)]
                                ].map(([label, value], idx) => (
                                    <tr key={idx}>
                                        <td style={{ padding: '12px 8px', border: '1px solid #e2e8f0', width: '45%', fontWeight: 'bold' }}>{label}</td>
                                        <td style={{ padding: '12px 8px', border: '1px solid #e2e8f0', width: '55%' }}>{value}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div style={{ marginTop: '80px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ borderTop: '1px solid black', paddingTop: '10px', width: '150px' }}>Prepared By</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ borderTop: '1px solid black', paddingTop: '10px', width: '150px' }}>Checked By</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ borderTop: '1px solid black', paddingTop: '10px', width: '150px', fontWeight: 'bold' }}>Authorized Signatory</div>
                                <div style={{ fontSize: '12px', marginTop: '5px' }}>Principal / Director</div>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    )
}
