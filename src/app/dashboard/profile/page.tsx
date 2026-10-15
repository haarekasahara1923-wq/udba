'use client'
import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect } from 'react'

export default function ProfilePage() {
    const { tenant, user, token } = useAuth()
    const [form, setForm] = useState({
        name: tenant?.name || '',
        phone: tenant?.phone || '',
        email: tenant?.email || '',
        website: tenant?.website || '',
        address: tenant?.address || '',
        themeColor: tenant?.themeColor || '#6366f1',
        logo: tenant?.logo || '',
        schoolCode: tenant?.schoolCode || '',
        diseCode: tenant?.diseCode || '',
        gstNumber: (tenant as any)?.gstNumber || '',
        directorSign: (tenant as any)?.directorSign || '',
        upiId: (tenant as any)?.upiId || '',
        bankAccountNo: (tenant as any)?.bankAccountNo || '',
        ifscCode: (tenant as any)?.ifscCode || '',
    })
    const [saved, setSaved] = useState(false)
    const [saving, setSaving] = useState(false)
    const [loading, setLoading] = useState(true)

    // Load fresh data from /api/tenant
    useEffect(() => {
        const fetchTenantData = async () => {
            const currentToken = token || (typeof window !== 'undefined' ? (localStorage.getItem('UDA_token') || localStorage.getItem('udba_token')) : null)
            if (!currentToken) {
                setLoading(false)
                return
            }
            try {
                const res = await fetch('/api/tenant', {
                    headers: { Authorization: `Bearer ${currentToken}` }
                })
                const data = await res.json()
                if (data.success && data.tenant) {
                    const t = data.tenant
                    setForm({
                        name: t.name || '',
                        phone: t.phone || '',
                        email: t.email || '',
                        website: t.website || '',
                        address: t.address || '',
                        themeColor: t.themeColor || '#6366f1',
                        logo: t.logo || '',
                        schoolCode: t.schoolCode || '',
                        diseCode: t.diseCode || '',
                        gstNumber: t.gstNumber || '',
                        directorSign: t.directorSign || '',
                        upiId: t.upiId || '',
                        bankAccountNo: t.bankAccountNo || '',
                        ifscCode: t.ifscCode || '',
                    })
                }
            } catch (err) {
                console.error('Failed to fetch tenant profile:', err)
            }
            setLoading(false)
        }
        fetchTenantData()
    }, [token])

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                alert('Please upload an image smaller than 2MB.')
                return
            }
            const reader = new FileReader()
            reader.onloadend = () => {
                setForm(prev => ({ ...prev, logo: reader.result as string }))
            }
            reader.readAsDataURL(file)
        }
    }

    const handleRemoveLogo = () => {
        setForm(prev => ({ ...prev, logo: '' }))
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        const currentToken = token || (typeof window !== 'undefined' ? (localStorage.getItem('UDA_token') || localStorage.getItem('udba_token')) : null)
        try {
            const res = await fetch('/api/tenant', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${currentToken}`
                },
                body: JSON.stringify(form)
            })
            const data = await res.json()
            if (data.success) {
                setSaved(true)
                
                // Update local storage so AuthContext has the new data immediately
                if (typeof window !== 'undefined') {
                    const existing = localStorage.getItem('UDA_tenant')
                    const parsed = existing ? JSON.parse(existing) : {}
                    const updated = { ...parsed, ...data.tenant, ...form }
                    localStorage.setItem('UDA_tenant', JSON.stringify(updated))
                }
                
                setTimeout(() => {
                    setSaved(false)
                    window.location.reload()
                }, 1200)
            } else {
                alert(data.error || 'Failed to update profile')
            }
        } catch (err) {
            console.error(err)
            alert('Error updating profile')
        }
        setSaving(false)
    }

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div className="page-header" style={{ marginBottom: '20px' }}>
                <div>
                    <h1 className="page-title" style={{ fontSize: '24px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span>🏢</span> School Profile & Branding
                    </h1>
                    <p className="page-subtitle" style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                        Manage your institute branding, UDISE No., School ID, and official details for all generated documents (TC, Marksheet, Admit Cards, Receipts)
                    </p>
                </div>
            </div>

            {saved && (
                <div className="toast toast-success" style={{ position: 'relative', marginBottom: '20px', maxWidth: '100%', padding: '14px 20px', fontSize: '15px', fontWeight: '700', borderRadius: '12px' }}>
                    ✓ School profile and branding saved successfully! Reloading...
                </div>
            )}

            {loading ? (
                <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div className="spinner" style={{ width: '36px', height: '36px', margin: '0 auto 12px' }} />
                    Loading school details...
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
                    {/* Left Form Column */}
                    <div>
                        <div className="card" style={{ marginBottom: '24px', padding: '24px', borderRadius: '16px' }}>
                            <h3 style={{ fontWeight: '800', marginBottom: '20px', fontSize: '18px', color: 'var(--primary-light)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                🏫 Institute Details & Official Branding
                            </h3>

                            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                                {/* Logo Upload Section */}
                                <div>
                                    <label className="label" style={{ fontWeight: '700', marginBottom: '8px', display: 'block' }}>School Official Logo</label>
                                    <div style={{ display: 'flex', gap: '18px', alignItems: 'center', flexWrap: 'wrap', background: 'var(--surface-2)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                        {form.logo ? (
                                            <div style={{ position: 'relative' }}>
                                                <img src={form.logo} alt="Logo" style={{ width: '80px', height: '80px', borderRadius: '10px', objectFit: 'contain', background: '#ffffff', padding: '6px', border: '1px solid var(--border)' }} />
                                            </div>
                                        ) : (
                                            <div style={{ width: '80px', height: '80px', borderRadius: '10px', background: 'var(--surface)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--border)', color: 'var(--text-muted)', fontSize: '28px' }}>
                                                🏫
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <label className="btn btn-primary" style={{ cursor: 'pointer', padding: '8px 16px', fontSize: '13px', fontWeight: '700' }}>
                                                    📁 {form.logo ? 'Change Logo' : 'Upload Logo'}
                                                    <input type="file" accept="image/*" hidden onChange={handleLogoUpload} />
                                                </label>
                                                {form.logo && (
                                                    <button type="button" onClick={handleRemoveLogo} className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '13px', color: '#ef4444' }}>
                                                        🗑️ Remove
                                                    </button>
                                                )}
                                            </div>
                                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Appears on TC, Marksheet, Admit Card & Receipts (PNG/JPG, max 2MB)</span>
                                        </div>
                                    </div>
                                </div>

                                {/* School Name */}
                                <div>
                                    <label className="label" style={{ fontWeight: '700' }}>School Name *</label>
                                    <input className="input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Universal Day Boarding Academy" style={{ fontSize: '15px', fontWeight: '600' }} />
                                </div>

                                {/* School Code & DISE Code */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                    <div>
                                        <label className="label" style={{ fontWeight: '700' }}>School ID / Code</label>
                                        <input className="input" value={form.schoolCode} onChange={e => setForm({ ...form, schoolCode: e.target.value })} placeholder="e.g. SCH-001 or CBSE Affil No." />
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>Appears on Top Violet Bar & Doc Headers</span>
                                    </div>
                                    <div>
                                        <label className="label" style={{ fontWeight: '700' }}>UDISE No. / Code</label>
                                        <input className="input" value={form.diseCode} onChange={e => setForm({ ...form, diseCode: e.target.value })} placeholder="e.g. 23040100101" />
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>Official 11-digit UDISE Number</span>
                                    </div>
                                </div>

                                {/* Phone & Email */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                    <div>
                                        <label className="label" style={{ fontWeight: '700' }}>Contact / Phone No. *</label>
                                        <input className="input" type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="e.g. +91 7879337770" />
                                    </div>
                                    <div>
                                        <label className="label" style={{ fontWeight: '700' }}>Official Email ID *</label>
                                        <input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="e.g. admin@uda.edu.in" />
                                    </div>
                                </div>

                                {/* Website & GST */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '14px' }}>
                                    <div>
                                        <label className="label" style={{ fontWeight: '700' }}>Website URL</label>
                                        <input className="input" type="text" value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} placeholder="e.g. https://www.udba.in" />
                                    </div>
                                    <div>
                                        <label className="label" style={{ fontWeight: '700' }}>GST / Reg. No.</label>
                                        <input className="input" type="text" value={form.gstNumber} onChange={e => setForm({ ...form, gstNumber: e.target.value })} placeholder="e.g. 23AAAAA0000A1Z5" />
                                    </div>
                                </div>

                                {/* Address */}
                                <div>
                                    <label className="label" style={{ fontWeight: '700' }}>School Complete Address *</label>
                                    <textarea className="input" rows={3} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Street address, City, District, State, PIN Code" style={{ resize: 'vertical' }} />
                                </div>

                                {/* Theme Color */}
                                <div>
                                    <label className="label" style={{ fontWeight: '700' }}>Brand Theme Color</label>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <input type="color" value={form.themeColor} onChange={e => setForm({ ...form, themeColor: e.target.value })} style={{ width: '48px', height: '42px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'none', padding: '2px' }} />
                                        <input className="input" style={{ flex: 1, fontFamily: 'monospace' }} value={form.themeColor} onChange={e => setForm({ ...form, themeColor: e.target.value })} />
                                    </div>
                                </div>

                                {/* Bank / UPI Details (For Fee Receipts) */}
                                <div style={{ background: 'var(--surface-2)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                    <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '12px', color: 'var(--text-primary)' }}>🏦 Payment & Receipt Details (Optional)</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                                        <div>
                                            <label className="label" style={{ fontSize: '12px' }}>UPI ID (for fees QR)</label>
                                            <input className="input" value={form.upiId} onChange={e => setForm({ ...form, upiId: e.target.value })} placeholder="e.g. school@upi" />
                                        </div>
                                        <div>
                                            <label className="label" style={{ fontSize: '12px' }}>Bank Account No.</label>
                                            <input className="input" value={form.bankAccountNo} onChange={e => setForm({ ...form, bankAccountNo: e.target.value })} placeholder="Account number" />
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div>
                                            <label className="label" style={{ fontSize: '12px' }}>Bank IFSC Code</label>
                                            <input className="input" value={form.ifscCode} onChange={e => setForm({ ...form, ifscCode: e.target.value })} placeholder="IFSC code" />
                                        </div>
                                        <div>
                                            <label className="label" style={{ fontSize: '12px' }}>Authorized Signatory Name</label>
                                            <input className="input" value={form.directorSign} onChange={e => setForm({ ...form, directorSign: e.target.value })} placeholder="Principal / Director" />
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    type="submit" 
                                    className="btn btn-primary" 
                                    disabled={saving}
                                    style={{ padding: '14px 24px', fontSize: '15px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: saving ? 'not-allowed' : 'pointer' }}
                                >
                                    {saving ? '⏳ Saving School Profile...' : '💾 Save All Changes'}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Right Preview Column */}
                    <div>
                        {/* Live Branding Preview */}
                        <div className="card" style={{ marginBottom: '20px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                <h3 style={{ fontWeight: '800', fontSize: '15px', margin: 0 }}>👁️ Live Document Header Branding</h3>
                                <span style={{ fontSize: '11px', background: 'rgba(99,102,241,0.15)', color: '#6366f1', padding: '3px 8px', borderRadius: '6px', fontWeight: '700' }}>Official Preview</span>
                            </div>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                                This header automatically appears on all generated <strong>TC</strong>, <strong>Marksheet</strong>, <strong>Admit Cards</strong>, and <strong>Fee Receipts</strong>:
                            </p>

                            {/* White paper sheet preview */}
                            <div style={{ padding: '24px 20px', background: '#ffffff', color: '#0f172a', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', border: '2px solid #e2e8f0', textAlign: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '12px' }}>
                                    {form.logo ? (
                                        <img src={form.logo} alt="School Logo" style={{ width: '64px', height: '64px', objectFit: 'contain' }} />
                                    ) : (
                                        <div style={{ width: '64px', height: '64px', borderRadius: '8px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', border: '1px solid #cbd5e1' }}>
                                            🏫
                                        </div>
                                    )}
                                </div>
                                <div style={{ fontSize: '20px', fontWeight: '900', textTransform: 'uppercase', color: '#0f172a', letterSpacing: '0.5px' }}>
                                    {form.name || 'YOUR SCHOOL NAME'}
                                </div>
                                <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px', lineHeight: '1.4' }}>
                                    {form.address || 'School Complete Address will appear here'}
                                </div>
                                <div style={{ fontSize: '12px', color: '#334155', marginTop: '4px', fontWeight: '600' }}>
                                    {form.phone ? `Ph: ${form.phone}` : ''} {form.email ? ` | Email: ${form.email}` : ''} {form.website ? ` | Web: ${form.website}` : ''}
                                </div>

                                <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '2px solid #0f172a', display: 'flex', justifyContent: 'center', gap: '18px', fontSize: '13px', fontWeight: '800', color: '#1e293b' }}>
                                    <span>School ID: {form.schoolCode || '---'}</span>
                                    <span>•</span>
                                    <span>UDISE No: {form.diseCode || '---'}</span>
                                </div>

                                <div style={{ marginTop: '14px', background: '#f8fafc', padding: '8px', borderRadius: '6px', border: '1px dashed #cbd5e1', fontSize: '11px', color: '#64748b' }}>
                                    [ Document Body: Transfer Certificate / Marksheet / Admit Card / Receipt ]
                                </div>
                            </div>
                        </div>

                        {/* Violet Bar Preview */}
                        <div className="card" style={{ marginBottom: '20px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '16px' }}>
                            <h3 style={{ fontWeight: '800', marginBottom: '12px', fontSize: '15px' }}>
                                🟣 Top Violet Bar Preview (Super Admin)
                            </h3>
                            <div style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', borderRadius: '12px', padding: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap', color: 'white' }}>
                                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px 14px', borderRadius: '8px', flex: 1, minWidth: '120px' }}>
                                    <div style={{ fontSize: '10px', opacity: 0.85 }}>School Name</div>
                                    <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{form.name || 'School Name'}</div>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px 14px', borderRadius: '8px', flex: 1, minWidth: '100px' }}>
                                    <div style={{ fontSize: '10px', opacity: 0.85 }}>School ID</div>
                                    <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{form.schoolCode || 'Not Set'}</div>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px 14px', borderRadius: '8px', flex: 1, minWidth: '100px' }}>
                                    <div style={{ fontSize: '10px', opacity: 0.85 }}>UDISE No.</div>
                                    <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{form.diseCode || 'Not Set'}</div>
                                </div>
                            </div>
                        </div>

                        {/* Admin Account Info */}
                        <div className="card" style={{ borderRadius: '16px' }}>
                            <h3 style={{ fontWeight: '700', marginBottom: '16px', fontSize: '15px' }}>👤 Logged-in Administrator</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                                <div className="avatar" style={{ width: '48px', height: '48px', fontSize: '20px' }}>{user?.name?.charAt(0) || 'A'}</div>
                                <div>
                                    <div style={{ fontWeight: '700', fontSize: '15px' }}>{user?.name}</div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{user?.email}</div>
                                    <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: 'rgba(99,102,241,0.15)', color: 'var(--primary-light)', marginTop: '4px', display: 'inline-block' }}>{user?.role?.replace('_', ' ')}</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {[
                                    { label: 'School ID (Code)', value: form.schoolCode || 'Not Set' },
                                    { label: 'UDISE No.', value: form.diseCode || 'Not Set' },
                                    { label: 'Website', value: form.website || 'Not Set' },
                                    { label: 'Platform', value: 'UDA v3.0 ERP' },
                                ].map(i => (
                                    <div key={i.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--surface-2)', borderRadius: '8px', alignItems: 'center' }}>
                                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{i.label}</span>
                                        <span style={{ fontSize: '12px', fontWeight: '600', fontFamily: 'monospace' }}>{i.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
