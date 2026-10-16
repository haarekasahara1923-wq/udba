import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { requireAuth, requireWriteAccess, checkPlanLimit } from '@/app/api/middleware'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
    const { error, user } = requireAuth(req)
    if (error) return error

    try {
        const teachers = await prisma.teacher.findMany({
            where: { tenantId: user!.tenantId },
            orderBy: { createdAt: 'desc' }
        })

        // Plan limits removed - unlimited teachers
        return NextResponse.json({
            success: true,
            data: teachers,
            total: teachers.length,
            planInfo: {
                limit: -1,
                used: teachers.length,
                currentPlan: 'UNLIMITED',
                canAdd: true,
            },
        })
    } catch (err) {
        console.error('Fetch teachers error:', err)
        return NextResponse.json({ error: 'Failed to fetch teachers' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    const { error, user } = requireAuth(req)
    if (error) return error

    try {
        // Plan limits removed - unlimited teachers allowed for all schools
        const body = await req.json()
        const { name, email, phone, subject, salary, joinDate } = body

        if (!name || !phone) {
            return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 })
        }

        const teacher = await prisma.teacher.create({
            data: {
                tenantId: user!.tenantId,
                name,
                email: email || '',
                phone,
                subject: Array.isArray(subject) ? subject : subject ? [subject] : [],
                salary: parseFloat(salary) || 0,
                joinDate: joinDate ? new Date(joinDate) : new Date(),
                isActive: true,
            }
        })

        return NextResponse.json({ success: true, data: teacher }, { status: 201 })
    } catch (err) {
        console.error('Create teacher error:', err)
        return NextResponse.json({ error: 'Failed to create teacher' }, { status: 500 })
    }
}
