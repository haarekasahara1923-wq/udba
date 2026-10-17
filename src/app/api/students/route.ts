import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { requireAuth, requireWriteAccess, checkPlanLimit } from '@/app/api/middleware'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
    const { error, user } = requireAuth(req)
    if (error) return error

    try {
        const { search, course, courseId, batch, batchId, status } = Object.fromEntries(
            new URL(req.url).searchParams.entries()
        )

        const where: any = {}
        // Resolve tenantId with fallback to primary school tenant (same as /api/courses and /api/batches)
        let tenantId = user!.tenantId
        const queryTenantId = new URL(req.url).searchParams.get('tenantId')
        if (user!.role === 'SUPER_ADMIN' && queryTenantId) {
            tenantId = queryTenantId
        } else if (!tenantId) {
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
        where.tenantId = tenantId

        const checkScholar = new URL(req.url).searchParams.get('checkScholar')
        if (checkScholar) {
            const cleanScholar = checkScholar.trim()
            const schoolSlug = process.env.NEXT_PUBLIC_SCHOOL_SLUG || 'udba'
            const primaryTenant = await prisma.tenant.findFirst({ where: { slug: schoolSlug } })
            const tenantIdsToCheck = Array.from(new Set([tenantId, user!.tenantId, primaryTenant?.id].filter(Boolean) as string[]))

            const existing = await prisma.student.findFirst({
                where: {
                    tenantId: { in: tenantIdsToCheck },
                    scholarNo: { equals: cleanScholar, mode: 'insensitive' }
                },
                include: {
                    course: { select: { name: true } },
                    batch: { select: { name: true } }
                }
            })

            return NextResponse.json({
                success: true,
                exists: !!existing,
                student: existing ? {
                    id: existing.id,
                    fullName: existing.fullName,
                    fatherName: existing.fatherName,
                    scholarNo: existing.scholarNo,
                    courseName: existing.course?.name || 'N/A',
                    batchName: existing.batch?.name || 'N/A'
                } : null
            })
        }

        const resolvedCourseId = course || courseId
        const resolvedBatchId = batch || batchId
        if (resolvedCourseId) where.courseId = resolvedCourseId
        if (resolvedBatchId) where.batchId = resolvedBatchId
        if (status) where.status = status
        if (search) {
            where.OR = [
                { fullName: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search } },
                { studentId: { contains: search, mode: 'insensitive' } },
                { scholarNo: { contains: search, mode: 'insensitive' } },
            ]
        }

        let students = await prisma.student.findMany({
            where,
            include: {
                course: { select: { name: true } },
                batch: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' }
        })

        // Fallback: If no students found, check the primary school tenant
        // (Same pattern as /api/courses and /api/batches)
        if (students.length === 0 && tenantId) {
            const schoolSlug = process.env.NEXT_PUBLIC_SCHOOL_SLUG || 'udba'
            const primaryTenant = await prisma.tenant.findFirst({ where: { slug: schoolSlug } })
            if (primaryTenant && primaryTenant.id !== tenantId) {
                const fallbackWhere: any = { tenantId: primaryTenant.id }
                if (resolvedCourseId) fallbackWhere.courseId = resolvedCourseId
                if (resolvedBatchId) fallbackWhere.batchId = resolvedBatchId
                if (status) fallbackWhere.status = status
                if (search) fallbackWhere.OR = where.OR
                students = await prisma.student.findMany({
                    where: fallbackWhere,
                    include: {
                        course: { select: { name: true } },
                        batch: { select: { name: true } }
                    },
                    orderBy: { createdAt: 'desc' }
                })
            }
        }

        const data = students.map(s => ({
            ...s,
            courseName: s.course?.name || 'N/A',
            batchName: s.batch?.name || 'N/A',
        }))

        // Plan limits removed - unlimited students
        const totalCount = await prisma.student.count({ where: { tenantId: user!.tenantId } })

        return NextResponse.json({
            success: true,
            data,
            total: data.length,
            planInfo: {
                limit: -1,
                used: totalCount,
                currentPlan: 'UNLIMITED',
                canAdd: true,
            },
        })
    } catch (err) {
        console.error('Fetch students error:', err)
        return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    const { error, user } = requireAuth(req)
    if (error) return error

    try {
        let tenantId = user!.tenantId
        const schoolSlug = process.env.NEXT_PUBLIC_SCHOOL_SLUG || 'udba'
        const primaryTenant = await prisma.tenant.findFirst({ where: { slug: schoolSlug } })

        if (!tenantId) {
            if (primaryTenant) tenantId = primaryTenant.id
        } else if (user!.role === 'SUPER_ADMIN') {
            const studentCount = await prisma.student.count({ where: { tenantId } })
            if (studentCount === 0 && primaryTenant) {
                tenantId = primaryTenant.id
            }
        }

        const tenantIdsToCheck = Array.from(new Set([tenantId, user!.tenantId, primaryTenant?.id].filter(Boolean) as string[]))
        const currentCount = await prisma.student.count({ where: { tenantId } })

        const body = await req.json()
        const { 
            fullName, phone, courseId, batchId, fatherName, motherName, parentPhone, email, address, 
            gender, dob, admissionDate, feePlan, totalFee, notes, aadhaarNo, penId, aparId, samagraId,
            scholarNo, caste, scholarshipScheme, dobInWords, medium, firstAdmissionClass, firstAdmissionDate,
            bankName, bankAccountNo, ifscCode, photo, subjectGroup, idProof
        } = body

        const cleanFullName = (fullName || '').trim()
        const cleanFatherName = (fatherName || '').trim()
        const cleanScholarNo = (scholarNo ? String(scholarNo) : '').trim()
        const cleanPhone = (phone || '').trim()

        if (!cleanFullName || !cleanFatherName || !cleanScholarNo || !cleanPhone || !courseId) {
            return NextResponse.json({ error: 'Required fields missing: Student Name, Father Name, Phone, Class, and Scholar No. are mandatory.' }, { status: 400 })
        }

        // 1. STRICT RESTRICTION: Check Scholar No. first!
        // No duplicate Scholar No. allowed in the database under any circumstance!
        const existingStudentByScholarNo = await prisma.student.findFirst({
            where: {
                tenantId: { in: tenantIdsToCheck },
                scholarNo: {
                    equals: cleanScholarNo,
                    mode: 'insensitive'
                }
            },
            include: {
                course: { select: { name: true } },
                batch: { select: { name: true } }
            }
        })

        if (existingStudentByScholarNo) {
            return NextResponse.json({
                error: `Duplicate Entry Alert! Scholar No. "${cleanScholarNo}" is already registered to "${existingStudentByScholarNo.fullName}" (${existingStudentByScholarNo.course?.name || 'Class N/A'}). Duplicate student cannot be saved.`,
                isDuplicate: true,
                duplicateField: 'scholarNo',
                existingStudent: {
                    id: existingStudentByScholarNo.id,
                    fullName: existingStudentByScholarNo.fullName,
                    fatherName: existingStudentByScholarNo.fatherName,
                    scholarNo: existingStudentByScholarNo.scholarNo,
                    courseName: existingStudentByScholarNo.course?.name || 'N/A',
                    batchName: existingStudentByScholarNo.batch?.name || 'N/A'
                }
            }, { status: 409 })
        }

        // 2. Check duplicate Full Name + Father Name in same tenant
        const existingStudentByName = await prisma.student.findFirst({
            where: {
                tenantId: { in: tenantIdsToCheck },
                fullName: { equals: cleanFullName, mode: 'insensitive' },
                fatherName: { equals: cleanFatherName, mode: 'insensitive' },
            },
            include: {
                course: { select: { name: true } },
                batch: { select: { name: true } }
            }
        })

        if (existingStudentByName) {
            return NextResponse.json({
                error: `Duplicate Entry Alert! Student "${cleanFullName}" with Father's Name "${cleanFatherName}" already exists in ${existingStudentByName.course?.name || 'the school'} (Scholar No: ${existingStudentByName.scholarNo || 'N/A'}). Duplicate student cannot be saved.`,
                isDuplicate: true,
                duplicateField: 'name',
                existingStudent: {
                    id: existingStudentByName.id,
                    fullName: existingStudentByName.fullName,
                    fatherName: existingStudentByName.fatherName,
                    scholarNo: existingStudentByName.scholarNo,
                    courseName: existingStudentByName.course?.name || 'N/A',
                    batchName: existingStudentByName.batch?.name || 'N/A'
                }
            }, { status: 409 })
        }

        const course = await prisma.course.findFirst({
            where: { id: courseId, tenantId: { in: tenantIdsToCheck } }
        })

        if (!course) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 })
        }

        const student = await prisma.student.create({
            data: {
                tenantId,
                courseId,
                batchId: batchId || null,
                studentId: `STU${String(currentCount + 1).padStart(3, '0')}`,
                fullName: cleanFullName,
                fatherName: cleanFatherName,
                motherName: motherName ? motherName.trim() : '',
                phone: cleanPhone,
                parentPhone: parentPhone ? parentPhone.trim() : '',
                email: email ? email.trim() : '',
                address: address ? address.trim() : '',
                gender: gender as any || 'MALE',
                dob: dob ? new Date(dob) : null,
                admissionDate: admissionDate ? new Date(admissionDate) : new Date(),
                feePlan: feePlan || '',
                totalFee: parseFloat(totalFee) || course.fees || 0,
                paidFee: 0,
                status: 'ACTIVE',
                notes: notes || '',
                aadhaarNo: aadhaarNo ? aadhaarNo.trim() : '',
                penId: penId ? penId.trim() : '',
                aparId: aparId ? aparId.trim() : '',
                samagraId: samagraId ? samagraId.trim() : '',
                scholarNo: cleanScholarNo,
                caste: caste || '',
                scholarshipScheme: scholarshipScheme || '',
                dobInWords: dobInWords || '',
                medium: medium || '',
                firstAdmissionClass: firstAdmissionClass || '',
                firstAdmissionDate: firstAdmissionDate ? new Date(firstAdmissionDate) : null,
                bankName: bankName || '',
                bankAccountNo: bankAccountNo ? bankAccountNo.trim() : '',
                ifscCode: ifscCode ? ifscCode.trim() : '',
                photo: photo || '',
                subjectGroup: subjectGroup || '',
                idProof: idProof || '',
            }
        })

        // Create 6 Fee installments (blank slots as requested by user)
        const admDate = admissionDate ? new Date(admissionDate) : new Date()

        for (let i = 0; i < 6; i++) {
            const dueDate = new Date(admDate)
            dueDate.setMonth(dueDate.getMonth() + i)
            
            await prisma.fee.create({
                data: {
                    tenantId,
                    studentId: student.id,
                    amount: 0,
                    dueDate,
                    status: 'PENDING',
                    notes: `Installment ${i + 1}`
                }
            })
        }

        return NextResponse.json({ success: true, data: student }, { status: 201 })
    } catch (err) {
        console.error('Create student error:', err)
        return NextResponse.json({ error: 'Failed to create student' }, { status: 500 })
    }
}

