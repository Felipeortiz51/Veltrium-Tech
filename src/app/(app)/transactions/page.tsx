import prisma from '@/lib/prisma'
import { TransactionClient } from '@/components/transactions/transaction-client'
import { getTransactions } from '@/services/transactions'
import { getAuthSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function TransactionsPage() {
  const session = await getAuthSession()

  const categories = await prisma.transactionCategory.findMany({
    where: { companyId: session.companyId },
    orderBy: { sortOrder: 'asc' }
  })

  const transactions = await getTransactions(session.companyId)

  const projects = await prisma.project.findMany({
    where: { companyId: session.companyId, status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <TransactionClient
      transactions={transactions}
      categories={categories}
      projects={projects}
    />
  )
}
