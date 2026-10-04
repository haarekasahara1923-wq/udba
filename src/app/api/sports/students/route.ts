import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'

export async function GET(req: Request) {
    try {
        const user = await verifyAuth(req)
        if (!user || !user.tenantId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        
        const url = new URL(req.url)
        const sportId = url.searchParams.get('sportId')
        if (!sportId) return NextResponse.json({ success: false, error: 'Sport ID is required' }, { status: 400 })

        const students = await prisma.studentSport.findMany({
            where: { tenantId: user.tenantId, sportId },
            include: {
                student: {
                    select: {
                        fullName: true,
                        course: { select: { name: true } },
                        batch: { select: { name: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json({ success: true, data: students })
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const user = await verifyAuth(req)
        if (!user || !user.tenantId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        
        const { sportId, studentIds } = await req.json()
        if (!sportId || !studentIds || !Array.isArray(studentIds)) {
            return NextResponse.json({ success: false, error: 'Invalid data' }, { status: 400 })
        }

        // Add each student if not already present
        const results = await Promise.all(studentIds.map(async (studentId) => {
            return prisma.studentSport.upsert({
                where: {
                    studentId_sportId: { studentId, sportId }
                },
                update: { status: 'ACTIVE' },
                create: {
                    tenantId: user.tenantId,
                    studentId,
                    sportId,
                    status: 'ACTIVE'
                }
            })
        }))

        return NextResponse.json({ success: true, data: results })
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 })
    }
}

export async function PUT(req: Request) {
    try {
        const user = await verifyAuth(req)
        if (!user || !user.tenantId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        
        const { id, status } = await req.json()
        if (!id || !status) return NextResponse.json({ success: false, error: 'Invalid data' }, { status: 400 })

        const updated = await prisma.studentSport.update({
            where: { id, tenantId: user.tenantId },
            data: { status }
        })

        return NextResponse.json({ success: true, data: updated })
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 })
    }
}
