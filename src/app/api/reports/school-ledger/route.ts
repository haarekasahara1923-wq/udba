import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { requireAuth } from '@/app/api/middleware'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
    const { error, user } = requireAuth(req)
    if (error) return error

    try {
        const tenantId = user!.tenantId

        // Fetch Payments (Credits)
        const payments = await prisma.payment.findMany({
            where: { tenantId },
            include: { student: { select: { fullName: true } } },
            orderBy: { createdAt: 'asc' }
        })

        // Fetch Expenses (Debits)
        const expenses = await prisma.expense.findMany({
            where: { tenantId },
            orderBy: { date: 'asc' }
        })

        // Unify into Ledger Entries
        const ledger = []
        
        for (const p of payments) {
            ledger.push({
                id: `pay_${p.id}`,
                date: p.createdAt.toISOString(),
                type: 'CREDIT',
                category: 'Fee Payment',
                description: `Payment from ${p.student.fullName} (Ref: ${p.reference || 'N/A'})`,
                amount: p.amount,
                source: 'Payment',
            })
        }

        for (const e of expenses) {
            ledger.push({
                id: `exp_${e.id}`,
                date: e.date.toISOString(),
                type: 'DEBIT',
                category: e.category,
                description: `Paid To: ${e.paidTo || 'N/A'} - ${e.description || 'No description'}`,
                amount: e.amount,
                source: 'Expense',
            })
        }

        // Sort by date ascending
        ledger.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

        // Calculate running balance
        let balance = 0
        const ledgerWithBalance = ledger.map(entry => {
            if (entry.type === 'CREDIT') balance += entry.amount
            else balance -= entry.amount
            return { ...entry, balance }
        })

        return NextResponse.json({
            success: true,
            data: ledgerWithBalance.reverse() // Newest first for UI
        })
    } catch (err) {
        console.error('School Ledger API Error:', err)
        return NextResponse.json({ error: 'Failed to fetch ledger' }, { status: 500 })
    }
}
