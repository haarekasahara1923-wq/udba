import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/app/api/middleware'

export async function POST(req: NextRequest) {
    const { error, user } = requireAuth(req)
    if (error) return error

    if (user?.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Unauthorized: Only Super Admin can generate TC' }, { status: 403 })
    }

    try {
        const { studentId, studentName, fatherName, scholarNo } = await req.json()

        if (!studentId || !studentName || !fatherName || !scholarNo) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Check for duplicate TC
        const existingTC = await prisma.transferCertificate.findFirst({
            where: {
                tenantId: user.tenantId,
                scholarNo,
                studentName,
                fatherName
            }
        })

        if (existingTC) {
            return NextResponse.json({ error: 'Duplicate TC not allowed. A TC for this student has already been generated.' }, { status: 409 })
        }

        const newTC = await prisma.transferCertificate.create({
            data: {
                tenantId: user.tenantId,
                studentId,
                studentName,
                fatherName,
                scholarNo
            }
        })

        return NextResponse.json({ success: true, data: newTC })
    } catch (err: any) {
        console.error('TC Generation Error:', err)
        return NextResponse.json({ error: 'Failed to generate TC' }, { status: 500 })
    }
}
