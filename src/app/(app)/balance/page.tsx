import prisma from "@/lib/prisma"
import { getMonthlyMetrics } from "@/services/reports"
import { BalanceClient } from "@/components/balance/balance-client"
import { Landmark } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function BalancePage() {
  const company = await prisma.company.findFirst()
  if (!company) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-muted-foreground">
        No hay empresa configurada.
      </div>
    )
  }

  // 1. Obtener Activos
  const assets = await prisma.asset.findMany({
    where: { companyId: company.id },
    orderBy: { updatedAt: 'desc' }
  })

  // 2. Obtener Pasivos (Manuales)
  const manualLiabilities = await prisma.liability.findMany({
    where: { companyId: company.id },
    orderBy: { updatedAt: 'desc' }
  })

  // 3. Obtener Pasivo Automático (IVA a Pagar del Mes en curso)
  const today = new Date()
  const metrics = await getMonthlyMetrics(company.id, today)
  const autoIvaPayable = Math.max(0, metrics.ivaAPagar)

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
      />
    </div>
  )
}
