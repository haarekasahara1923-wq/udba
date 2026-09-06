import 'dotenv/config'
import bcrypt from 'bcryptjs'
import pg from 'pg'

const { Pool } = pg

async function main() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
    })

    console.log('🌱 Starting UDBA seed...')

    // ============================================================
    // Create UDBA Tenant
    // ============================================================
    const tenantResult = await pool.query(`
        INSERT INTO "Tenant" (id, name, slug, "themeColor", address, phone, email, "isActive", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET name = $2, "themeColor" = $4, address = $5, phone = $6, email = $7
        RETURNING id
    `, [
        'tenant_udba',
        'Universal Day Boarding Academy',
        'udba',
        '#1a5c38',
        'Pinto Park, Gwalior (MP)',
        '917879337770',
        'info@udba.space',
    ])
    const tenantId = tenantResult.rows[0].id
    console.log('✅ UDBA Tenant created/updated, id:', tenantId)

    // ============================================================
    // Create Super Admin
    // ============================================================
    const superPass = await bcrypt.hash('udba@super2026', 10)
    await pool.query(`
        INSERT INTO "User" (id, "tenantId", email, phone, password, name, role, "isActive", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW())
        ON CONFLICT ("tenantId", email) DO UPDATE SET password = $5, name = $6
    `, ['user_udba_super', tenantId, 'superadmin@udba.space', '917879337770', superPass, 'UDBA Super Admin', 'SUPER_ADMIN'])
    console.log('✅ Super Admin: superadmin@udba.space / udba@super2026')

    // ============================================================
    // Create School Admin (COACHING_ADMIN)
    // ============================================================
    const adminPass = await bcrypt.hash('udba@admin2026', 10)
    await pool.query(`
        INSERT INTO "User" (id, "tenantId", email, phone, password, name, role, "isActive", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW())
        ON CONFLICT ("tenantId", email) DO UPDATE SET password = $5, name = $6
    `, ['user_udba_admin', tenantId, 'admin@udba.space', '917879337770', adminPass, 'School Administrator', 'COACHING_ADMIN'])
    console.log('✅ Admin: admin@udba.space / udba@admin2026')

    // ============================================================
    // Create Demo Teacher
    // ============================================================
    const teacherPass = await bcrypt.hash('teacher@udba2026', 10)
    await pool.query(`
        INSERT INTO "User" (id, "tenantId", email, phone, password, name, role, "isActive", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW())
        ON CONFLICT ("tenantId", email) DO UPDATE SET password = $5, name = $6
    `, ['user_udba_teacher', tenantId, 'teacher@udba.space', '9876543211', teacherPass, 'Demo Teacher', 'TEACHER'])
    console.log('✅ Teacher: teacher@udba.space / teacher@udba2026')

    // ============================================================
    // Create Courses (School Classes)
    // ============================================================
    const courses = [
        ['course_udba_1', 'Class 6', 'Std. 6 — Full Academic Year', '1 Year', 12000, '{Hindi,English,Maths,Science,Social Science}'],
        ['course_udba_2', 'Class 7', 'Std. 7 — Full Academic Year', '1 Year', 12000, '{Hindi,English,Maths,Science,Social Science}'],
        ['course_udba_3', 'Class 8', 'Std. 8 — Full Academic Year', '1 Year', 13000, '{Hindi,English,Maths,Science,Social Science}'],
        ['course_udba_4', 'Class 9', 'Std. 9 — Full Academic Year', '1 Year', 15000, '{Hindi,English,Maths,Science,Social Science}'],
        ['course_udba_5', 'Class 10', 'Std. 10 — Board Exam Preparation', '1 Year', 18000, '{Hindi,English,Maths,Science,Social Science}'],
        ['course_udba_6', 'Class 11 (Science)', 'Std. 11 Science Stream', '1 Year', 22000, '{Physics,Chemistry,Maths,Biology,English}'],
        ['course_udba_7', 'Class 12 (Science)', 'Std. 12 Science Stream — Board', '1 Year', 24000, '{Physics,Chemistry,Maths,Biology,English}'],
        ['course_udba_8', 'Class 11 (Commerce)', 'Std. 11 Commerce Stream', '1 Year', 20000, '{Accountancy,Business Studies,Economics,English}'],
        ['course_udba_9', 'Class 12 (Commerce)', 'Std. 12 Commerce Stream — Board', '1 Year', 22000, '{Accountancy,Business Studies,Economics,English}'],
    ]
    for (const c of courses) {
        await pool.query(`
            INSERT INTO "Course" (id, "tenantId", name, description, duration, fees, subjects, "isActive", "createdAt", "updatedAt")
            VALUES ($1,$2,$3,$4,$5,$6,$7,true,NOW(),NOW())
            ON CONFLICT DO NOTHING
        `, c)
    }
    console.log('✅ Courses created:', courses.length)

    // ============================================================
    // Create Batches (Sections)
    // ============================================================
    const batches = [
        ['batch_udba_1', 'course_udba_1', 'Class 6 - Section A', '08:00', '14:00', 40],
        ['batch_udba_2', 'course_udba_2', 'Class 7 - Section A', '08:00', '14:00', 40],
        ['batch_udba_3', 'course_udba_3', 'Class 8 - Section A', '08:00', '14:00', 40],
        ['batch_udba_4', 'course_udba_4', 'Class 9 - Section A', '08:00', '14:00', 40],
        ['batch_udba_5', 'course_udba_5', 'Class 10 - Section A', '08:00', '14:00', 40],
        ['batch_udba_6', 'course_udba_6', 'Class 11 (Science)', '08:00', '14:30', 35],
        ['batch_udba_7', 'course_udba_7', 'Class 12 (Science)', '08:00', '14:30', 35],
        ['batch_udba_8', 'course_udba_8', 'Class 11 (Commerce)', '08:00', '14:00', 35],
        ['batch_udba_9', 'course_udba_9', 'Class 12 (Commerce)', '08:00', '14:00', 35],
    ]
    for (const b of batches) {
        await pool.query(`
            INSERT INTO "Batch" (id, "tenantId", "courseId", name, "startTime", "endTime", capacity, "isActive", "createdAt", "updatedAt")
            VALUES ($1,$2,$3,$4,$5,$6,$7,true,NOW(),NOW())
            ON CONFLICT DO NOTHING
        `, [b[0], tenantId, b[1], b[2], b[3], b[4], b[5]])
    }
    console.log('✅ Batches created:', batches.length)

    // ============================================================
    // Create Demo Students
    // ============================================================
    const students = [
        ['stu_udba_1', 'Arjun Sharma', '9876501001', 'Ramesh Sharma', 'course_udba_5', 'batch_udba_5', 18000, 9000, 'UDBA001'],
        ['stu_udba_2', 'Priya Verma', '9876502001', 'Suresh Verma', 'course_udba_7', 'batch_udba_7', 24000, 24000, 'UDBA002'],
        ['stu_udba_3', 'Rahul Gupta', '9876503001', 'Mahesh Gupta', 'course_udba_4', 'batch_udba_4', 15000, 7500, 'UDBA003'],
        ['stu_udba_4', 'Sneha Patel', '9876504001', 'Kamlesh Patel', 'course_udba_6', 'batch_udba_6', 22000, 22000, 'UDBA004'],
        ['stu_udba_5', 'Vikram Singh', '9876505001', 'Brijesh Singh', 'course_udba_3', 'batch_udba_3', 13000, 6500, 'UDBA005'],
        ['stu_udba_6', 'Anjali Mishra', '9876506001', 'Dinesh Mishra', 'course_udba_9', 'batch_udba_9', 22000, 11000, 'UDBA006'],
    ]
    for (const s of students) {
        await pool.query(`
            INSERT INTO "Student" (id, "tenantId", "courseId", "batchId", "studentId", "fullName", "fatherName", phone, gender, "totalFee", "paidFee", status, "admissionDate", "createdAt", "updatedAt")
            VALUES ($1,$2,$5,$6,$9,$3,$4,$3,'MALE',$7,$8,'ACTIVE',NOW(),NOW(),NOW())
            ON CONFLICT DO NOTHING
        `, [s[0], tenantId, s[1], s[3], s[4], s[5], s[6], s[7], s[8]])
    }
    console.log('✅ Students created:', students.length)

    // ============================================================
    // Create Demo Teachers
    // ============================================================
    await pool.query(`INSERT INTO "Teacher" (id, "tenantId", name, email, phone, subject, salary, "isActive", "createdAt", "updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,true,NOW(),NOW()) ON CONFLICT DO NOTHING`, ['teacher_udba_1', tenantId, 'Mr. Ravi Sharma', 'ravi@udba.space', '9876511001', '{Maths,Physics}', 35000])
    await pool.query(`INSERT INTO "Teacher" (id, "tenantId", name, email, phone, subject, salary, "isActive", "createdAt", "updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,true,NOW(),NOW()) ON CONFLICT DO NOTHING`, ['teacher_udba_2', tenantId, 'Mrs. Sunita Singh', 'sunita@udba.space', '9876511002', '{Science,Biology}', 32000])
    await pool.query(`INSERT INTO "Teacher" (id, "tenantId", name, email, phone, subject, salary, "isActive", "createdAt", "updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,true,NOW(),NOW()) ON CONFLICT DO NOTHING`, ['teacher_udba_3', tenantId, 'Mr. Amit Jain', 'amit@udba.space', '9876511003', '{Hindi,Social Science}', 30000])
    console.log('✅ Teachers created: 3')

    // ============================================================
    // Create Subscription (ACTIVE - no trial for UDBA)
    // ============================================================
    await pool.query(`
        INSERT INTO "Subscription" (id, "tenantId", plan, status, amount, "createdAt", "updatedAt")
        VALUES ($1,$2,$3,$4,$5,NOW(),NOW())
        ON CONFLICT ("tenantId") DO UPDATE SET plan = $3, status = $4
    `, ['sub_udba', tenantId, 'ELITE', 'ACTIVE', 0])
    console.log('✅ Subscription: ELITE / ACTIVE')

    // ============================================================
    // Create Demo Expenses
    // ============================================================
    const expenses = [
        ['exp_udba_1', 'Rent', 30000, 'Monthly school building rent'],
        ['exp_udba_2', 'Salary', 97000, 'Staff salaries - this month'],
        ['exp_udba_3', 'Electricity', 12000, 'Electricity bill'],
        ['exp_udba_4', 'Maintenance', 8000, 'Building maintenance & repairs'],
        ['exp_udba_5', 'Stationery', 4500, 'Books, stationery & supplies'],
    ]
    for (const e of expenses) {
        await pool.query(`
            INSERT INTO "Expense" (id, "tenantId", category, amount, date, description, "createdAt", "updatedAt")
            VALUES ($1,$2,$3,$4,NOW(),$5,NOW(),NOW())
            ON CONFLICT DO NOTHING
        `, [e[0], tenantId, e[1], e[2], e[3]])
    }
    console.log('✅ Expenses created:', expenses.length)

    // ============================================================
    // Create Demo Leads (Enquiries)
    // ============================================================
    const leads = [
        ['lead_udba_1', 'Rohan Agarwal', '9876520001', 'Class 9', 'Walk-in', 'NEW'],
        ['lead_udba_2', 'Kavya Nair', '9876520002', 'Class 11 (Science)', 'WhatsApp', 'CONTACTED'],
        ['lead_udba_3', 'Aditya Mehta', '9876520003', 'Class 10', 'Referral', 'INTERESTED'],
        ['lead_udba_4', 'Simran Kaur', '9876520004', 'Class 12 (Commerce)', 'Instagram', 'CONVERTED'],
    ]
    for (const l of leads) {
        await pool.query(`
            INSERT INTO "Lead" (id, "tenantId", name, phone, course, source, status, "createdAt", "updatedAt")
            VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),NOW())
            ON CONFLICT DO NOTHING
        `, [l[0], tenantId, l[1], l[2], l[3], l[4], l[5]])
    }
    console.log('✅ Leads created:', leads.length)

    console.log('')
    console.log('🎉 UDBA Seed completed successfully!')
    console.log('')
    console.log('📋 Login Credentials:')
    console.log('   Super Admin:  superadmin@udba.space  / udba@super2026')
    console.log('   School Admin: admin@udba.space        / udba@admin2026')
    console.log('   Teacher:      teacher@udba.space      / teacher@udba2026')
    console.log('')
    console.log(`📌 UDBA Tenant ID: ${tenantId}`)
    console.log('   → Copy this value to NEXT_PUBLIC_SCHOOL_TENANT_ID in your .env')

    await pool.end()
}

main().catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
})
