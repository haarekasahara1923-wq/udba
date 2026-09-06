'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
    const router = useRouter()
    const [role, setRole] = useState('STUDENT')
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const rolesList = [
        { key: 'STUDENT', label: 'Student', icon: '👨‍🎓' },
        { key: 'PARENT', label: 'Parent', icon: '👨‍👩‍👧' },
        { key: 'TEACHER', label: 'Teacher', icon: '👩‍🏫' },
        { key: 'DRIVER', label: 'Driver', icon: '🚌' },
    ]

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    email,
                    phone: phone || email,
                    password,
                    role,
                }),
            })

            const data = await res.json()

            if (!res.ok || !data.success) {
                setError(data.error || 'Registration failed')
                setLoading(false)
                return
            }

            // Save tokens & user data
            localStorage.setItem('udba_token', data.accessToken)
            localStorage.setItem('udba_user', JSON.stringify(data.user))
            localStorage.setItem('udba_tenant', JSON.stringify(data.tenant))
            localStorage.setItem('udba_refresh', data.refreshToken)

            // Redirect based on role
            if (role === 'STUDENT') router.push('/portal/student')
            else if (role === 'PARENT') router.push('/portal/parent')
            else if (role === 'DRIVER') router.push('/portal/driver')
            else if (role === 'TEACHER') router.push('/portal/staff')
            else router.push('/dashboard')
        } catch (err: any) {
            setError(err?.message || 'Network error occurred')
            setLoading(false)
        }
    }

    return (
        <div style={{ minHeight: '100vh', background: '#0a1208', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse at center, rgba(26,92,56,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />

            <div style={{ width: '100%', maxWidth: '440px', position: 'relative' }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                    <div style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg, #1a5c38, #f97316)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 14px', boxShadow: '0 8px 30px rgba(26,92,56,0.4)' }}>🏫</div>
                    <h1 style={{ fontSize: '22px', fontWeight: '900', color: 'white' }}>Create UDBA Account</h1>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginTop: '4px' }}>Universal Day Boarding Academy, Gwalior</p>
                </div>

                {/* Form Box */}
                <div style={{ background: '#111a0e', border: '1px solid rgba(26,92,56,0.25)', borderRadius: '20px', padding: '28px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
                    {/* Role Selector */}
                    <div style={{ display: 'flex', gap: '6px', background: '#172014', padding: '4px', borderRadius: '12px', marginBottom: '20px' }}>
                        {rolesList.map(r => (
                            <button
                                key={r.key}
                                type="button"
                                onClick={() => setRole(r.key)}
                                style={{
                                    flex: 1,
                                    padding: '8px 4px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: role === r.key ? 'linear-gradient(135deg, #1a5c38, #0f3d26)' : 'transparent',
                                    color: role === r.key ? 'white' : 'rgba(255,255,255,0.4)',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
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

                    <form onSubmit={handleRegister}>
                        <div style={{ marginBottom: '14px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>Full Name *</label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Enter full name"
                                style={{ width: '100%', padding: '10px 14px', background: '#172014', border: '1px solid rgba(26,92,56,0.3)', borderRadius: '10px', color: 'white', fontSize: '14px', outline: 'none' }}
                            />
                        </div>

                        <div style={{ marginBottom: '14px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>Email Address *</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="name@example.com"
                                style={{ width: '100%', padding: '10px 14px', background: '#172014', border: '1px solid rgba(26,92,56,0.3)', borderRadius: '10px', color: 'white', fontSize: '14px', outline: 'none' }}
                            />
                        </div>

                        <div style={{ marginBottom: '14px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>Phone / WhatsApp Number</label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                placeholder="9876543210"
                                style={{ width: '100%', padding: '10px 14px', background: '#172014', border: '1px solid rgba(26,92,56,0.3)', borderRadius: '10px', color: 'white', fontSize: '14px', outline: 'none' }}
                            />
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>Password *</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Create a secure password"
                                style={{ width: '100%', padding: '10px 14px', background: '#172014', border: '1px solid rgba(26,92,56,0.3)', borderRadius: '10px', color: 'white', fontSize: '14px', outline: 'none' }}
                            />
                        </div>

                        {error && (
                            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '10px', marginBottom: '16px', fontSize: '13px', color: '#fca5a5' }}>
                                ⚠️ {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            style={{ width: '100%', padding: '12px', background: loading ? '#1a5c38' : 'linear-gradient(135deg, #1a5c38, #0f3d26)', color: 'white', border: '1px solid rgba(45,138,87,0.4)', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 16px rgba(26,92,56,0.35)' }}
                        >
                            {loading ? 'Creating Account...' : '✨ Create Account & Login'}
                        </button>
                    </form>
                </div>

                {/* Footer link to login */}
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
                        Already have an account?{' '}
                        <Link href="/login" style={{ color: '#4ade80', fontWeight: '700', textDecoration: 'none' }}>
                            Sign In here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
