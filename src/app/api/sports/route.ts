import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'

export async function GET(req: Request) {
    try {
        const user = await verifyAuth(req)
        if (!user || !user.tenantId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        
        if (user.role !== 'SUPER_ADMIN' && user.role !== 'COACHING_ADMIN' && user.role !== 'ADMIN_SPORTS') {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
        }

        const sports = await prisma.sport.findMany({
            where: { tenantId: user.tenantId, isActive: true },
            orderBy: { name: 'asc' }
        })

        return NextResponse.json({ success: true, data: sports })
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const user = await verifyAuth(req)
        if (!user || !user.tenantId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        
        if (user.role !== 'SUPER_ADMIN' && user.role !== 'COACHING_ADMIN' && user.role !== 'ADMIN_SPORTS') {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
        }

        const { name } = await req.json()
        if (!name) return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 })

        const sport = await prisma.sport.create({
            data: {
                tenantId: user.tenantId,
                name
            }
        })

        return NextResponse.json({ success: true, data: sport })
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 })
    }
}
