// In-memory store for demo - Replace with Prisma + PostgreSQL in production
import bcrypt from 'bcryptjs'

export interface Tenant {
    id: string
    name: string
    slug: string
    logo?: string
    themeColor: string
    address?: string
    phone?: string
    email?: string
    isActive: boolean
    createdAt: Date
}

export interface User {
    id: string
    tenantId: string
    email: string
    phone?: string
    password: string
    name: string
    role: string
    avatar?: string
    isActive: boolean
    lastLogin?: Date
    createdAt: Date
}

export interface Student {
    id: string
    tenantId: string
    courseId: string
    batchId: string
    studentId?: string
    fullName: string
    fatherName?: string
    motherName?: string
    phone: string
    parentPhone?: string
    email?: string
    address?: string
    dob?: string
    gender: string
    photo?: string
    admissionDate: string
    feePlan?: string
    totalFee: number
    paidFee: number
    status: string
    notes?: string
    createdAt: Date
}

export interface Course {
    id: string
    tenantId: string
    name: string
    description?: string
    duration?: string
    fees: number
    subjects: string[]
    isActive: boolean
    createdAt: Date
}

export interface Batch {
    id: string
    tenantId: string
    courseId: string
    name: string
    startTime?: string
    endTime?: string
    capacity: number
    isActive: boolean
    createdAt: Date
}

export interface Teacher {
    id: string
    tenantId: string
    name: string
    email?: string
    phone: string
    subject: string[]
    salary: number
    joinDate: string
    isActive: boolean
    createdAt: Date
}

export interface Fee {
    id: string
    tenantId: string
    studentId: string
    amount: number
    dueDate: string
    paidDate?: string
    status: string
    lateFee: number
    notes?: string
    createdAt: Date
}

export interface Payment {
    id: string
    tenantId: string
    studentId: string
    feeId?: string
    amount: number
    mode: string
    reference?: string
    receivedBy?: string
    notes?: string
    createdAt: Date
}

export interface Attendance {
    id: string
    tenantId: string
    studentId?: string
    batchId: string
    date: string
    status: string
    markedBy?: string
    notes?: string
    createdAt: Date
}

export interface MockTest {
    id: string
    tenantId: string
    batchId?: string
    title: string
    subject?: string
    type: string
    duration: number
    totalMarks: number
    passingMarks: number
    negativeMarks: number
    isPublished: boolean
    instructions?: string
    createdAt: Date
}

export interface Question {
    id: string
    tenantId: string
    mockTestId?: string
    subject: string
    topic?: string
    questionText: string
    type: string
    options?: string[]
    correctAnswer?: string
    marks: number
    difficulty: string
    explanation?: string
    createdAt: Date
}

export interface Result {
    id: string
    tenantId: string
    studentId: string
    mockTestId: string
    totalMarks: number
    obtainedMarks: number
    percentage: number
    rank?: number
    createdAt: Date
}

export interface Expense {
    id: string
    tenantId: string
    category: string
    amount: number
    date: string
    description?: string
    paidTo?: string
    createdAt: Date
}

export interface Lead {
    id: string
    tenantId: string
    name: string
    phone: string
    email?: string
    course?: string
    source?: string
    status: string
    followUpDate?: string
    notes?: string
    assignedTo?: string
    createdAt: Date
}

export interface Subscription {
    id: string
    tenantId: string
    plan: string
    status: string
    trialEndsAt?: Date
    amount: number
    createdAt: Date
}

