import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/app/api/middleware'

export async function POST(req: NextRequest) {
  const { error, user } = requireAuth(req)
  if (error) return error

  if (!['TEACHER', 'STAFF', 'COACHING_ADMIN', 'SUPER_ADMIN'].includes(user!.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const body = await req.json()
  const { title, message, studentId } = body

  if (!title || !message || !studentId) {
    return NextResponse.json({ error: 'title, message, and studentId required' }, { status: 400 })
  }

  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId, tenantId: user!.tenantId },
      include: { parentLinks: true }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    if (student.parentLinks.length === 0) {
      return NextResponse.json({ error: 'Student has no linked parent account' }, { status: 400 })
    }

    const createdNotices = []
    for (const parent of student.parentLinks) {
      const notice = await prisma.notification.create({
        data: {
          tenantId: user!.tenantId,
          title: `To ${student.fullName}'s Parent: ${title}`,
          message,
          type: 'NOTICE',
          targetRole: 'PARENT',
          targetId: parent.userId,
        },
      })
      createdNotices.push(notice)
    }

    return NextResponse.json({ success: true, notices: createdNotices }, { status: 201 })
  } catch (err) {
    console.error('Targeted notice error:', err)
    return NextResponse.json({ error: 'Failed to send targeted notice' }, { status: 500 })
  }
}
