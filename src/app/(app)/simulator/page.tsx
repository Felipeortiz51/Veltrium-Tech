import { getMonthlyMetrics } from "@/services/reports"
import { SimulatorClient } from "@/components/simulator/simulator-client"
import { getAuthSession } from "@/lib/auth"

export const dynamic = 'force-dynamic'

export default async function SimulatorPage() {
  const session = await getAuthSession()

  const today = new Date()
  const metrics = await getMonthlyMetrics(session.companyId, today)

  const fixedCosts = metrics.gastosOperacionalesNeto > 0
    ? metrics.gastosOperacionalesNeto
    : 119500

  const avgJobs = metrics.numeroTrabajosRealizados > 0 ? metrics.numeroTrabajosRealizados : 0

  const avgPrice = avgJobs > 0
    ? metrics.ingresosBrutos / avgJobs
    : 500000

  const avgDirectCostBruto = avgJobs > 0
    ? (metrics.costosDirectosNeto * 1.19) / avgJobs
    : 150000

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-primary">Simulador de Negocio</h2>
        <p className="text-muted-foreground mt-1">Simula el <strong className="font-semibold">Punto de Equilibrio</strong> y escenarios de rentabilidad de Veltrium Tech.</p>
      </div>

      <SimulatorClient
        initialFixedCosts={Math.round(fixedCosts)}
        initialPrice={Math.round(avgPrice)}
        initialDirectCost={Math.round(avgDirectCostBruto)}
      />
    </div>
  )
}
