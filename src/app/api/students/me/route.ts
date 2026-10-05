import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { requireAuth } from '@/app/api/middleware'
import { prisma } from '@/lib/prisma'

// Returns the Student record for the currently logged-in student user
export async function GET(req: NextRequest) {
  const { error, user } = requireAuth(req)
  if (error) return error

  try {
    const student = await prisma.student.findFirst({
      where: { tenantId: user!.tenantId, userId: user!.userId },
      include: {
        course: { select: { name: true } },
        batch: { select: { name: true } },
      }
    })
    return NextResponse.json({ success: true, student })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch student profile' }, { status: 500 })
  }
}
