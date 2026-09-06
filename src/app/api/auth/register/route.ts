import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, signAccessToken, signRefreshToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { name, email, password, phone, role, tenantId } = body

        if (!name || !email || !password) {
            return NextResponse.json({ error: 'Name, email/phone, and password are required' }, { status: 400 })
        }

        // Check if user already exists
        const existingUser = await prisma.user.findFirst({ 
            where: { 
                OR: [
                    { email: email.toLowerCase() },
                    { phone: phone || email }
                ]
            } 
        })
        if (existingUser) {
            return NextResponse.json({ error: 'An account with this email/phone already exists' }, { status: 409 })
        }

        const hashedPassword = await hashPassword(password)
        const userRole = role || 'STUDENT'

        // Single-School UDBA: Auto-resolve UDBA tenant
        let targetTenantId = tenantId || process.env.NEXT_PUBLIC_SCHOOL_TENANT_ID
        let school = null

        if (targetTenantId) {
            school = await prisma.tenant.findUnique({ where: { id: targetTenantId } })
        }

        if (!school) {
            const schoolSlug = process.env.NEXT_PUBLIC_SCHOOL_SLUG || 'udba'
            school = await prisma.tenant.findFirst({ 
                where: { 
                    OR: [
                        { slug: schoolSlug }, 
                        { id: 'tenant_udba' },
                        { name: { contains: 'Universal Day Boarding Academy', mode: 'insensitive' } }
                    ] 
                } 
            })
        }

        if (!school) {
            return NextResponse.json({ error: 'School configuration not found. Please contact administration.' }, { status: 404 })
        }

        const resolvedTenantId = school.id

        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    tenantId: resolvedTenantId,
                    email: email.toLowerCase(),
                    phone: phone || email,
                    password: hashedPassword,
                    plainPassword: password,
                    name,
                    role: userRole as any,
                    isActive: true,
                }
            })

            let studentId = null

            if (userRole === 'STUDENT') {
                // Link to existing student profile or create new
                const existingStudent = await tx.student.findFirst({
                    where: {
                        tenantId: resolvedTenantId,
                        OR: [
                            { email: email.toLowerCase() },
                            { phone: phone || email }
                        ]
                    }
                })

                if (existingStudent) {
                    await tx.student.update({
                        where: { id: existingStudent.id },
                        data: { userId: user.id }
                    })
                    studentId = existingStudent.id
                } else {
                    let dummyCourse = await tx.course.findFirst({ where: { tenantId: resolvedTenantId } })
                    if (!dummyCourse) {
                        dummyCourse = await tx.course.create({ data: { tenantId: resolvedTenantId, name: 'Class 10' } })
                    }
                    let dummyBatch = await tx.batch.findFirst({ where: { tenantId: resolvedTenantId } })
                    if (!dummyBatch) {
                        dummyBatch = await tx.batch.create({ data: { tenantId: resolvedTenantId, courseId: dummyCourse.id, name: 'Section A' } })
                    }

                    const newStudent = await tx.student.create({
                        data: {
                            tenantId: resolvedTenantId,
                            userId: user.id,
                            fullName: name,
                            phone: phone || email,
                            courseId: dummyCourse.id,
                            batchId: dummyBatch.id,
                            status: 'ACTIVE',
                        }
                    })
                    studentId = newStudent.id
                }
            } else if (userRole === 'PARENT') {
                await tx.parentProfile.create({
                    data: {
                        tenantId: resolvedTenantId,
                        userId: user.id,
                        name,
                        phone: phone || email,
                    }
                })
            } else if (userRole === 'TEACHER') {
                await tx.teacher.create({
                    data: {
                        tenantId: resolvedTenantId,
                        name,
                        email: email.toLowerCase(),
                        phone: phone || email,
                    }
                })
            } else if (userRole === 'DRIVER') {
                await tx.driverProfile.create({
                    data: {
                        tenantId: resolvedTenantId,
                        userId: user.id,
                        phone: phone || email,
                        isActive: true
                    }
                })
            }

            return { tenant: school, user, studentId }
        })

        const payload = { userId: result.user.id, tenantId: resolvedTenantId, role: userRole, email: email.toLowerCase() }
        const accessToken = signAccessToken(payload)
        const refreshToken = signRefreshToken(payload)

        return NextResponse.json({
            success: true,
            message: 'Registration successful',
            accessToken,
            refreshToken,
            user: { id: result.user.id, name, email, role: userRole, tenantId: resolvedTenantId, studentId: result.studentId || null },
            tenant: { id: school.id, name: school.name, themeColor: school.themeColor },
        }, { status: 201 })
    } catch (error) {
        console.error('Register error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
