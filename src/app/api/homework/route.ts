import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/app/api/middleware'

export async function GET(req: NextRequest) {
  const { error, user } = requireAuth(req)
  if (error) return error

  const { searchParams } = new URL(req.url)
  const batchId = searchParams.get('batchId')

  const where: any = { tenantId: user!.tenantId }
  if (batchId) where.batchId = batchId

  let finalWhere = where
  if (user!.role === 'STUDENT') {
    const student = await prisma.student.findUnique({ where: { userId: user!.userId } })
    if (student) {
      finalWhere.batchId = student.batchId
    }
  }

  const homeworks = await prisma.homework.findMany({
    where: finalWhere,
    include: { 
      batch: { select: { name: true } }, 
      _count: { select: { submissions: true } },
      submissions: user!.role === 'STUDENT' ? {
        where: { student: { userId: user!.userId } },
        select: { id: true, content: true, grade: true, feedback: true, status: true, submittedAt: true }
      } : false
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ success: true, homeworks })
}

export async function POST(req: NextRequest) {
  const { error, user } = requireAuth(req)
  if (error) return error

  const body = await req.json()
  const { batchId, title, description, subject, dueDate, attachmentUrl } = body

  if (!batchId || !title) return NextResponse.json({ error: 'batchId and title are required' }, { status: 400 })

  const homework = await prisma.homework.create({
    data: {
      tenantId: user!.tenantId,
      batchId,
      teacherId: user!.userId,
      title,
      description,
      subject,
      dueDate: dueDate ? new Date(dueDate) : null,
      attachmentUrl,
    },
  })

  // Notify students in the batch
  const students = await prisma.student.findMany({
    where: { tenantId: user!.tenantId, batchId },
    select: { userId: true, fullName: true },
  })

  const studentsWithAccount = students.filter(s => s.userId)
  if (studentsWithAccount.length > 0) {
    await prisma.notification.createMany({
      data: studentsWithAccount.map(s => ({
        tenantId: user!.tenantId,
        title: `New Homework: ${title}`,
        message: `${subject ? subject + ' - ' : ''}${description || title}`,
        type: 'HOMEWORK',
        targetRole: 'STUDENT',
        targetId: s.userId!,
      })),
    })
  }

  return NextResponse.json({ success: true, homework }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const { error, user } = requireAuth(req)
  if (error) return error
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  await prisma.homework.delete({ where: { id, tenantId: user!.tenantId } })
  return NextResponse.json({ success: true })
}
