'use client'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
        <label className="label">{label}</label>
        {children}
    </div>
)

// Reliable camera/gallery upload for doc items — uses transparent overlay to ensure direct touch on Android WebViews
function DocUploadButtons({
    docKey,
    onUpload,
}: {
    docKey: string
    onUpload: (key: string, e: React.ChangeEvent<HTMLInputElement>) => void
}) {
    const idSuffix = Math.random().toString(36).substring(7)
    return (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <div>
                <label htmlFor={`cam-${docKey}-${idSuffix}`} className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '11px', cursor: 'pointer', margin: 0 }}>
                    📸 Cam
                </label>
                <input
                    id={`cam-${docKey}-${idSuffix}`}
                    type="file"
                    accept="image/*,application/pdf"
                    capture="environment"
                    style={{ position: 'absolute', opacity: 0, width: '0.1px', height: '0.1px', zIndex: -1 }}
                    onChange={e => onUpload(docKey, e)}
                />
            </div>
            <div>
                <label htmlFor={`gal-${docKey}-${idSuffix}`} className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '11px', cursor: 'pointer', margin: 0 }}>
                    🖼️ Gal
                </label>
                <input
                    id={`gal-${docKey}-${idSuffix}`}
                    type="file"
                    accept="image/*,application/pdf"
                    style={{ position: 'absolute', opacity: 0, width: '0.1px', height: '0.1px', zIndex: -1 }}
                    onChange={e => onUpload(docKey, e)}
                />
            </div>
        </div>
    )
}

