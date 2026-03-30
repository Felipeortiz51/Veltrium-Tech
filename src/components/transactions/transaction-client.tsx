'use client'

import { useState } from 'react'
import { TransactionForm } from './transaction-form'
import { TransactionRowActions } from './transaction-row-actions'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { formatCurrency } from '@/hooks/use-currency'
import { TransactionType } from '@prisma/client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { PlusCircle, Search, Download, FileSpreadsheet } from 'lucide-react'
import { exportTransactionsExcel, exportTransactionsPDF } from '@/lib/exports'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function TransactionClient({ 
  transactions, 
  categories,
  projects
}: { 
  transactions: any[], 
  categories: any[],
  projects: any[]
}) {
  const [isOpen, setIsOpen] = useState(false)
  
  // States para filtros básicos (MVP)
  const [filterType, setFilterType] = useState<string>("ALL")
  const [search, setSearch] = useState("")

  const filteredData = transactions.filter((t) => {
    if (filterType !== "ALL" && t.type !== filterType) return false
    if (search) {
      const qs = search.toLowerCase()
      if (!t.description.toLowerCase().includes(qs) && !t.notes?.toLowerCase().includes(qs)) return false
    }
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">Transacciones</h2>
          <p className="text-muted-foreground mt-1">Registra, anula y visualiza el historial financiero.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger render={<Button className="bg-accent text-accent-foreground hover:bg-[#D4A84B]" />}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nuevo Movimiento
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] border-[#AB8755]/20 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl text-primary">Registrar Movimiento</DialogTitle>
              <DialogDescription>
                Ingresa los datos para alimentar el módulo contable. El IVA se calculará automáticamente.
              </DialogDescription>
            </DialogHeader>
            <TransactionForm categories={categories} projects={projects} onSuccess={() => setIsOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4 py-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar en descripción..."
            className="pl-8 bg-white border-border/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterType} onValueChange={(val) => setFilterType(val || "ALL")}>
          <SelectTrigger className="w-[180px] bg-white border-border/50">
            <span data-slot="select-value">
              {filterType === "ALL" ? "Todos los tipos" : filterType === "INCOME" ? "Ingresos" : "Egresos"}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los tipos</SelectItem>
            <SelectItem value={TransactionType.INCOME}>Ingresos</SelectItem>
            <SelectItem value={TransactionType.EXPENSE}>Egresos</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2 ml-auto">
          <Button variant="outline" size="sm" className="h-9" onClick={() => exportTransactionsExcel(filteredData, format(new Date(), 'yyyy-MM'))}>
            <FileSpreadsheet className="mr-1.5 h-4 w-4" /> Excel
          </Button>
          <Button variant="outline" size="sm" className="h-9" onClick={() => exportTransactionsPDF(filteredData, format(new Date(), 'yyyy-MM'))}>
            <Download className="mr-1.5 h-4 w-4" /> PDF
          </Button>
        </div>
      </div>

      <div className="rounded-md border bg-white shadow-sm overflow-hidden border-border/50">
        <Table>
          <TableHeader className="bg-secondary/10">
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead className="w-[30%]">Descripción</TableHead>
              <TableHead className="text-right">Monto Neto</TableHead>
              <TableHead className="text-right">Monto Total</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No se encontraron resultados.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((t) => (
                <TableRow key={t.id} className={t.isVoided ? "opacity-50 line-through" : ""}>
                  <TableCell className="font-medium">
                    {format(new Date(t.date), 'dd MMM yyyy', { locale: es })}
                  </TableCell>
                  <TableCell>
                    {t.type === TransactionType.INCOME ? (
                      <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200">Ingreso</Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-700 bg-amber-50 border-amber-200">Egreso</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-primary text-sm">{t.category?.name}</span>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm">
                    {t.description}
                    {t.clientSupplier && <span className="block text-xs text-muted-foreground mt-0.5">{t.clientSupplier}</span>}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatCurrency(t.netAmount)}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(t.amount)}
                  </TableCell>
                  <TableCell>
                    <TransactionRowActions transaction={t} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
