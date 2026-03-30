import prisma from '@/lib/prisma'
import { DebtFormValues, DebtPaymentFormValues } from '@/lib/validators'

export async function createDebt(data: DebtFormValues, companyId: string) {
  const debt = await prisma.debt.create({
    data: {
      name: data.name,
      initialBalance: data.initialBalance,
      currentBalance: data.initialBalance,
      monthlyRate: data.monthlyRate,
      basePayment: data.basePayment,
      totalPayments: data.totalPayments ?? null,
      startDate: data.startDate,
      companyId,
    }
  })
  return debt
}

export async function registerPayment(data: DebtPaymentFormValues, companyId: string) {
  // 1. Get the debt and verify ownership
  const debt = await prisma.debt.findFirst({
    where: { id: data.debtId, companyId },
    include: { payments: { orderBy: { createdAt: 'desc' }, take: 1 } }
  })
  if (!debt) throw new Error("Deuda no encontrada")
  if (debt.status === 'PAID') throw new Error("Esta deuda ya fue pagada completamente")

  // 2. Calculate interest and principal
  const balanceBefore = debt.currentBalance
  const interestCharged = Math.round(balanceBefore * debt.monthlyRate)
  const principalPaid = data.amountPaid - interestCharged
  const balanceAfter = Math.max(0, balanceBefore - principalPaid)

  // 3. Create the payment and update the debt balance in a transaction
  const [payment] = await prisma.$transaction([
    prisma.debtPayment.create({
      data: {
        debtId: data.debtId,
        month: data.month,
        amountPaid: data.amountPaid,
        interestCharged,
        principalPaid: Math.max(0, principalPaid),
        balanceAfter,
      }
    }),
    prisma.debt.update({
      where: { id: data.debtId },
      data: {
        currentBalance: balanceAfter,
        status: balanceAfter <= 0 ? 'PAID' : 'ACTIVE',
      }
    })
  ])

  return payment
}

export async function getDebts(companyId: string) {
  return prisma.debt.findMany({
    where: { companyId },
    orderBy: { createdAt: 'desc' },
    include: {
      payments: {
        orderBy: { month: 'asc' }
      }
    }
  })
}

export async function getDebtById(id: string, companyId: string) {
  return prisma.debt.findFirst({
    where: { id, companyId },
    include: {
      payments: {
        orderBy: { month: 'asc' }
      }
    }
  })
}

export async function updateDebtStatus(id: string, status: 'ACTIVE' | 'DELINQUENT' | 'RESTRUCTURED', companyId: string) {
  return prisma.debt.update({
    where: { id, companyId },
    data: { status }
  })
}

export async function getDebtSummary(companyId: string) {
  const debts = await prisma.debt.findMany({
    where: { companyId },
    include: { payments: true }
  })

  const totalInitialBalance = debts.reduce((acc, d) => acc + d.initialBalance, 0)
  const totalCurrentBalance = debts.reduce((acc, d) => acc + d.currentBalance, 0)
  const totalPaid = totalInitialBalance - totalCurrentBalance
  const activeDebts = debts.filter(d => d.status === 'ACTIVE').length
  const totalMonthlyPayment = debts
    .filter(d => d.status === 'ACTIVE')
    .reduce((acc, d) => acc + d.basePayment, 0)

  return {
    totalInitialBalance,
    totalCurrentBalance,
    totalPaid,
    activeDebts,
    totalDebts: debts.length,
    totalMonthlyPayment,
  }
}
