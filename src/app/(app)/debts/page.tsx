import prisma from "@/lib/prisma"
import { getDebtSummary } from "@/services/debts"
import { DebtsClient } from "@/components/debts/debts-client"
import { CreditCard } from "lucide-react"
import { getAuthSession } from "@/lib/auth"

export const dynamic = 'force-dynamic'

export default async function DebtsPage() {
  const session = await getAuthSession()

  const debts = await prisma.debt.findMany({
    where: { companyId: session.companyId },
    orderBy: { createdAt: 'desc' },
    include: {
      payments: {
        orderBy: { month: 'asc' }
      }
    }
  })

  const summary = await getDebtSummary(session.companyId)

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-primary flex items-center">
          <CreditCard className="mr-3 h-8 w-8 text-muted-foreground" />
          Control de Deudas
        </h2>
        <p className="text-muted-foreground mt-1">Seguimiento de créditos, préstamos y amortización.</p>
      </div>

      <DebtsClient debts={debts} summary={summary} />
    </div>
  )
}