export async function PATCH(req: NextRequest) {
    const { error, user } = requireWriteAccess(req)
    if (error) return error

    try {
        const body = await req.json()
        const { 
            id, fullName, phone, courseId, batchId, status, fatherName, parentPhone, email, totalFee, admissionDate, notes,
            scholarNo, caste, scholarshipScheme, dobInWords, medium, firstAdmissionClass, firstAdmissionDate,
            bankName, bankAccountNo, ifscCode, photo, subjectGroup
        } = body

        if (!id) return NextResponse.json({ error: 'Student ID is required' }, { status: 400 })

        let tenantId = user!.tenantId
        const schoolSlug = process.env.NEXT_PUBLIC_SCHOOL_SLUG || 'udba'
        const primaryTenant = await prisma.tenant.findFirst({ where: { slug: schoolSlug } })
        if (!tenantId && primaryTenant) tenantId = primaryTenant.id
        const tenantIdsToCheck = Array.from(new Set([tenantId, user!.tenantId, primaryTenant?.id].filter(Boolean) as string[]))

        // If updating scholarNo, verify it doesn't already belong to another student
        if (scholarNo) {
            const cleanScholarNo = String(scholarNo).trim()
            const duplicateScholar = await prisma.student.findFirst({
                where: {
                    tenantId: { in: tenantIdsToCheck },
                    scholarNo: { equals: cleanScholarNo, mode: 'insensitive' },
                    NOT: { id }
                },
                include: {
                    course: { select: { name: true } }
                }
            })
            if (duplicateScholar) {
                return NextResponse.json({
                    error: `Duplicate Entry Alert! Scholar No. "${cleanScholarNo}" is already assigned to student "${duplicateScholar.fullName}" (${duplicateScholar.course?.name || 'N/A'}). Duplicate update rejected.`,
                    isDuplicate: true,
                    duplicateField: 'scholarNo'
                }, { status: 409 })
            }
        }

        const student = await prisma.student.update({
            where: { id },
            data: {
                fullName: fullName !== undefined ? String(fullName).trim() : undefined,
                phone: phone !== undefined ? String(phone).trim() : undefined,
                courseId,
                batchId: batchId || null,
                status: status as any,
                fatherName: fatherName !== undefined ? String(fatherName).trim() : undefined,
                parentPhone,
                email,
                totalFee: totalFee !== undefined ? parseFloat(totalFee) : undefined,
                admissionDate: admissionDate ? new Date(admissionDate) : undefined,
                notes,
                scholarNo: scholarNo !== undefined ? String(scholarNo).trim() : undefined,
                caste,
                scholarshipScheme,
                dobInWords,
                medium,
                firstAdmissionClass,
                firstAdmissionDate: firstAdmissionDate ? new Date(firstAdmissionDate) : undefined,
                bankName,
                bankAccountNo,
                ifscCode,
                photo,
                subjectGroup
            }
        })

        return NextResponse.json({ success: true, data: student })
    } catch (err) {
        console.error('Update student error:', err)
        return NextResponse.json({ error: 'Failed to update student' }, { status: 500 })
    }
}

