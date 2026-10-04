import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/app/api/middleware'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    const { error, user } = requireAuth(req)
    if (error) return error

    try {
        const today = new Date()
        const currentMonth = today.getMonth() + 1
        const currentDay = today.getDate()

        let birthdays: { studentName: string, studentId: string }[] = []

        if (user!.role === 'STUDENT' && (user as any).studentId) {
            const student = await prisma.student.findUnique({
                where: { id: (user as any).studentId }
            })
            if (student && student.dob) {
                const dob = new Date(student.dob)
                if (dob.getMonth() + 1 === currentMonth && dob.getDate() === currentDay) {
                    birthdays.push({ studentName: student.fullName, studentId: student.id })
                }
            }
        } else if (user!.role === 'PARENT') {
            const parentProfile = await prisma.parentProfile.findUnique({
                where: { userId: user!.userId },
                include: { children: true }
            })
            if (parentProfile) {
                parentProfile.children.forEach(child => {
                    if (child.dob) {
                        const dob = new Date(child.dob)
                        if (dob.getMonth() + 1 === currentMonth && dob.getDate() === currentDay) {
                            birthdays.push({ studentName: child.fullName, studentId: child.id })
                        }
                    }
                })
            }
        }

        return NextResponse.json({ success: true, data: birthdays })
    } catch (err) {
        console.error('Birthdays check error:', err)
        return NextResponse.json({ error: 'Failed to check birthdays' }, { status: 500 })
    }
}
