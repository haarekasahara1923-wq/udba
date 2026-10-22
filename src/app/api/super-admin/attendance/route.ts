import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { requireRole } from '@/app/api/middleware'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
    const { error, user } = requireRole(req, ['SUPER_ADMIN'])
    if (error) return error

    try {
        const { batchId, date } = Object.fromEntries(new URL(req.url).searchParams.entries())

        if (!batchId || !date) {
            return NextResponse.json({ error: 'batchId and date are required' }, { status: 400 })
        }

        const startDate = new Date(date)
        startDate.setHours(0, 0, 0, 0)
        const endDate = new Date(date)
        endDate.setHours(23, 59, 59, 999)

        // Get batch info
        const batch = await prisma.batch.findUnique({
            where: { id: batchId },
            include: { course: { select: { name: true } } }
        })

        if (!batch) {
            return NextResponse.json({ error: 'Batch not found' }, { status: 404 })
        }

        // Get all students in batch
        const students = await prisma.student.findMany({
            where: { batchId, status: 'ACTIVE' },
            select: { id: true, fullName: true, studentId: true, photo: true },
            orderBy: { fullName: 'asc' }
        })

        // Get attendance records for the date
        const attendances = await prisma.attendance.findMany({
            where: {
                batchId,
                date: { gte: startDate, lte: endDate },
                studentId: { in: students.map(s => s.id) }
            },
            include: {
                student: { select: { fullName: true } }
            }
        })

        // Map attendance by studentId
        const attendanceMap = new Map(attendances.map(a => [a.studentId, a]))

        // Build student-attendance list
        const studentList = students.map(s => {
            const att = attendanceMap.get(s.id)
            return {
                studentId: s.id,
                studentCode: s.studentId,
                fullName: s.fullName,
                photo: s.photo,
                status: att?.status || null,
                notes: att?.notes || null,
                markedBy: att?.markedBy || null,
                attendanceId: att?.id || null,
            }
        })

        // Summary
        const summary = {
            total: students.length,
            present: attendances.filter(a => a.status === 'PRESENT').length,
            absent: attendances.filter(a => a.status === 'ABSENT').length,
            late: attendances.filter(a => a.status === 'LATE').length,
            leave: attendances.filter(a => a.status === 'LEAVE').length,
            halfDay: attendances.filter(a => a.status === 'HALF_DAY').length,
            notMarked: students.length - attendances.length,
            attendancePercentage: students.length > 0
                ? Math.round((attendances.filter(a => a.status === 'PRESENT').length / students.length) * 100)
                : 0
        }

        return NextResponse.json({
            success: true,
            batch: {
                id: batch.id,
                name: batch.name,
                courseName: batch.course?.name || ''
            },
            date,
            students: studentList,
            summary
        })
    } catch (err) {
        console.error('Super admin attendance fetch error:', err)
        return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 })
    }
}
