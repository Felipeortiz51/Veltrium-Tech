'use client'

import { useState } from 'react'
import { MoreHorizontal, Ban, Loader2, CheckCircle } from 'lucide-react'
import { voidTransactionAction, markPaidAction } from '@/actions/transactions'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function TransactionRowActions({ transaction }: { transaction: any }) {
  const [isVoidDialogOpen, setIsVoidDialogOpen] = useState(false)
  const [voidReason, setVoidReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (transaction.isVoided) {
    return <div className="text-xs text-muted-foreground pr-2 italic">Anulada</div>
  }

  const isPending = transaction.status === 'PENDING'

  async function handleMarkPaid() {
    setIsSubmitting(true)
    try {
      const res = await markPaidAction(transaction.id)
      if (res.success) {
        toast.success('Transacción marcada como pagada.')
      } else {
        toast.error(res.error || 'No se pudo actualizar.')
      }
    } catch {
      toast.error('Error de servidor.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleVoid() {
    if (voidReason.length < 5) {
      toast.error('La razón debe tener al menos 5 caracteres.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await voidTransactionAction({ id: transaction.id, voidReason })
      if (res.success) {
        toast.success('Transacción anulada correctamente.')
        setIsVoidDialogOpen(false)
      } else {
        toast.error(res.error || 'No se pudo anular la transacción.')
      }
    } catch (error) {
      toast.error('Error de servidor.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" className="h-8 w-8 p-0" />}>
          <span className="sr-only">Abrir menú</span>
          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {isPending && (
              <DropdownMenuItem
                className="text-emerald-600 focus:bg-emerald-50 focus:text-emerald-700 cursor-pointer"
                onClick={handleMarkPaid}
                disabled={isSubmitting}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Marcar como Pagada
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              className="text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer"
              onClick={() => setIsVoidDialogOpen(true)}
            >
              <Ban className="mr-2 h-4 w-4" />
              Anular transacción
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isVoidDialogOpen} onOpenChange={setIsVoidDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anular Transacción</DialogTitle>
            <DialogDescription>
              Esta acción marcará la transacción como anulada. Sus montos dejarán de sumar en el dashboard y reportes, pero el registro permanecerá por auditoría.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="reason">Motivo de la anulación (Mínimo 5 caracteres)</Label>
              <Input
                id="reason"
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                placeholder="Ej. Duplicado, error de digitación, reembolso..."
                disabled={isSubmitting}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVoidDialogOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleVoid} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirmar Anulación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
