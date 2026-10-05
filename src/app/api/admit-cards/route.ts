import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { requireAuth } from '@/app/api/middleware'
import { prisma } from '@/lib/prisma'

// GET - Fetch all admit cards for this tenant (with class/batch filter)
export async function GET(req: NextRequest) {
  const { error, user } = requireAuth(req)
  if (error) return error

  const tenantId = user!.tenantId
  const { searchParams } = new URL(req.url)
  const courseId = searchParams.get('courseId')
  const batchId = searchParams.get('batchId')
  const studentId = searchParams.get('studentId') // for student/parent portal

  try {
    if (studentId) {
      // Portal: get published admit card students for this student
      const acs = await prisma.admitCardStudent.findMany({
        where: { tenantId, studentId, isPublished: true },
        include: {
          admitCard: {
            include: {
              course: { select: { name: true } },
              batch: { select: { name: true } },
            }
          },
          student: {
            select: { fullName: true, studentId: true, photo: true, fatherName: true, dob: true, gender: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
      return NextResponse.json({ success: true, admitCardStudents: acs })
    }

    const where: any = { tenantId }
    if (courseId) where.courseId = courseId
    if (batchId) where.batchId = batchId

    const admitCards = await prisma.admitCard.findMany({
      where,
      include: {
        course: { select: { name: true } },
        batch: { select: { name: true } },
        students: {
          include: {
            student: {
              select: { fullName: true, studentId: true, photo: true, fatherName: true, dob: true, gender: true, phone: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json({ success: true, admitCards })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch admit cards' }, { status: 500 })
  }
}

// POST - Create a new admit card batch and auto-generate for all students in class/batch
export async function POST(req: NextRequest) {
  const { error, user } = requireAuth(req)
  if (error) return error

  const tenantId = user!.tenantId
  const body = await req.json()
  const { examName, courseId, batchId, startDate, endDate } = body

  if (!examName || !courseId || !batchId || !startDate || !endDate) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
  }

  try {
    // Get all active students in this class/batch
    const students = await prisma.student.findMany({
      where: { tenantId, courseId, batchId, status: 'ACTIVE' }
    })

    const admitCard = await prisma.admitCard.create({
      data: {
        tenantId,
        examName,
        courseId,
        batchId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        students: {
          create: students.map(s => ({
            tenantId,
            studentId: s.id,
            isBlocked: false,
            isApproved: false,
            isPublished: false,
          }))
        }
      },
      include: {
        course: { select: { name: true } },
        batch: { select: { name: true } },
        students: {
          include: {
            student: {
              select: { fullName: true, studentId: true, photo: true, fatherName: true, dob: true, gender: true, phone: true }
            }
          }
        }
      }
    })

    return NextResponse.json({ success: true, admitCard })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to create admit card' }, { status: 500 })
  }
}

// PATCH - Update individual student admit card (block/unblock, publish, approve)
export async function PATCH(req: NextRequest) {
  const { error, user } = requireAuth(req)
  if (error) return error

  const tenantId = user!.tenantId
  const body = await req.json()
  const { action, admitCardStudentId, admitCardId, isBlocked, blockReason } = body

  try {
    if (action === 'block_student') {
      // Teacher blocks a student's admit card
      const acs = await prisma.admitCardStudent.update({
        where: { id: admitCardStudentId },
        data: { isBlocked: true, blockReason: blockReason || '', isApproved: false, isPublished: false }
      })
      return NextResponse.json({ success: true, admitCardStudent: acs })
    }

    if (action === 'approve_student') {
      // Super admin approves a blocked student
      const acs = await prisma.admitCardStudent.update({
        where: { id: admitCardStudentId },
        data: { isApproved: true }
      })
      return NextResponse.json({ success: true, admitCardStudent: acs })
    }

    if (action === 'publish_student') {
      // Teacher publishes an approved (or non-blocked) student's admit card
      const acs = await prisma.admitCardStudent.findUnique({ where: { id: admitCardStudentId } })
      if (acs?.isBlocked && !acs.isApproved) {
        return NextResponse.json({ error: 'Awaiting Super Admin approval before publish' }, { status: 403 })
      }
      const updated = await prisma.admitCardStudent.update({
        where: { id: admitCardStudentId },
        data: { isPublished: true }
      })
      return NextResponse.json({ success: true, admitCardStudent: updated })
    }

    if (action === 'publish_all') {
      // Publish all non-blocked (or approved) students for an admit card
      await prisma.admitCardStudent.updateMany({
        where: {
          admitCardId,
          tenantId,
          OR: [{ isBlocked: false }, { isBlocked: true, isApproved: true }]
        },
        data: { isPublished: true }
      })
      // Mark main admit card as published
      await prisma.admitCard.update({ where: { id: admitCardId }, data: { isPublished: true } })
      return NextResponse.json({ success: true })
    }

    if (action === 'unblock_student') {
      const acs = await prisma.admitCardStudent.update({
        where: { id: admitCardStudentId },
        data: { isBlocked: false, blockReason: null, isApproved: false }
      })
      return NextResponse.json({ success: true, admitCardStudent: acs })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to update admit card' }, { status: 500 })
  }
}
