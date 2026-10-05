'use client'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function SuperAdminPage() {
    const { user, token, tenant } = useAuth()
    const router = useRouter()
    const [tenants, setTenants] = useState<any[]>([])
    const [stats, setStats] = useState<any>({})
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    const authHeaders = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }

    useEffect(() => {
        if (user && user.role !== 'SUPER_ADMIN') router.push('/dashboard')
        if (user && user.role === 'SUPER_ADMIN') fetchData()
    }, [user, router])

    const fetchData = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/super-admin/tenants', { headers: authHeaders })
            const data = await res.json()
            if (!data.error) {
                setTenants(data.tenants || [])
                setStats(data.stats || {})
            }
        } catch (e) { console.error(e) }
        setLoading(false)
    }

    const handleAction = async (tenantId: string, action: string, plan?: string) => {
        const confirmation = action === 'block'
            ? window.confirm('Are you sure you want to BLOCK this school?')
            : action === 'mark_paid'
                ? window.confirm('Mark this school subscription as PAID for 1 month?')
                : true
        if (!confirmation) return
        try {
            const res = await fetch('/api/super-admin/tenants', {
                method: 'PUT', headers: authHeaders,
                body: JSON.stringify({ tenantId, action, plan })
            })
            const data = await res.json()
            if (data.success) { alert(data.message); fetchData() }
            else alert(data.error || 'Failed')
        } catch (e) { console.error(e) }
    }

    if (!user || user.role !== 'SUPER_ADMIN') return null

    const filteredTenants = tenants.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        (t.email || '').toLowerCase().includes(search.toLowerCase())
    )

    const planColors: Record<string, string> = { BASIC: '#6366f1', PRO: '#ec4899', ELITE: '#f59e0b' }

    return (
        <div>
            {/* New Bar for School IDs */}
            <div style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', borderRadius: '16px', padding: '24px', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '24px' }}>
                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '12px 20px', borderRadius: '10px', color: 'white', flex: 1, minWidth: '200px' }}>
                    <div style={{ fontSize: '12px', opacity: 0.8 }}>School Name & App ID</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{tenant?.name} ({user?.tenantId || 'N/A'})</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '12px 20px', borderRadius: '10px', color: 'white', flex: 1, minWidth: '200px' }}>
                    <div style={{ fontSize: '12px', opacity: 0.8 }}>School ID (Profile)</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{tenant?.schoolCode || 'Not Set'}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '12px 20px', borderRadius: '10px', color: 'white', flex: 1, minWidth: '200px' }}>
                    <div style={{ fontSize: '12px', opacity: 0.8 }}>DISE No.</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{tenant?.diseCode || 'Not Set'}</div>
                </div>
            </div>

            {/* Quick Buttons Grid */}
            <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Quick Buttons</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                    {[
                        { href: '/dashboard', icon: '🏠', label: 'Dashboard', color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
                        { href: '/dashboard/super-admin/tenants', icon: '🏗️', label: 'Schools', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
                        { href: '/dashboard/super-admin/manage-admins', icon: '👥', label: 'Manage Admins', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
                        { href: '/dashboard/super-admin/tc', icon: '📜', label: 'TC Generation', color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
                    ].map(a => (
                        <Link key={a.href} href={a.href} style={{ textDecoration: 'none' }}>
                            <div style={{ background: a.bg, border: `1px solid ${a.color}30`, borderRadius: '14px', padding: '16px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '8px', cursor: 'pointer', transition: 'transform 0.15s' }}
                                onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
                                onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
                                <div style={{ fontSize: '26px' }}>{a.icon}</div>
                                <div style={{ fontSize: '12px', fontWeight: '600', color: a.color, lineHeight: '1.3' }}>{a.label}</div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Tenants Table */}
            <div className="card" style={{ padding: 0 }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontWeight: '700', fontSize: '16px' }}>🏫 All schools ({filteredTenants.length})</h3>
                    <input className="input" placeholder="Search by name or email..." style={{ width: '250px', padding: '8px 12px' }} value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>school</th>
                                    <th>Plan</th>
                                    <th>Students</th>
                                    <th>Affiliate Earnings</th>
                                    <th>Balance</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTenants.map(t => {
                                    const pc = planColors[t.plan] || '#6366f1'
                                    return (
                                        <tr key={t.id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '14px' }}>{t.name.charAt(0)}</div>
                                                    <div>
                                                        <div style={{ fontWeight: '600', fontSize: '14px' }}>{t.name}</div>
                                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.email || t.slug}</div>
                                                        <div style={{ display: 'flex', gap: '8px', fontSize: '11px', marginTop: '4px', flexWrap: 'wrap' }}>
                                                            <div style={{ background: 'var(--surface-2)', padding: '2px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                <span style={{ color: 'var(--text-muted)' }}>ID:</span> <span style={{ fontFamily: 'monospace' }}>{t.id}</span>
                                                                <button onClick={() => navigator.clipboard.writeText(t.id)} style={{ cursor: 'pointer', background: 'none', border: 'none', color: 'var(--primary-light)', padding: '0', display: 'flex' }} title="Copy ID">
                                                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                                                </button>
                                                            </div>
                                                            <div style={{ background: 'var(--surface-2)', padding: '2px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                <span style={{ color: 'var(--text-muted)' }}>Code:</span> <span style={{ fontFamily: 'monospace' }}>{t.schoolCode || 'N/A'}</span>
                                                                {t.schoolCode && (
                                                                    <button onClick={() => navigator.clipboard.writeText(t.schoolCode)} style={{ cursor: 'pointer', background: 'none', border: 'none', color: 'var(--primary-light)', padding: '0', display: 'flex' }} title="Copy Code">
                                                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <div style={{ background: 'var(--surface-2)', padding: '2px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                <span style={{ color: 'var(--text-muted)' }}>DISE:</span> <span style={{ fontFamily: 'monospace' }}>{t.diseCode || 'N/A'}</span>
                                                                {t.diseCode && (
                                                                    <button onClick={() => navigator.clipboard.writeText(t.diseCode)} style={{ cursor: 'pointer', background: 'none', border: 'none', color: 'var(--primary-light)', padding: '0', display: 'flex' }} title="Copy DISE">
                                                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', background: `${pc}20`, color: pc }}>{t.plan}</span>
                                            </td>
                                            <td style={{ fontWeight: '600' }}>{t.studentCount}</td>
                                            <td style={{ fontWeight: '700', color: '#10b981' }}>₹{t.affiliateEarnings || 0}</td>
                                            <td style={{ fontWeight: '600' }}>₹{t.availableBalance || 0}</td>
                                            <td>
                                                <span className={`badge ${t.isActive ? 'badge-success' : 'badge-danger'}`}>
                                                    {t.isActive ? 'ACTIVE' : 'BLOCKED'}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                    <select className="input" style={{ padding: '4px 6px', fontSize: '12px', width: '90px' }} id={`plan-${t.id}`} defaultValue={t.plan}>
                                                        <option value="BASIC">BASIC</option>
                                                        <option value="PRO">PRO</option>
                                                        <option value="ELITE">ELITE</option>
                                                    </select>
                                                    <button className="btn btn-sm" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', fontSize: '12px', padding: '4px 8px' }}
                                                        onClick={() => {
                                                            const sel = document.getElementById(`plan-${t.id}`) as HTMLSelectElement
                                                            handleAction(t.id, 'mark_paid', sel.value)
                                                        }}>✅ Mark Paid</button>
                                                    {t.isActive ? (
                                                        <button className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', fontSize: '12px', padding: '4px 8px' }}
                                                            onClick={() => handleAction(t.id, 'block')}>⛔ Block</button>
                                                    ) : (
                                                        <button className="btn btn-sm" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', fontSize: '12px', padding: '4px 8px' }}
                                                            onClick={() => handleAction(t.id, 'unblock')}>🟢 Unblock</button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
