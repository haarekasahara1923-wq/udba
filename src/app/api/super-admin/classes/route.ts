import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { requireRole } from '@/app/api/middleware'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/super-admin/classes
 * Returns ALL active classes (courses) and their sections (batches)
 * from the primary school tenant (SCHOOL_SLUG / SCHOOL_TENANT_ID).
 * Used in Super Admin Attendance Viewer so the dropdown lists every class.
 */
export async function GET(req: NextRequest) {
    const { error } = requireRole(req, ['SUPER_ADMIN'])
    if (error) return error

    try {
        const schoolSlug = process.env.NEXT_PUBLIC_SCHOOL_SLUG || 'udba'
        const schoolTenantId = process.env.NEXT_PUBLIC_SCHOOL_TENANT_ID

        let tenantId: string | undefined

        if (schoolTenantId) {
            const t = await prisma.tenant.findUnique({ where: { id: schoolTenantId } })
            if (t) tenantId = t.id
        }

        if (!tenantId) {
            const tenant = await prisma.tenant.findFirst({ where: { slug: schoolSlug } })
            if (tenant) tenantId = tenant.id
        }

        if (!tenantId) {
            const firstTenant = await prisma.tenant.findFirst({ orderBy: { createdAt: 'asc' } })
            if (firstTenant) tenantId = firstTenant.id
        }

        if (!tenantId) {
            return NextResponse.json({ success: true, data: [] })
        }

        // Fetch all active courses (classes)
        const courses = await prisma.course.findMany({
            where: { tenantId, isActive: true },
            include: {
                batches: {
                    where: { isActive: true },
                    select: { id: true, name: true, capacity: true }
                },
                _count: {
                    select: {
                        students: { where: { status: 'ACTIVE' } }
                    }
                }
            }
        })

        // Standard school class ordering
        const orderMap: Record<string, number> = {
            'nursery': 1,
            'lkg': 2,
            'ukg': 3,
            'kg': 4,
            'prep': 5,
            'class 1': 10,
            '1st': 10,
            'class 2': 20,
            '2nd': 20,
            'class 3': 30,
            '3rd': 30,
            'class 4': 40,
            '4th': 40,
            'class 5': 50,
            '5th': 50,
            'class 6': 60,
            '6th': 60,
            'class 7': 70,
            '7th': 70,
            'class 8': 80,
            '8th': 80,
            'class 9': 90,
            '9th': 90,
            'class 10': 100,
            '10th': 100,
            'class 11': 110,
            '11th': 110,
            'class 12': 120,
            '12th': 120,
        }

        const getOrder = (name: string): number => {
            const lower = name.toLowerCase().trim()
            if (orderMap[lower] !== undefined) return orderMap[lower]
            for (const [key, val] of Object.entries(orderMap)) {
                if (lower.startsWith(key)) return val
            }
            return 999
        }

        const sorted = courses.sort((a, b) => {
            const orderA = getOrder(a.name)
            const orderB = getOrder(b.name)
            if (orderA !== orderB) return orderA - orderB
            // If same name, sort by student count desc
            if (b._count.students !== a._count.students) {
                return b._count.students - a._count.students
            }
            return a.name.localeCompare(b.name)
        })

        const data = sorted.map(c => ({
            id: c.id,
            name: c.name,
            studentCount: c._count.students,
            batches: c.batches.map(b => ({
                id: b.id,
                name: b.name,
            }))
        }))

        return NextResponse.json({ success: true, data, tenantId })
    } catch (err) {
        console.error('Super admin classes fetch error:', err)
        return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 })
    }
}
