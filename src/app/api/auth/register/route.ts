import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, signAccessToken, signRefreshToken } from '@/lib/auth'
import { slugify } from '@/lib/utils'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { name, email, password, phone, coachingName, plan, ref, role, tenantId } = body

        if (!name || !email || !password) {
            return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 })
        }

        // Check if email already exists
        const existingUser = await prisma.user.findFirst({ where: { email: email.toLowerCase() } })
        if (existingUser) {
            return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
        }

        const hashedPassword = await hashPassword(password)
        const userRole = role || 'COACHING_ADMIN'

        let result;

        if (userRole === 'COACHING_ADMIN') {
            // Register a new school (Tenant)
            if (!coachingName) {
                return NextResponse.json({ error: 'School name is required' }, { status: 400 })
            }

            let tenantSlug = slugify(coachingName)
            let slugExists = await prisma.tenant.findUnique({ where: { slug: tenantSlug } })
            let count = 1
            while (slugExists) {
                tenantSlug = `${slugify(coachingName)}-${count}`
                slugExists = await prisma.tenant.findUnique({ where: { slug: tenantSlug } })
                count++
            }

            const trialEndsAt = new Date()
            trialEndsAt.setDate(trialEndsAt.getDate() + 7)

            result = await prisma.$transaction(async (tx) => {
                const tenant = await tx.tenant.create({
                    data: {
                        name: coachingName,
                        slug: tenantSlug,
                        themeColor: '#6366f1',
                        phone: phone || '',
                        email: email,
                        isActive: true,
                    }
                })

                let affiliateObj = null;
                if (ref) {
                    affiliateObj = await tx.affiliate.findUnique({ where: { affiliateCode: ref } });
                    if (affiliateObj) {
                        await tx.tenant.update({
                            where: { id: tenant.id },
                            data: { affiliateId: affiliateObj.id }
                        });
                        await tx.affiliateReferral.create({
                            data: {
                                affiliateId: affiliateObj.id,
                                tenantId: tenant.id,
                                status: 'PENDING',
                            }
                        });
                    }
                }

                const user = await tx.user.create({
                    data: {
                        tenantId: tenant.id,
                        email: email.toLowerCase(),
                        phone: phone || '',
                        password: hashedPassword,
                        plainPassword: password,
                        name,
                        role: 'COACHING_ADMIN',
                        isActive: true,
                    }
                })

                const subscription = await tx.subscription.create({
                    data: {
                        tenantId: tenant.id,
                        plan: plan || 'PRO',
                        status: 'TRIAL',
                        trialEndsAt,
                        amount: 0,
                    }
                })

                return { tenant, user, subscription, studentId: null }
            })
        } else {
            // Register under an existing school
            if (!tenantId) {
                return NextResponse.json({ error: 'Please select a school to register under' }, { status: 400 })
            }

            const school = await prisma.tenant.findUnique({ where: { id: tenantId } })
            if (!school) {
                return NextResponse.json({ error: 'Selected school does not exist' }, { status: 404 })
            }

            result = await prisma.$transaction(async (tx) => {
                const user = await tx.user.create({
                    data: {
                        tenantId,
                        email: email.toLowerCase(),
                        phone: phone || '',
                        password: hashedPassword,
                        plainPassword: password,
                        name,
                        role: userRole as any,
                        isActive: true,
                    }
                })

                let studentId = null;
                // Create profile details based on role
                if (userRole === 'STUDENT') {
                    // Try to link to an existing student profile in the same school by email or phone
                    const existingStudent = await tx.student.findFirst({
                        where: {
                            tenantId,
                            OR: [
                                { email: email.toLowerCase() },
                                { phone: phone || 'undefined_placeholder_to_prevent_match' }
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
                        // Create a dummy/initial Student profile to link
                        // They'll need to select/assign to Course/Batch later by staff
                        let dummyCourse = await tx.course.findFirst({ where: { tenantId } })
                        if (!dummyCourse) {
                            dummyCourse = await tx.course.create({ data: { tenantId, name: 'Default Course' } })
                        }
                        let dummyBatch = await tx.batch.findFirst({ where: { tenantId } })
                        if (!dummyBatch) {
                            dummyBatch = await tx.batch.create({ data: { tenantId, courseId: dummyCourse.id, name: 'Default Batch' } })
                        }
                        
                        const newStudent = await tx.student.create({
                            data: {
                                tenantId,
                                userId: user.id,
                                fullName: name,
                                phone: phone || '',
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
                            tenantId,
                            userId: user.id,
                            name,
                            phone: phone || '',
                        }
                    })
                } else if (userRole === 'TEACHER') {
                    await tx.teacher.create({
                        data: {
                            tenantId,
                            name,
                            email: email.toLowerCase(),
                            phone: phone || '',
                        }
                    })
                } else if (userRole === 'DRIVER') {
                    await tx.driverProfile.create({
                        data: {
                            tenantId,
                            userId: user.id,
                            phone: phone || '',
                            isActive: true
                        }
                    })
                }

                return { tenant: school, user, subscription: null, studentId }
            })
        }

        const payload = { userId: result.user.id, tenantId: result.tenant.id, role: userRole, email: email.toLowerCase() }
        const accessToken = signAccessToken(payload)
        const refreshToken = signRefreshToken(payload)

        return NextResponse.json({
            success: true,
            message: 'Registration successful',
            accessToken,
            refreshToken,
            user: { id: result.user.id, name, email, role: userRole, tenantId: result.tenant.id, studentId: result.studentId || null },
            tenant: { id: result.tenant.id, name: result.tenant.name, themeColor: result.tenant.themeColor },
        }, { status: 201 })
    } catch (error) {
        console.error('Register error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
