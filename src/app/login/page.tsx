'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'

// UDBA Single School — tenantId is auto-injected from env
const SCHOOL_TENANT_ID = process.env.NEXT_PUBLIC_SCHOOL_TENANT_ID || ''

function LoginForm() {
    const { user, login } = useAuth()
    const router = useRouter()
    const [role, setRole] = useState('COACHING_ADMIN')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (user) {
            redirectByRole(user.role)
        }
    }, [user, router])

    const redirectByRole = (role: string) => {
        if (role === 'STUDENT') {
            router.push('/portal/student')
        } else if (role === 'PARENT') {
            router.push('/portal/parent')
        } else if (role === 'DRIVER') {
            router.push('/portal/driver')
        } else if (role === 'TEACHER' || role === 'STAFF') {
            router.push('/portal/staff')
        } else if (role === 'SUPER_ADMIN') {
            router.push('/dashboard/super-admin/tenants')
        } else {
            router.push('/dashboard')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        // For non-admin roles, use the school's tenantId from env
        const tenantId = (role !== 'COACHING_ADMIN' && role !== 'SUPER_ADMIN')
            ? SCHOOL_TENANT_ID
            : undefined

        const result = await login(email, password, role, tenantId)
        setLoading(false)

        if (result.success) {
            const storedUser = localStorage.getItem('udba_user')
            if (storedUser) {
                const user = JSON.parse(storedUser)
                redirectByRole(user.role)
            } else {
                router.push('/dashboard')
            }
        } else {
            setError(result.error || 'Login failed')
        }
    }

    const rolesList = [
        { key: 'COACHING_ADMIN', label: 'Admin', icon: '👑' },
        { key: 'TEACHER', label: 'Teacher', icon: '👩‍🏫' },
        { key: 'STUDENT', label: 'Student', icon: '👨‍🎓' },
        { key: 'PARENT', label: 'Parent', icon: '👨‍👩‍👧' },
        { key: 'DRIVER', label: 'Driver', icon: '🚌' },
    ]

    return (
        <div style={{ minHeight: '100vh', background: '#0a1208', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            {/* Background glow */}
            <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse at 30% 50%, rgba(26,92,56,0.12) 0%, transparent 60%)', pointerEvents: 'none' }} />
            <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse at 70% 50%, rgba(249,115,22,0.06) 0%, transparent 60%)', pointerEvents: 'none' }} />

            <div style={{ width: '100%', maxWidth: '420px', position: 'relative' }}>
                {/* Logo & school name */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{ width: '64px', height: '64px', background: 'linear-gradient(135deg, #1a5c38, #f97316)', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto 16px', boxShadow: '0 8px 32px rgba(26,92,56,0.4)' }}>🏫</div>
                    <h1 style={{ fontSize: '22px', fontWeight: '900', color: 'white', lineHeight: 1.2 }}>Universal Day Boarding Academy</h1>
                    <p style={{ color: 'rgba(255,255,255,0.35)', marginTop: '6px', fontSize: '13px' }}>📍 Pinto Park, Gwalior (MP)</p>
                    <p style={{ color: 'rgba(255,255,255,0.25)', marginTop: '4px', fontSize: '13px' }}>Welcome Back! Please sign in.</p>
                </div>

                {/* Form Card */}
                <div style={{ background: '#111a0e', border: '1px solid rgba(26,92,56,0.25)', borderRadius: '20px', padding: '32px' }}>
                    {/* Role Selection Tabs */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', background: '#172014', padding: '4px', borderRadius: '12px', marginBottom: '24px' }}>
                        {rolesList.map(r => (
                            <button
                                key={r.key}
                                type="button"
                                onClick={() => setRole(r.key)}
                                style={{
                                    flex: '1 1 auto',
                                    padding: '8px 6px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: role === r.key
                                        ? 'linear-gradient(135deg, #1a5c38, #0f3d26)'
                                        : 'transparent',
                                    color: role === r.key ? 'white' : 'rgba(255,255,255,0.4)',
                                    fontSize: '11px',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    whiteSpace: 'nowrap',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '2px',
                                    boxShadow: role === r.key ? '0 2px 8px rgba(26,92,56,0.4)' : 'none',
                                }}
                            >
                                <span style={{ fontSize: '14px' }}>{r.icon}</span>
                                {r.label}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>Email or Phone</label>
                            <input
                                type="text"
                                style={{ width: '100%', padding: '11px 14px', background: '#172014', border: '1px solid rgba(26,92,56,0.3)', borderRadius: '10px', color: 'white', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }}
                                placeholder="your@email.com or 917879337770"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                onFocus={e => (e.target.style.borderColor = '#2d8a57')}
                                onBlur={e => (e.target.style.borderColor = 'rgba(26,92,56,0.3)')}
                            />
                        </div>
                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <label style={{ fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.5)' }}>Password</label>
                                <Link href="/forgot-password" style={{ fontSize: '12px', color: '#2d8a57', fontWeight: '600', textDecoration: 'none' }}>Forgot password?</Link>
                            </div>
                            <input
                                type="password"
                                style={{ width: '100%', padding: '11px 14px', background: '#172014', border: '1px solid rgba(26,92,56,0.3)', borderRadius: '10px', color: 'white', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }}
                                placeholder="Enter your password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                onFocus={e => (e.target.style.borderColor = '#2d8a57')}
                                onBlur={e => (e.target.style.borderColor = 'rgba(26,92,56,0.3)')}
                            />
                        </div>

                        {error && (
                            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '12px', marginBottom: '16px', fontSize: '14px', color: '#fca5a5' }}>
                                ⚠️ {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            style={{ width: '100%', padding: '13px', background: loading ? '#1a5c38' : 'linear-gradient(135deg, #1a5c38, #0f3d26)', color: 'white', border: '1px solid rgba(45,138,87,0.4)', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s', boxShadow: '0 4px 16px rgba(26,92,56,0.35)' }}
                        >
                            {loading ? (
                                <>
                                    <div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                                    Signing in...
                                </>
                            ) : '🔑 Sign In to Portal'}
                        </button>
                    </form>
                </div>

                {/* Contact info */}
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.2)' }}>
                        Need help?{' '}
                        <a href="https://wa.me/917879337770" target="_blank" rel="noopener noreferrer"
                            style={{ color: '#25d366', fontWeight: '600', textDecoration: 'none' }}>
                            WhatsApp: +91 7879337770
                        </a>
                    </p>
                    <p style={{ marginTop: '10px', fontSize: '12px', color: 'rgba(255,255,255,0.15)' }}>
                        <Link href="/" style={{ color: 'rgba(255,255,255,0.2)', textDecoration: 'none' }}>← Back to Home</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <AuthProvider>
            <LoginForm />
        </AuthProvider>
    )
}
