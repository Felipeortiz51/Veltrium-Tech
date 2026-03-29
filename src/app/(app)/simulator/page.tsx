import prisma from "@/lib/prisma"
import { getMonthlyMetrics } from "@/services/reports"
import { SimulatorClient } from "@/components/simulator/simulator-client"

export const dynamic = 'force-dynamic'

export default async function SimulatorPage() {
  const company = await prisma.company.findFirst()
  
  if (!company) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">No hay una empresa configurada.</p>
      </div>
    )
  }

  const today = new Date()
  const metrics = await getMonthlyMetrics(company.id, today)

  // Calcular promedios para inicializar el simulador
  // Si no hay transacciones, caemos a los defaults por defecto del Excel (119500, 500000, 150000)
  
  // Costos Fijos Brutos (aquí convertiremos a bruto por simplicidad de UX para no marear al usuario,
  // el componente los convierte de vuelta a neto internamente). O usaremos netos?
  // En tu Excel, 119500 es el fijo.
  const fixedCosts = metrics.gastosOperacionalesNeto > 0 
    ? metrics.gastosOperacionalesNeto 
    : 119500

  const avgJobs = metrics.numeroTrabajosRealizados > 0 ? metrics.numeroTrabajosRealizados : 0
  
  const avgPrice = avgJobs > 0 
    ? metrics.ingresosBrutos / avgJobs 
    : 500000
    
  // Costo Directo Bruto aproximado: tomamos el Costo Neto Directo, le sumamos IVA para que calce con la UX de "ingreso bruto" del cliente.
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
