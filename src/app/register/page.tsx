'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

/**
 * UDBA Single-School System:
 * Public self-registration is disabled. Users are added by the admin.
 * This page redirects to login with an informational message.
 */
export default function RegisterPage() {
    const router = useRouter()

    useEffect(() => {
        const storedUser = localStorage.getItem('udba_user')
        if (storedUser) {
            try {
                const user = JSON.parse(storedUser)
                if (user.role === 'STUDENT') router.push('/portal/student')
                else if (user.role === 'PARENT') router.push('/portal/parent')
                else if (user.role === 'DRIVER') router.push('/portal/driver')
                else if (user.role === 'TEACHER' || user.role === 'STAFF') router.push('/portal/staff')
                else if (user.role === 'SUPER_ADMIN') router.push('/dashboard/super-admin/tenants')
                else router.push('/dashboard')
            } catch { /* ignore */ }
        }
    }, [router])

    return (
        <div style={{ minHeight: '100vh', background: '#0a1208', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse at center, rgba(26,92,56,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

            <div style={{ width: '100%', maxWidth: '480px', textAlign: 'center', position: 'relative' }}>
                <div style={{ width: '64px', height: '64px', background: 'linear-gradient(135deg, #1a5c38, #f97316)', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto 24px', boxShadow: '0 8px 32px rgba(26,92,56,0.4)' }}>🏫</div>

                <h1 style={{ fontSize: '24px', fontWeight: '900', color: 'white', marginBottom: '8px' }}>Universal Day Boarding Academy</h1>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', marginBottom: '32px' }}>📍 Pinto Park, Gwalior (MP)</p>

                <div style={{ background: '#111a0e', border: '1px solid rgba(249,115,22,0.25)', borderRadius: '20px', padding: '32px', marginBottom: '24px' }}>
                    <div style={{ fontSize: '40px', marginBottom: '16px' }}>ℹ️</div>
                    <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'white', marginBottom: '12px' }}>
                        Self-Registration Unavailable
                    </h2>
                    <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.8', marginBottom: '24px' }}>
                        UDBA mein new accounts school administration dwara create kiye jaate hain.<br />
                        Apna account activate karne ke liye school se contact karein.
                    </p>

                    <div style={{ background: 'rgba(26,92,56,0.1)', border: '1px solid rgba(26,92,56,0.25)', borderRadius: '12px', padding: '16px', marginBottom: '24px', textAlign: 'left' }}>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#4ade80', marginBottom: '10px' }}>📞 Sampark Karein</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <a href="https://wa.me/917879337770" target="_blank" rel="noopener noreferrer"
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#25d366', fontSize: '14px', textDecoration: 'none', fontWeight: '600' }}>
                                💬 WhatsApp: +91 7879337770
                            </a>
                            <a href="mailto:info@udba.space"
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#60a5fa', fontSize: '14px', textDecoration: 'none', fontWeight: '600' }}>
                                📧 info@udba.space
                            </a>
                        </div>
                    </div>

                    <Link href="/login" style={{ display: 'block', width: '100%', padding: '13px', background: 'linear-gradient(135deg, #1a5c38, #0f3d26)', color: 'white', borderRadius: '12px', textDecoration: 'none', fontSize: '15px', fontWeight: '700', boxShadow: '0 4px 16px rgba(26,92,56,0.35)', border: '1px solid rgba(45,138,87,0.4)' }}>
                        🔑 Already have an account? Login
                    </Link>
                </div>

                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.15)' }}>
                    <Link href="/" style={{ color: 'rgba(255,255,255,0.2)', textDecoration: 'none' }}>← Back to Home</Link>
                </p>
            </div>
        </div>
    )
}
