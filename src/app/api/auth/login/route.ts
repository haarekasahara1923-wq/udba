import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signAccessToken, signRefreshToken, comparePassword } from '@/lib/auth'

export async function POST(req: NextRequest) {
    try {
        const { email, password, role, tenantId } = await req.json()

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
        }

        const whereClause: any = { isActive: true }
        // Let user log in with email or phone
        whereClause.OR = [
            { email: email.toLowerCase() },
            { phone: email } // 'email' field holds the input (can be phone too)
        ]

        if (role) {
            whereClause.role = role
        }

        // For non-admin roles: use provided tenantId, or fall back to env school slug
        let resolvedTenantId = tenantId

        if (!resolvedTenantId && role && role !== 'COACHING_ADMIN' && role !== 'SUPER_ADMIN') {
            // Auto-resolve from env: find UDBA's tenant by slug
            const schoolSlug = process.env.NEXT_PUBLIC_SCHOOL_SLUG
            if (schoolSlug) {
                const school = await prisma.tenant.findUnique({ where: { slug: schoolSlug } })
                if (school) resolvedTenantId = school.id
            }
        }

        if (resolvedTenantId) {
            whereClause.tenantId = resolvedTenantId
        }

        const user = await prisma.user.findFirst({
            where: whereClause,
            include: {
                studentProfile: true
            }
        })
        if (!user) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
        }

        const isValid = await comparePassword(password, user.password)
        if (!isValid) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
        }

        const tenant = await prisma.tenant.findUnique({
            where: { id: user.tenantId }
        })

        const subscription = await prisma.subscription.findUnique({
            where: { tenantId: user.tenantId }
        })

        const payload = {
            userId: user.id,
            tenantId: user.tenantId,
            role: user.role,
            email: user.email,
            phone: user.phone || null,
        }

        const accessToken = signAccessToken(payload)
        const refreshToken = signRefreshToken(payload)

        await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
        })

        return NextResponse.json({
            success: true,
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                tenantId: user.tenantId,
                phone: user.phone,
                studentId: user.studentProfile?.id || null,
            },
            tenant: tenant ? {
                id: tenant.id,
                name: tenant.name,
                logo: tenant.logo,
                themeColor: tenant.themeColor,
                phone: tenant.phone,
                address: tenant.address,
                email: tenant.email,
            } : null,
            subscription: subscription || null,
        })
    } catch (error) {
        console.error('Login error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
