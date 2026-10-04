import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/api/middleware'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    const { error, user } = requireAuth(req)
    if (error) return error

    try {
        if (user!.role === 'TEACHER') {
            const teacherProfile = await prisma.teacher.findUnique({
                where: { userId: user!.id }
            })
            if (!teacherProfile) return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 })

            const ledger = await prisma.teacherSalaryLedger.findMany({
                where: {
                    tenantId: user!.tenantId,
                    teacherId: teacherProfile.id
                },
                orderBy: [
                    { year: 'desc' },
                    { month: 'desc' }
                ]
            })
            return NextResponse.json({ success: true, data: ledger })
        }

        if (user!.role !== 'SUPER_ADMIN' && user!.role !== 'COACHING_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const ledgers = await prisma.teacherSalaryLedger.findMany({
            where: { tenantId: user!.tenantId },
            include: { teacher: true },
            orderBy: [
                { year: 'desc' },
                { month: 'desc' }
            ]
        })

        return NextResponse.json({ success: true, data: ledgers })
    } catch (err) {
        console.error('Fetch ledger error:', err)
        return NextResponse.json({ error: 'Failed to fetch ledger' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    const { error, user } = requireAuth(req)
    if (error) return error

    if (user!.role !== 'SUPER_ADMIN' && user!.role !== 'COACHING_ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    try {
        const body = await req.json()
        const { teacherId, month, year, deductions = 0 } = body

        const teacher = await prisma.teacher.findUnique({
            where: { id: teacherId, tenantId: user!.tenantId }
        })

        if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })

        const netPayable = teacher.salary - deductions

        const ledger = await prisma.teacherSalaryLedger.upsert({
            where: {
                tenantId_teacherId_month_year: {
                    tenantId: user!.tenantId,
                    teacherId,
                    month,
                    year
                }
            },
            update: {
                baseSalary: teacher.salary,
                deductions,
                netPayable
            },
            create: {
                tenantId: user!.tenantId,
                teacherId,
                month,
                year,
                baseSalary: teacher.salary,
                deductions,
                netPayable,
                status: 'PENDING'
            }
        })

        return NextResponse.json({ success: true, data: ledger })
    } catch (err) {
        console.error('Generate salary error:', err)
        return NextResponse.json({ error: 'Failed to generate salary' }, { status: 500 })
    }
}

export async function PATCH(req: NextRequest) {
    const { error, user } = requireAuth(req)
    if (error) return error

    if (user!.role !== 'SUPER_ADMIN' && user!.role !== 'COACHING_ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    try {
        const body = await req.json()
        const { id, status } = body // status: PAID

        const updated = await prisma.teacherSalaryLedger.update({
            where: { id, tenantId: user!.tenantId },
            data: { status }
        })

        return NextResponse.json({ success: true, data: updated })
    } catch (err) {
        console.error('Update ledger error:', err)
        return NextResponse.json({ error: 'Failed to update ledger' }, { status: 500 })
    }
}
