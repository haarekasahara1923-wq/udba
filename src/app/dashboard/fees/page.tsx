'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency } from '@/lib/utils'
import { downloadCSV, generateAndPrintPDF } from '@/lib/reportExport'

interface Student {
    id: string
    fullName: string
    scholarNo?: string
    phone: string
    parentPhone: string
    courseName: string
    totalFee: number
    paidFee: number
    status: string
}

interface SiblingStudent {
    id: string
    fullName: string
    scholarNo?: string
    courseName?: string
    batchName?: string
    totalFee: number
    paidFee: number
}

export default function FeesPage() {
    const { token, tenant } = useAuth()
    const [students, setStudents] = useState<Student[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('outstanding')
    const [toast, setToast] = useState('')
    const [feeSearch, setFeeSearch] = useState('')

    // Installments Modal State
    const [selectedStudentForFees, setSelectedStudentForFees] = useState<Student | null>(null)
    const [studentFees, setStudentFees] = useState<any[]>([])
    const [feesLoading, setFeesLoading] = useState(false)
    const [paymentMode, setPaymentMode] = useState('CASH')
    const [processingPayment, setProcessingPayment] = useState<string | null>(null)
    const [depositDate, setDepositDate] = useState(new Date().toISOString().split('T')[0])

    // Siblings state in fee modal
    const [studentSiblings, setStudentSiblings] = useState<SiblingStudent[]>([])
    const [siblingsLoading, setSiblingsLoading] = useState(false)
    const [grossAmount, setGrossAmount] = useState('')
    const [processingGross, setProcessingGross] = useState(false)

    const fetchStudents = () => {
        fetch('/api/students', { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(data => { if (data.success) setStudents(data.data); setLoading(false) })
    }

    useEffect(() => {
        if (!token) return
        fetchStudents()
    }, [token])

    const outstanding = students.filter(s => s.totalFee > s.paidFee).sort((a, b) => (b.totalFee - b.paidFee) - (a.totalFee - a.paidFee))
    const paid = students.filter(s => s.paidFee >= s.totalFee)
    const totalDue = outstanding.reduce((s, st) => s + (st.totalFee - st.paidFee), 0)
    const totalCollected = students.reduce((s, st) => s + st.paidFee, 0)

    const sendWhatsAppReminder = (student: Student) => {
        const due = formatCurrency(student.totalFee - student.paidFee)
        const msg = `Dear Parent, This is a gentle reminder that ${student.fullName}'s fee of ${due} is pending at our school institute. Please arrange payment at your earliest convenience. Thank you!`
        window.open(`https://wa.me/91${(student.parentPhone || student.phone).replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank')
    }

    const openInstallments = async (student: Student) => {
        setSelectedStudentForFees(student)
        setFeesLoading(true)
        setSiblingsLoading(true)
        setStudentSiblings([])
        setGrossAmount('')

        const [feesRes, siblingsRes] = await Promise.all([
            fetch(`/api/fees?studentId=${student.id}`, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(`/api/students/siblings?studentId=${student.id}`, { headers: { Authorization: `Bearer ${token}` } })
        ])

        const [feesData, siblingsData] = await Promise.all([feesRes.json(), siblingsRes.json()])
        if (feesData.success) setStudentFees(feesData.data)
        if (siblingsData.success) {
            // Fetch student details (paidFee, totalFee) for each sibling for proportional calculation
            const siblingIds = siblingsData.data.map((s: any) => s.id)
            if (siblingIds.length > 0) {
                try {
                    const sibStudentsRes = await fetch(`/api/students`, { headers: { Authorization: `Bearer ${token}` } })
                    const sibStudentsData = await sibStudentsRes.json()
                    if (sibStudentsData.success) {
                        const sibMap = new Map(sibStudentsData.data.map((s: any) => [s.id, s]))
                        const enrichedSiblings = siblingsData.data.map((sib: any) => {
                            const full = sibMap.get(sib.id) as any
                            return {
                                ...sib,
                                totalFee: full?.totalFee || 0,
                                paidFee: full?.paidFee || 0,
                            }
                        })
                        setStudentSiblings(enrichedSiblings)
                    }
                } catch {}
            }
        }
        setFeesLoading(false)
        setSiblingsLoading(false)
    }

    const generateFeeReceipt = (payment: any, student: Student, amount: number) => {
        const fullHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Fee Receipt - ${payment.receiptNo}</title>
            <style>
                @page { size: A4; margin: 15mm; }
                body { font-family: Arial, sans-serif; margin: 0; padding: 0; color: #000; }
                .receipt-box { border: 2px solid #000; padding: 20px; }
            </style>
        </head>
        <body>
            <div class="receipt-box">
                <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px;">
                    ${tenant?.logo ? `<img src="${tenant.logo}" style="height: 80px;" />` : ''}
                    <h1 style="margin: 10px 0 5px 0; text-transform: uppercase;">${tenant?.name || 'School Name'}</h1>
                    <p style="margin: 0; font-size: 14px;">${tenant?.address || ''} | Ph: ${tenant?.phone || ''} | Email: ${tenant?.email || ''}</p>
                </div>
                
                <h2 style="text-align: center; text-transform: uppercase; margin-bottom: 20px; font-size: 18px; text-decoration: underline;">FEE RECEIPT</h2>
                
                <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                    <div><strong>Receipt No:</strong> ${payment.receiptNo}</div>
                    <div><strong>Date:</strong> ${new Date(payment.createdAt).toLocaleDateString('en-IN')}</div>
                </div>

                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <tr><td style="padding: 5px; width: 30%;"><strong>Student Name:</strong></td><td style="padding: 5px; border-bottom: 1px dashed #ccc;">${student.fullName}</td></tr>
                    <tr><td style="padding: 5px;"><strong>Course/Class:</strong></td><td style="padding: 5px; border-bottom: 1px dashed #ccc;">${student.courseName}</td></tr>
                    <tr><td style="padding: 5px;"><strong>Payment Mode:</strong></td><td style="padding: 5px; border-bottom: 1px dashed #ccc;">${payment.mode}</td></tr>
                    <tr><td style="padding: 5px;"><strong>Amount Received:</strong></td><td style="padding: 5px; border-bottom: 1px dashed #ccc;">Rs. ${amount.toFixed(2)}</td></tr>
                </table>
                
                <p style="margin-bottom: 40px;"><em>Received with thanks from ${student.fullName} the sum of Rupees ${amount.toFixed(2)} towards fee installment.</em></p>

                <div style="margin-top: 50px; display: flex; justify-content: flex-end;">
                    <div style="text-align: center;">
                        <div style="border-top: 1px solid #000; width: 200px; padding-top: 5px;">Authorized Signatory</div>
                    </div>
                </div>
            </div>
            <script>
                window.onload = function() {
                    setTimeout(function() {
                        window.print();
                    }, 500);
                };
            </script>
        </body>
        </html>
        `;
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.open();
            printWindow.document.write(fullHtml);
            printWindow.document.close();
        } else {
            alert('Popup was blocked by your browser. Please allow popups to download the PDF.');
        }
    }

    const handlePayInstallment = async (fee: any, val: number) => {
        if (!fee) { alert('Please generate slots first!'); return; }
        if (val <= 0) return alert('Enter valid amount')
        if (!confirm(`Deposit ${formatCurrency(val)} via ${paymentMode}?`)) return
        
        setProcessingPayment(fee.id)
        
        try {
            const res = await fetch('/api/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    studentId: selectedStudentForFees!.id,
                    feeId: fee.id,
                    amount: val,
                    mode: paymentMode,
                    notes: `Installment Payment (${fee.notes || 'Monthly'})`,
                    date: depositDate
                })
            })
            const data = await res.json()
            if (data.success) {
                setToast('Fee deposited successfully!')
                setTimeout(() => setToast(''), 3000)
                
                generateFeeReceipt(data.data, selectedStudentForFees!, val)

                // Refresh modal data
                openInstallments(selectedStudentForFees!)
                // Refresh main list
                fetchStudents()
            } else {
                alert(data.error || 'Payment failed')
            }
        } catch (err) {
            alert('Error processing payment')
        }
        setProcessingPayment(null)
    }

    // Gross family payment: distribute proportionally among student + siblings based on pending dues
    const handleGrossPayment = async () => {
        const grossAmt = parseFloat(grossAmount)
        if (!grossAmt || grossAmt <= 0) { alert('Enter a valid gross amount'); return }
        if (!selectedStudentForFees) return

        // Build list of all family members with pending fee
        const allFamily = [
            { ...selectedStudentForFees, pending: selectedStudentForFees.totalFee - selectedStudentForFees.paidFee },
            ...studentSiblings.map(s => ({ ...s, pending: s.totalFee - s.paidFee }))
        ].filter(m => m.pending > 0)

        if (allFamily.length === 0) { alert('No pending fees for any family member'); return }

        const totalPending = allFamily.reduce((sum, m) => sum + m.pending, 0)
        if (grossAmt > totalPending) {
            if (!confirm(`Gross amount (${formatCurrency(grossAmt)}) exceeds total family pending (${formatCurrency(totalPending)}). Proceed with ₹${totalPending.toFixed(2)}?`)) return
        }

        const effectiveAmt = Math.min(grossAmt, totalPending)

        // Calculate proportional distribution
        const distributions = allFamily.map(m => ({
            studentId: m.id,
            name: m.fullName,
            proportion: m.pending / totalPending,
            amount: Math.round((m.pending / totalPending) * effectiveAmt * 100) / 100
        }))

        // Adjust for rounding
        const distribSum = distributions.reduce((s, d) => s + d.amount, 0)
        if (distributions.length > 0) distributions[0].amount += Math.round((effectiveAmt - distribSum) * 100) / 100

        const confirmMsg = distributions.map(d => `${d.name}: ${formatCurrency(d.amount)}`).join('\n')
        if (!confirm(`Gross family payment of ${formatCurrency(effectiveAmt)} will be distributed as:\n\n${confirmMsg}\n\nProceed?`)) return

        setProcessingGross(true)
        try {
            for (const dist of distributions) {
                if (dist.amount <= 0) continue
                await fetch('/api/payments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                        studentId: dist.studentId,
                        amount: dist.amount,
                        mode: paymentMode,
                        notes: `Family Gross Payment (proportional share)`,
                        date: depositDate
                    })
                })
            }
            setToast('Family gross payment distributed successfully!')
            setTimeout(() => setToast(''), 4000)
            setGrossAmount('')
            openInstallments(selectedStudentForFees)
            fetchStudents()
        } catch (err) {
            alert('Error processing gross payment')
        }
        setProcessingGross(false)
    }

    const getCurrentList = () => {
        let list = activeTab === 'outstanding' ? outstanding : activeTab === 'paid' ? paid : students
        if (feeSearch.trim()) {
            const q = feeSearch.toLowerCase()
            list = list.filter(s =>
                s.fullName.toLowerCase().includes(q) ||
                (s.scholarNo || '').toLowerCase().includes(q) ||
                (s.phone || '').includes(q)
            )
        }
        return list
    }

    const handleExportCSV = () => {
        const list = getCurrentList()
        const timestamp = new Date().toISOString().split('T')[0]
        const tabTitle = activeTab === 'outstanding' ? 'OUTSTANDING DUES' : activeTab === 'paid' ? 'PAID FEES' : 'ALL STUDENTS'
        const rows = [
            [`UNIVERSAL DAY BOARDING ACADEMY - FEE REPORT (${tabTitle})`],
            ['Generated On', new Date().toLocaleString('en-IN')],
            ['Total Students In List', list.length],
            ['Total Outstanding Dues', formatCurrency(totalDue)],
            ['Total Collected', formatCurrency(totalCollected)],
            [''],
            ['Student Name', 'Scholar No.', 'Phone', 'Parent Phone', 'Course', 'Total Fee (INR)', 'Paid Fee (INR)', 'Pending Due (INR)', 'Payment %', 'Status']
        ]
        list.forEach(s => {
            const pending = s.totalFee - s.paidFee
            const pct = s.totalFee > 0 ? Math.round((s.paidFee / s.totalFee) * 100) : 0
            rows.push([
                s.fullName,
                s.scholarNo || '-',
                s.phone || '-',
                s.parentPhone || '-',
                s.courseName || '-',
                s.totalFee,
                s.paidFee,
                Math.max(0, pending),
                `${pct}%`,
                s.status
            ])
        })
        downloadCSV(`UDA-fees-${activeTab}-${timestamp}.csv`, rows)
    }

    const handleExportPDF = () => {
        const list = getCurrentList()
        const tabTitle = activeTab === 'outstanding' ? 'Outstanding Fees Report' : activeTab === 'paid' ? 'Paid Fees Report' : 'Student Fee Accounts Report'
        generateAndPrintPDF({
            title: tabTitle,
            subtitle: `Filter: ${activeTab.toUpperCase()} | Generated: ${new Date().toLocaleDateString('en-IN')}`,
            schoolName: tenant?.name || 'Universal Day Boarding Academy',
            schoolAddress: '📍 Pinto Park, Gwalior (MP)',
            schoolCode: tenant?.schoolCode,
            diseCode: tenant?.diseCode,
            stats: [
                { label: 'Total Collected', value: formatCurrency(totalCollected), subtext: 'Received so far', color: '#10b981' },
                { label: 'Total Outstanding', value: formatCurrency(totalDue), subtext: 'Pending balance', color: '#f59e0b' },
                { label: 'Students with Dues', value: outstanding.length, subtext: 'Unpaid installments', color: '#ef4444' },
                { label: 'Fully Paid Students', value: paid.length, subtext: 'Completed payments', color: '#6366f1' },
            ],
            tables: [
                {
                    title: `Fee Accounts (${list.length} Students)`,
                    headers: ['Student Name', 'Scholar No.', 'Phone', 'Course', 'Total Fee', 'Paid', 'Pending Due', 'Payment %'],
                    rows: list.map(s => {
                        const pending = s.totalFee - s.paidFee
                        const pct = s.totalFee > 0 ? Math.round((s.paidFee / s.totalFee) * 100) : 0
                        return [
                            s.fullName,
                            s.scholarNo || '-',
                            s.parentPhone || s.phone || '-',
                            s.courseName,
                            formatCurrency(s.totalFee),
                            formatCurrency(s.paidFee),
                            pending > 0 ? formatCurrency(pending) : '✅ Clear',
                            `${pct}%`
                        ]
                    })
                }
            ]
        })
    }

    const displayList = getCurrentList()

    return (
        <div>
            {toast && (
                <div style={{
                    position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
                    background: '#10b981', color: 'white', padding: '12px 20px',
                    borderRadius: '12px', fontWeight: '700', fontSize: '14px',
                    boxShadow: '0 4px 20px rgba(16,185,129,0.4)', animation: 'slideIn 0.3s ease'
                }}>
                    ✅ {toast}
                </div>
            )}

            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h1 className="page-title">💰 Fee Management</h1>
                    <p className="page-subtitle">Track and manage student fees</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={handleExportCSV}
                        className="btn btn-secondary"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '9px 14px' }}
                        title="Download current fee list as CSV"
                    >
                        <span>⬇️</span> Download CSV
                    </button>
                    <button
                        onClick={handleExportPDF}
                        className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '9px 14px', background: 'linear-gradient(135deg, #1a5c38, #0f3d26)' }}
                        title="Print or Save current fee report as PDF"
                    >
                        <span>🖨️</span> Download PDF
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                {[
                    { label: 'Total Collected', value: formatCurrency(totalCollected), icon: '✅', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
                    { label: 'Total Outstanding', value: formatCurrency(totalDue), icon: '⚠️', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
                    { label: 'Students with Dues', value: outstanding.length, icon: '👥', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
                    { label: 'Fully Paid Students', value: paid.length, icon: '🎉', color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
                ].map(c => (
                    <div key={c.label} style={{ padding: '20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', borderLeft: `4px solid ${c.color}` }}>
                        <div style={{ fontSize: '28px', marginBottom: '8px' }}>{c.icon}</div>
                        <div style={{ fontSize: '22px', fontWeight: '800', color: c.color, marginBottom: '4px' }}>{c.value}</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{c.label}</div>
                    </div>
                ))}
            </div>

            {/* Search */}
            <div className="card" style={{ marginBottom: '16px', padding: '14px 16px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                        className="input"
                        style={{ flex: 1 }}
                        placeholder="🔍 Search by student name or scholar no..."
                        value={feeSearch}
                        onChange={e => setFeeSearch(e.target.value)}
                    />
                    {feeSearch && (
                        <button className="btn btn-secondary" onClick={() => setFeeSearch('')} style={{ whiteSpace: 'nowrap' }}>
                            ✕ Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs">
                <button className={`tab ${activeTab === 'outstanding' ? 'active' : ''}`} onClick={() => setActiveTab('outstanding')}>⚠️ Outstanding ({outstanding.length})</button>
                <button className={`tab ${activeTab === 'paid' ? 'active' : ''}`} onClick={() => setActiveTab('paid')}>✅ Paid ({paid.length})</button>
                <button className={`tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>👥 All Students</button>
            </div>

            <div className="card" style={{ padding: 0 }}>
                <div className="table-container">
                    {loading ? (
                        <div style={{ padding: '40px', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Course</th>
                                    <th>Total Fee</th>
                                    <th>Paid</th>
                                    <th>Pending</th>
                                    <th>Payment %</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayList.map(s => {
                                    const pending = s.totalFee - s.paidFee
                                    const pct = s.totalFee > 0 ? Math.round((s.paidFee / s.totalFee) * 100) : 0
                                    return (
                                        <tr key={s.id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '12px' }}>{s.fullName.charAt(0)}</div>
                                                    <div>
                                                        <div style={{ fontWeight: '600', fontSize: '14px' }}>{s.fullName}</div>
                                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                            {s.scholarNo && <span style={{ color: '#f97316', fontWeight: '700' }}>{s.scholarNo} • </span>}
                                                            {s.phone}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{s.courseName}</td>
                                            <td style={{ fontWeight: '600', fontSize: '14px' }}>{formatCurrency(s.totalFee)}</td>
                                            <td style={{ color: '#10b981', fontWeight: '700' }}>{formatCurrency(s.paidFee)}</td>
                                            <td style={{ color: pending > 0 ? '#ef4444' : '#10b981', fontWeight: '700' }}>
                                                {pending > 0 ? formatCurrency(pending) : '✅ Clear'}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div className="progress-bar" style={{ flex: 1 }}>
                                                        <div className="progress-fill" style={{ width: `${pct}%`, background: pct >= 100 ? '#10b981' : pct > 50 ? '#f59e0b' : '#ef4444' }} />
                                                    </div>
                                                    <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', minWidth: '32px' }}>{pct}%</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                    <button onClick={() => openInstallments(s)} className="btn btn-primary btn-sm" title="View Installments" style={{ padding: '5px 10px', fontSize: '11px', fontWeight: '700' }}>
                                                        📜 Installments
                                                    </button>
                                                    {pending > 0 && (
                                                        <button onClick={() => sendWhatsAppReminder(s)} style={{ padding: '5px 10px', background: '#25d36615', border: '1px solid #25d36640', borderRadius: '6px', color: '#25d366', fontSize: '11px', cursor: 'pointer', fontWeight: '700' }}>
                                                            💬 Remind
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                                {displayList.length === 0 && (
                                    <tr>
                                        <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                            {feeSearch ? `No students found for "${feeSearch}"` : 'No students in this category'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Installments Modal */}
            {selectedStudentForFees && (
                <div className="modal-overlay" onClick={() => setSelectedStudentForFees(null)}>
                    <div className="modal" style={{ maxWidth: '680px' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h3 style={{ fontWeight: '700', fontSize: '18px' }}>📜 Fee Installments</h3>
                                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                                    {selectedStudentForFees.fullName}
                                    {selectedStudentForFees.scholarNo && <span style={{ color: '#f97316', fontWeight: '700' }}> • {selectedStudentForFees.scholarNo}</span>}
                                    {' • '}{selectedStudentForFees.courseName}
                                </p>
                            </div>
                            <button onClick={() => setSelectedStudentForFees(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}>✕</button>
                        </div>
                        <div className="modal-body">
                            {feesLoading ? (
                                <div style={{ padding: '40px', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
                            ) : studentFees.length === 0 ? (
                                <div style={{ padding: '40px', textAlign: 'center' }}>
                                    <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>No installments found! This usually happens for students added before installment tracking was enabled.</p>
                                    <button 
                                        className="btn btn-primary" 
                                        onClick={async () => {
                                            setFeesLoading(true)
                                            try {
                                                const res = await fetch('/api/fees/generate', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                                    body: JSON.stringify({ studentId: selectedStudentForFees.id })
                                                })
                                                const data = await res.json()
                                                if (data.success) {
                                                    setToast('Installments generated successfully!')
                                                    openInstallments(selectedStudentForFees)
                                                } else {
                                                    alert(data.error || 'Failed to generate')
                                                    setFeesLoading(false)
                                                }
                                            } catch(err) { alert('Error'); setFeesLoading(false) }
                                        }}
                                    >
                                        ⚙️ Auto-Generate Installments
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {/* Summary Bar */}
                                    <div style={{ padding: '12px', background: 'var(--surface-2)', borderRadius: '12px' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                            <div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800' }}>Total Fee</div>
                                                <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--primary)' }}>{formatCurrency(selectedStudentForFees.totalFee)}</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800' }}>Remaining</div>
                                                <div style={{ fontSize: '18px', fontWeight: '800', color: '#ef4444' }}>{formatCurrency(selectedStudentForFees.totalFee - selectedStudentForFees.paidFee)}</div>
                                            </div>
                                        </div>
                                        <div className="progress-bar" style={{ marginTop: '12px', height: '6px' }}>
                                            <div className="progress-fill" style={{ width: `${(selectedStudentForFees.paidFee / selectedStudentForFees.totalFee) * 100}%`, background: 'var(--primary)' }} />
                                        </div>
                                    </div>

                                    {/* Payment Mode & Date */}
                                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                        <div style={{ flex: 1, minWidth: '140px' }}>
                                            <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>Payment Mode</div>
                                            <select 
                                                className="input" 
                                                style={{ padding: '6px 12px', fontSize: '13px', borderRadius: '8px' }}
                                                value={paymentMode} 
                                                onChange={e => setPaymentMode(e.target.value)}
                                            >
                                                <option value="CASH">💵 Cash</option>
                                                <option value="UPI">📱 UPI</option>
                                                <option value="BANK_TRANSFER">🏦 Bank Transfer</option>
                                                <option value="CHEQUE">💳 Cheque</option>
                                                <option value="CARD">💳 Card</option>
                                            </select>
                                        </div>
                                        <div style={{ flex: 1, minWidth: '140px' }}>
                                            <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>Deposit Date</div>
                                            <input 
                                                type="date"
                                                className="input" 
                                                style={{ padding: '6px 12px', fontSize: '13px', borderRadius: '8px' }}
                                                value={depositDate} 
                                                onChange={e => setDepositDate(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {/* Installment Slots */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                                        {[0, 1, 2, 3, 4, 5].map(idx => {
                                            const fee = studentFees[idx]
                                            return (
                                                <div key={idx} style={{ padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                                                    <div style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-secondary)' }}>Slot {idx + 1} {fee?.status === 'PAID' ? '✅' : ''}</div>
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <div style={{ position: 'relative', flex: 1 }}>
                                                            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: 'var(--text-muted)' }}>₹</span>
                                                            <input 
                                                                type="number" 
                                                                id={`slot-amount-${idx}`}
                                                                className="input" 
                                                                style={{ paddingLeft: '24px', fontWeight: '700' }} 
                                                                placeholder="0.00"
                                                                defaultValue={fee?.amount || 0}
                                                            />
                                                        </div>
                                                        <button 
                                                            className="btn btn-primary"
                                                            style={{ padding: '0 12px', fontSize: '12px', fontWeight: '700' }}
                                                            onClick={() => {
                                                                const valInput = document.getElementById(`slot-amount-${idx}`) as HTMLInputElement;
                                                                if (valInput) handlePayInstallment(fee, parseFloat(valInput.value));
                                                            }}
                                                            disabled={!fee || processingPayment === fee.id || fee.status === 'PAID'}
                                                        >
                                                            {processingPayment === fee?.id ? '⏳' : 'Deposit'}
                                                        </button>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>

                                    {/* Siblings Fee Section */}
                                    {siblingsLoading ? (
                                        <div style={{ textAlign: 'center', padding: '12px' }}><div className="spinner" style={{ margin: '0 auto', width: '20px', height: '20px' }} /></div>
                                    ) : studentSiblings.length > 0 && (
                                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                                            <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-secondary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                👨‍👩‍👧‍👦 Siblings Fee Summary
                                                <span style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#6366f1', borderRadius: '999px', padding: '1px 8px', fontSize: '11px' }}>
                                                    {studentSiblings.length} sibling{studentSiblings.length > 1 ? 's' : ''}
                                                </span>
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                                                {/* Current student row */}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '10px' }}>
                                                    <div>
                                                        <div style={{ fontWeight: '700', fontSize: '13px' }}>{selectedStudentForFees.fullName} <span style={{ fontSize: '11px', color: '#6366f1', fontWeight: '800' }}>(Current)</span></div>
                                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{selectedStudentForFees.courseName}</div>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <div style={{ fontSize: '13px', fontWeight: '700', color: selectedStudentForFees.totalFee - selectedStudentForFees.paidFee > 0 ? '#ef4444' : '#10b981' }}>
                                                            Pending: {formatCurrency(selectedStudentForFees.totalFee - selectedStudentForFees.paidFee)}
                                                        </div>
                                                    </div>
                                                </div>
                                                {studentSiblings.map(sib => (
                                                    <div key={sib.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '10px' }}>
                                                        <div>
                                                            <div style={{ fontWeight: '600', fontSize: '13px' }}>{sib.fullName}</div>
                                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                                {sib.scholarNo && <span style={{ color: '#f97316' }}>{sib.scholarNo} • </span>}
                                                                {sib.courseName || 'N/A'}
                                                            </div>
                                                        </div>
                                                        <div style={{ textAlign: 'right' }}>
                                                            <div style={{ fontSize: '13px', fontWeight: '700', color: sib.totalFee - sib.paidFee > 0 ? '#ef4444' : '#10b981' }}>
                                                                Pending: {formatCurrency(sib.totalFee - sib.paidFee)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Gross Payment Input */}
                                            <div style={{ padding: '14px', background: 'rgba(16,185,129,0.06)', border: '1.5px solid rgba(16,185,129,0.25)', borderRadius: '12px' }}>
                                                <div style={{ fontSize: '13px', fontWeight: '800', color: '#059669', marginBottom: '10px' }}>
                                                    💰 Gross Family Payment
                                                    <div style={{ fontSize: '11px', fontWeight: '400', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                        Enter total amount. It will be split proportionally among all family members with pending dues.
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <div style={{ position: 'relative', flex: 1 }}>
                                                        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: '700', color: 'var(--text-muted)' }}>₹</span>
                                                        <input
                                                            type="number"
                                                            className="input"
                                                            style={{ paddingLeft: '28px', fontWeight: '700', fontSize: '16px' }}
                                                            placeholder="Enter gross amount..."
                                                            value={grossAmount}
                                                            onChange={e => setGrossAmount(e.target.value)}
                                                        />
                                                    </div>
                                                    <button
                                                        className="btn btn-success"
                                                        style={{ padding: '0 18px', fontWeight: '800', fontSize: '13px', whiteSpace: 'nowrap' }}
                                                        onClick={handleGrossPayment}
                                                        disabled={processingGross || !grossAmount}
                                                    >
                                                        {processingGross ? '⏳ Processing...' : '🏦 Distribute & Deposit'}
                                                    </button>
                                                </div>
                                                {grossAmount && (() => {
                                                    const amt = parseFloat(grossAmount)
                                                    const allFamily = [
                                                        { name: selectedStudentForFees.fullName, pending: selectedStudentForFees.totalFee - selectedStudentForFees.paidFee },
                                                        ...studentSiblings.map(s => ({ name: s.fullName, pending: s.totalFee - s.paidFee }))
                                                    ].filter(m => m.pending > 0)
                                                    const totalPending = allFamily.reduce((s, m) => s + m.pending, 0)
                                                    if (!amt || amt <= 0 || totalPending <= 0) return null
                                                    const effective = Math.min(amt, totalPending)
                                                    return (
                                                        <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>
                                                            <strong style={{ color: 'var(--text-secondary)' }}>Preview distribution:</strong>
                                                            {allFamily.map(m => (
                                                                <div key={m.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                                                                    <span>{m.name}</span>
                                                                    <span style={{ fontWeight: '700', color: '#059669' }}>
                                                                        {formatCurrency(Math.round((m.pending / totalPending) * effective * 100) / 100)}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )
                                                })()}
                                            </div>
                                        </div>
                                    )}

                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '4px' }}>
                                        * Enter amount in any slot. Dashboard will update in real-time.
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
