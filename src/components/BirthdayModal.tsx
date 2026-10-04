'use client'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface Birthday {
    studentName: string;
    studentId: string;
}

export default function BirthdayModal() {
    const { token, tenant } = useAuth()
    const [birthdays, setBirthdays] = useState<Birthday[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isOpen, setIsOpen] = useState(false)
    const cardRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!token) return;

        const checkBirthdays = async () => {
            try {
                const res = await fetch('/api/birthdays', {
                    headers: { Authorization: `Bearer ${token}` }
                })
                const data = await res.json()
                
                if (data.success && data.data.length > 0) {
                    const todayStr = new Date().toISOString().split('T')[0];
                    const activeBirthdays = data.data.filter((b: Birthday) => {
                        const dismissed = localStorage.getItem(`bday_dismissed_${b.studentId}_${todayStr}`);
                        return !dismissed;
                    });
                    
                    if (activeBirthdays.length > 0) {
                        setBirthdays(activeBirthdays);
                        setIsOpen(true);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch birthdays", err)
            }
        }
        
        checkBirthdays();
    }, [token])

    const handleClose = () => {
        if (birthdays.length > 0) {
            const todayStr = new Date().toISOString().split('T')[0];
            const currentBday = birthdays[currentIndex];
            localStorage.setItem(`bday_dismissed_${currentBday.studentId}_${todayStr}`, 'true');
            
            if (currentIndex < birthdays.length - 1) {
                setCurrentIndex(currentIndex + 1);
            } else {
                setIsOpen(false);
            }
        } else {
            setIsOpen(false);
        }
    }

    const handleDownloadPDF = async () => {
        if (!cardRef.current) return;
        try {
            const html2pdf = (await import('html2pdf.js')).default;
            const element = cardRef.current;
            const opt = {
                margin: 0,
                filename: `birthday_wishes_${birthdays[currentIndex].studentName.replace(/\s+/g, '_')}.pdf`,
                image: { type: 'jpeg' as const, quality: 0.98 },
                html2canvas: { scale: 3, useCORS: true },
                jsPDF: { unit: 'mm' as const, format: 'a5', orientation: 'landscape' as const }
            };
            html2pdf().set(opt).from(element).save();
        } catch (err) {
            console.error('Failed to download PDF:', err);
        }
    }

    if (!isOpen || birthdays.length === 0) return null;

    const currentBday = birthdays[currentIndex];

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 99999, padding: '20px'
        }}>
            <div style={{
                position: 'relative',
                background: 'linear-gradient(135deg, #ffffff 0%, #fef3c7 100%)',
                borderRadius: '24px',
                width: '100%',
                maxWidth: '600px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 8px rgba(255,255,255,0.2)',
                overflow: 'hidden',
                animation: 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}>
                {/* PDF Content Area */}
                <div ref={cardRef} style={{
                    padding: '40px',
                    textAlign: 'center',
                    background: 'url(/confetti-bg.png)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    position: 'relative'
                }}>
                    {/* Decorative Elements */}
                    <div style={{ position: 'absolute', top: '20px', left: '20px', fontSize: '40px', opacity: 0.8 }}>🎈</div>
                    <div style={{ position: 'absolute', top: '20px', right: '20px', fontSize: '40px', opacity: 0.8 }}>🎉</div>
                    <div style={{ position: 'absolute', bottom: '20px', left: '20px', fontSize: '40px', opacity: 0.8 }}>🎁</div>
                    <div style={{ position: 'absolute', bottom: '20px', right: '20px', fontSize: '40px', opacity: 0.8 }}>🎂</div>

                    {/* School Branding */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '30px' }}>
                        {tenant?.logo ? (
                            <img src={tenant.logo} alt="School Logo" style={{ width: '80px', height: '80px', objectFit: 'contain' }} crossOrigin="anonymous" />
                        ) : (
                            <div style={{ width: '80px', height: '80px', background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', color: 'white', fontWeight: 'bold' }}>
                                {tenant?.name?.charAt(0) || 'U'}
                            </div>
                        )}
                        <h2 style={{ margin: 0, fontSize: '20px', color: '#1e293b', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase' }}>
                            {tenant?.name || 'School Management'}
                        </h2>
                    </div>

                    <h1 style={{ 
                        fontSize: '48px', 
                        fontWeight: '900', 
                        background: 'linear-gradient(to right, #ec4899, #8b5cf6, #3b82f6)', 
                        WebkitBackgroundClip: 'text', 
                        WebkitTextFillColor: 'transparent',
                        margin: '0 0 20px 0',
                        fontFamily: '"Comic Sans MS", "Chalkboard SE", sans-serif'
                    }}>
                        Happy Birthday!
                    </h1>
                    
                    <h3 style={{ fontSize: '28px', color: '#334155', margin: '0 0 30px 0' }}>
                        {currentBday.studentName}
                    </h3>
                    
                    <p style={{ fontSize: '18px', color: '#475569', lineHeight: '1.6', maxWidth: '80%', margin: '0 auto', fontStyle: 'italic' }}>
                        "Wishing you a fantastic day filled with joy, laughter, and wonderful memories. May this special day bring you endless happiness!"
                    </p>
                    
                    <div style={{ marginTop: '30px', fontWeight: 'bold', color: '#1e293b', fontSize: '16px' }}>
                        Warm Wishes,<br/>
                        School Management
                    </div>
                </div>

                {/* Interactive Actions (Not included in PDF) */}
                <div style={{ padding: '20px', background: 'rgba(255,255,255,0.8)', borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>
                        {birthdays.length > 1 ? `Wish ${currentIndex + 1} of ${birthdays.length}` : ''}
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button 
                            onClick={handleDownloadPDF}
                            style={{ 
                                padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', 
                                borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' 
                            }}
                        >
                            <span>📥</span> Download PDF
                        </button>
                        <button 
                            onClick={handleClose}
                            style={{ 
                                padding: '10px 20px', background: '#e2e8f0', color: '#475569', border: 'none', 
                                borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' 
                            }}
                        >
                            Close
                        </button>
                    </div>
                </div>

                {/* Close Button Top Right */}
                <button 
                    onClick={handleClose}
                    style={{
                        position: 'absolute', top: '15px', right: '15px', width: '36px', height: '36px',
                        background: 'rgba(0,0,0,0.1)', border: 'none', borderRadius: '50%', color: '#334155',
                        fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10
                    }}
                >
                    &times;
                </button>
                
                <style dangerouslySetInnerHTML={{__html: `
                    @keyframes popIn {
                        0% { transform: scale(0.8); opacity: 0; }
                        100% { transform: scale(1); opacity: 1; }
                    }
                `}} />
            </div>
        </div>
    )
}
