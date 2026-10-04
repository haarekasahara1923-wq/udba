import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { requireAuth } from '@/app/api/middleware'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest) {
    const { error, user } = requireAuth(req)
    if (error) return error

    if (user!.role !== 'SUPER_ADMIN' && user!.role !== 'COACHING_ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    try {
        const body = await req.json()
        const { name, phone, email, address, themeColor, logo } = body

        const updatedTenant = await prisma.tenant.update({
            where: { id: user!.tenantId },
            data: {
                name,
                phone,
                email,
                address,
                themeColor,
                logo
            }
        })

        return NextResponse.json({ success: true, data: updatedTenant })
    } catch (err) {
        console.error('Update tenant error:', err)
        return NextResponse.json({ error: 'Failed to update school profile' }, { status: 500 })
    }
}
