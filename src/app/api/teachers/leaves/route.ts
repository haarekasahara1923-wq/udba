import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/api/middleware'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    const { error, user } = requireAuth(req)
    if (error) return error

    try {
        if (user!.role === 'TEACHER') {
            const teacherProfile = await prisma.teacher.findUnique({
                where: { userId: user!.userId }
            })
            if (!teacherProfile) return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 })

            const leaves = await prisma.leaveApplication.findMany({
                where: {
                    tenantId: user!.tenantId,
                    teacherId: teacherProfile.id
                },
                orderBy: { createdAt: 'desc' }
            })
            return NextResponse.json({ success: true, data: leaves })
        }

        if (user!.role !== 'SUPER_ADMIN' && user!.role !== 'COACHING_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const leaves = await prisma.leaveApplication.findMany({
            where: { tenantId: user!.tenantId },
            include: { teacher: true },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json({ success: true, data: leaves })
    } catch (err) {
        console.error('Fetch leaves error:', err)
        return NextResponse.json({ error: 'Failed to fetch leaves' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    const { error, user } = requireAuth(req)
    if (error) return error

    if (user!.role !== 'TEACHER') {
        return NextResponse.json({ error: 'Only teachers can apply for leave' }, { status: 403 })
    }

    try {
        const body = await req.json()
        const { startDate, endDate, reason } = body

        const teacherProfile = await prisma.teacher.findUnique({
            where: { userId: user!.userId }
        })

        if (!teacherProfile) return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 })

        const leave = await prisma.leaveApplication.create({
            data: {
                tenantId: user!.tenantId,
                teacherId: teacherProfile.id,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                reason,
                status: 'PENDING'
            }
        })

        return NextResponse.json({ success: true, data: leave })
    } catch (err) {
        console.error('Apply leave error:', err)
        return NextResponse.json({ error: 'Failed to apply for leave' }, { status: 500 })
    }
}

export async function PATCH(req: NextRequest) {
    const { error, user } = requireAuth(req)
    if (error) return error

    if (user!.role !== 'SUPER_ADMIN' && user!.role !== 'COACHING_ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    try {
        const body = await req.json()
        const { leaveId, status } = body // status: APPROVED or REJECTED

        const updatedLeave = await prisma.leaveApplication.update({
            where: { id: leaveId, tenantId: user!.tenantId },
            data: { status }
        })

        return NextResponse.json({ success: true, data: updatedLeave })
    } catch (err) {
        console.error('Update leave error:', err)
        return NextResponse.json({ error: 'Failed to update leave status' }, { status: 500 })
    }
}
