'use client'
import { useAuth } from '@/contexts/AuthContext'
import { useState } from 'react'

export default function ProfilePage() {
    const { tenant, user, token } = useAuth()
    const [form, setForm] = useState({
        name: tenant?.name || '',
        phone: tenant?.phone || '',
        email: tenant?.email || '',
        address: tenant?.address || '',
        themeColor: tenant?.themeColor || '#6366f1',
        logo: tenant?.logo || '',
        schoolCode: tenant?.schoolCode || '',
        diseCode: tenant?.diseCode || ''
    })
    const [saved, setSaved] = useState(false)
    const [saving, setSaving] = useState(false)

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setForm({ ...form, logo: reader.result as string })
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        try {
            const res = await fetch('/api/tenant', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(form)
            })
            const data = await res.json()
            if (data.success) {
                setSaved(true)
                
                // Update local storage so Context has the new data on reload
                if (tenant) {
                    localStorage.setItem('udba_tenant', JSON.stringify({ ...tenant, ...form }))
                }
                
                setTimeout(() => {
                    setSaved(false)
                    window.location.reload()
                }, 1000)
            } else {
                alert(data.error || 'Failed to update')
            }
        } catch (err) {
            alert('Error updating profile')
        }
        setSaving(false)
    }

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">🏢 school profile</h1>
                    <p className="page-subtitle">Manage your institute details and branding</p>
                </div>
            </div>

            {saved && <div className="toast toast-success" style={{ position: 'relative', marginBottom: '16px', maxWidth: '100%' }}>✓ Profile updated successfully!</div>}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                    <div className="card" style={{ marginBottom: '20px' }}>
                        <h3 style={{ fontWeight: '700', marginBottom: '20px', fontSize: '16px', color: 'var(--primary-light)' }}>🏫 Institute Details</h3>
                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                {form.logo ? (
                                    <img src={form.logo} alt="Logo" style={{ width: '64px', height: '64px', borderRadius: '8px', objectFit: 'contain', background: 'var(--surface-2)' }} />
                                ) : (
                                    <div style={{ width: '64px', height: '64px', borderRadius: '8px', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🏢</div>
                                )}
                                <div>
                                    <label className="btn btn-secondary" style={{ cursor: 'pointer', padding: '6px 12px', fontSize: '13px' }}>
                                        Upload Logo
                                        <input type="file" accept="image/*" hidden onChange={handleLogoUpload} />
                                    </label>
                                </div>
                            </div>
                            <div>
                                <label className="label">school name</label>
                                <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="label">Phone Number</label>
                                <input className="input" type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                            </div>
                            <div>
                                <label className="label">Email</label>
                                <input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                            </div>
                            <div>
                                <label className="label">School Code</label>
                                <input className="input" type="text" value={form.schoolCode} onChange={e => setForm({ ...form, schoolCode: e.target.value })} />
                            </div>
                            <div>
                                <label className="label">DISE Code</label>
                                <input className="input" type="text" value={form.diseCode} onChange={e => setForm({ ...form, diseCode: e.target.value })} />
                            </div>
                            <div>
                                <label className="label">Address</label>
                                <textarea className="input" rows={3} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} style={{ resize: 'none' }} />
                            </div>
                            <div>
                                <label className="label">Brand Color</label>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <input type="color" value={form.themeColor} onChange={e => setForm({ ...form, themeColor: e.target.value })} style={{ width: '48px', height: '40px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'none', padding: '2px' }} />
                                    <input className="input" style={{ flex: 1 }} value={form.themeColor} onChange={e => setForm({ ...form, themeColor: e.target.value })} />
                                </div>
                            </div>
                            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : '💾 Save Changes'}</button>
                        </form>
                    </div>
                </div>

                <div>
                    {/* Preview Card */}
                    <div className="card" style={{ marginBottom: '20px', background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(236,72,153,0.05))' }}>
                        <h3 style={{ fontWeight: '700', marginBottom: '16px', fontSize: '15px' }}>👁️ Preview</h3>
                        <div style={{ padding: '20px', background: 'var(--surface)', borderRadius: '12px', border: `2px solid ${form.themeColor}40` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                <div style={{ width: '48px', height: '48px', background: `linear-gradient(135deg, ${form.themeColor}, ${form.themeColor}88)`, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🎓</div>
                                <div>
                                    <div style={{ fontWeight: '800', fontSize: '16px', color: 'white' }}>{form.name || 'Your school name'}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{form.phone}</div>
                                </div>
                            </div>
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{form.address || 'Your institute address...'}</div>
                        </div>
                    </div>

                    {/* Admin Info */}
                    <div className="card">
                        <h3 style={{ fontWeight: '700', marginBottom: '16px', fontSize: '15px' }}>👤 Admin Account</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                            <div className="avatar" style={{ width: '56px', height: '56px', fontSize: '24px' }}>{user?.name?.charAt(0) || 'A'}</div>
                            <div>
                                <div style={{ fontWeight: '700', fontSize: '16px' }}>{user?.name}</div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{user?.email}</div>
                                <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: 'rgba(99,102,241,0.15)', color: 'var(--primary-light)', marginTop: '4px', display: 'inline-block' }}>{user?.role?.replace('_', ' ')}</span>
                            </div>
                        </div>

                        {/* Quick Info */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {[
                                { label: 'School ID', value: user?.tenantId?.slice(0, 12) + '...' || '' },
                                { label: 'School Code', value: tenant?.schoolCode || 'Not Set' },
                                { label: 'DISE Code', value: tenant?.diseCode || 'Not Set' },
                                { label: 'Platform', value: 'UDBA v2.0' },
                                { label: 'Region', value: 'India (Asia-South)' },
                            ].map(i => (
                                <div key={i.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--surface-2)', borderRadius: '8px', alignItems: 'center' }}>
                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{i.label}</span>
                                    <span style={{ fontSize: '12px', fontWeight: '600', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {i.value}
                                        {i.value !== 'Not Set' && i.value !== 'UDBA v2.0' && i.value !== 'India (Asia-South)' && (
                                            <button 
                                                onClick={() => {
                                                    let textToCopy = i.value;
                                                    if (i.label === 'School ID' && user?.tenantId) textToCopy = user.tenantId;
                                                    navigator.clipboard.writeText(textToCopy);
                                                }} 
                                                style={{ cursor: 'pointer', background: 'none', border: 'none', color: 'var(--primary-light)', padding: '2px', display: 'flex' }}
                                                title={`Copy ${i.label}`}
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                            </button>
                                        )}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
