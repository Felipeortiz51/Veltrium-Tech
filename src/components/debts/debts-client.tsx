"use client"

import { useState } from "react"
import {
  Plus, CreditCard, TrendingDown, DollarSign, CalendarDays,
  ChevronDown, ChevronRight, AlertTriangle, CheckCircle2, Clock,
  BadgePercent
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/hooks/use-currency"
import { Debt, DebtPayment } from "@prisma/client"
import { createDebtAction, registerPaymentAction, updateDebtStatusAction } from "@/actions/debts"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, ReferenceLine } from "recharts"
import { Download, FileSpreadsheet } from "lucide-react"
import { exportDebtsExcel, exportDebtsPDF } from "@/lib/exports"

type DebtWithPayments = Debt & { payments: DebtPayment[] }

interface DebtSummary {
  totalInitialBalance: number
  totalCurrentBalance: number
  totalPaid: number
  activeDebts: number
  totalDebts: number
  totalMonthlyPayment: number
}

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "destructive" | "outline" | "secondary"; icon: typeof CheckCircle2 }> = {
  ACTIVE: { label: "Activa", variant: "default", icon: Clock },
  PAID: { label: "Pagada", variant: "secondary", icon: CheckCircle2 },
  DELINQUENT: { label: "Morosa", variant: "destructive", icon: AlertTriangle },
  RESTRUCTURED: { label: "Reestructurada", variant: "outline", icon: TrendingDown },
}

function DebtTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border bg-background p-3 shadow-sm text-sm">
      <p className="font-medium text-muted-foreground mb-1">Mes: {label}</p>
      <p className="font-bold">Saldo: {formatCurrency(payload[0].value)}</p>
    </div>
  )
}

