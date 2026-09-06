import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/api/middleware'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
    const { error, user } = requireAuth(req)
    if (error) return error

    try {
        const { courseId, batchId } = Object.fromEntries(new URL(req.url).searchParams.entries())

        const where: any = { tenantId: user!.tenantId }
        if (courseId) where.courseId = courseId
        if (batchId) where.batchId = batchId

        const exams = await prisma.exam.findMany({
            where,
            include: {
                course: { select: { name: true } },
                batch: { select: { name: true } },
                results: {
                    include: { student: { select: { fullName: true, studentId: true } } }
                }
            },
            orderBy: { date: 'desc' }
        })

        return NextResponse.json({ success: true, data: exams })
    } catch (err) {
        console.error('Fetch exams error:', err)
        return NextResponse.json({ error: 'Failed to fetch exams' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    const { error, user } = requireAuth(req)
    if (error) return error

    try {
        const body = await req.json()
        const { title, subject, date, maxMarks, courseId, batchId, results } = body

        if (!title || !subject || !maxMarks || !courseId || !batchId || !results) {
            return NextResponse.json({ error: 'Required fields missing' }, { status: 400 })
        }

        const exam = await prisma.exam.create({
            data: {
                tenantId: user!.tenantId,
                title,
                subject,
                date: new Date(date),
                maxMarks: parseFloat(maxMarks),
                courseId,
                batchId,
                teacherId: user!.userId,
                results: {
                    create: results.map((r: any) => ({
                        tenantId: user!.tenantId,
                        studentId: r.studentId,
                        marksObtained: parseFloat(r.marksObtained),
                        remarks: r.remarks || ''
                    }))
                }
            }
        })

        return NextResponse.json({ success: true, data: exam }, { status: 201 })
    } catch (err) {
        console.error('Create exam error:', err)
        return NextResponse.json({ error: 'Failed to save exam marks' }, { status: 500 })
    }
}

