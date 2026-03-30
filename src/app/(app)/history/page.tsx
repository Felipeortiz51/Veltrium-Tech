import { getCompanyHistory } from "@/services/reports"
import { formatCurrency } from "@/hooks/use-currency"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { History as HistoryIcon, TrendingUp, AlertCircle, BarChart3, CheckCircle2 } from "lucide-react"
import { HistoryExport } from "@/components/history/history-export"
import { getAuthSession } from "@/lib/auth"

export const dynamic = 'force-dynamic'

export default async function HistoryPage() {
  const session = await getAuthSession()

  const history = await getCompanyHistory(session.companyId)

  let utilidadAcumulada = 0
  let mejorMesMonto = 0
  let mejorMesStr = "-"
  let totalTrabajos = 0

  history.forEach(h => {
    utilidadAcumulada += h.utilidadNeta
    totalTrabajos += h.numeroTrabajos
    if (h.ingresosBrutos > mejorMesMonto) {
      mejorMesMonto = h.ingresosBrutos
      mejorMesStr = new Intl.DateTimeFormat('es-CL', { month: 'short', year: 'numeric' }).format(h.monthDate)
    }
  })

  const ingresoPromedioMensual = history.length > 0 ? (history.reduce((acc, h) => acc + h.ingresosBrutos, 0) / history.length) : 0
  const sumaMargenBase = history.reduce((acc, h) => acc + h.margenBruto, 0)
  const sumaIngresosNetos = history.reduce((acc, h) => acc + (h.ingresosBrutos > 0 ? h.ingresosBrutos / 1.19 : 0), 0)
  const margenPromedio = sumaIngresosNetos > 0 ? (sumaMargenBase / sumaIngresosNetos) * 100 : 0

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-primary flex items-center">
          <HistoryIcon className="mr-3 h-8 w-8 text-muted-foreground" />
          Historial Mensual
        </h2>
        <p className="text-muted-foreground mt-1">Evolución contable mes a mes y métricas clave de rentabilidad acumulada.</p>
      </div>

      {history.length > 0 && (
        <div className="flex justify-end">
          <HistoryExport history={history} />
        </div>
      )}

      {/* MÉTRICAS ACUMULADAS */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-border">
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Utilidad Neta Acumulada</h3>
            <div className={cn("text-2xl font-bold", utilidadAcumulada >= 0 ? "text-primary dark:text-gold" : "text-destructive")}>
              {formatCurrency(utilidadAcumulada)}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border">
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Mejor Mes (Ingreso Bruto)</h3>
            <div className="text-2xl font-bold">{formatCurrency(mejorMesMonto)}</div>
            <p className="text-xs text-muted-foreground mt-1 capitalize">{mejorMesStr}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border relative overflow-hidden">
          {margenPromedio >= 40 && <div className="absolute right-0 top-0 h-full w-2 bg-accent" />}
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Margen Bruto Promedio</h3>
            <div className="text-2xl font-bold flex items-center gap-2">
              {margenPromedio.toFixed(1)}%
              {margenPromedio >= 40 ? <CheckCircle2 className="h-4 w-4 text-accent" /> : <AlertCircle className="h-4 w-4 text-yellow-500" />}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Meta histórica {'>'} 40.0%
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border">
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Trabajos Históricos</h3>
            <div className="text-2xl font-bold">{totalTrabajos}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-primary" /> Ingreso Promedio: {formatCurrency(ingresoPromedioMensual)}/mes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* TABLA HISTÓRICA */}
      <Card className="shadow-sm border-border">
        <CardHeader className="bg-secondary/20 pb-4 border-b">
          <CardTitle className="text-lg flex items-center">
            <BarChart3 className="mr-2 h-5 w-5 text-primary" />
            Registro de Resultados Financieros
          </CardTitle>
          <CardDescription>
            Toda la data generada históricamente a partir de Transacciones ingresadas en sistema.
          </CardDescription>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-xs text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Mes</th>
                <th className="px-6 py-4 font-semibold text-right">Ingresos Brutos</th>
                <th className="px-6 py-4 font-semibold text-right">Costos Directos</th>
                <th className="px-6 py-4 font-semibold text-right text-primary">Margen Bruto</th>
                <th className="px-6 py-4 font-semibold text-right">G. Operacionales</th>
                <th className="px-6 py-4 font-semibold text-right text-primary">Utilidad Neta</th>
                <th className="px-6 py-4 font-semibold text-right">IVA Pagado al SII</th>
                <th className="px-6 py-4 font-semibold text-center">Nº Tbjos.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {history.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                    Aún no existen registros financieros cerrados.
                  </td>
                </tr>
              )}
              {history.map((row) => (
                <tr key={row.monthKey} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-medium capitalize">
                    {new Intl.DateTimeFormat('es-CL', { month: 'short', year: 'numeric' }).format(row.monthDate)}
                  </td>
                  <td className="px-6 py-4 text-right">{formatCurrency(row.ingresosBrutos)}</td>
                  <td className="px-6 py-4 text-right text-muted-foreground">{formatCurrency(row.costosDirectos)}</td>
                  <td className="px-6 py-4 text-right font-semibold bg-primary/5">{formatCurrency(row.margenBruto)}</td>
                  <td className="px-6 py-4 text-right text-muted-foreground">{formatCurrency(row.gastosOperacionales)}</td>
                  <td className={cn(
                    "px-6 py-4 text-right font-bold tracking-tight",
                    row.utilidadNeta >= 0 ? "text-primary bg-primary/10" : "text-destructive"
                  )}>
                    {formatCurrency(row.utilidadNeta)}
                  </td>
                  <td className="px-6 py-4 text-right text-amber-600 dark:text-amber-500 font-medium">
                    {formatCurrency(row.ivaPagado)}
                  </td>
                  <td className="px-6 py-4 text-center font-semibold text-muted-foreground">
                    {row.numeroTrabajos}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