export default function AddStudentPage() {
    const { token, tenant } = useAuth()
    const router = useRouter()
    const [showDocsModal, setShowDocsModal] = useState(false)
    const [docs, setDocs] = useState({ aadhaarFront: '', aadhaarBack: '', samagra: '', apar: '', pen: '', bank: '' })
    const [courses, setCourses] = useState<{ id: string; name: string; fees: number; installmentCount: number }[]>([])
    const [batches, setBatches] = useState<{ id: string; name: string; courseId: string }[]>([])
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [toast, setToast] = useState('')
    const [metadataLoading, setMetadataLoading] = useState(true)

    const [form, setForm] = useState({
        scholarNo: '', fullName: '', fatherName: '', motherName: '', phone: '', parentPhone: '',
        email: '', address: '', gender: 'MALE', dob: '', dobInWords: '', courseId: '', batchId: '',
        admissionDate: new Date().toISOString().split('T')[0],
        medium: 'Hindi', caste: '', scholarshipScheme: '',
        firstAdmissionClass: '', firstAdmissionDate: '', subjectGroup: '',
        feePlan: 'Annual', feeWaiver: '', totalFee: '', notes: '',
        aadhaarNo: '', penId: '', aparId: '', samagraId: '',
        bankName: '', bankAccountNo: '', ifscCode: '', photo: ''
    })

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onloadend = () => setForm(prev => ({ ...prev, photo: reader.result as string }))
        reader.readAsDataURL(file)
        e.target.value = ''
    }

    const handleDocUpload = (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onloadend = () => {
            const result = reader.result as string
            setDocs(prev => ({ ...prev, [key]: result }))
        }
        reader.readAsDataURL(file)
        e.target.value = ''
    }

    const getFormHtml = () => {
        const courseName = courses.find(c => c.id === form.courseId)?.name || ''
        const batchName = batches.find(b => b.id === form.batchId)?.name || ''
        
        return `
            <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; color: #000; padding: 20px;">
                <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px;">
                    ${tenant?.logo ? `<img src="${tenant.logo}" style="height: 80px;" />` : ''}
                    <h1 style="margin: 10px 0 5px 0;">${tenant?.name || 'School Name'}</h1>
                    <p style="margin: 0; font-size: 14px;">${tenant?.address || ''} | Ph: ${tenant?.phone || ''} | Email: ${tenant?.email || ''}</p>
                    <p style="margin: 5px 0 0 0; font-size: 14px;"><strong>School Code:</strong> ${tenant?.schoolCode || '___'} &nbsp;&nbsp;&nbsp; <strong>DISE Code:</strong> ${tenant?.diseCode || '___'}</p>
                </div>
                
                <h2 style="text-align: center; text-transform: uppercase; margin-bottom: 20px; font-size: 18px; text-decoration: underline;">Student Admission Form</h2>
                
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <tr>
                        <td style="width: 75%; vertical-align: top;">
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr><td style="padding: 5px; width: 35%;"><strong>Scholar No:</strong></td><td style="padding: 5px; border-bottom: 1px dashed #ccc;">${form.scholarNo}</td></tr>
                                <tr><td style="padding: 5px;"><strong>Full Name:</strong></td><td style="padding: 5px; border-bottom: 1px dashed #ccc;">${form.fullName}</td></tr>
                                <tr><td style="padding: 5px;"><strong>Class & Section:</strong></td><td style="padding: 5px; border-bottom: 1px dashed #ccc;">${courseName} - ${batchName}</td></tr>
                                <tr><td style="padding: 5px;"><strong>Gender:</strong></td><td style="padding: 5px; border-bottom: 1px dashed #ccc;">${form.gender}</td></tr>
                            </table>
                        </td>
                        <td style="width: 25%; text-align: right; vertical-align: top;">
                            <div style="width: 120px; height: 150px; border: 1px solid #000; display: inline-flex; align-items: center; justify-content: center; text-align: center; float: right;">
                                ${form.photo ? `<img src="${form.photo}" style="width: 100%; height: 100%; object-fit: cover;" />` : 'Paste/Upload<br/>Passport Size<br/>Photo'}
                            </div>
                        </td>
                    </tr>
                </table>
                
                <h3 style="background: #f0f0f0; padding: 5px; font-size: 14px; margin: 15px 0 10px 0; border: 1px solid #000;">1. Personal Details</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                    <tr>
                        <td style="padding: 5px; width: 25%;"><strong>Father's Name:</strong></td><td style="padding: 5px; width: 25%; border-bottom: 1px dashed #ccc;">${form.fatherName}</td>
                        <td style="padding: 5px; width: 25%;"><strong>Mother's Name:</strong></td><td style="padding: 5px; width: 25%; border-bottom: 1px dashed #ccc;">${form.motherName}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px;"><strong>Date of Birth:</strong></td><td style="padding: 5px; border-bottom: 1px dashed #ccc;">${form.dob}</td>
                        <td style="padding: 5px;"><strong>DOB (in words):</strong></td><td style="padding: 5px; border-bottom: 1px dashed #ccc;">${form.dobInWords}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px;"><strong>Student Phone:</strong></td><td style="padding: 5px; border-bottom: 1px dashed #ccc;">${form.phone}</td>
                        <td style="padding: 5px;"><strong>Parent Phone:</strong></td><td style="padding: 5px; border-bottom: 1px dashed #ccc;">${form.parentPhone}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px;"><strong>Caste:</strong></td><td style="padding: 5px; border-bottom: 1px dashed #ccc;">${form.caste}</td>
                        <td style="padding: 5px;"><strong>Medium:</strong></td><td style="padding: 5px; border-bottom: 1px dashed #ccc;">${form.medium}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px;"><strong>Email:</strong></td><td colspan="3" style="padding: 5px; border-bottom: 1px dashed #ccc;">${form.email}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px;"><strong>Address:</strong></td><td colspan="3" style="padding: 5px; border-bottom: 1px dashed #ccc;">${form.address}</td>
                    </tr>
                </table>
                
                <h3 style="background: #f0f0f0; padding: 5px; font-size: 14px; margin: 15px 0 10px 0; border: 1px solid #000;">2. Government IDs</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                    <tr>
                        <td style="padding: 5px; width: 25%;"><strong>Aadhaar No:</strong></td><td style="padding: 5px; width: 25%; border-bottom: 1px dashed #ccc;">${form.aadhaarNo}</td>
                        <td style="padding: 5px; width: 25%;"><strong>Samagra ID:</strong></td><td style="padding: 5px; width: 25%; border-bottom: 1px dashed #ccc;">${form.samagraId}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px;"><strong>PEN ID No:</strong></td><td style="padding: 5px; border-bottom: 1px dashed #ccc;">${form.penId}</td>
                        <td style="padding: 5px;"><strong>APAR ID No:</strong></td><td style="padding: 5px; border-bottom: 1px dashed #ccc;">${form.aparId}</td>
                    </tr>
                </table>
                
                <h3 style="background: #f0f0f0; padding: 5px; font-size: 14px; margin: 15px 0 10px 0; border: 1px solid #000;">3. Academic Details</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                    <tr>
                        <td style="padding: 5px; width: 25%;"><strong>First Adm. Class:</strong></td><td style="padding: 5px; width: 25%; border-bottom: 1px dashed #ccc;">${form.firstAdmissionClass}</td>
                        <td style="padding: 5px; width: 25%;"><strong>First Adm. Date:</strong></td><td style="padding: 5px; width: 25%; border-bottom: 1px dashed #ccc;">${form.firstAdmissionDate}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px;"><strong>Subject Group:</strong></td><td style="padding: 5px; border-bottom: 1px dashed #ccc;">${form.subjectGroup}</td>
                        <td style="padding: 5px;"><strong>Scholarship:</strong></td><td style="padding: 5px; border-bottom: 1px dashed #ccc;">${form.scholarshipScheme}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px;"><strong>Current Adm. Date:</strong></td><td style="padding: 5px; border-bottom: 1px dashed #ccc;">${form.admissionDate}</td>
                        <td style="padding: 5px;"><strong>Fee Plan:</strong></td><td style="padding: 5px; border-bottom: 1px dashed #ccc;">${form.feePlan}</td>
                    </tr>
                </table>
                
                <h3 style="background: #f0f0f0; padding: 5px; font-size: 14px; margin: 15px 0 10px 0; border: 1px solid #000;">4. Bank Details</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                    <tr>
                        <td style="padding: 5px; width: 25%;"><strong>Bank Name:</strong></td><td colspan="3" style="padding: 5px; border-bottom: 1px dashed #ccc;">${form.bankName}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px; width: 25%;"><strong>Account No:</strong></td><td style="padding: 5px; width: 25%; border-bottom: 1px dashed #ccc;">${form.bankAccountNo}</td>
                        <td style="padding: 5px; width: 25%;"><strong>IFSC Code:</strong></td><td style="padding: 5px; width: 25%; border-bottom: 1px dashed #ccc;">${form.ifscCode}</td>
                    </tr>
                </table>
                
                <div style="margin-top: 50px; display: flex; justify-content: space-between; align-items: flex-end;">
                    <div style="text-align: center;">
                        <div style="border-top: 1px solid #000; width: 200px; padding-top: 5px;">Parent / Guardian Signature</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="border-top: 1px solid #000; width: 200px; padding-top: 5px;">Authorized Signatory</div>
                    </div>
                </div>
            </div>
        `
    }

    const handleDownloadPDF = () => {
        const html = getFormHtml()
        const fullHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Admission Form - ${form.fullName}</title>
            <style>
                @page { size: A4; margin: 15mm; }
                body { margin: 0; padding: 0; }
                table { page-break-inside: avoid; }
            </style>
        </head>
        <body>
            ${html}
            <script>
                window.onload = function() {
                    setTimeout(function() {
                        window.print();
                    }, 500);
                };
            </script>
        </body>
        </html>
        `
        const printWindow = window.open('', '_blank')
        if (printWindow) {
            printWindow.document.open()
            printWindow.document.write(fullHtml)
            printWindow.document.close()
        } else {
            alert('Popup was blocked by your browser. Please allow popups for this site to download the PDF.')
        }
    }

    const handleDownloadDOCX = () => {
        const html = getFormHtml()
        const preHtml = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export HTML To Doc</title></head><body>";
        const postHtml = "</body></html>";
        const docHtml = preHtml + html + postHtml;

        const blob = new Blob(['\ufeff', docHtml], { type: 'application/msword' });
        const url = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(docHtml);
        const filename = form.fullName ? `Admission_Form_${form.fullName.replace(/\s+/g, '_')}.doc` : 'Admission_Form.doc';
        const downloadLink = document.createElement("a");

        document.body.appendChild(downloadLink);
        
        if ((navigator as any).msSaveOrOpenBlob) {
            (navigator as any).msSaveOrOpenBlob(blob, filename);
        } else {
            downloadLink.href = url;
            downloadLink.download = filename;
            downloadLink.click();
        }
        document.body.removeChild(downloadLink);
    }


    useEffect(() => {
        if (!token) return
        setMetadataLoading(true)
        Promise.all([
            fetch('/api/courses', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
            fetch('/api/batches', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        ]).then(([c, b]) => {
            if (c.success) setCourses(c.data)
            if (b.success) setBatches(b.data)
            setMetadataLoading(false)
        }).catch(err => {
            console.error('Failed to fetch metadata:', err)
            setToast('Failed to load courses and batches. Please refresh.')
            setMetadataLoading(false)
        })
    }, [token])

    const filteredBatches = batches.filter(b => !form.courseId || b.courseId === form.courseId)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            // Serialize govt ID docs into idProof field as JSON
            const hasAnyDoc = Object.values(docs).some(v => v !== '')
            const idProof = hasAnyDoc ? JSON.stringify(docs) : ''
            const res = await fetch('/api/students', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ ...form, idProof }),
            })
            const data = await res.json()
            setLoading(false)
            if (data.success) {
                setSuccess(true)
                setToast('Student added successfully!')
                setTimeout(() => router.push('/dashboard/students'), 1500)
            } else {
                setToast(data.error || 'Failed to add student')
            }
        } catch (error) {
            setLoading(false)
            setToast('Failed to add student. Please check your connection and try again.')
        }
    }

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">➕ Add New Student</h1>
                    <p className="page-subtitle">Fill in the student details below</p>
                </div>
            </div>

            {toast && (
                <div className={`toast ${success ? 'toast-success' : 'toast-error'}`} style={{ position: 'relative', marginBottom: '16px', maxWidth: '100%' }}>
                    {success ? '✓' : '⚠️'} {toast}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* Personal Info */}
                <div className="card" style={{ marginBottom: '20px' }}>
                    <h3 style={{ fontWeight: '700', marginBottom: '20px', fontSize: '16px', color: 'var(--primary-light)' }}>👤 Personal Information</h3>
                    
                    <div style={{ marginBottom: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                        {form.photo ? (
                            <div style={{ position: 'relative' }}>
                                <img src={form.photo} alt="Student" style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover' }} />
                                <button type="button" onClick={() => setForm(prev => ({ ...prev, photo: '' }))} style={{ position: 'absolute', top: 0, right: 0, background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                            </div>
                        ) : (
                            <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>📷</div>
                        )}
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <div>
                                <label htmlFor="main-cam-upload" className="btn btn-secondary" style={{ cursor: 'pointer', margin: 0 }}>
                                    📸 Camera
                                </label>
                                <input
                                    id="main-cam-upload"
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    style={{ position: 'absolute', opacity: 0, width: '0.1px', height: '0.1px', zIndex: -1 }}
                                    onChange={handlePhotoUpload}
                                />
                            </div>
                            <div>
                                <label htmlFor="main-gal-upload" className="btn btn-secondary" style={{ cursor: 'pointer', margin: 0 }}>
                                    🖼️ Gallery
                                </label>
                                <input
                                    id="main-gal-upload"
                                    type="file"
                                    accept="image/*"
                                    style={{ position: 'absolute', opacity: 0, width: '0.1px', height: '0.1px', zIndex: -1 }}
                                    onChange={handlePhotoUpload}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid-cols-2">
                        <Field label="Scholar No. *">
                            <input className="input" placeholder="e.g. 1001" value={form.scholarNo} onChange={e => setForm({ ...form, scholarNo: e.target.value })} required />
                        </Field>
                        <Field label="Full Name *">
                            <input className="input" placeholder="Arjun Sharma" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} required />
                        </Field>
                        <Field label="Phone Number *">
                            <input className="input" type="tel" placeholder="917879337770" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required />
                        </Field>
                        <Field label="Father's Name *">
                            <input className="input" placeholder="Ramesh Sharma" value={form.fatherName} onChange={e => setForm({ ...form, fatherName: e.target.value })} required />
                        </Field>
                        <Field label="Mother's Name">
                            <input className="input" placeholder="Sunita Sharma" value={form.motherName} onChange={e => setForm({ ...form, motherName: e.target.value })} />
                        </Field>
                        <Field label="Parent Phone">
                            <input className="input" type="tel" placeholder="9876543211" value={form.parentPhone} onChange={e => setForm({ ...form, parentPhone: e.target.value })} />
                        </Field>
                        <Field label="Email">
                            <input className="input" type="email" placeholder="student@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                        </Field>
                        <Field label="Gender">
                            <select className="input" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                                <option value="MALE">Male</option>
                                <option value="FEMALE">Female</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </Field>
                        <Field label="Date of Birth">
                            <input className="input" type="date" value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} />
                        </Field>
                        <Field label="Date of Birth (in words)">
                            <input className="input" placeholder="e.g. First January Two Thousand Ten" value={form.dobInWords} onChange={e => setForm({ ...form, dobInWords: e.target.value })} />
                        </Field>
                        <Field label="Caste">
                            <select className="input" value={form.caste} onChange={e => setForm({ ...form, caste: e.target.value })}>
                                <option value="">Select Caste</option>
                                <option value="General">General</option>
                                <option value="OBC">OBC</option>
                                <option value="SC">SC</option>
                                <option value="ST">ST</option>
                                <option value="OTHER">OTHER</option>
                            </select>
                        </Field>
                        <Field label="Medium">
                            <select className="input" value={form.medium} onChange={e => setForm({ ...form, medium: e.target.value })}>
                                <option value="Hindi">Hindi</option>
                                <option value="English">English</option>
                            </select>
                        </Field>
                        {(() => {
                            const course = courses.find(c => c.id === form.courseId)
                            const isHigherSecondary = course?.name === 'Class 11' || course?.name === 'Class 12'
                            if (!isHigherSecondary) return null
                            
                            return (
                                <Field label="Subject Group">
                                    <select 
                                        className="input" 
                                        value={form.subjectGroup} 
                                        onChange={e => setForm({ ...form, subjectGroup: e.target.value })}
                                    >
                                        <option value="">Select Subject Group</option>
                                        <option value="PCM">PCM</option>
                                        <option value="PCB">PCB</option>
                                        <option value="Arts">Arts</option>
                                        <option value="Commerce">Commerce</option>
                                    </select>
                                </Field>
                            )
                        })()}
                    </div>
                    <div style={{ marginTop: '16px' }}>
                        <Field label="Address">
                            <textarea className="input" placeholder="Full address with city and pin code" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} rows={2} style={{ resize: 'none' }} />
                        </Field>
                    </div>
                </div>

                {/* Government IDs */}
                <div className="card" style={{ marginBottom: '20px' }}>
                    <h3 style={{ fontWeight: '700', marginBottom: '20px', fontSize: '16px', color: 'var(--primary-light)' }}>🪪 Government IDs</h3>
                    <div className="grid-cols-2">
                        <Field label="Aadhaar Number">
                            <input className="input" placeholder="1234 5678 9012" value={form.aadhaarNo} onChange={e => setForm({ ...form, aadhaarNo: e.target.value })} />
                        </Field>
                        <Field label="PEN ID No.">
                            <input className="input" placeholder="PEN ID" value={form.penId} onChange={e => setForm({ ...form, penId: e.target.value })} />
                        </Field>
                        <Field label="APAR ID No.">
                            <input className="input" placeholder="APAR ID" value={form.aparId} onChange={e => setForm({ ...form, aparId: e.target.value })} />
                        </Field>
                        <Field label="Samagra ID No.">
                            <input className="input" placeholder="Samagra ID" value={form.samagraId} onChange={e => setForm({ ...form, samagraId: e.target.value })} />
                        </Field>
                        <Field label="Bank Name">
                            <input className="input" placeholder="State Bank of India" value={form.bankName} onChange={e => setForm({ ...form, bankName: e.target.value })} />
                        </Field>
                        <Field label="Bank Account No.">
                            <input className="input" placeholder="Account Number" value={form.bankAccountNo} onChange={e => setForm({ ...form, bankAccountNo: e.target.value })} />
                        </Field>
                        <Field label="IFSC Code">
                            <input className="input" placeholder="IFSC Code" value={form.ifscCode} onChange={e => setForm({ ...form, ifscCode: e.target.value })} />
                        </Field>
                    </div>
                </div>

                {/* Academic Info */}
                <div className="card" style={{ marginBottom: '20px' }}>
                    <h3 style={{ fontWeight: '700', marginBottom: '20px', fontSize: '16px', color: 'var(--primary-light)' }}>📚 Academic Details</h3>
                    <div className="grid-cols-2">
                        <Field label="Class *">
                            <select 
                                className="input" 
                                value={form.courseId} 
                                onChange={e => {
                                    const courseId = e.target.value;
                                    const selectedCourse = courses.find(c => c.id === courseId);
                                    setForm({ 
                                        ...form, 
                                        courseId, 
                                        batchId: '', 
                                        feeWaiver: '',
                                        totalFee: selectedCourse ? selectedCourse.fees.toString() : '' 
                                    });
                                }} 
                                required 
                                disabled={metadataLoading}
                            >
                                <option value="">{metadataLoading ? '⌛ Loading classes...' : 'Select Class'}</option>
                                {courses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.installmentCount} Installments)</option>)}
                            </select>
                            {form.courseId && courses.find(c => c.id === form.courseId) && (
                                <div style={{ fontSize: '11px', color: 'var(--primary)', marginTop: '4px', fontWeight: 'bold' }}>
                                    Fees will be split into {courses.find(c => c.id === form.courseId)?.installmentCount} installments automatically.
                                </div>
                            )}
                        </Field>
                        <Field label="Section (Optional)">
                            <select className="input" value={form.batchId} onChange={e => setForm({ ...form, batchId: e.target.value })} disabled={metadataLoading}>
                                <option value="">
                                    {metadataLoading ? '⌛ Loading sections...' : 
                                     (form.courseId && filteredBatches.length === 0) ? 'No sections available' : 
                                     'Select Section'}
                                </option>
                                {filteredBatches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </Field>
                        <Field label="First Admission Class">
                            <input className="input" placeholder="e.g. Class 1" value={form.firstAdmissionClass} onChange={e => setForm({ ...form, firstAdmissionClass: e.target.value })} />
                        </Field>
                        <Field label="First Admission Date">
                            <input className="input" type="date" value={form.firstAdmissionDate} onChange={e => setForm({ ...form, firstAdmissionDate: e.target.value })} />
                        </Field>
                        <Field label="Current Admission Date">
                            <input className="input" type="date" value={form.admissionDate} onChange={e => setForm({ ...form, admissionDate: e.target.value })} />
                        </Field>
                        <Field label="Scholarship Scheme">
                            <input className="input" placeholder="e.g. RT, Post Matric" value={form.scholarshipScheme} onChange={e => {
                                const scheme = e.target.value;
                                let newWaiver = form.feeWaiver;
                                let newTotalFee = form.totalFee;
                                if (scheme.toUpperCase() === 'RT') {
                                    const selectedCourse = courses.find(c => c.id === form.courseId);
                                    const baseFee = selectedCourse ? selectedCourse.fees : 0;
                                    newWaiver = baseFee.toString();
                                    newTotalFee = '0';
                                }
                                setForm({ ...form, scholarshipScheme: scheme, feeWaiver: newWaiver, totalFee: newTotalFee.toString() });
                            }} />
                        </Field>
                        <Field label="Fee Plan">
                            <select className="input" value={form.feePlan} onChange={e => setForm({ ...form, feePlan: e.target.value })}>
                                <option>Annual</option>
                                <option>Quarterly</option>
                                <option>Monthly</option>
                                <option>Custom</option>
                            </select>
                        </Field>
                        <Field label="Fee Waiver (₹)">
                            <input 
                                className="input" 
                                type="number" 
                                placeholder="0" 
                                value={form.feeWaiver} 
                                onChange={e => {
                                    const waiver = e.target.value;
                                    const selectedCourse = courses.find(c => c.id === form.courseId);
                                    const baseFee = selectedCourse ? selectedCourse.fees : (parseFloat(form.totalFee) || 0);
                                    const newTotalFee = baseFee - (parseFloat(waiver) || 0);
                                    setForm({ ...form, feeWaiver: waiver, totalFee: Math.max(0, newTotalFee).toString() });
                                }} 
                            />
                        </Field>
                        <Field label="Final Total Fee (₹)">
                            <input className="input" type="number" placeholder="45000" value={form.totalFee} onChange={e => setForm({ ...form, totalFee: e.target.value })} />
                        </Field>
                    </div>
                </div>

                {/* Notes */}
                <div className="card" style={{ marginBottom: '20px' }}>
                    <h3 style={{ fontWeight: '700', marginBottom: '16px', fontSize: '16px', color: 'var(--primary-light)' }}>📝 Additional Notes</h3>
                    <textarea className="input" placeholder="Any important notes about this student..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} style={{ resize: 'none' }} />
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button type="button" onClick={handleDownloadPDF} className="btn btn-secondary" style={{ background: '#0f3d26', color: 'white', border: 'none' }}>🖨️ PDF Form</button>
                        <button type="button" onClick={handleDownloadDOCX} className="btn btn-secondary" style={{ background: '#1e40af', color: 'white', border: 'none' }}>📄 DOCX Form</button>
                        <button type="button" onClick={() => setShowDocsModal(true)} className="btn btn-secondary" style={{ background: '#7e22ce', color: 'white', border: 'none' }}>🪪 Upload Govt IDs</button>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button type="button" onClick={() => router.back()} className="btn btn-secondary">Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? <><div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} /> Saving...</> : '💾 Add Student'}
                        </button>
                    </div>
                </div>
            </form>

            {/* Govt IDs Upload Modal */}
            {showDocsModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="card" style={{ width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '700' }}>🪪 Upload Govt IDs</h3>
                            <button onClick={() => setShowDocsModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            {[
                                { label: 'Aadhaar Card (Front)', key: 'aadhaarFront' },
                                { label: 'Aadhaar Card (Back)', key: 'aadhaarBack' },
                                { label: 'Samagra ID', key: 'samagra' },
                                { label: 'APAR ID', key: 'apar' },
                                { label: 'PEN ID', key: 'pen' },
                                { label: 'Bank Passbook (1st Page)', key: 'bank' }
                            ].map(item => {
                                const docValue = docs[item.key as keyof typeof docs]
                                const isPdf = docValue?.startsWith('data:application/pdf')
                                return (
                                <div key={item.key} style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>{item.label}</div>
                                    {docValue ? (
                                        <div style={{ position: 'relative' }}>
                                            {isPdf ? (
                                                <div style={{ width: '100%', height: '100px', background: 'var(--surface-2)', borderRadius: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                                    <span style={{ fontSize: '28px' }}>📄</span>
                                                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>PDF Uploaded</span>
                                                </div>
                                            ) : (
                                                <img src={docValue} alt={item.label} style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '4px' }} />
                                            )}
                                            <button 
                                                type="button"
                                                onClick={() => setDocs(prev => ({...prev, [item.key]: ''}))}
                                                style={{ position: 'absolute', top: 4, right: 4, background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '10px' }}>✕</button>
                                        </div>
                                    ) : (
                                        <DocUploadButtons
                                            docKey={item.key as keyof typeof docs}
                                            onUpload={handleDocUpload}
                                        />
                                    )}
                                </div>
                                )
                            })}
                        </div>
                        <div style={{ marginTop: '24px', textAlign: 'right' }}>
                            <button className="btn btn-primary" onClick={() => setShowDocsModal(false)}>Done Uploading</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Off-screen hidden file inputs removed — now using label+input overlay pattern for Android compatibility */}
        </div>
    )
}
