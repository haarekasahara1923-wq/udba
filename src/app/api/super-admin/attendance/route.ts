import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { requireRole } from '@/app/api/middleware'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
    const { error } = requireRole(req, ['SUPER_ADMIN'])
    if (error) return error

    try {
        const { courseId, classId, batchId, date } = Object.fromEntries(new URL(req.url).searchParams.entries())
        const resolvedCourseId = courseId || classId

        if ((!resolvedCourseId && !batchId) || !date) {
            return NextResponse.json({ error: 'Class (courseId) or Batch (batchId) and date are required' }, { status: 400 })
        }

        const startDate = new Date(date)
        startDate.setHours(0, 0, 0, 0)
        const endDate = new Date(date)
        endDate.setHours(23, 59, 59, 999)

        // Resolve course and batch details
        let course = resolvedCourseId ? await prisma.course.findUnique({ where: { id: resolvedCourseId } }) : null
        let batch = batchId ? await prisma.batch.findUnique({ where: { id: batchId }, include: { course: true } }) : null

        if (!course && batch?.course) {
            course = batch.course
        }

        // Build student query
        const studentWhere: any = { status: 'ACTIVE' }
        if (resolvedCourseId) {
            studentWhere.courseId = resolvedCourseId
        }
        if (batchId) {
            studentWhere.batchId = batchId
        }

        // Get all active students for this class / batch
        const students = await prisma.student.findMany({
            where: studentWhere,
            select: {
                id: true,
                fullName: true,
                studentId: true,
                photo: true,
                scholarNo: true,
                batch: { select: { id: true, name: true } },
                course: { select: { id: true, name: true } }
            },
            orderBy: { fullName: 'asc' }
        })

        const studentIds = students.map(s => s.id)

        // Get attendance records for the date
        const attendances = studentIds.length > 0 ? await prisma.attendance.findMany({
            where: {
                date: { gte: startDate, lte: endDate },
                studentId: { in: studentIds }
            },
            include: {
                student: { select: { fullName: true } }
            }
        }) : []

        // Map attendance by studentId
        const attendanceMap = new Map(attendances.map(a => [a.studentId, a]))

        // Build student-attendance list
        const studentList = students.map(s => {
            const att = attendanceMap.get(s.id)
            return {
                studentId: s.id,
                studentCode: s.studentId || s.scholarNo,
                fullName: s.fullName,
                photo: s.photo,
                batchName: s.batch?.name || null,
                status: att?.status || null,
                notes: att?.notes || null,
                markedBy: att?.markedBy || null,
                attendanceId: att?.id || null,
            }
        })

        // Summary calculations
        const present = attendances.filter(a => a.status === 'PRESENT').length
        const absent = attendances.filter(a => a.status === 'ABSENT').length
        const late = attendances.filter(a => a.status === 'LATE').length
        const leave = attendances.filter(a => a.status === 'LEAVE').length
        const halfDay = attendances.filter(a => a.status === 'HALF_DAY').length
        const total = students.length
        const markedCount = attendances.length
        const notMarked = Math.max(0, total - markedCount)
        const attendancePercentage = total > 0 ? Math.round((present / total) * 100) : 0

        const summary = {
            total,
            present,
            absent,
            late,
            leave,
            halfDay,
            notMarked,
            attendancePercentage
        }

        return NextResponse.json({
            success: true,
            classInfo: {
                id: course?.id || batch?.courseId || '',
                name: course?.name || 'Class',
                batchId: batch?.id || null,
                batchName: batch?.name || null,
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
