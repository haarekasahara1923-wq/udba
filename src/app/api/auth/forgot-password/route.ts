import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json()

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 })
        }

        // Check in User table
        const user = await prisma.user.findFirst({
            where: { email: email.toLowerCase() }
        })

        // Check in Affiliate table if not found in User
        const affiliate = await prisma.affiliate.findUnique({
            where: { email: email.toLowerCase() }
        })

        if (!user && !affiliate) {
            // Return success even if not found to prevent email enumeration
            return NextResponse.json({ success: true, message: 'If an account exists with this email, you will receive a reset link.' })
        }

        const resetToken = crypto.randomBytes(32).toString('hex')
        const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour from now

        if (user) {
            await prisma.user.update({
                where: { id: user.id },
                data: { resetToken, resetTokenExpiry }
            })
        } else if (affiliate) {
            await prisma.affiliate.update({
                where: { id: affiliate.id },
                data: { resetToken, resetTokenExpiry }
            })
        }

        const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`

        // Send Email via Resend
        const resend = new Resend(process.env.RESEND_API_KEY)
        const emailFrom = process.env.EMAIL_FROM || 'UDBA <onboarding@resend.dev>'
        
        console.log('Attempting to send reset email from:', emailFrom)
        
        const { data, error: resendError } = await resend.emails.send({
            from: emailFrom,
            to: email,
            subject: 'Password Reset Request',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px;">
                    <h2 style="color: #4f46e5; text-align: center;">Password Reset Request</h2>
                    <p>Hello,</p>
                    <p>We received a request to reset your password. Click the button below to set a new password. This link is valid for 1 hour.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Reset Password</a>
                    </div>
                    <p>If you didn't request this, you can safely ignore this email.</p>
                    <p style="font-size: 11px; color: #9ca3af; margin-top: 40px; text-align: center;">
                        UDBA Team<br>
                        ${resetUrl}
                    </p>
                </div>
            `
        })

        if (resendError) {
            console.error('Resend API error:', resendError)
            return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
        }

        console.log('Resend success data:', data)

        return NextResponse.json({ success: true, message: 'Reset link sent to your email.' })
    } catch (error) {
        console.error('Forgot password error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
