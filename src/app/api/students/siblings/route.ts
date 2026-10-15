import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { requireAuth, requireWriteAccess } from '@/app/api/middleware'
import { prisma } from '@/lib/prisma'

// GET: fetch siblings for a student, or search students for sibling assignment
export async function GET(req: NextRequest) {
    const { error, user } = requireAuth(req)
    if (error) return error

    try {
        const { searchParams } = new URL(req.url)
        const studentId = searchParams.get('studentId')
        const search = searchParams.get('search')

        // Resolve tenant
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

        // Search mode: find students by name or scholarNo for sibling selection
        if (search) {
            const students = await prisma.student.findMany({
                where: {
                    tenantId,
                    ...(studentId ? { id: { not: studentId } } : {}),
                    OR: [
                        { fullName: { contains: search, mode: 'insensitive' } },
                        { scholarNo: { contains: search, mode: 'insensitive' } },
                        { studentId: { contains: search, mode: 'insensitive' } },
                    ]
                },
                select: {
                    id: true,
                    fullName: true,
                    scholarNo: true,
                    studentId: true,
                    fatherName: true,
                    phone: true,
                    course: { select: { name: true } },
                    batch: { select: { name: true } },
                },
                take: 20,
                orderBy: { fullName: 'asc' }
            })
            return NextResponse.json({ success: true, data: students })
        }

        // Get siblings for a specific student
        if (!studentId) {
            return NextResponse.json({ error: 'studentId or search is required' }, { status: 400 })
        }

        const siblingRecords = await prisma.sibling.findMany({
            where: { studentId },
            include: {
                sibling: {
                    select: {
                        id: true,
                        fullName: true,
                        scholarNo: true,
                        studentId: true,
                        fatherName: true,
                        phone: true,
                        course: { select: { name: true } },
                        batch: { select: { name: true } },
                    }
                }
            }
        })

        const siblings = siblingRecords.map(r => ({
            ...r.sibling,
            courseName: r.sibling.course?.name || 'N/A',
            batchName: r.sibling.batch?.name || 'N/A',
        }))

        return NextResponse.json({ success: true, data: siblings })
    } catch (err) {
        console.error('Fetch siblings error:', err)
        return NextResponse.json({ error: 'Failed to fetch siblings' }, { status: 500 })
    }
}

// POST: add a sibling relationship (bidirectional)
export async function POST(req: NextRequest) {
    const { error, user } = requireWriteAccess(req)
    if (error) return error

    try {
        const body = await req.json()
        const { studentId, siblingId } = body

        if (!studentId || !siblingId) {
            return NextResponse.json({ error: 'studentId and siblingId are required' }, { status: 400 })
        }

        if (studentId === siblingId) {
            return NextResponse.json({ error: 'A student cannot be their own sibling' }, { status: 400 })
        }

        // Resolve tenant
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

        // Check both students exist
        const [student, sibling] = await Promise.all([
            prisma.student.findUnique({ where: { id: studentId } }),
            prisma.student.findUnique({ where: { id: siblingId } })
        ])

        if (!student || !sibling) {
            return NextResponse.json({ error: 'One or both students not found' }, { status: 404 })
        }

        // Check if already siblings
        const existing = await prisma.sibling.findUnique({
            where: { studentId_siblingId: { studentId, siblingId } }
        })
        if (existing) {
            return NextResponse.json({ error: 'These students are already siblings' }, { status: 400 })
        }

        // Enforce max 3 siblings per student (check both directions)
        const studentSiblingCount = await prisma.sibling.count({ where: { studentId } })
        if (studentSiblingCount >= 3) {
            return NextResponse.json({ error: 'Maximum 3 siblings allowed per student' }, { status: 400 })
        }

        const siblingCount = await prisma.sibling.count({ where: { studentId: siblingId } })
        if (siblingCount >= 3) {
            return NextResponse.json({ error: 'The selected sibling already has 3 siblings added' }, { status: 400 })
        }

        // Create bidirectional sibling relationship in a transaction
        await prisma.$transaction([
            prisma.sibling.create({
                data: { tenantId, studentId, siblingId }
            }),
            prisma.sibling.create({
                data: { tenantId, studentId: siblingId, siblingId: studentId }
            }),
        ])

        return NextResponse.json({ success: true, message: 'Sibling added successfully' }, { status: 201 })
    } catch (err: any) {
        console.error('Add sibling error:', err)
        if (err.code === 'P2002') {
            return NextResponse.json({ error: 'These students are already siblings' }, { status: 400 })
        }
        return NextResponse.json({ error: 'Failed to add sibling' }, { status: 500 })
    }
}

// DELETE: remove a sibling relationship (bidirectional)
export async function DELETE(req: NextRequest) {
    const { error, user } = requireWriteAccess(req)
    if (error) return error

    try {
        const { searchParams } = new URL(req.url)
        const studentId = searchParams.get('studentId')
        const siblingId = searchParams.get('siblingId')

        if (!studentId || !siblingId) {
            return NextResponse.json({ error: 'studentId and siblingId are required' }, { status: 400 })
        }

        // Remove both directions
        await prisma.$transaction([
            prisma.sibling.deleteMany({ where: { studentId, siblingId } }),
            prisma.sibling.deleteMany({ where: { studentId: siblingId, siblingId: studentId } }),
        ])

        return NextResponse.json({ success: true, message: 'Sibling relationship removed' })
    } catch (err: any) {
        console.error('Remove sibling error:', err)
        return NextResponse.json({ error: 'Failed to remove sibling' }, { status: 500 })
    }
}
