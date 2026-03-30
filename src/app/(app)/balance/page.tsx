import prisma from "@/lib/prisma"
import { getMonthlyMetrics } from "@/services/reports"
import { BalanceClient } from "@/components/balance/balance-client"
import { Landmark } from "lucide-react"
import { getAuthSession } from "@/lib/auth"

export const dynamic = 'force-dynamic'

export default async function BalancePage() {
  const session = await getAuthSession()

  const assets = await prisma.asset.findMany({
    where: { companyId: session.companyId },
    orderBy: { updatedAt: 'desc' }
  })

  const manualLiabilities = await prisma.liability.findMany({
    where: { companyId: session.companyId },
    orderBy: { updatedAt: 'desc' }
  })

  const today = new Date()
  const metrics = await getMonthlyMetrics(session.companyId, today)
  const autoIvaPayable = Math.max(0, metrics.ivaAPagar)

  const paidTransactions = await prisma.transaction.findMany({
    where: {
      companyId: session.companyId,
      isVoided: false,
      status: 'PAID' as any
    } as any,
    select: {
      type: true,
      amount: true
    }
  })

  let autoCashPosition = 0
  for (const t of paidTransactions) {
    if (t.type === 'INCOME') {
      autoCashPosition += t.amount
    } else {
      autoCashPosition -= t.amount
    }
  }

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-primary flex items-center">
          <Landmark className="mr-3 h-8 w-8 text-muted-foreground" />
          Balance General
        </h2>
        <p className="text-muted-foreground mt-1">Estado de situación patrimonial corporativo.</p>
      </div>

      <BalanceClient
        assets={assets}
        manualLiabilities={manualLiabilities}
        autoIvaPayable={autoIvaPayable}
        autoCashPosition={autoCashPosition}
      />
    </div>
  )
}
