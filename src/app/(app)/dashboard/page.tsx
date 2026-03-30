import { getMonthlyMetrics } from "@/services/reports"
import { DollarSign, Wallet, TrendingUp, AlertTriangle, Percent, Briefcase, MinusCircle, Landmark } from "lucide-react"
import { cn } from "@/lib/utils"
import { DashboardExport } from "@/components/dashboard/dashboard-export"
import { getAuthSession } from "@/lib/auth"

export const dynamic = 'force-dynamic'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount)
}

export default async function DashboardPage() {
  const session = await getAuthSession()

  const today = new Date()
  const metrics = await getMonthlyMetrics(session.companyId, today)

  const mesActual = new Intl.DateTimeFormat('es-CL', { month: 'long', year: 'numeric' }).format(today)
  const mesCapitalizado = mesActual.charAt(0).toUpperCase() + mesActual.slice(1)

  return (
    <div className="space-y-8 pb-8">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">Estado de Resultados</h2>
          <p className="text-muted-foreground mt-1">Periodo actual: <span className="font-semibold text-foreground">{mesCapitalizado}</span></p>
        </div>
        <DashboardExport metrics={metrics} monthLabel={mesCapitalizado} />
      </div>

      {/* KPI Row 1: The Core Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

        {/* FLUJO DE CAJA VS DEVENGADO */}
        <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm p-6 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] z-0" />
          <div className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Facturado (Devengado)</h3>
            <DollarSign className="h-4 w-4 text-primary" />
          </div>
          <div className="relative z-10 mt-2">
            <div className="text-2xl font-bold text-primary">{formatCurrency(metrics.ingresosNetos)}</div>

            <div className="mt-4 pt-3 border-t border-border/50">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground font-medium">Líquido en Caja:</span>
                <span className={cn("text-sm font-bold", metrics.flujoCajaReal < metrics.ingresosNetos ? "text-amber-500" : "text-green-600")}>
                  {formatCurrency(metrics.flujoCajaReal)}
                </span>
              </div>
              {metrics.ingresosNetos > metrics.flujoCajaReal && (
                <p className="text-[10px] text-amber-500 mt-1 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Cuentas por cobrar: {formatCurrency(metrics.ingresosBrutos - metrics.flujoCajaReal)} (Bruto)
                </p>
              )}
            </div>
          </div>
        </div>

        {/* COSTOS DIRECTOS */}
        <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm p-6 overflow-hidden relative">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Costos Directos</h3>
            <MinusCircle className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="relative z-10 mt-2">
            <div className="text-2xl font-bold">{formatCurrency(metrics.costosDirectosNeto)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Materiales, subcontratos, terreno
            </p>
          </div>
        </div>

        {/* MARGEN BRUTO */}
        <div className={cn(
          "rounded-xl border shadow-sm p-6 overflow-hidden relative",
          metrics.margenBrutoPorcentaje >= 40
            ? "border-accent/40 bg-accent/5"
            : metrics.margenBrutoPorcentaje > 0 ? "border-yellow-500/40 bg-yellow-500/5 text-yellow-800 dark:text-yellow-400" : "border-border bg-card"
        )}>
          <div className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <h3 className="tracking-tight text-sm font-medium">Margen Bruto</h3>
            {metrics.margenBrutoPorcentaje >= 40 ? (
              <Percent className="h-4 w-4 text-accent" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            )}
          </div>
          <div className="relative z-10 mt-2 flex items-end justify-between">
            <div className="text-2xl font-bold">{formatCurrency(metrics.margenBruto)}</div>
            <div className="text-lg font-bold">
              {metrics.margenBrutoPorcentaje.toFixed(1)}%
            </div>
          </div>
          <p className="text-xs opacity-80 mt-1">
            {metrics.margenBrutoPorcentaje >= 40 ? "Retorno saludable (>40%)" : "Atención: Margen bajo meta de 40%"}
          </p>
        </div>

        {/* TRABAJOS */}
        <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm p-6 overflow-hidden relative">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Trabajos Realizados</h3>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="relative z-10 mt-2">
            <div className="text-2xl font-bold">{metrics.numeroTrabajosRealizados}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.numeroTrabajosRealizados > 0
                ? `Promedio: ${formatCurrency(metrics.ingresosNetos / metrics.numeroTrabajosRealizados)} c/u`
                : "Sin actividad en el periodo"}
            </p>
          </div>
        </div>
      </div>

      {/* Row 2: Bottom Line & Taxes */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

        {/* GASTOS OPERACIONALES */}
        <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Gastos Operacionales</h3>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 text-2xl font-bold">{formatCurrency(metrics.gastosOperacionalesNeto)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Costos fijos del negocio (Patente, contador, etc)
          </p>
        </div>

        {/* UTILIDAD NETA */}
        <div className={cn(
          "rounded-xl border shadow-sm p-6 relative overflow-hidden",
          metrics.utilidadNeta > 0
            ? "border-primary/50 bg-primary/10 text-primary-foreground"
            : "border-destructive/30 bg-destructive/5 text-destructive"
        )}>
          {metrics.utilidadNeta > 0 && <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-16 -mt-16 z-0" />}

          <div className="flex flex-row items-center justify-between pb-2 relative z-10">
            <h3 className={cn("tracking-tight text-sm font-semibold uppercase", metrics.utilidadNeta > 0 ? "text-primary" : "")}>
              Utilidad Neta
            </h3>
            <TrendingUp className="h-4 w-4" />
          </div>
          <div className="relative z-10 mt-2">
            <div className={cn("text-4xl font-black tracking-tight", metrics.utilidadNeta > 0 ? "text-primary dark:text-white" : "")}>
              {formatCurrency(metrics.utilidadNeta)}
            </div>
            <p className={cn("text-sm mt-2 font-medium", metrics.utilidadNeta > 0 ? "text-primary/80" : "text-destructive/80")}>
              {metrics.utilidadNeta > 0 ? "Sosteniendo operaciones rentables" : "Pérdida en este periodo"}
            </p>
          </div>
        </div>

        {/* IVA A PAGAR (CAJA FISCO) */}
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 shadow-sm p-6">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="tracking-tight text-sm font-medium text-amber-800 dark:text-amber-500">Caja Fisco (IVA a Pagar)</h3>
            <Landmark className="h-4 w-4 text-amber-600 dark:text-amber-500" />
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div className="text-2xl font-bold text-amber-900 dark:text-amber-400">
              {formatCurrency(Math.max(0, metrics.ivaAPagar))}
            </div>
          </div>
          <div className="mt-3 flex flex-col gap-1 text-xs text-amber-800/70 dark:text-amber-500/70">
            <div className="flex justify-between">
              <span>+ Débito (Ventas):</span>
              <span>{formatCurrency(metrics.ivaDebito)}</span>
            </div>
            <div className="flex justify-between">
              <span>- Crédito (Compras):</span>
              <span>{formatCurrency(metrics.ivaCredito)}</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  )
}
