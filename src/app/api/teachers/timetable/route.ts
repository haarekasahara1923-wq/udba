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
                where: { userId: user!.id }
            })
            if (!teacherProfile) return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 })

            const timetables = await prisma.timeTable.findMany({
                where: {
                    tenantId: user!.tenantId,
                    teacherId: teacherProfile.id
                },
                include: { batch: true }
            })
            return NextResponse.json({ success: true, data: timetables })
        }

        const timetables = await prisma.timeTable.findMany({
            where: { tenantId: user!.tenantId },
            include: { teacher: true, batch: true }
        })

        return NextResponse.json({ success: true, data: timetables })
    } catch (err) {
        console.error('Fetch timetable error:', err)
        return NextResponse.json({ error: 'Failed to fetch timetable' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    const { error, user } = requireAuth(req)
    if (error) return error

    if (user!.role !== 'TEACHER') {
        return NextResponse.json({ error: 'Only teachers can submit timetable' }, { status: 403 })
    }

    try {
        const body = await req.json()
        const { batchId, subject, dayOfWeek, startTime, endTime } = body

        const teacherProfile = await prisma.teacher.findUnique({
            where: { userId: user!.id }
        })
        if (!teacherProfile) return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 })

        const timetable = await prisma.timeTable.create({
            data: {
                tenantId: user!.tenantId,
                teacherId: teacherProfile.id,
                batchId,
                subject,
                dayOfWeek,
                startTime,
                endTime,
                status: 'PENDING'
            }
        })

        return NextResponse.json({ success: true, data: timetable })
    } catch (err) {
        console.error('Submit timetable error:', err)
        return NextResponse.json({ error: 'Failed to submit timetable' }, { status: 500 })
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
        const { id, status } = body // status: APPROVED or REJECTED

        const updated = await prisma.timeTable.update({
            where: { id, tenantId: user!.tenantId },
            data: { status }
        })

        return NextResponse.json({ success: true, data: updated })
    } catch (err) {
        console.error('Update timetable error:', err)
        return NextResponse.json({ error: 'Failed to update timetable' }, { status: 500 })
    }
}
