// =============================================
// PLAN LIMITS & FEATURE GATING CONFIGURATION
// =============================================
// Plan restrictions are completely disabled / inactive.
// All schools/institutes and Super Admins have unlimited students, teachers,
// courses, mock tests, and access to all platform features without restriction.

export type PlanType = 'BASIC' | 'PRO' | 'ELITE' | 'UNLIMITED'

export interface PlanLimits {
    maxStudents: number       // -1 = unlimited
    maxTeachers: number       // -1 = unlimited
    maxBranches: number       // -1 = unlimited
    maxMockTests: number      // per month, -1 = unlimited
    maxAIQuestions: number    // per month, -1 = unlimited
    maxWhatsAppMessages: number // per month, -1 = unlimited
    maxLeads: number          // -1 = unlimited
    maxCourses: number        // -1 = unlimited
    maxBatches: number        // -1 = unlimited
}

export interface PlanFeatures {
    feeManagement: boolean
    attendance: boolean
    analytics: boolean
    mockTests: boolean
    aiTools: boolean
    whatsApp: boolean
    leadManagement: boolean
    expenseTracking: boolean
    multiBranch: boolean
    whiteLabel: boolean
    customDomain: boolean
    apiAccess: boolean
    franchiseMode: boolean
    advancedReports: boolean
    bulkSmsEmail: boolean
    parentPortal: boolean
}

export interface PlanConfig {
    name: string
    displayName: string
    price: number
    limits: PlanLimits
    features: PlanFeatures
}

// All limits set to -1 (UNLIMITED)
const UNLIMITED_LIMITS: PlanLimits = {
    maxStudents: -1,
    maxTeachers: -1,
    maxBranches: -1,
    maxMockTests: -1,
    maxAIQuestions: -1,
    maxWhatsAppMessages: -1,
    maxLeads: -1,
    maxCourses: -1,
    maxBatches: -1,
}

// All features enabled
const ALL_FEATURES_ENABLED: PlanFeatures = {
    feeManagement: true,
    attendance: true,
    analytics: true,
    mockTests: true,
    aiTools: true,
    whatsApp: true,
    leadManagement: true,
    expenseTracking: true,
    multiBranch: true,
    whiteLabel: true,
    customDomain: true,
    apiAccess: true,
    franchiseMode: true,
    advancedReports: true,
    bulkSmsEmail: true,
    parentPortal: true,
}

const UNLIMITED_CONFIG: PlanConfig = {
    name: 'UNLIMITED',
    displayName: 'Unlimited Lifetime Plan',
    price: 0,
    limits: UNLIMITED_LIMITS,
    features: ALL_FEATURES_ENABLED,
}

export const PLAN_CONFIGS: Record<string, PlanConfig> = {
    BASIC: UNLIMITED_CONFIG,
    PRO: UNLIMITED_CONFIG,
    ELITE: UNLIMITED_CONFIG,
    UNLIMITED: UNLIMITED_CONFIG,
}

// =============================================
// HELPER FUNCTIONS (Always return unlimited / allowed)
// =============================================

export function getPlanConfig(_plan?: string): PlanConfig {
    return UNLIMITED_CONFIG
}

export function hasFeature(_plan: string, _feature: keyof PlanFeatures): boolean {
    return true
}

export function getLimit(_plan: string, _limit: keyof PlanLimits): number {
    return -1
}

export function isWithinLimit(_plan: string, _limit: keyof PlanLimits, _currentCount: number): boolean {
    return true
}

export function getLimitDisplay(_plan: string, _limit: keyof PlanLimits): string {
    return 'Unlimited'
}

export function getUpgradePlanForFeature(_feature: keyof PlanFeatures): PlanType {
    return 'UNLIMITED'
}

export function getUpgradePlanForLimit(_limit: keyof PlanLimits, _currentPlan: string): PlanType | null {
    return null
}

// Sidebar navigation items with their required features (all accessible)
export const NAV_FEATURE_MAP: Record<string, keyof PlanFeatures | null> = {
    '/dashboard': null,
    '/dashboard/students': null,
    '/dashboard/students/add': null,
    '/dashboard/courses': null,
    '/dashboard/fees': null,
    '/dashboard/payments': null,
    '/dashboard/expenses': null,
    '/dashboard/attendance': null,
    '/dashboard/profile': null,
    '/dashboard/subscription': null,
    '/dashboard/analytics': null,
    '/dashboard/mock-tests': null,
    '/dashboard/ai-tools': null,
    '/dashboard/teachers': null,
    '/dashboard/leads': null,
    '/dashboard/whatsapp': null,
}
