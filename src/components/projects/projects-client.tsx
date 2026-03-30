'use client'

import { useState } from 'react'
import { PlusCircle, Search, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { formatCurrency } from '@/hooks/use-currency'
import { format } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ProjectForm } from './project-form'

export function ProjectsClient({
  data
}: {
  data: any[]
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState("")

  const filtered = data.filter(p => {
    if (!search) return true
    return p.name.toLowerCase().includes(search.toLowerCase()) || p.code?.toLowerCase().includes(search.toLowerCase())
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">Centros de Costo</h2>
          <p className="text-muted-foreground mt-1">Rentabilidad y P&amp;L por proyecto adjudicado.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger render={<Button className="bg-accent text-accent-foreground hover:bg-[#D4A84B]" />}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nuevo Proyecto
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Abrir Centro de Costo</DialogTitle>
              <DialogDescription>A partir de ahora podrás agrupar ingresos y materiales a este nombre.</DialogDescription>
            </DialogHeader>
            <ProjectForm onSuccess={() => setIsOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Buscar por nombre o código (Ej: PRJ-001)..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Proyecto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Presupuesto (Meta)</TableHead>
              <TableHead className="text-right">Ingresos</TableHead>
              <TableHead className="text-right">Egresos (Costo)</TableHead>
              <TableHead className="text-right">Margen Real</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No hay centros de costo registrados.
                </TableCell>
              </TableRow>
            ) : filtered.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <div className="font-medium text-primary">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.code || 'Sin Código'} • Inicio: {p.startDate ? format(new Date(p.startDate), 'dd/MM/yyyy') : 'Pendiente'}</div>
                </TableCell>
                <TableCell>
                  <Badge variant={p.status === 'ACTIVE' ? "default" : p.status === 'COMPLETED' ? "secondary" : "destructive"}>
                    {p.status === 'ACTIVE' ? 'Activo' : p.status === 'COMPLETED' ? 'Terminado' : 'Cancelado'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium">{p.budget ? formatCurrency(p.budget) : 'N/A'}</TableCell>
                <TableCell className="text-right text-green-600">{formatCurrency(p.totalIncome)}</TableCell>
                <TableCell className="text-right text-red-500">{formatCurrency(p.totalExpense)}</TableCell>
                <TableCell className="text-right">
                  <div className={p.margin >= 0 ? "text-green-600 font-bold" : "text-red-500 font-bold"}>
                    {formatCurrency(p.margin)}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {p.marginPercent > 0 ? (
                      <span className="text-green-600 flex items-center justify-end gap-1"><TrendingUp className="w-3 h-3"/> {p.marginPercent.toFixed(1)}%</span>
                    ) : p.marginPercent < 0 ? (
                      <span className="text-red-500 flex items-center justify-end gap-1"><TrendingDown className="w-3 h-3"/> {p.marginPercent.toFixed(1)}%</span>
                    ) : (
                      "0.0%"
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
