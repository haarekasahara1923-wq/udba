import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/app/api/middleware'

export async function GET(req: NextRequest) {
  const { error, user } = requireAuth(req)
  if (error) return error
  const { searchParams } = new URL(req.url)
  const targetRole = searchParams.get('role')

  const where: any = { tenantId: user!.tenantId, type: 'NOTICE' }
  if (targetRole) {
    where.OR = [{ targetRole: null }, { targetRole: '' }, { targetRole }]
  } else {
    where.OR = [{ targetRole: null }, { targetRole: '' }, { targetRole: user!.role }]
  }

  const notices = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  return NextResponse.json({ success: true, notices })
}

export async function POST(req: NextRequest) {
  const { error, user } = requireAuth(req)
  if (error) return error
  if (!['SUPER_ADMIN', 'COACHING_ADMIN'].includes(user!.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  const body = await req.json()
  const { title, message, targetRole } = body
  if (!title || !message) return NextResponse.json({ error: 'title and message required' }, { status: 400 })

  const notice = await prisma.notification.create({
    data: {
      tenantId: user!.tenantId,
      title,
      message,
      type: 'NOTICE',
      targetRole: targetRole || null,
    },
  })
  return NextResponse.json({ success: true, notice }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const { error, user } = requireAuth(req)
  if (error) return error
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  await prisma.notification.delete({ where: { id, tenantId: user!.tenantId } })
  return NextResponse.json({ success: true })
}