export function DebtsClient({
  debts,
  summary
}: {
  debts: DebtWithPayments[]
  summary: DebtSummary
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [expandedDebt, setExpandedDebt] = useState<string | null>(null)

  // Create Debt Dialog
  const [createOpen, setCreateOpen] = useState(false)
  const [debtName, setDebtName] = useState("")
  const [debtBalance, setDebtBalance] = useState("")
  const [debtRate, setDebtRate] = useState("")
  const [debtPayment, setDebtPayment] = useState("")
  const [debtTotalPayments, setDebtTotalPayments] = useState("")
  const [debtStartDate, setDebtStartDate] = useState("")

  // Payment Dialog
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [paymentDebtId, setPaymentDebtId] = useState("")
  const [paymentMonth, setPaymentMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [paymentAmount, setPaymentAmount] = useState("")

  function resetCreateForm() {
    setDebtName("")
    setDebtBalance("")
    setDebtRate("")
    setDebtPayment("")
    setDebtTotalPayments("")
    setDebtStartDate("")
  }

  async function handleCreateDebt(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!debtName || !debtBalance || !debtRate || !debtPayment || !debtStartDate) {
      return toast.error("Completa todos los campos obligatorios")
    }
    setLoading(true)
    const res = await createDebtAction({
      name: debtName,
      initialBalance: parseInt(debtBalance, 10),
      monthlyRate: parseFloat(debtRate),
      basePayment: parseInt(debtPayment, 10),
      totalPayments: debtTotalPayments ? parseInt(debtTotalPayments, 10) : undefined,
      startDate: new Date(debtStartDate),
    })
    setLoading(false)
    if (res.success) {
      toast.success("Deuda registrada correctamente")
      setCreateOpen(false)
      resetCreateForm()
      router.refresh()
    } else {
      toast.error(res.error)
    }
  }

  function openPaymentDialog(debtId: string, basePayment: number) {
    setPaymentDebtId(debtId)
    setPaymentAmount(String(basePayment))
    setPaymentMonth(format(new Date(), 'yyyy-MM'))
    setPaymentOpen(true)
  }

  async function handleRegisterPayment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!paymentAmount || !paymentMonth) {
      return toast.error("Completa todos los campos")
    }
    setLoading(true)
    const res = await registerPaymentAction({
      debtId: paymentDebtId,
      month: paymentMonth,
      amountPaid: parseInt(paymentAmount, 10),
    })
    setLoading(false)
    if (res.success) {
      toast.success("Pago registrado correctamente")
      setPaymentOpen(false)
      router.refresh()
    } else {
      toast.error(res.error)
    }
  }

  async function handleMarkDelinquent(id: string) {
    if (!confirm("¿Marcar esta deuda como morosa?")) return
    const res = await updateDebtStatusAction(id, 'DELINQUENT')
    if (res.success) {
      toast.success("Estado actualizado")
      router.refresh()
    } else {
      toast.error(res.error)
    }
  }

  // Build chart data from all debts' payments
  const chartData = buildEvolutionChartData(debts)

  const progressPercent = summary.totalInitialBalance > 0
    ? Math.round((summary.totalPaid / summary.totalInitialBalance) * 100)
    : 0

  return (
    <div className="space-y-6">

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Deuda Total Vigente</p>
                <p className="text-2xl font-black tracking-tight text-destructive mt-1">{formatCurrency(summary.totalCurrentBalance)}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Amortizado</p>
                <p className="text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-500 mt-1">{formatCurrency(summary.totalPaid)}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-emerald-500" />
              </div>
            </div>
            {summary.totalInitialBalance > 0 && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Progreso</span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Cuota Mensual Total</p>
                <p className="text-2xl font-black tracking-tight text-primary mt-1">{formatCurrency(summary.totalMonthlyPayment)}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {summary.activeDebts} deuda{summary.activeDebts !== 1 ? 's' : ''} activa{summary.activeDebts !== 1 ? 's' : ''} de {summary.totalDebts}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Deuda Original</p>
                <p className="text-2xl font-black tracking-tight text-muted-foreground mt-1">{formatCurrency(summary.totalInitialBalance)}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <BadgePercent className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* EVOLUTION CHART */}
      {chartData.length > 1 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <TrendingDown className="mr-2 h-5 w-5 text-muted-foreground" />
              Evolución de Deuda Total
            </CardTitle>
            <CardDescription>Saldo consolidado mes a mes</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="debtGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v: number) => `${Math.round(v / 1000000)}M`}
                />
                <Tooltip content={<DebtTooltip />} />
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                <Area
                  type="monotone"
                  dataKey="balance"
                  stroke="hsl(var(--destructive))"
                  fill="url(#debtGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* DEBT LIST */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b bg-secondary/10">
          <div>
            <CardTitle className="text-xl flex items-center">
              <CreditCard className="mr-2 h-5 w-5 text-muted-foreground" />
              Deudas y Créditos
            </CardTitle>
            <CardDescription>Control de obligaciones financieras y amortización</CardDescription>
          </div>
          <div className="flex gap-2">
            {debts.length > 0 && (
              <>
                <Button variant="outline" size="sm" className="h-8" onClick={() => exportDebtsExcel(debts)}>
                  <FileSpreadsheet className="mr-1 h-3 w-3" /> Excel
                </Button>
                <Button variant="outline" size="sm" className="h-8" onClick={() => exportDebtsPDF(debts)}>
                  <Download className="mr-1 h-3 w-3" /> PDF
                </Button>
              </>
            )}
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger render={props => (
              <Button {...props} size="sm" className="h-8">
                <Plus className="mr-1 h-3 w-3" /> Nueva Deuda
              </Button>
            )} />
            <DialogContent className="sm:max-w-[480px]">
              <DialogHeader>
                <DialogTitle>Registrar Nueva Deuda</DialogTitle>
                <DialogDescription>Crédito bancario, leasing, línea de crédito, etc.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateDebt} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Nombre / Descripción</Label>
                  <Input value={debtName} onChange={e => setDebtName(e.target.value)} placeholder="Ej: Crédito Banco Itaú" autoFocus />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Saldo Inicial ($ CLP)</Label>
                    <Input type="number" value={debtBalance} onChange={e => setDebtBalance(e.target.value)} placeholder="10000000" />
                  </div>
                  <div className="space-y-2">
                    <Label>Cuota Mensual ($ CLP)</Label>
                    <Input type="number" value={debtPayment} onChange={e => setDebtPayment(e.target.value)} placeholder="350000" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tasa Mensual (decimal)</Label>
                    <Input type="number" step="0.001" value={debtRate} onChange={e => setDebtRate(e.target.value)} placeholder="0.021" />
                    <p className="text-xs text-muted-foreground">Ej: 0.021 = 2.1% mensual</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Total Cuotas (opcional)</Label>
                    <Input type="number" value={debtTotalPayments} onChange={e => setDebtTotalPayments(e.target.value)} placeholder="36" />
                    <p className="text-xs text-muted-foreground">Vacío = crédito rotativo</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Fecha de Inicio</Label>
                  <Input type="date" value={debtStartDate} onChange={e => setDebtStartDate(e.target.value)} />
                </div>
                <div className="flex justify-end pt-2 gap-2">
                  <DialogClose render={props => <Button {...props} type="button" variant="outline">Cancelar</Button>} />
                  <Button type="submit" disabled={loading}>{loading ? "Guardando..." : "Registrar Deuda"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {debts.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="font-medium">Sin deudas registradas</p>
              <p className="text-sm mt-1">Registra créditos o préstamos para llevar un control de amortización.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {debts.map(debt => {
                const isExpanded = expandedDebt === debt.id
                const config = STATUS_CONFIG[debt.status] || STATUS_CONFIG.ACTIVE
                const StatusIcon = config.icon
                const paidCount = debt.payments.length
                const remainingPayments = debt.totalPayments ? debt.totalPayments - paidCount : null
                const paidPercent = debt.initialBalance > 0
                  ? Math.round(((debt.initialBalance - debt.currentBalance) / debt.initialBalance) * 100)
                  : 0

                return (
                  <div key={debt.id}>
                    {/* Debt Row */}
                    <div
                      className={cn(
                        "p-4 flex items-center gap-4 cursor-pointer hover:bg-muted/30 transition-colors",
                        isExpanded && "bg-muted/20"
                      )}
                      onClick={() => setExpandedDebt(isExpanded ? null : debt.id)}
                    >
                      <div className="flex-shrink-0">
                        {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm truncate">{debt.name}</span>
                          <Badge variant={config.variant} className="text-xs">
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {config.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>Inicio: {format(new Date(debt.startDate), 'dd/MM/yyyy', { locale: es })}</span>
                          <span>Tasa: {(debt.monthlyRate * 100).toFixed(1)}%</span>
                          {debt.totalPayments && (
                            <span>Cuotas: {paidCount}/{debt.totalPayments}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex-shrink-0 text-right">
                        <p className="text-sm font-bold text-destructive">{formatCurrency(debt.currentBalance)}</p>
                        <p className="text-xs text-muted-foreground">de {formatCurrency(debt.initialBalance)}</p>
                      </div>

                      <div className="flex-shrink-0 w-20">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>{paidPercent}%</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              debt.status === 'PAID' ? "bg-emerald-500" : "bg-primary"
                            )}
                            style={{ width: `${paidPercent}%` }}
                          />
                        </div>
                      </div>

                      {debt.status === 'ACTIVE' && (
                        <div className="flex-shrink-0" onClick={e => e.stopPropagation()}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => openPaymentDialog(debt.id, debt.basePayment)}
                          >
                            <DollarSign className="h-3 w-3 mr-1" /> Pagar
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Expanded: Payment History */}
                    {isExpanded && (
                      <div className="bg-muted/10 border-t border-dashed px-4 pb-4">
                        <div className="flex items-center justify-between py-3">
                          <h4 className="text-sm font-semibold text-muted-foreground flex items-center">
                            <CalendarDays className="h-4 w-4 mr-1.5" />
                            Historial de Pagos
                          </h4>
                          <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                            {debt.status === 'ACTIVE' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs text-destructive hover:text-destructive"
                                onClick={() => handleMarkDelinquent(debt.id)}
                              >
                                <AlertTriangle className="h-3 w-3 mr-1" /> Marcar Morosa
                              </Button>
                            )}
                          </div>
                        </div>

                        {debt.payments.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            Sin pagos registrados aún.
                          </p>
                        ) : (
                          <div className="rounded-md border overflow-hidden">
                            <table className="w-full text-sm">
                              <thead className="bg-muted/50">
                                <tr>
                                  <th className="text-left p-2.5 font-medium text-muted-foreground">Mes</th>
                                  <th className="text-right p-2.5 font-medium text-muted-foreground">Pagado</th>
                                  <th className="text-right p-2.5 font-medium text-muted-foreground">Interés</th>
                                  <th className="text-right p-2.5 font-medium text-muted-foreground">Capital</th>
                                  <th className="text-right p-2.5 font-medium text-muted-foreground">Saldo</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border/50">
                                {debt.payments.map(p => (
                                  <tr key={p.id} className="hover:bg-muted/20">
                                    <td className="p-2.5 font-medium">{p.month}</td>
                                    <td className="p-2.5 text-right">{formatCurrency(p.amountPaid)}</td>
                                    <td className="p-2.5 text-right text-amber-600 dark:text-amber-500">{formatCurrency(p.interestCharged)}</td>
                                    <td className="p-2.5 text-right text-emerald-600 dark:text-emerald-500">{formatCurrency(p.principalPaid)}</td>
                                    <td className="p-2.5 text-right font-bold">{formatCurrency(p.balanceAfter)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Remaining info */}
                        {debt.status === 'ACTIVE' && (
                          <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                            <span>Cuota base: <strong className="text-foreground">{formatCurrency(debt.basePayment)}</strong></span>
                            {remainingPayments !== null && (
                              <span>Cuotas restantes: <strong className="text-foreground">{remainingPayments}</strong></span>
                            )}
                            <span>Interés próximo mes: <strong className="text-amber-600 dark:text-amber-500">~{formatCurrency(Math.round(debt.currentBalance * debt.monthlyRate))}</strong></span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* PAYMENT DIALOG */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Registrar Pago</DialogTitle>
            <DialogDescription>Ingresa el monto efectivamente pagado este mes.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRegisterPayment} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Mes del Pago</Label>
              <Input type="month" value={paymentMonth} onChange={e => setPaymentMonth(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Monto Pagado ($ CLP)</Label>
              <Input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} placeholder="350000" autoFocus />
              <p className="text-xs text-muted-foreground">El interés y capital se calculan automáticamente.</p>
            </div>
            <div className="flex justify-end pt-2 gap-2">
              <DialogClose render={props => <Button {...props} type="button" variant="outline">Cancelar</Button>} />
              <Button type="submit" disabled={loading}>{loading ? "Registrando..." : "Registrar Pago"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function buildEvolutionChartData(debts: DebtWithPayments[]) {
  const allPayments: { month: string; debtId: string; balanceAfter: number }[] = []

  for (const debt of debts) {
    for (const p of debt.payments) {
      allPayments.push({ month: p.month, debtId: debt.id, balanceAfter: p.balanceAfter })
    }
  }

  if (allPayments.length === 0) return []

  // Get unique months sorted
  const months = [...new Set(allPayments.map(p => p.month))].sort()

  // For each month, calculate total balance across all debts
  const lastKnownBalance = new Map<string, number>()
  for (const debt of debts) {
    lastKnownBalance.set(debt.id, debt.initialBalance)
  }

  const data: { month: string; balance: number }[] = []

  for (const month of months) {
    // Update balances for debts that have payments this month
    const paymentsThisMonth = allPayments.filter(p => p.month === month)
    for (const p of paymentsThisMonth) {
      lastKnownBalance.set(p.debtId, p.balanceAfter)
    }

    // Sum all current balances
    let totalBalance = 0
    for (const balance of lastKnownBalance.values()) {
      totalBalance += balance
    }

    data.push({ month, balance: totalBalance })
  }

  return data
}
