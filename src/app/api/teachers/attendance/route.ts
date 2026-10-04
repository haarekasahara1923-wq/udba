import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/api/middleware'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    const { error, user } = requireAuth(req)
    if (error) return error

    try {
        const url = new URL(req.url)
        const dateParam = url.searchParams.get('date')
        const today = dateParam ? new Date(dateParam) : new Date()
        today.setHours(0, 0, 0, 0)
        
        const endOfDay = new Date(today)
        endOfDay.setHours(23, 59, 59, 999)

        if (user!.role === 'TEACHER') {
            const teacherProfile = await prisma.teacher.findUnique({
                where: { userId: user!.userId }
            })
            if (!teacherProfile) return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 })

            const attendances = await prisma.attendance.findMany({
                where: {
                    tenantId: user!.tenantId,
                    teacherId: teacherProfile.id,
                    date: {
                        gte: today,
                        lte: endOfDay
                    }
                }
            })
            return NextResponse.json({ success: true, data: attendances })
        }

        if (user!.role !== 'SUPER_ADMIN' && user!.role !== 'COACHING_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const attendances = await prisma.attendance.findMany({
            where: {
                tenantId: user!.tenantId,
                teacherId: { not: null },
                date: {
                    gte: today,
                    lte: endOfDay
                }
            },
            include: {
                teacher: true
            }
        })

        return NextResponse.json({ success: true, data: attendances })
    } catch (err) {
        console.error('Fetch attendance error:', err)
        return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    const { error, user } = requireAuth(req)
    if (error) return error

    if (user!.role !== 'TEACHER') {
        return NextResponse.json({ error: 'Only teachers can mark their attendance' }, { status: 403 })
    }

    try {
        const body = await req.json()
        const { action, status, notes } = body // action = MARK_IN or MARK_OUT
        const now = new Date()

        const teacherProfile = await prisma.teacher.findUnique({
            where: { userId: user!.userId }
        })

        if (!teacherProfile) return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 })

        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const endOfDay = new Date(today)
        endOfDay.setHours(23, 59, 59, 999)

        const existing = await prisma.attendance.findFirst({
            where: {
                tenantId: user!.tenantId,
                teacherId: teacherProfile.id,
                date: { gte: today, lte: endOfDay }
            }
        })

        if (action === 'MARK_OUT') {
            if (!existing) return NextResponse.json({ error: 'Please mark IN before marking OUT' }, { status: 400 })
            const updated = await prisma.attendance.update({
                where: { id: existing.id },
                data: {
                    outTime: now,
                    notes: notes ? existing.notes + ' | OUT: ' + notes : existing.notes
                }
            })
            return NextResponse.json({ success: true, data: updated })
        }

        if (existing) {
            return NextResponse.json({ error: 'Attendance already marked IN for today' }, { status: 400 })
        }

        const attendance = await prisma.attendance.create({
            data: {
                tenantId: user!.tenantId,
                teacherId: teacherProfile.id,
                date: now,
                inTime: now,
                status: status || 'PRESENT',
                markedBy: user!.userId,
                notes
            }
        })

        return NextResponse.json({ success: true, data: attendance })
    } catch (err) {
        console.error('Mark attendance error:', err)
        return NextResponse.json({ error: 'Failed to mark attendance' }, { status: 500 })
    }
}
