import prisma from '@/lib/prisma'
import { TransactionClient } from '@/components/transactions/transaction-client'
import { getTransactions } from '@/services/transactions'

export const dynamic = 'force-dynamic'

export default async function TransactionsPage() {
  // Para MVP: Obtener la primera empresa y el primer usuario disponible (simulando Auth)
  const company = await prisma.company.findFirst()
  
  if (!company) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="p-6 bg-secondary/10 border border-border rounded-lg text-center shadow-sm">
          <h2 className="text-xl font-bold text-destructive">Error Crítico</h2>
          <p className="mt-2 text-muted-foreground">
            No hay una empresa configurada en la base de datos.<br />
            Por favor, asegúrese de ejecutar el script `seed.ts`.
          </p>
        </div>
      </div>
    )
  }

  // Cargar categorías
  const categories = await prisma.transactionCategory.findMany({
    where: { companyId: company.id },
    orderBy: { sortOrder: 'asc' }
  })

  // Cargar transacciones recientes
  const transactions = await getTransactions(company.id)

  return (
    <TransactionClient 
      transactions={transactions} 
      categories={categories} 
    />
  )
}