function cuid(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// Seeded Data
const seedTenant: Tenant = {
    id: 'tenant_demo',
    name: 'Sharma Coaching Classes',
    slug: 'sharma-coaching',
    themeColor: '#6366f1',
    address: 'C-45, Lajpat Nagar, New Delhi - 110024',
    phone: '917879337770',
    email: 'info@sharmacoaching.in',
    isActive: true,
    createdAt: new Date('2024-01-01'),
}

const seedAdminPassword = bcrypt.hashSync('admin123', 10)

const seedUsers: User[] = [
    {
        id: 'user_admin',
        tenantId: 'tenant_demo',
        email: 'admin@coaching.com',
        phone: '917879337770',
        password: seedAdminPassword,
        name: 'Rajesh Sharma',
        role: 'COACHING_ADMIN',
        isActive: true,
        createdAt: new Date('2024-01-01'),
    },
    {
        id: 'user_teacher1',
        tenantId: 'tenant_demo',
        email: 'teacher@coaching.com',
        phone: '9876543211',
        password: bcrypt.hashSync('teacher123', 10),
        name: 'Priya Singh',
        role: 'TEACHER',
        isActive: true,
        createdAt: new Date('2024-01-15'),
    },
    {
        id: 'user_superadmin',
        tenantId: 'tenant_demo',
        email: 'superadmin@udba.space',
        phone: '9999999999',
        password: bcrypt.hashSync('super123', 10),
        name: 'Super Admin',
        role: 'SUPER_ADMIN',
        isActive: true,
        createdAt: new Date('2024-01-01'),
    },
]

const seedCourses: Course[] = [
    { id: 'course_1', tenantId: 'tenant_demo', name: 'JEE Foundation', description: 'IIT-JEE preparation', duration: '2 Years', fees: 45000, subjects: ['Physics', 'Chemistry', 'Maths'], isActive: true, createdAt: new Date() },
    { id: 'course_2', tenantId: 'tenant_demo', name: 'NEET Preparation', description: 'NEET-UG preparation', duration: '2 Years', fees: 48000, subjects: ['Physics', 'Chemistry', 'Biology'], isActive: true, createdAt: new Date() },
    { id: 'course_3', tenantId: 'tenant_demo', name: 'Class 10 Board', description: 'Board exam preparation', duration: '1 Year', fees: 25000, subjects: ['Maths', 'Science', 'English', 'Hindi', 'SST'], isActive: true, createdAt: new Date() },
    { id: 'course_4', tenantId: 'tenant_demo', name: 'CA Foundation', description: 'CA Foundation course', duration: '6 Months', fees: 30000, subjects: ['Accounts', 'Economics', 'Maths', 'Law'], isActive: true, createdAt: new Date() },
]

const seedBatches: Batch[] = [
    { id: 'batch_1', tenantId: 'tenant_demo', courseId: 'course_1', name: 'JEE Morning Batch', startTime: '07:00', endTime: '10:00', capacity: 35, isActive: true, createdAt: new Date() },
    { id: 'batch_2', tenantId: 'tenant_demo', courseId: 'course_1', name: 'JEE Evening Batch', startTime: '17:00', endTime: '20:00', capacity: 30, isActive: true, createdAt: new Date() },
    { id: 'batch_3', tenantId: 'tenant_demo', courseId: 'course_2', name: 'NEET Morning Batch', startTime: '07:00', endTime: '10:30', capacity: 40, isActive: true, createdAt: new Date() },
    { id: 'batch_4', tenantId: 'tenant_demo', courseId: 'course_3', name: 'Class 10 Weekend', startTime: '09:00', endTime: '13:00', capacity: 25, isActive: true, createdAt: new Date() },
]

const seedStudents: Student[] = [
    { id: 'stu_1', tenantId: 'tenant_demo', courseId: 'course_1', batchId: 'batch_1', studentId: 'STU001', fullName: 'Arjun Sharma', fatherName: 'Ramesh Sharma', phone: '9876501001', parentPhone: '9876501002', email: 'arjun@example.com', gender: 'MALE', admissionDate: '2024-04-01', feePlan: 'Quarterly', totalFee: 45000, paidFee: 22500, status: 'ACTIVE', createdAt: new Date('2024-04-01') },
    { id: 'stu_2', tenantId: 'tenant_demo', courseId: 'course_2', batchId: 'batch_3', studentId: 'STU002', fullName: 'Priya Verma', fatherName: 'Suresh Verma', phone: '9876502001', parentPhone: '9876502002', email: 'priya@example.com', gender: 'FEMALE', admissionDate: '2024-04-05', feePlan: 'Annual', totalFee: 48000, paidFee: 48000, status: 'ACTIVE', createdAt: new Date('2024-04-05') },
    { id: 'stu_3', tenantId: 'tenant_demo', courseId: 'course_1', batchId: 'batch_2', studentId: 'STU003', fullName: 'Rahul Gupta', fatherName: 'Mahesh Gupta', phone: '9876503001', gender: 'MALE', admissionDate: '2024-04-10', feePlan: 'Monthly', totalFee: 45000, paidFee: 15000, status: 'ACTIVE', createdAt: new Date('2024-04-10') },
    { id: 'stu_4', tenantId: 'tenant_demo', courseId: 'course_3', batchId: 'batch_4', studentId: 'STU004', fullName: 'Sneha Patel', fatherName: 'Kamlesh Patel', phone: '9876504001', gender: 'FEMALE', admissionDate: '2024-04-15', feePlan: 'Annual', totalFee: 25000, paidFee: 25000, status: 'ACTIVE', createdAt: new Date('2024-04-15') },
    { id: 'stu_5', tenantId: 'tenant_demo', courseId: 'course_2', batchId: 'batch_3', studentId: 'STU005', fullName: 'Vikram Singh', fatherName: 'Brijesh Singh', phone: '9876505001', gender: 'MALE', admissionDate: '2024-05-01', feePlan: 'Quarterly', totalFee: 48000, paidFee: 24000, status: 'ACTIVE', createdAt: new Date('2024-05-01') },
    { id: 'stu_6', tenantId: 'tenant_demo', courseId: 'course_4', batchId: 'batch_1', studentId: 'STU006', fullName: 'Anjali Mishra', fatherName: 'Dinesh Mishra', phone: '9876506001', gender: 'FEMALE', admissionDate: '2024-05-10', feePlan: 'Monthly', totalFee: 30000, paidFee: 10000, status: 'ACTIVE', createdAt: new Date('2024-05-10') },
]

const seedTeachers: Teacher[] = [
    { id: 'teacher_1', tenantId: 'tenant_demo', name: 'Dr. Rajesh Kumar', email: 'rajesh@coaching.com', phone: '9876511001', subject: ['Physics', 'Maths'], salary: 45000, joinDate: '2023-06-01', isActive: true, createdAt: new Date() },
    { id: 'teacher_2', tenantId: 'tenant_demo', name: 'Priya Singh', email: 'priya.t@coaching.com', phone: '9876511002', subject: ['Chemistry', 'Biology'], salary: 40000, joinDate: '2023-07-01', isActive: true, createdAt: new Date() },
    { id: 'teacher_3', tenantId: 'tenant_demo', name: 'Amit Jain', email: 'amit@coaching.com', phone: '9876511003', subject: ['Maths', 'Accounts'], salary: 38000, joinDate: '2023-08-01', isActive: true, createdAt: new Date() },
]

const seedExpenses: Expense[] = [
    { id: 'exp_1', tenantId: 'tenant_demo', category: 'Rent', amount: 25000, date: '2024-12-01', description: 'Monthly office rent', createdAt: new Date() },
    { id: 'exp_2', tenantId: 'tenant_demo', category: 'Salary', amount: 123000, date: '2024-12-31', description: 'Teacher salaries December', createdAt: new Date() },
    { id: 'exp_3', tenantId: 'tenant_demo', category: 'Electricity', amount: 8500, date: '2024-12-05', description: 'Electricity bill', createdAt: new Date() },
    { id: 'exp_4', tenantId: 'tenant_demo', category: 'Marketing', amount: 15000, date: '2024-12-10', description: 'Digital marketing', createdAt: new Date() },
    { id: 'exp_5', tenantId: 'tenant_demo', category: 'Misc', amount: 3500, date: '2024-12-15', description: 'Stationery & supplies', createdAt: new Date() },
]

const seedLeads: Lead[] = [
    { id: 'lead_1', tenantId: 'tenant_demo', name: 'Rohan Agarwal', phone: '9876520001', email: 'rohan@example.com', course: 'JEE Foundation', source: 'Website', status: 'NEW', createdAt: new Date() },
    { id: 'lead_2', tenantId: 'tenant_demo', name: 'Kavya Nair', phone: '9876520002', course: 'NEET Preparation', source: 'WhatsApp', status: 'CONTACTED', followUpDate: '2025-01-15', createdAt: new Date() },
    { id: 'lead_3', tenantId: 'tenant_demo', name: 'Aditya Mehta', phone: '9876520003', course: 'Class 10 Board', source: 'Referral', status: 'INTERESTED', createdAt: new Date() },
    { id: 'lead_4', tenantId: 'tenant_demo', name: 'Simran Kaur', phone: '9876520004', course: 'JEE Foundation', source: 'Instagram', status: 'CONVERTED', createdAt: new Date() },
]

const seedMockTests: MockTest[] = [
    { id: 'test_1', tenantId: 'tenant_demo', batchId: 'batch_1', title: 'Physics Chapter 1 Test', subject: 'Physics', type: 'MCQ', duration: 60, totalMarks: 100, passingMarks: 40, negativeMarks: 0.25, isPublished: true, createdAt: new Date() },
    { id: 'test_2', tenantId: 'tenant_demo', batchId: 'batch_3', title: 'Biology Mock Test', subject: 'Biology', type: 'MCQ', duration: 90, totalMarks: 180, passingMarks: 72, negativeMarks: 1, isPublished: true, createdAt: new Date() },
]

const seedPayments: Payment[] = [
    { id: 'pay_1', tenantId: 'tenant_demo', studentId: 'stu_1', amount: 11250, mode: 'UPI', reference: 'UPI123456', createdAt: new Date('2024-10-01') },
    { id: 'pay_2', tenantId: 'tenant_demo', studentId: 'stu_1', amount: 11250, mode: 'CASH', createdAt: new Date('2024-12-01') },
    { id: 'pay_3', tenantId: 'tenant_demo', studentId: 'stu_2', amount: 48000, mode: 'BANK_TRANSFER', reference: 'NEFT789012', createdAt: new Date('2024-04-05') },
    { id: 'pay_4', tenantId: 'tenant_demo', studentId: 'stu_5', amount: 12000, mode: 'UPI', createdAt: new Date('2024-11-01') },
    { id: 'pay_5', tenantId: 'tenant_demo', studentId: 'stu_5', amount: 12000, mode: 'UPI', createdAt: new Date('2024-12-01') },
]

// Global mutable store
export const store = {
    tenants: [seedTenant] as Tenant[],
    users: seedUsers as User[],
    students: seedStudents as Student[],
    courses: seedCourses as Course[],
    batches: seedBatches as Batch[],
    teachers: seedTeachers as Teacher[],
    fees: [] as Fee[],
    payments: seedPayments as Payment[],
    attendances: [] as Attendance[],
    mockTests: seedMockTests as MockTest[],
    questions: [] as Question[],
    results: [] as Result[],
    expenses: seedExpenses as Expense[],
    leads: seedLeads as Lead[],
    subscriptions: [
        { id: 'sub_1', tenantId: 'tenant_demo', plan: 'PRO', status: 'ACTIVE', amount: 2999, createdAt: new Date() }
    ] as Subscription[],
}

export function generateId(): string {
    return cuid()
}

export function getTenantStore(tenantId: string) {
    return {
        students: store.students.filter(s => s.tenantId === tenantId),
        courses: store.courses.filter(c => c.tenantId === tenantId),
        batches: store.batches.filter(b => b.tenantId === tenantId),
        teachers: store.teachers.filter(t => t.tenantId === tenantId),
        fees: store.fees.filter(f => f.tenantId === tenantId),
        payments: store.payments.filter(p => p.tenantId === tenantId),
        attendances: store.attendances.filter(a => a.tenantId === tenantId),
        mockTests: store.mockTests.filter(m => m.tenantId === tenantId),
        questions: store.questions.filter(q => q.tenantId === tenantId),
        results: store.results.filter(r => r.tenantId === tenantId),
        expenses: store.expenses.filter(e => e.tenantId === tenantId),
        leads: store.leads.filter(l => l.tenantId === tenantId),
    }
}
