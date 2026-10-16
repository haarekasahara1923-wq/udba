'use client'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'

export default function SubscriptionPage() {
    const { tenant } = useAuth()

    const features = [
        'Unlimited Students (No limit / restriction)',
        'Unlimited Teachers & Staff',
        'Unlimited Batches & Classes',
        'Fee Management & Digital Receipts',
        'Full Student Attendance & Analytics',
        'AI Question Generator & Tools',
        'Mock Tests & Exam Portals',
        'WhatsApp & SMS Automation',
        'Transfer Certificate (TC) & Admit Cards',
        'Lifetime Unrestricted Access',
    ]

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">⭐ Institution Plan & Limits</h1>
                    <p className="page-subtitle">Unlimited school access is active</p>
                </div>
            </div>

            {/* Plan Status Banner */}
            <div className="card" style={{
                marginBottom: '24px',
                background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(99,102,241,0.1))',
                border: '1px solid rgba(16,185,129,0.4)',
                borderRadius: '16px',
                padding: '24px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <span style={{ fontSize: '20px' }}>👑</span>
                            <span style={{ fontSize: '13px', color: '#10b981', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Plan Selection System: INACTIVE
                            </span>
                        </div>
                        <h2 style={{ fontSize: '26px', fontWeight: '900', color: 'white', marginBottom: '6px' }}>
                            Unlimited Lifetime Access
                        </h2>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '600px' }}>
                            Plan subscription limits have been deactivated for {tenant?.name || 'your institution'}.
                            Super Admins can add unlimited students, teachers, and batches without any restriction or upgrade fee.
                        </p>
                    </div>
                    <div>
                        <div style={{
                            padding: '10px 20px',
                            background: 'rgba(16,185,129,0.2)',
                            border: '1px solid #10b981',
                            borderRadius: '30px',
                            color: '#10b981',
                            fontWeight: '800',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <span>✓</span> UNLIMITED QUOTA ACTIVE
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Included */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <h3 style={{ fontWeight: '700', marginBottom: '16px', fontSize: '16px' }}>
                    ✨ Activated Privileges & Quotas
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                    {features.map((feat, idx) => (
                        <div key={idx} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '12px 16px',
                            background: 'var(--surface-2)',
                            borderRadius: '10px',
                            border: '1px solid var(--border)'
                        }}>
                            <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '16px' }}>✓</span>
                            <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '500' }}>{feat}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="card" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                <Link href="/dashboard/students/add" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                    ➕ Add Student (Unlimited)
                </Link>
                <Link href="/dashboard/students" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
                    👨‍🎓 View All Students
                </Link>
            </div>
        </div>
    )
}
