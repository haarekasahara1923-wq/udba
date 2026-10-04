'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency, formatDate } from '@/lib/utils'
import { downloadCSV, generateAndPrintPDF } from '@/lib/reportExport'

interface LedgerEntry {
    id: string
    date: string
    type: 'CREDIT' | 'DEBIT'
    category: string
    description: string
    amount: number
    balance: number
    source: string
}

export default function SchoolLedgerPage() {
    const { token, tenant } = useAuth()
    const [entries, setEntries] = useState<LedgerEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('ledger')

    useEffect(() => {
        if (!token) return
        fetch('/api/reports/school-ledger', { headers: { Authorization: `Bearer ${token}` } })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setEntries(data.data)
                }
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [token])

    const totalIncome = entries.filter(e => e.type === 'CREDIT').reduce((s, e) => s + e.amount, 0)
    const totalExpense = entries.filter(e => e.type === 'DEBIT').reduce((s, e) => s + e.amount, 0)
    const netProfit = totalIncome - totalExpense

    const handleExportCSV = () => {
        const timestamp = new Date().toISOString().split('T')[0]
        if (activeTab === 'ledger') {
            const rows = [
                ['UNIVERSAL DAY BOARDING ACADEMY - SCHOOL LEDGER'],
                ['Generated On', new Date().toLocaleString('en-IN')],
                ['Closing Balance', formatCurrency(netProfit)],
                [''],
                ['Date', 'Type', 'Category', 'Description', 'Credit (₹)', 'Debit (₹)', 'Balance (₹)']
            ]
            
            const sorted = [...entries].reverse() // Ascending order for export
            sorted.forEach(e => {
                rows.push([
                    formatDate(e.date),
                    e.type,
                    e.category,
                    e.description,
                    e.type === 'CREDIT' ? e.amount.toString() : '',
                    e.type === 'DEBIT' ? e.amount.toString() : '',
                    e.balance.toString()
                ])
            })
            downloadCSV(`school-ledger-${timestamp}.csv`, rows)
        } else {
            const rows = [
                ['UNIVERSAL DAY BOARDING ACADEMY - PROFIT & LOSS ACCOUNT'],
                ['Generated On', new Date().toLocaleString('en-IN')],
                [''],
                ['Total Income', formatCurrency(totalIncome)],
                ['Total Expense', formatCurrency(totalExpense)],
                ['Net Profit/Loss', formatCurrency(netProfit)]
            ]
            downloadCSV(`profit-and-loss-${timestamp}.csv`, rows)
        }
    }

    const handleExportPDF = () => {
        if (activeTab === 'ledger') {
            generateAndPrintPDF({
                title: 'School Ledger Report',
                subtitle: `Complete Financial Record - Generated on ${new Date().toLocaleDateString('en-IN')}`,
                schoolName: tenant?.name || 'Universal Day Boarding Academy',
                schoolAddress: '📍 Pinto Park, Gwalior (MP) • Ph: +91 7879337770',
                stats: [
                    { label: 'Total Credits', value: formatCurrency(totalIncome), subtext: 'All Income', color: '#10b981' },
                    { label: 'Total Debits', value: formatCurrency(totalExpense), subtext: 'All Expenses', color: '#ef4444' },
                    { label: 'Closing Balance', value: formatCurrency(netProfit), subtext: 'Current Balance', color: netProfit >= 0 ? '#6366f1' : '#f59e0b' },
                ],
                tables: [
                    {
                        title: 'Ledger Entries',
                        headers: ['Date', 'Particulars', 'Credit (+)', 'Debit (-)', 'Balance'],
                        rows: [...entries].reverse().map(e => [
                            formatDate(e.date),
                            `${e.category}\n${e.description}`,
                            e.type === 'CREDIT' ? `₹${e.amount.toLocaleString('en-IN')}` : '-',
                            e.type === 'DEBIT' ? `₹${e.amount.toLocaleString('en-IN')}` : '-',
                            `₹${e.balance.toLocaleString('en-IN')}`
                        ])
                    }
                ]
            })
        } else {
            generateAndPrintPDF({
                title: 'Profit & Loss Account',
                subtitle: `Financial Summary - Generated on ${new Date().toLocaleDateString('en-IN')}`,
                schoolName: tenant?.name || 'Universal Day Boarding Academy',
                schoolAddress: '📍 Pinto Park, Gwalior (MP) • Ph: +91 7879337770',
                stats: [
                    { label: 'Total Income', value: formatCurrency(totalIncome), subtext: 'Revenue', color: '#10b981' },
                    { label: 'Total Expense', value: formatCurrency(totalExpense), subtext: 'Expenditure', color: '#ef4444' },
                    { label: 'Net Profit/Loss', value: formatCurrency(netProfit), subtext: 'Overall', color: netProfit >= 0 ? '#6366f1' : '#f59e0b' },
                ],
                tables: [
                    {
                        title: 'Income Breakdown',
                        headers: ['Category', 'Amount'],
                        rows: [['Fee Collections (All)', `₹${totalIncome.toLocaleString('en-IN')}`]]
                    },
                    {
                        title: 'Expense Breakdown',
                        headers: ['Category', 'Amount'],
                        // Group expenses by category
                        rows: Object.entries(
                            entries.filter(e => e.type === 'DEBIT').reduce((acc, e) => {
                                acc[e.category] = (acc[e.category] || 0) + e.amount
                                return acc
                            }, {} as Record<string, number>)
                        ).map(([cat, amt]) => [cat, `₹${amt.toLocaleString('en-IN')}`])
                    }
                ]
            })
        }
    }

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h1 className="page-title">📒 School Ledger & P&L</h1>
                    <p className="page-subtitle">Track daily credits, debits, and overall profit & loss</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={handleExportCSV} className="btn btn-secondary">⬇️ Export CSV</button>
                    <button onClick={handleExportPDF} className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #1a5c38, #0f3d26)' }}>🖨️ Export PDF</button>
                </div>
            </div>

            {/* Overview Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div className="card" style={{ borderLeft: '4px solid #10b981' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Total Income (Credits)</div>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: '#10b981' }}>{formatCurrency(totalIncome)}</div>
                </div>
                <div className="card" style={{ borderLeft: '4px solid #ef4444' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Total Expense (Debits)</div>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: '#ef4444' }}>{formatCurrency(totalExpense)}</div>
                </div>
                <div className="card" style={{ borderLeft: `4px solid ${netProfit >= 0 ? '#6366f1' : '#f59e0b'}` }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Net Balance / Profit</div>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: netProfit >= 0 ? '#6366f1' : '#f59e0b' }}>
                        {formatCurrency(netProfit)}
                    </div>
                </div>
            </div>

            <div className="tabs" style={{ marginBottom: '20px' }}>
                <button className={`tab ${activeTab === 'ledger' ? 'active' : ''}`} onClick={() => setActiveTab('ledger')}>📓 Ledger View</button>
                <button className={`tab ${activeTab === 'pnl' ? 'active' : ''}`} onClick={() => setActiveTab('pnl')}>📈 Profit & Loss (P&L)</button>
            </div>

            {activeTab === 'ledger' && (
                <div className="card" style={{ padding: 0 }}>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Particulars</th>
                                    <th style={{ textAlign: 'right' }}>Credit (+)</th>
                                    <th style={{ textAlign: 'right' }}>Debit (-)</th>
                                    <th style={{ textAlign: 'right' }}>Balance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px' }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
                                ) : entries.length === 0 ? (
                                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No financial records found</td></tr>
                                ) : entries.map(e => (
                                    <tr key={e.id}>
                                        <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{formatDate(e.date)}</td>
                                        <td>
                                            <div style={{ fontWeight: '600' }}>{e.category}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{e.description}</div>
                                        </td>
                                        <td style={{ textAlign: 'right', fontWeight: '700', color: '#10b981' }}>
                                            {e.type === 'CREDIT' ? `+${formatCurrency(e.amount)}` : ''}
                                        </td>
                                        <td style={{ textAlign: 'right', fontWeight: '700', color: '#ef4444' }}>
                                            {e.type === 'DEBIT' ? `-${formatCurrency(e.amount)}` : ''}
                                        </td>
                                        <td style={{ textAlign: 'right', fontWeight: '800', color: 'var(--text-primary)' }}>
                                            {formatCurrency(e.balance)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'pnl' && (
                <div className="card">
                    <h3 style={{ fontWeight: '700', marginBottom: '16px', fontSize: '16px', textAlign: 'center' }}>UNIVERSAL DAY BOARDING ACADEMY</h3>
                    <h4 style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '24px' }}>Profit & Loss Account</h4>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        {/* Expenditures */}
                        <div>
                            <h4 style={{ padding: '8px', background: 'var(--surface-2)', borderBottom: '2px solid #ef4444', marginBottom: '12px' }}>Expenditures (Dr.)</h4>
                            <table style={{ width: '100%' }}>
                                <tbody>
                                    {Object.entries(
                                        entries.filter(e => e.type === 'DEBIT').reduce((acc, e) => {
                                            acc[e.category] = (acc[e.category] || 0) + e.amount
                                            return acc
                                        }, {} as Record<string, number>)
                                    ).map(([cat, amt]) => (
                                        <tr key={cat}>
                                            <td style={{ padding: '8px 4px', borderBottom: '1px solid var(--border)' }}>To {cat}</td>
                                            <td style={{ padding: '8px 4px', borderBottom: '1px solid var(--border)', textAlign: 'right', fontWeight: '600' }}>{formatCurrency(amt)}</td>
                                        </tr>
                                    ))}
                                    {netProfit > 0 && (
                                        <tr>
                                            <td style={{ padding: '12px 4px', fontWeight: '700', color: '#6366f1' }}>To Net Profit</td>
                                            <td style={{ padding: '12px 4px', textAlign: 'right', fontWeight: '800', color: '#6366f1' }}>{formatCurrency(netProfit)}</td>
                                        </tr>
                                    )}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td style={{ padding: '12px 4px', fontWeight: '800', borderTop: '2px solid var(--border)' }}>Total</td>
                                        <td style={{ padding: '12px 4px', textAlign: 'right', fontWeight: '800', borderTop: '2px solid var(--border)' }}>
                                            {formatCurrency(totalExpense + (netProfit > 0 ? netProfit : 0))}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                        
                        {/* Income */}
                        <div>
                            <h4 style={{ padding: '8px', background: 'var(--surface-2)', borderBottom: '2px solid #10b981', marginBottom: '12px' }}>Income (Cr.)</h4>
                            <table style={{ width: '100%' }}>
                                <tbody>
                                    <tr>
                                        <td style={{ padding: '8px 4px', borderBottom: '1px solid var(--border)' }}>By Fee Collections</td>
                                        <td style={{ padding: '8px 4px', borderBottom: '1px solid var(--border)', textAlign: 'right', fontWeight: '600' }}>{formatCurrency(totalIncome)}</td>
                                    </tr>
                                    {netProfit < 0 && (
                                        <tr>
                                            <td style={{ padding: '12px 4px', fontWeight: '700', color: '#ef4444' }}>By Net Loss</td>
                                            <td style={{ padding: '12px 4px', textAlign: 'right', fontWeight: '800', color: '#ef4444' }}>{formatCurrency(Math.abs(netProfit))}</td>
                                        </tr>
                                    )}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td style={{ padding: '12px 4px', fontWeight: '800', borderTop: '2px solid var(--border)' }}>Total</td>
                                        <td style={{ padding: '12px 4px', textAlign: 'right', fontWeight: '800', borderTop: '2px solid var(--border)' }}>
                                            {formatCurrency(totalIncome + (netProfit < 0 ? Math.abs(netProfit) : 0))}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
