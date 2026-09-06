'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const features = [
  { icon: '👨‍🎓', title: 'Student Management', desc: 'Admissions, profiles, class management with digital records & ID cards', color: '#1a5c38' },
  { icon: '💰', title: 'Fee Collection', desc: 'Installment plans, UPI/Cash/Bank receipts with automated reminders', color: '#f97316' },
  { icon: '📊', title: 'Live Analytics', desc: 'Real-time revenue, attendance & academic performance dashboards', color: '#2d8a57' },
  { icon: '📝', title: 'Exams & Tests', desc: 'MCQ + descriptive tests, auto evaluation, rank & digital report cards', color: '#ea580c' },
  { icon: '✅', title: 'Attendance System', desc: 'Daily class attendance, bulk marking, instant parent WhatsApp alerts', color: '#059669' },
  { icon: '🤖', title: 'AI Question Generator', desc: 'Generate MCQs & descriptive questions for any subject instantly', color: '#16a34a' },
  { icon: '💬', title: 'WhatsApp Automation', desc: 'Fee reminders, attendance alerts & notices via WhatsApp', color: '#25d366' },
  { icon: '📈', title: 'Lead / Enquiry CRM', desc: 'Enquiries, follow-ups, conversion tracking & pipeline analytics', color: '#f97316' },
  { icon: '👩‍🏫', title: 'Teacher Portal', desc: 'Staff profiles, homework, attendance & salary management', color: '#1a5c38' },
  { icon: '💼', title: 'Expense Tracking', desc: 'Rent, salary, utilities & operational expenses with P&L reports', color: '#ea580c' },
  { icon: '🚌', title: 'Transport Management', desc: 'Vehicle tracking, route management & driver coordination', color: '#2d8a57' },
  { icon: '🔒', title: 'Role-Based Access', desc: 'Admin, Teacher, Student, Parent & Driver — 5 dedicated portals', color: '#f97316' },
]

