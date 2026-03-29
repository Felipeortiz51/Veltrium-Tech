"use client"

import { useState } from "react"
import { Building2, Wallet, Plus, Trash2, Landmark, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/hooks/use-currency"
import { Asset, Liability, AssetType, LiabilityType } from "@prisma/client"
import { createAssetAction, deleteAssetAction, createLiabilityAction, deleteLiabilityAction } from "@/actions/balance"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

export function BalanceClient({ 
  assets, 
  manualLiabilities, 
  autoIvaPayable,
  autoCashPosition
}: { 
  assets: Asset[]
  manualLiabilities: Liability[]
  autoIvaPayable: number
  autoCashPosition: number 
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Asset Form State
  const [assetOpen, setAssetOpen] = useState(false)
  const [assetName, setAssetName] = useState("")
  const [assetValue, setAssetValue] = useState("")

  // Liability Form State
  const [liabilityOpen, setLiabilityOpen] = useState(false)
  const [liabilityName, setLiabilityName] = useState("")
  const [liabilityValue, setLiabilityValue] = useState("")

  const totalManualAssets = assets.reduce((acc, el) => acc + el.value, 0)
  const totalAssets = totalManualAssets + Math.max(0, autoCashPosition)
  const totalManualLiabilities = manualLiabilities.reduce((acc, el) => acc + el.value, 0)
  const totalLiabilities = totalManualLiabilities + autoIvaPayable

  const netWorth = totalAssets - totalLiabilities

  async function handleAddAsset(e: React.FormEvent) {
    e.preventDefault()
    if (!assetName || !assetValue) return toast.error("Llena todos los campos")
    setLoading(true)
    const res = await createAssetAction({
      name: assetName,
      value: parseInt(assetValue, 10),
      type: "NON_CURRENT" // Simplified for MVP Balance
    })
    setLoading(false)
    if (res.success) {
      toast.success("Activo añadido")
      setAssetOpen(false)
      setAssetName("")
      setAssetValue("")
      router.refresh()
    } else {
      toast.error(res.error)
    }
  }

  async function handleAddLiability(e: React.FormEvent) {
    e.preventDefault()
    if (!liabilityName || !liabilityValue) return toast.error("Llena todos los campos")
    setLoading(true)
    const res = await createLiabilityAction({
      name: liabilityName,
      value: parseInt(liabilityValue, 10),
      type: "CURRENT"
    })
    setLoading(false)
    if (res.success) {
      toast.success("Pasivo añadido")
      setLiabilityOpen(false)
      setLiabilityName("")
      setLiabilityValue("")
      router.refresh()
    } else {
      toast.error(res.error)
    }
  }

  async function handleDeleteAsset(id: string) {
    if(!confirm("¿Eliminar este activo?")) return
    await deleteAssetAction(id)
    toast.success("Activo eliminado")
    router.refresh()
  }

  async function handleDeleteLiability(id: string) {
    if(!confirm("¿Eliminar este pasivo?")) return
    await deleteLiabilityAction(id)
    toast.success("Pasivo eliminado")
    router.refresh()
  }

  return (
    <div className="space-y-6">
      
      {/* NET WORTH HEADER */}
      <Card className={cn(
        "overflow-hidden border-2 shadow-md relative", 
        netWorth >= 0 ? "border-primary/50 bg-primary/5" : "border-destructive/50 bg-destructive/5"
      )}>
        {netWorth >= 0 && <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-20 -mt-20 z-0" />}
        <CardContent className="p-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center">
                <Landmark className="mr-2 h-4 w-4" />
                Patrimonio Neto de la Empresa
              </h3>
              <p className="text-xs text-muted-foreground">Estatuto de Liquidación (Activos - Pasivos)</p>
            </div>
            <div className={cn("text-5xl font-black tracking-tighter", netWorth >= 0 ? "text-primary dark:text-gold" : "text-destructive")}>
              {formatCurrency(netWorth)}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* ACTIVOS */}
        <Card className="shadow-sm border-t-4 border-t-primary/60 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-4 bg-secondary/10 border-b">
            <div>
              <CardTitle className="text-xl flex items-center text-primary">
                <Building2 className="mr-2 h-5 w-5" />
                Activos Totales
              </CardTitle>
              <CardDescription>Bienes y efectivos a la fecha</CardDescription>
            </div>
            <Dialog open={assetOpen} onOpenChange={setAssetOpen}>
              <DialogTrigger render={props => (
                <Button {...props} variant="outline" size="sm" className="h-8">
                  <Plus className="mr-1 h-3 w-3" /> Añadir
                </Button>
              )}/>
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle>Añadir Activo</DialogTitle>
                  <DialogDescription>
                    Ej. Efectivo, Vehículo, Herramientas...
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddAsset} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Nombre del Activo</Label>
                    <Input value={assetName} onChange={e => setAssetName(e.target.value)} placeholder="Ej: Furgoneta Chevrolet" autoFocus />
                  </div>
                  <div className="space-y-2">
                    <Label>Valor Tasado ($ CLP)</Label>
                    <Input type="number" value={assetValue} onChange={e => setAssetValue(e.target.value)} placeholder="15000000" />
                  </div>
                  <div className="flex justify-end pt-2 gap-2">
                    <DialogClose render={props => <Button {...props} type="button" variant="outline">Cancelar</Button>} />
                    <Button type="submit" disabled={loading}>{loading ? "Espera..." : "Guardar Activo"}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="p-0 flex-1 flex flex-col">
            <div className="bg-primary/5 p-4 flex justify-between items-center font-bold text-lg border-b">
              <span>Suma Activos:</span>
              <span className="text-primary">{formatCurrency(totalAssets)}</span>
            </div>
            <div className="overflow-y-auto max-h-[400px]">
              {/* AUTO ASSET: EFECTIVO EN CAJA */}
              {autoCashPosition !== 0 && (
                <li className="p-4 flex items-center justify-between bg-emerald-500/5 group">
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                      <TrendingUp className="h-3 w-3 text-emerald-500" />
                      Efectivo en Caja
                    </span>
                    <span className="text-xs text-muted-foreground">Auto-calculado: Ingresos pagados − Egresos pagados</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm tracking-tight text-emerald-600 dark:text-emerald-500">{formatCurrency(autoCashPosition)}</span>
                    <div className="w-7 h-7" />
                  </div>
                </li>
              )}

              {/* MANUAL ASSETS */}
              {assets.length === 0 && autoCashPosition === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  Sin activos registrados. Añade capital o equipos arriba.
                </div>
              ) : (
                assets.map(a => (
                  <li key={a.id} className="p-4 flex items-center justify-between hover:bg-muted/30 group">
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm">{a.name}</span>
                      <span className="text-xs text-muted-foreground">{a.type === 'CURRENT' ? 'Liquidez' : 'Activo Fijo'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-sm tracking-tight">{formatCurrency(a.value)}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                        onClick={() => handleDeleteAsset(a.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </li>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* PASIVOS */}
        <Card className="shadow-sm border-t-4 border-t-destructive/60 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-4 bg-secondary/10 border-b">
            <div>
              <CardTitle className="text-xl flex items-center text-destructive">
                <Wallet className="mr-2 h-5 w-5" />
                Pasivos Totales
              </CardTitle>
              <CardDescription>Obligaciones y deudas vigentes</CardDescription>
            </div>
            <Dialog open={liabilityOpen} onOpenChange={setLiabilityOpen}>
              <DialogTrigger render={props => (
                <Button {...props} variant="outline" size="sm" className="h-8">
                  <Plus className="mr-1 h-3 w-3" /> Añadir Manual
                </Button>
              )}/>
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle>Obligación / Pasivo</DialogTitle>
                  <DialogDescription>
                    Registra facturas pendientes, sueldos o préstamos.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddLiability} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Nombre de la Deuda</Label>
                    <Input value={liabilityName} onChange={e => setLiabilityName(e.target.value)} placeholder="Ej: Sueldos por pagar Mar" autoFocus />
                  </div>
                  <div className="space-y-2">
                    <Label>Monto Adeudado ($ CLP)</Label>
                    <Input type="number" value={liabilityValue} onChange={e => setLiabilityValue(e.target.value)} placeholder="1500000" />
                  </div>
                  <div className="flex justify-end pt-2 gap-2">
                    <DialogClose render={props => <Button {...props} type="button" variant="outline">Cancelar</Button>} />
                    <Button type="submit" disabled={loading} variant="destructive">{loading ? "Espera..." : "Guardar Pasivo"}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="p-0 flex-1 flex flex-col">
            <div className="bg-destructive/5 p-4 flex justify-between items-center font-bold text-lg border-b text-destructive">
              <span>Suma Pasivos:</span>
              <span>{formatCurrency(totalLiabilities)}</span>
            </div>
            <div className="overflow-y-auto max-h-[400px]">
              <ul className="divide-y divide-border/50">
                
                {/* AUTO LIABILITY (IVA) */}
                <li className="p-4 flex items-center justify-between bg-amber-500/5 group">
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                      <TrendingUp className="h-3 w-3 text-amber-500" />
                      Provisión IVA Fisco
                    </span>
                    <span className="text-xs text-muted-foreground">Impuesto a pagar (Auto-calculado mes en curso)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm tracking-tight text-amber-600 dark:text-amber-500 truncate">{formatCurrency(autoIvaPayable)}</span>
                    <div className="w-7 h-7" /> {/* Spacer para alinear con botones basurero */}
                  </div>
                </li>

                {/* MANUAL LIABILITIES */}
                {manualLiabilities.map(l => (
                  <li key={l.id} className="p-4 flex items-center justify-between hover:bg-muted/30 group">
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm">{l.name}</span>
                      <span className="text-xs text-muted-foreground">Registro manual</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-sm tracking-tight text-muted-foreground">{formatCurrency(l.value)}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                        onClick={() => handleDeleteLiability(l.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </li>
                ))}
                
                {autoIvaPayable === 0 && manualLiabilities.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    Sin pasivos vigentes. Excelente.
                  </div>
                )}
              </ul>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
