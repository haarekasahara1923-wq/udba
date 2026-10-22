import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { requireRole } from '@/app/api/middleware'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/super-admin/batches
 * Returns ALL active batches from the primary school tenant (SCHOOL_SLUG).
 * Used in Super Admin Attendance Viewer so the class dropdown shows every class.
 */
export async function GET(req: NextRequest) {
    const { error } = requireRole(req, ['SUPER_ADMIN'])
    if (error) return error

    try {
        // Resolve primary school tenant — try env first, then slug 'udba'
        const schoolSlug = process.env.NEXT_PUBLIC_SCHOOL_SLUG || 'udba'
        const schoolTenantId = process.env.NEXT_PUBLIC_SCHOOL_TENANT_ID

        let tenantId: string | undefined

        // Prefer the explicit env var if it's set
        if (schoolTenantId) {
            // Verify it exists in the DB
            const t = await prisma.tenant.findUnique({ where: { id: schoolTenantId } })
            if (t) tenantId = t.id
        }

        // Fallback: lookup by slug
        if (!tenantId) {
            const tenant = await prisma.tenant.findFirst({ where: { slug: schoolSlug } })
            if (tenant) tenantId = tenant.id
        }

        // Last resort: take the first tenant in the DB
        if (!tenantId) {
            const firstTenant = await prisma.tenant.findFirst({ orderBy: { createdAt: 'asc' } })
            if (firstTenant) tenantId = firstTenant.id
        }

        if (!tenantId) {
            return NextResponse.json({ success: true, data: [] })
        }

        const batches = await prisma.batch.findMany({
            where: { tenantId, isActive: true },
            include: {
                course: { select: { name: true } },
                _count: { select: { students: true } },
                branch: { select: { name: true } },
            },
            orderBy: [
                { course: { name: 'asc' } },
                { name: 'asc' }
            ]
        })

        const data = batches.map(b => ({
            id: b.id,
            name: b.name,
            courseId: b.courseId,
            courseName: b.course?.name || '',
            branchName: b.branch?.name || '',
            studentCount: b._count.students,
            startTime: b.startTime,
            endTime: b.endTime,
        }))

        return NextResponse.json({ success: true, data, tenantId })
    } catch (err) {
        console.error('Super admin batches fetch error:', err)
        return NextResponse.json({ error: 'Failed to fetch batches' }, { status: 500 })
    }
}