const roles = [
  { icon: '👑', title: 'School Admin', desc: 'Complete control — students, fees, reports, staff & settings' },
  { icon: '👩‍🏫', title: 'Teachers & Staff', desc: 'Attendance, homework, exam marking & class management' },
  { icon: '👨‍🎓', title: 'Students', desc: 'Results, attendance, notices, homework & fee status' },
  { icon: '👨‍👩‍👧', title: 'Parents', desc: 'Ward\'s progress, attendance, fees & instant school notifications' },
  { icon: '🚌', title: 'Bus Driver', desc: 'Route updates, transport logs & pickup/drop management' },
]

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkMobile = () => {
      if (window.innerWidth <= 768) {
        router.replace('/login')
      }
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [router])

  return (
    <div style={{ minHeight: '100vh', background: '#080e06', color: 'white', fontFamily: 'inherit' }}>

      {/* Navbar */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(8,14,6,0.90)', backdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(26,92,56,0.2)',
        padding: '0 32px', height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #1a5c38, #f97316)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🏫</div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: 'white', lineHeight: 1.2 }}>UDBA</div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.5px' }}>Universal Day Boarding Academy</div>
          </div>
        </div>

        <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: '36px' }}>
          {[['Features', '#features'], ['Roles', '#roles'], ['Contact', '#contact']].map(([label, href]) => (
            <a key={label} href={href} style={{ color: 'rgba(255,255,255,0.55)', fontSize: '14px', fontWeight: '500', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.target as HTMLElement).style.color = 'white'}
              onMouseLeave={e => (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.55)'}
            >{label}</a>
          ))}
        </div>

        <div className="hide-mobile" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Link href="/login" style={{ padding: '9px 24px', fontSize: '14px', fontWeight: '700', background: 'linear-gradient(135deg, #1a5c38, #f97316)', color: 'white', borderRadius: '8px', textDecoration: 'none', boxShadow: '0 4px 20px rgba(26,92,56,0.35)' }}>🔑 Staff Login</Link>
        </div>

        <button className="show-mobile" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{ background: 'rgba(26,92,56,0.15)', border: '1px solid rgba(26,92,56,0.3)', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', color: 'white', fontSize: '18px' }}>
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="fade-in" style={{ position: 'fixed', top: '64px', left: 0, right: 0, zIndex: 99, background: '#0d1a0a', borderBottom: '1px solid rgba(26,92,56,0.2)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[['Features', '#features'], ['Roles', '#roles'], ['Contact', '#contact']].map(([label, href]) => (
            <a key={label} href={href} onClick={() => setMobileMenuOpen(false)} style={{ color: 'white', fontSize: '16px', fontWeight: '600', textDecoration: 'none' }}>{label}</a>
          ))}
          <div style={{ height: '1px', background: 'rgba(26,92,56,0.2)' }} />
          <Link href="/login" onClick={() => setMobileMenuOpen(false)} style={{ padding: '12px', textAlign: 'center', background: 'linear-gradient(135deg, #1a5c38, #f97316)', color: 'white', borderRadius: '10px', textDecoration: 'none', fontWeight: '700' }}>🔑 Login to Portal</Link>
        </div>
      )}

      {/* Hero */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '120px 32px 80px', maxWidth: '1200px', margin: '0 auto', gap: '64px', flexWrap: 'wrap', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '15%', left: '-5%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(26,92,56,0.22) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '-5%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(40px)' }} />

        {/* Left text */}
        <div style={{ flex: '1', minWidth: '300px', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(26,92,56,0.15)', border: '1px solid rgba(26,92,56,0.4)', borderRadius: '50px', padding: '6px 16px', marginBottom: '28px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#2d8a57', display: 'inline-block' }} />
            <span style={{ fontSize: '13px', color: '#4ade80', fontWeight: '600' }}>🏫 Pinto Park, Gwalior (MP)</span>
          </div>

          <h1 style={{ fontSize: 'clamp(34px, 5vw, 62px)', fontWeight: '900', lineHeight: '1.1', marginBottom: '24px', letterSpacing: '-1px' }}>
            Universal Day<br />
            <span style={{ background: 'linear-gradient(135deg, #2d8a57, #f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Boarding Academy
            </span>
          </h1>

          <p style={{ fontSize: '17px', color: 'rgba(255,255,255,0.5)', maxWidth: '500px', lineHeight: '1.8', marginBottom: '36px' }}>
            Ek advanced school management system — students, fees, attendance, exams, transport aur parent communication sab ek jagah manage karein.
          </p>

          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '32px' }}>
            <Link href="/login" style={{ padding: '14px 36px', fontSize: '15px', fontWeight: '700', background: 'linear-gradient(135deg, #1a5c38, #0f3d26)', color: 'white', borderRadius: '12px', textDecoration: 'none', boxShadow: '0 8px 32px rgba(26,92,56,0.4)', border: '1px solid rgba(45,138,87,0.4)' }}>🔑 Login to Portal</Link>
            <a href="#features" style={{ padding: '14px 32px', fontSize: '15px', fontWeight: '600', background: 'rgba(255,255,255,0.06)', color: 'white', borderRadius: '12px', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.12)' }}>Explore Features →</a>
          </div>

          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            {['5 Role Portals', 'WhatsApp Alerts', 'AI-Powered'].map(t => (
              <span key={t} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ color: '#2d8a57' }}>✓</span> {t}
              </span>
            ))}
          </div>
        </div>

        {/* Right: dashboard mockup */}
        <div style={{ flex: '1', minWidth: '300px', position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'center' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(26,92,56,0.25)', borderRadius: '20px', padding: '28px', backdropFilter: 'blur(12px)', boxShadow: '0 32px 80px rgba(0,0,0,0.5)', maxWidth: '420px', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg,#1a5c38,#f97316)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🏫</div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '700' }}>UDBA Dashboard</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>Admin Panel • Live</div>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '5px' }}>
                {['#ef4444', '#f59e0b', '#10b981'].map(c => <div key={c} style={{ width: '10px', height: '10px', borderRadius: '50%', background: c }} />)}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              {[
                { label: 'Total Students', value: '486', icon: '👨‍🎓', color: '#1a5c38' },
                { label: 'Fee Collected', value: '₹3.8L', icon: '💰', color: '#f97316' },
                { label: 'Present Today', value: '92.4%', icon: '✅', color: '#10b981' },
                { label: 'Pending Dues', value: '₹42K', icon: '⚠️', color: '#ef4444' },
              ].map(card => (
                <div key={card.label} style={{ background: `linear-gradient(135deg, ${card.color}18, ${card.color}08)`, border: `1px solid ${card.color}30`, borderRadius: '12px', padding: '14px' }}>
                  <div style={{ fontSize: '20px', marginBottom: '6px' }}>{card.icon}</div>
                  <div style={{ fontSize: '18px', fontWeight: '800' }}>{card.value}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{card.label}</div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.3)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Recent Activity</div>
            {[
              { msg: 'Rahul Sharma ka fee ₹8,000 mila', time: '2m ago', dot: '#10b981' },
              { msg: 'Class 9-A ki attendance mark hui', time: '18m ago', dot: '#1a5c38' },
              { msg: 'New admission: Priya Patel', time: '1h ago', dot: '#f97316' },
            ].map(item => (
              <div key={item.msg} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.dot, flexShrink: 0 }} />
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)', flex: 1 }}>{item.msg}</span>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ padding: '96px 32px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(26,92,56,0.12)', border: '1px solid rgba(26,92,56,0.3)', borderRadius: '50px', padding: '6px 16px', marginBottom: '20px' }}>
            <span style={{ fontSize: '13px', color: '#4ade80', fontWeight: '600' }}>All-in-One Platform</span>
          </div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: '900', letterSpacing: '-0.5px' }}>
            UDBA ke liye sabkuch{' '}
            <span style={{ background: 'linear-gradient(135deg, #2d8a57, #f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ek platform par</span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', marginTop: '14px', fontSize: '15px' }}>12+ powerful modules to automate every aspect of school management</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
          {features.map(f => (
            <div key={f.title}
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(26,92,56,0.12)', borderRadius: '16px', padding: '24px', transition: 'all 0.25s', cursor: 'default' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = `${f.color}10`; el.style.borderColor = `${f.color}40`; el.style.transform = 'translateY(-4px)'; el.style.boxShadow = `0 12px 40px ${f.color}15` }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(255,255,255,0.02)'; el.style.borderColor = 'rgba(26,92,56,0.12)'; el.style.transform = 'translateY(0)'; el.style.boxShadow = 'none' }}>
              <div style={{ width: '48px', height: '48px', background: `${f.color}20`, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginBottom: '16px' }}>{f.icon}</div>
              <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '8px' }}>{f.title}</h3>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.7' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Roles Section */}
      <section id="roles" style={{ padding: '80px 32px', background: 'rgba(26,92,56,0.04)', borderTop: '1px solid rgba(26,92,56,0.12)', borderBottom: '1px solid rgba(26,92,56,0.12)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 42px)', fontWeight: '900', marginBottom: '14px' }}>
              5 Dedicated{' '}
              <span style={{ background: 'linear-gradient(135deg, #2d8a57, #f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Role Portals</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '15px' }}>Har role ke liye alag, customized experience</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
            {roles.map(r => (
              <div key={r.title} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(26,92,56,0.18)', borderRadius: '16px', padding: '24px 20px', textAlign: 'center', transition: 'all 0.25s' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(249,115,22,0.4)'; el.style.background = 'rgba(249,115,22,0.06)'; el.style.transform = 'translateY(-3px)'; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(26,92,56,0.18)'; el.style.background = 'rgba(255,255,255,0.03)'; el.style.transform = 'translateY(0)'; }}>
                <div style={{ fontSize: '36px', marginBottom: '12px' }}>{r.icon}</div>
                <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>{r.title}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.6' }}>{r.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA / Contact */}
      <section id="contact" style={{ padding: '96px 32px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '600px', height: '400px', background: 'radial-gradient(ellipse, rgba(26,92,56,0.18) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(30px)' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '640px', margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 52px)', fontWeight: '900', marginBottom: '16px', letterSpacing: '-0.5px' }}>
            Sampark Karein<br />
            <span style={{ background: 'linear-gradient(135deg, #2d8a57, #f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Universal Day Boarding Academy</span>
          </h2>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.45)', marginBottom: '16px', lineHeight: '1.7' }}>
            Pinto Park, Gwalior (MP)
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '36px' }}>
            <a href="https://wa.me/917879337770" target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 28px', fontSize: '15px', fontWeight: '700', background: '#25d366', color: 'white', borderRadius: '12px', textDecoration: 'none', boxShadow: '0 8px 24px rgba(37,211,102,0.3)' }}>
              💬 WhatsApp: +91 7879337770
            </a>
            <a href="mailto:info@udba.space"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 28px', fontSize: '15px', fontWeight: '600', background: 'rgba(255,255,255,0.06)', color: 'white', borderRadius: '12px', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.12)' }}>
              📧 info@udba.space
            </a>
          </div>

          <Link href="/login" style={{ display: 'inline-block', padding: '16px 48px', fontSize: '16px', fontWeight: '700', background: 'linear-gradient(135deg, #1a5c38, #f97316)', color: 'white', borderRadius: '14px', textDecoration: 'none', boxShadow: '0 12px 40px rgba(26,92,56,0.4)' }}>
            🔑 Portal Login →
          </Link>
          <p style={{ marginTop: '20px', fontSize: '13px', color: 'rgba(255,255,255,0.25)' }}>
            📞 +91 7879337770 &nbsp;•&nbsp; 📧 info@udba.space
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: 'rgba(26,92,56,0.05)', borderTop: '1px solid rgba(26,92,56,0.15)', padding: '40px 32px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #1a5c38, #f97316)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🏫</div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: '800', fontSize: '16px' }}>UDBA</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>Universal Day Boarding Academy</div>
          </div>
        </div>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.25)', lineHeight: '1.8' }}>
          © 2026 Universal Day Boarding Academy, Pinto Park, Gwalior (MP). All rights reserved.<br />
          📞 +91 7879337770 &nbsp;•&nbsp; 📧 info@udba.space &nbsp;•&nbsp; Powered by Next.js
        </p>
      </footer>
    </div>
  )
}
