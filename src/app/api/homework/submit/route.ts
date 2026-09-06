import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/app/api/middleware'

export async function GET(req: NextRequest) {
  const { error, user } = requireAuth(req)
  if (error) return error
  const { searchParams } = new URL(req.url)
  const homeworkId = searchParams.get('homeworkId')
  const studentId = searchParams.get('studentId')

  const where: any = { tenantId: user!.tenantId }
  if (homeworkId) where.homeworkId = homeworkId
  if (studentId) where.studentId = studentId

  const submissions = await prisma.homeworkSubmission.findMany({
    where,
    include: {
      student: { select: { fullName: true, studentId: true } },
      homework: { select: { title: true } },
    },
    orderBy: { submittedAt: 'desc' },
  })
  return NextResponse.json({ success: true, submissions })
}

export async function POST(req: NextRequest) {
  const { error, user } = requireAuth(req)
  if (error) return error
  const body = await req.json()
  let { homeworkId, studentId, content, attachmentUrl } = body
  
  if (!studentId && user?.role === 'STUDENT') {
      const s = await prisma.student.findFirst({ where: { userId: user.userId } })
      if (s) studentId = s.id
  }
  
  if (!homeworkId || !studentId) return NextResponse.json({ error: 'homeworkId and studentId required' }, { status: 400 })

  const submission = await prisma.homeworkSubmission.upsert({
    where: { homeworkId_studentId: { homeworkId, studentId } },
    create: { tenantId: user!.tenantId, homeworkId, studentId, content, attachmentUrl, status: 'SUBMITTED' },
    update: { content, attachmentUrl, status: 'SUBMITTED' },
  })
  return NextResponse.json({ success: true, submission }, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const { error, user } = requireAuth(req)
  if (error) return error
  const body = await req.json()
  const { id, grade, feedback } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const submission = await prisma.homeworkSubmission.update({
    where: { id },
    data: { grade, feedback, status: 'GRADED' },
  })
  return NextResponse.json({ success: true, submission })
}
