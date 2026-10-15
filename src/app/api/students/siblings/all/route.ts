import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { requireAuth } from '@/app/api/middleware'
import { prisma } from '@/lib/prisma'

// GET: returns set of studentIds that have at least one sibling
export async function GET(req: NextRequest) {
    const { error, user } = requireAuth(req)
    if (error) return error

    try {
        let tenantId = user!.tenantId
        if (!tenantId) {
            const schoolSlug = process.env.NEXT_PUBLIC_SCHOOL_SLUG || 'udba'
            const tenant = await prisma.tenant.findFirst({ where: { slug: schoolSlug } })
            if (tenant) tenantId = tenant.id
        } else if (user!.role === 'SUPER_ADMIN') {
            const studentCount = await prisma.student.count({ where: { tenantId } })
            if (studentCount === 0) {
                const schoolSlug = process.env.NEXT_PUBLIC_SCHOOL_SLUG || 'udba'
                const primaryTenant = await prisma.tenant.findFirst({ where: { slug: schoolSlug } })
                if (primaryTenant) tenantId = primaryTenant.id
            }
        }

        const siblings = await prisma.sibling.findMany({
            where: { tenantId },
            select: { studentId: true },
            distinct: ['studentId'],
        })

        const studentIdsWithSiblings = siblings.map(s => s.studentId)
        return NextResponse.json({ success: true, data: studentIdsWithSiblings })
    } catch (err) {
        console.error('Fetch all sibling status error:', err)
        return NextResponse.json({ error: 'Failed to fetch sibling status' }, { status: 500 })
    }
}
