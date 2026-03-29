'use client'

import { useState } from "react"
import { DollarSign, Settings2, Sigma, TrendingUp, Info, UserPlus, Save, Trash2, FolderOpen } from "lucide-react"
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/hooks/use-currency"
import { cn } from "@/lib/utils"

interface SimulatorClientProps {
  initialFixedCosts: number
  initialPrice: number
  initialDirectCost: number
}

interface SavedScenario {
  id: string
  name: string
  fixedCosts: number
  price: number
  directCost: number
  extraStaff: number
  staffCost: number
  breakEvenPoint: number
  profitAt3: number
  margin: number
}

export function SimulatorClient({ initialFixedCosts, initialPrice, initialDirectCost }: SimulatorClientProps) {
  const [fixedCosts, setFixedCosts] = useState(initialFixedCosts || 119500)
  const [price, setPrice] = useState(initialPrice || 500000)
  const [directCost, setDirectCost] = useState(initialDirectCost || 150000)
  
  // Contratación de personal
  const [extraStaff, setExtraStaff] = useState(0)
  const [staffCostPerPerson, setStaffCostPerPerson] = useState(650000)
  
  // Escenarios guardados
  const [scenarios, setScenarios] = useState<SavedScenario[]>([])
  const [scenarioName, setScenarioName] = useState("")
  const [showScenarios, setShowScenarios] = useState(false)

  // Costos fijos TOTALES (base + personal extra)
  const totalFixedCosts = fixedCosts + (extraStaff * staffCostPerPerson)

  const netPrice = price / 1.19
  const netDirectCost = directCost / 1.19
  
  const marginBrutoPorTrabajo = netPrice - netDirectCost
  const marginPercentage = netPrice > 0 ? (marginBrutoPorTrabajo / netPrice) * 100 : 0
  
  // Punto de equilibrio con costos fijos totales
  const baseEquilibrio = marginBrutoPorTrabajo > 0 ? totalFixedCosts / marginBrutoPorTrabajo : 0
  const breakEvenPoint = Math.ceil(baseEquilibrio)

  // Generar data para el gráfico
  const maxSimulatedJobs = Math.max(12, breakEvenPoint + 5)
  
  const data = []
  for (let jobs = 0; jobs <= maxSimulatedJobs; jobs++) {
    const totalRevenue = netPrice * jobs
    const totalCost = (netDirectCost * jobs) + totalFixedCosts
    const margin = marginBrutoPorTrabajo * jobs
    const profit = margin - totalFixedCosts

    data.push({ jobs, totalRevenue, totalCost, margin, profit })
  }

  const profitAt3 = (marginBrutoPorTrabajo * (breakEvenPoint + 2)) - totalFixedCosts

  function handleSaveScenario() {
    if (!scenarioName.trim()) return
    const newScenario: SavedScenario = {
      id: Date.now().toString(),
      name: scenarioName.trim(),
      fixedCosts,
      price,
      directCost,
      extraStaff,
      staffCost: extraStaff * staffCostPerPerson,
      breakEvenPoint,
      profitAt3,
      margin: marginPercentage,
    }
    setScenarios(prev => [...prev, newScenario])
    setScenarioName("")
    setShowScenarios(true)
  }

  function handleLoadScenario(s: SavedScenario) {
    setFixedCosts(s.fixedCosts)
    setPrice(s.price)
    setDirectCost(s.directCost)
    setExtraStaff(s.extraStaff)
  }

  function handleDeleteScenario(id: string) {
    setScenarios(prev => prev.filter(s => s.id !== id))
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload
      return (
        <div className="bg-card text-card-foreground border rounded-lg p-3 shadow-md max-w-[200px]">
          <p className="font-bold mb-2">{label} Trabajos Mensuales</p>
          <div className="space-y-1 text-sm">
            <p className="text-muted-foreground flex justify-between">
              <span>Ingreso:</span> <span className="font-semibold text-foreground ml-2">{formatCurrency(p.totalRevenue)}</span>
            </p>
            <p className="text-muted-foreground flex justify-between">
              <span>Costos:</span> <span className="font-semibold text-foreground ml-2">{formatCurrency(p.totalCost)}</span>
            </p>
            <div className="border-t my-1 pt-1" />
            <p className="flex justify-between font-bold">
              <span>Utilidad:</span> 
              <span className={p.profit >= 0 ? "text-primary dark:text-gold" : "text-destructive"}>
                {formatCurrency(p.profit)}
              </span>
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        {/* PARÁMETROS */}
        <Card className="md:col-span-1 shadow-sm">
          <CardHeader className="bg-secondary/20 border-b pb-4">
            <CardTitle className="text-lg flex items-center">
              <Settings2 className="mr-2 h-5 w-5 text-primary" />
              Parámetros Veltrium
            </CardTitle>
            <CardDescription>
              Modifica las variables operativas para simular distintos escenarios en tiempo real.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-3">
              <Label htmlFor="fixedCost" className="flex justify-between">
                <span>Costos Fijos Operacionales</span>
                <span className="font-mono text-xs text-muted-foreground">/mes</span>
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="fixedCost" 
                  type="number" 
                  className="pl-9 font-medium"
                  value={fixedCosts}
                  onChange={(e) => setFixedCosts(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="price" className="flex justify-between">
                <span>Precio Cobrado Bruto</span>
                <span className="font-mono text-xs text-muted-foreground">por trabajo</span>
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="price" 
                  type="number" 
                  className="pl-9 font-medium border-primary/20 focus-visible:ring-primary"
                  value={price}
                  onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="directCost" className="flex justify-between">
                <span>Costo Directo Bruto</span>
                <span className="font-mono text-xs text-muted-foreground">por trabajo</span>
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="directCost" 
                  type="number" 
                  className="pl-9 font-medium"
                  value={directCost}
                  onChange={(e) => setDirectCost(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            {/* SIMULADOR DE CONTRATACIÓN */}
            <div className="border-t pt-4 space-y-3">
              <Label className="flex items-center gap-2 text-sm font-semibold">
                <UserPlus className="h-4 w-4 text-blue-500" />
                Simulación de Contratación
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="extraStaff" className="text-xs text-muted-foreground">Personas extra</Label>
                  <Input 
                    id="extraStaff" 
                    type="number"
                    min={0}
                    className="font-medium"
                    value={extraStaff}
                    onChange={(e) => setExtraStaff(parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="staffCost" className="text-xs text-muted-foreground">Costo c/u $/mes</Label>
                  <Input 
                    id="staffCost" 
                    type="number"
                    className="font-medium"
                    value={staffCostPerPerson}
                    onChange={(e) => setStaffCostPerPerson(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
              {extraStaff > 0 && (
                <div className="bg-blue-50 dark:bg-blue-950/30 rounded-md p-3 text-xs space-y-1">
                  <p className="text-blue-700 dark:text-blue-400 font-medium">
                    +{extraStaff} persona{extraStaff > 1 ? 's' : ''} = <span className="font-bold">{formatCurrency(extraStaff * staffCostPerPerson)}</span>/mes extra
                  </p>
                  <p className="text-muted-foreground">
                    Costos fijos totales: <span className="font-semibold">{formatCurrency(totalFixedCosts)}</span>
                  </p>
                </div>
              )}
            </div>

            {/* MARGEN NETO */}
            <div className="rounded-lg bg-secondary/30 p-4 border border-border mt-4">
              <div className="flex justify-between items-end mb-1">
                <Label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Margen Neto s/IVA</Label>
                <div className="text-right">
                  <span className="text-xl font-bold text-primary">{formatCurrency(marginBrutoPorTrabajo)}</span>
                </div>
              </div>
              <div className="w-full bg-secondary h-2 mt-2 rounded-full overflow-hidden">
                <div 
                  className="bg-primary h-full transition-all duration-500 ease-in-out" 
                  style={{ width: `${Math.min(100, Math.max(0, marginPercentage))}%` }}
                />
              </div>
              <p className="text-right text-xs mt-1 text-muted-foreground font-medium">{marginPercentage.toFixed(1)}%</p>
            </div>

            {/* GUARDAR ESCENARIO */}
            <div className="border-t pt-4 space-y-3">
              <Label className="flex items-center gap-2 text-sm font-semibold">
                <Save className="h-4 w-4 text-primary" />
                Guardar Escenario
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder='Ej: "Con 1 técnico extra"'
                  value={scenarioName}
                  onChange={(e) => setScenarioName(e.target.value)}
                  className="text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveScenario()}
                />
                <Button 
                  size="sm" 
                  onClick={handleSaveScenario}
                  disabled={!scenarioName.trim()}
                  className="shrink-0"
                >
                  <Save className="h-3.5 w-3.5" />
                </Button>
              </div>
              {scenarios.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-xs" 
                  onClick={() => setShowScenarios(!showScenarios)}
                >
                  <FolderOpen className="h-3.5 w-3.5 mr-1.5" />
                  {showScenarios ? 'Ocultar' : 'Ver'} Escenarios ({scenarios.length})
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* GRAFICO Y RESULTADOS */}
        <div className="md:col-span-2 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-primary text-primary-foreground shadow-md border-primary-foreground/10 overflow-hidden relative">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl z-0" />
              <CardContent className="p-6 relative z-10">
                <p className="text-sm font-medium opacity-90 mb-1 flex items-center">
                  <Sigma className="w-4 h-4 mr-1.5" /> Punto de Equilibrio
                </p>
                <div className="text-4xl font-black mt-2">
                  {breakEvenPoint} <span className="text-lg font-medium opacity-75 ml-1">trabajos / mes</span>
                </div>
                <p className="text-xs opacity-75 mt-3 leading-snug">
                  Debes cerrar al menos {breakEvenPoint} cotizaciones para cubrir todos tus costos fijos de {formatCurrency(totalFixedCosts)}.
                </p>
                {extraStaff > 0 && (
                  <p className="text-xs opacity-90 mt-2 bg-white/10 rounded px-2 py-1">
                    Incluye {extraStaff} persona{extraStaff > 1 ? 's' : ''} extra
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="p-6">
                <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1.5 text-accent" /> Meta Sugerida (Ganancia)
                </p>
                <div className="text-4xl font-black mt-2">
                  {breakEvenPoint + 2} <span className="text-lg font-medium text-muted-foreground ml-1">trabajos</span>
                </div>
                <p className="text-xs text-muted-foreground mt-3 leading-snug">
                  Generaría una Utilidad Neta proyectada de <span className="font-semibold text-primary">{formatCurrency(profitAt3)}</span>
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Proyección de Rentabilidad</CardTitle>
              <CardDescription>
                Cruce de Ingresos Totales vs Costos Totales
                {extraStaff > 0 && <span className="ml-1 text-blue-500">(con {extraStaff} contratación{extraStaff > 1 ? 'es' : ''} extra)</span>}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="jobs" 
                      tickLine={false} 
                      axisLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      tickFormatter={(val) => `${val} T.`}
                    />
                    <YAxis 
                      tickLine={false} 
                      axisLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      tickFormatter={(val) => `$${(val / 1000).toLocaleString('es-CL')}k`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    
                    <ReferenceLine y={totalFixedCosts} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" opacity={0.5} label={{ position: 'insideTopLeft', value: 'Costos Fijos', fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                    <ReferenceLine x={baseEquilibrio} stroke="hsl(var(--primary))" strokeDasharray="5 5" opacity={0.7} />

                    <Area 
                      type="monotone" 
                      dataKey="totalRevenue" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#profitGrad)" 
                      name="Ingresos Totales"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="totalCost" 
                      stroke="hsl(var(--destructive))" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#costGrad)" 
                      name="Costos Totales"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* COMPARADOR DE ESCENARIOS */}
      {showScenarios && scenarios.length > 0 && (
        <Card className="shadow-sm overflow-hidden border-blue-200 dark:border-blue-900">
          <CardHeader className="bg-blue-50 dark:bg-blue-950/30 border-b pb-3">
            <CardTitle className="text-lg flex items-center">
              <FolderOpen className="mr-2 h-5 w-5 text-blue-500" />
              Escenarios Guardados
            </CardTitle>
            <CardDescription>Compara tus planes de negocio lado a lado. Haz clic en un escenario para cargarlo.</CardDescription>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-secondary/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Escenario</th>
                  <th className="px-4 py-3 font-semibold text-right">Costos Fijos</th>
                  <th className="px-4 py-3 font-semibold text-right">Personal Extra</th>
                  <th className="px-4 py-3 font-semibold text-right">Precio/Trabajo</th>
                  <th className="px-4 py-3 font-semibold text-right">Margen %</th>
                  <th className="px-4 py-3 font-semibold text-center bg-primary/5">Break-Even</th>
                  <th className="px-4 py-3 font-semibold text-right bg-primary/10">Utilidad (Meta)</th>
                  <th className="px-4 py-3 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {scenarios.map((s) => (
                  <tr 
                    key={s.id} 
                    className="border-b border-border/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 cursor-pointer transition-colors"
                    onClick={() => handleLoadScenario(s)}
                  >
                    <td className="px-4 py-3 font-medium">{s.name}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(s.fixedCosts + s.staffCost)}</td>
                    <td className="px-4 py-3 text-right">
                      {s.extraStaff > 0 
                        ? <span className="text-blue-600 font-medium">+{s.extraStaff} ({formatCurrency(s.staffCost)})</span>
                        : <span className="text-muted-foreground">—</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-right">{formatCurrency(s.price)}</td>
                    <td className="px-4 py-3 text-right font-medium">{s.margin.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-center font-bold bg-primary/5">{s.breakEvenPoint} T.</td>
                    <td className={cn("px-4 py-3 text-right font-bold bg-primary/10", s.profitAt3 >= 0 ? "text-primary" : "text-destructive")}>
                      {formatCurrency(s.profitAt3)}
                    </td>
                    <td className="px-4 py-3">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); handleDeleteScenario(s.id) }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-muted p-3 border-t text-xs text-muted-foreground text-center">
            Haz clic en una fila para cargar ese escenario en el simulador
          </div>
        </Card>
      )}

      {/* TABLA DE SIMULACIÓN */}
      <Card className="shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-secondary/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-6 py-3 font-semibold">Trabajos/mes</th>
                <th className="px-6 py-3 font-semibold text-right">Ingreso Bruto</th>
                <th className="px-6 py-3 font-semibold text-right">Costos Directos (Bruto)</th>
                <th className="px-6 py-3 font-semibold bg-primary/5 text-right">Margen Neto M.</th>
                <th className="px-6 py-3 font-semibold bg-primary/10 text-right">Utilidad Neta</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i} className={cn("border-b border-border/50", row.jobs === breakEvenPoint && "bg-accent/10 border-accent/20")}>
                  <td className="px-6 py-3 font-medium">
                    {row.jobs} {row.jobs === breakEvenPoint && <span className="ml-2 text-[10px] bg-accent text-accent-foreground px-2 py-0.5 rounded-full uppercase">Equilibrio</span>}
                  </td>
                  <td className="px-6 py-3 text-right">{formatCurrency(price * row.jobs)}</td>
                  <td className="px-6 py-3 text-right">{formatCurrency(directCost * row.jobs)}</td>
                  <td className="px-6 py-3 text-right font-medium bg-primary/5">{formatCurrency(row.margin)}</td>
                  <td className={cn("px-6 py-3 text-right font-bold", row.profit > 0 ? "text-primary bg-primary/10" : "text-destructive opacity-80")}>
                    {formatCurrency(row.profit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-muted p-4 border-t flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center"><Info className="w-4 h-4 mr-2" /> La Utilidad Neta mostrada ya ha descontado los costos operacionales fijos ({formatCurrency(totalFixedCosts)}).</span>
          <span>Modelo de análisis Veltrium Group</span>
        </div>
      </Card>
    </div>
  )
}