export async function DELETE(req: NextRequest) {
    const { error, user } = requireWriteAccess(req)
    if (error) return error

    try {
        const { id } = Object.fromEntries(new URL(req.url).searchParams.entries())
        if (!id) return NextResponse.json({ error: 'Student ID is required' }, { status: 400 })

        // Check if student has payments or dependencies
        const payments = await prisma.payment.count({ where: { studentId: id } })
        if (payments > 0) {
            return NextResponse.json({ error: 'Cannot delete student with payment history. Block them instead.' }, { status: 400 })
        }

        // Delete related records that don't have onDelete: Cascade
        await prisma.fee.deleteMany({ where: { studentId: id } })
        await prisma.attendance.deleteMany({ where: { studentId: id } })
        await prisma.homeworkSubmission.deleteMany({ where: { studentId: id } })
        await prisma.result.deleteMany({ where: { studentId: id } })
        await prisma.transportLog.deleteMany({ where: { studentId: id } })
        await prisma.studentSport.deleteMany({ where: { studentId: id } })

        await prisma.student.delete({
            where: { id, tenantId: user!.tenantId }
        })

        return NextResponse.json({ success: true, message: 'Student deleted' })
    } catch (err) {
        console.error('Delete student error:', err)
        return NextResponse.json({ error: 'Failed to delete student' }, { status: 500 })
    }
}
