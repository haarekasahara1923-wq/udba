'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function AffiliateRegisterPage() {
    const router = useRouter()
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        bankAccountNumber: '',
        ifscCode: '',
        upiId: ''
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const res = await fetch('/api/affiliates/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })
            const data = await res.json()

            if (!data.success) {
                setError(data.error || 'Registration failed')
                setLoading(false)
                return
            }

            // Store auth data
            localStorage.setItem('udba_token', data.accessToken)
            localStorage.setItem('udba_user', JSON.stringify(data.user))
            localStorage.setItem('udba_refresh', data.refreshToken)
            localStorage.removeItem('udba_tenant')
            localStorage.removeItem('udba_subscription')

            setSuccess(true)
            setTimeout(() => window.location.href = '/dashboard/global-affiliate', 1500)
        } catch {
            setError('Network error. Please try again.')
        }
        setLoading(false)
    }

    if (success) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
                    <h2 style={{ fontSize: '28px', fontWeight: '800', color: 'white', marginBottom: '8px' }}>Welcome to UDBA Global Affiliate!</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Account created successfully. Redirecting to your dashboard...</p>
                    <div className="spinner" style={{ margin: '20px auto' }} />
                </div>
            </div>
        )
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse at top right, rgba(16, 185, 129, 0.1) 0%, transparent 60%)', pointerEvents: 'none' }} />

            <div style={{ width: '100%', maxWidth: '480px' }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 16px' }}>💰</div>
                    <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'white' }}>Become a Partner</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '6px', fontSize: '14px' }}>Earn 40% on first payment & 20% recurring for every coaching center you refer!</p>
                </div>

                <div className="card" style={{ borderRadius: '20px', padding: '32px' }}>
                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '16px' }}>
                            <label className="label">Full Name</label>
                            <input className="input" placeholder="Rahul Singh" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label className="label">Email Address</label>
                            <input type="email" className="input" placeholder="rahul@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label className="label">Phone (Optional)</label>
                            <input className="input" placeholder="917879337770" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label className="label">Password</label>
                            <input type="password" className="input" placeholder="Minimum 6 characters" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} />
                        </div>

                        <div style={{ marginTop: '24px', marginBottom: '16px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: 'white', marginBottom: '12px' }}>Payout Details (Optional, can add later)</div>
                            <div style={{ marginBottom: '16px' }}>
                                <label className="label">UPI ID</label>
                                <input className="input" placeholder="yourname@okaxis" value={form.upiId} onChange={e => setForm({ ...form, upiId: e.target.value })} />
                            </div>
                        </div>

                        {error && (
                            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '12px', marginBottom: '16px', fontSize: '14px', color: '#fca5a5' }}>
                                ⚠️ {error}
                            </div>
                        )}

                        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', fontSize: '15px', padding: '13px', background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                            {loading ? <><div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} /> Creating account...</> : '🚀 Join Affiliate Program'}
                        </button>
                    </form>

                    <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                        Already an affiliate?{' '}
                        <Link href="/affiliate-login" style={{ color: '#10b981', fontWeight: '600' }}>Sign In</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
