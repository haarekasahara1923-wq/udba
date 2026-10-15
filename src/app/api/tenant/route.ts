import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { requireAuth } from '@/app/api/middleware'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
    const { error, user } = requireAuth(req)
    if (error) return error

    try {
        const tenant = await prisma.tenant.findUnique({
            where: { id: user!.tenantId }
        })
        if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
        return NextResponse.json({ success: true, tenant })
    } catch (err) {
        console.error('Fetch tenant error:', err)
        return NextResponse.json({ error: 'Failed to fetch school details' }, { status: 500 })
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
        const { 
            name, 
            phone, 
            email, 
            website, 
            address, 
            themeColor, 
            logo, 
            schoolCode, 
            diseCode,
            gstNumber,
            directorSign,
            upiId,
            bankAccountNo,
            ifscCode
        } = body

        const updatedTenant = await prisma.tenant.update({
            where: { id: user!.tenantId },
            data: {
                ...(name !== undefined && { name }),
                ...(phone !== undefined && { phone }),
                ...(email !== undefined && { email }),
                ...(website !== undefined && { website }),
                ...(address !== undefined && { address }),
                ...(themeColor !== undefined && { themeColor }),
                ...(logo !== undefined && { logo }),
                ...(schoolCode !== undefined && { schoolCode }),
                ...(diseCode !== undefined && { diseCode }),
                ...(gstNumber !== undefined && { gstNumber }),
                ...(directorSign !== undefined && { directorSign }),
                ...(upiId !== undefined && { upiId }),
                ...(bankAccountNo !== undefined && { bankAccountNo }),
                ...(ifscCode !== undefined && { ifscCode }),
            }
        })

        return NextResponse.json({ success: true, tenant: updatedTenant, data: updatedTenant })
    } catch (err) {
        console.error('Update tenant error:', err)
        return NextResponse.json({ error: 'Failed to update school profile' }, { status: 500 })
    }
}
