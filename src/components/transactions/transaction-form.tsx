'use client'

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { TransactionType, DocumentType, PaymentMethod } from "@prisma/client"
import { transactionFormSchema, TransactionFormValues } from "@/lib/validators"
import { createTransactionAction } from "@/actions/transactions"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/hooks/use-currency"

export function TransactionForm({ 
  categories,
  projects = [],
  onSuccess 
}: { 
  categories: any[],
  projects?: any[],
  onSuccess: () => void 
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema) as any,
    defaultValues: {
      date: new Date(),
      type: "EXPENSE" as any,
      description: "",
      amount: 0,
      categoryId: "",
      documentType: "NO_DOCUMENT" as any,
      paymentMethod: "TRANSFER" as any,
      clientSupplier: "",
      notes: "",
      currency: "CLP" as any,
      status: "PAID" as any,
      originalAmount: undefined,
      exchangeRate: undefined,
      folio: "",
      projectId: "none",
    },
  })

  // Cálculos automáticos de IVA
  const amount = form.watch("amount")
  const documentType = form.watch("documentType")
  const type = form.watch("type")

  let taxAmount = 0
  let netAmount = Number(amount) || 0

  // Lógica Contable Auditable (Chile):
  // 1. Facturas (INVOICE): Siempre desglosan IVA (ya sea Débito para ventas o Crédito para compras).
  // 2. Boletas (RECEIPT) de Ingreso: Desglosan IVA porque se le debe pagar al Fisco (Débito Fiscal).
  // 3. Boletas (RECEIPT) de Egreso: El IVA no es recuperable, así que el total Bruto es el Gasto Neto de la empresa.
  if (documentType === "INVOICE" || (documentType === "RECEIPT" && type === "INCOME")) {
    taxAmount = Math.round((netAmount / 1.19) * 0.19)
    netAmount = netAmount - taxAmount
  }

  const filteredCategories = categories.filter(c => c.type === type)

  // Deseleccionar categoría si se cambia el tipo
  useEffect(() => {
    form.setValue("categoryId", "")
  }, [type, form])

  async function onSubmit(data: TransactionFormValues) {
    setIsSubmitting(true)
    try {
      const res = await createTransactionAction(data)
      if (res.success) {
        toast.success("Transacción registrada correctamente")
        onSuccess()
      } else {
        toast.error(res.error || "Ocurrió un error al registrar.")
      }
    } catch (e) {
      toast.error("Error crítico de servidor.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Movimiento</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <span data-slot="select-value">
                        {field.value === "INCOME" ? "INGRESO" : field.value === "EXPENSE" ? "EGRESO" : "Selecciona"}
                      </span>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="INCOME">INGRESO</SelectItem>
                    <SelectItem value="EXPENSE">EGRESO</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col mt-2.5">
                <FormLabel>Fecha</FormLabel>
                <Popover>
                  <PopoverTrigger render={
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                      >
                        {field.value ? format(field.value, "PPP", { locale: es }) : <span>Elegir fecha</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  } />
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                      locale={es}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoría</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <span data-slot="select-value">
                      {categories.find(c => c.id === field.value)?.name || "Selecciona una categoría..."}
                    </span>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {filteredCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} {c.subtype === 'DIRECT_COST' ? '(Costo Directo)' : c.subtype === 'OPERATIONAL' ? '(Operacional)' : ''}
                    </SelectItem>
                  ))}
                  {filteredCategories.length === 0 && (
                    <div className="p-2 text-sm text-muted-foreground">No hay categorías.</div>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción / Glosa</FormLabel>
              <FormControl>
                <Input placeholder="Ej. Compra de herramientas..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="documentType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Documento</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <span data-slot="select-value">
                        {field.value === "INVOICE" ? "Factura" : field.value === "RECEIPT" ? "Boleta" : "Sin Documento"}
                      </span>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="INVOICE">Factura</SelectItem>
                    <SelectItem value="RECEIPT">Boleta</SelectItem>
                    <SelectItem value="NO_DOCUMENT">Sin Documento</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monto Total (Bruto)</FormLabel>
                <FormControl>
                  <Input 
                    type="text" 
                    placeholder="10.000" 
                    {...field}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '');
                      field.onChange(raw ? parseInt(raw, 10) : "");
                    }}
                    value={field.value ? new Intl.NumberFormat('es-CL').format(Number(field.value)) : ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="rounded-md bg-secondary/30 p-4 shrink-0 flex items-center justify-between shadow-inner border border-border/50">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Neto Calculado</p>
            <p className="text-lg font-bold text-foreground">{formatCurrency(netAmount)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">IVA Calculado</p>
            <p className={cn("text-lg font-bold", taxAmount > 0 ? "text-accent" : "text-muted-foreground")}>
              {formatCurrency(taxAmount)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado de Flujo</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <span data-slot="select-value">{field.value === "PAID" ? "En Caja (Pagado)" : "Devengado (Pendiente)"}</span>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="PAID">En Caja (Pagado)</SelectItem>
                    <SelectItem value="PENDING">Devengado (Pendiente)</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription className="text-[10px]">Las transacciones pendientes no suman a la liquidez.</FormDescription>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="projectId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Centro de Costo</FormLabel>
                <Select onValueChange={(val) => field.onChange(val === 'none' ? undefined : val)} value={field.value || 'none'}>
                  <FormControl>
                    <SelectTrigger>
                      <span data-slot="select-value">
                        {field.value && field.value !== 'none' ? projects.find(p => p.id === field.value)?.name : "Sin Centro (General)"}
                      </span>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Sin Centro (General)</SelectItem>
                    {projects.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="paymentMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Método de Pago</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <span data-slot="select-value">
                        {field.value === "TRANSFER" ? "Transferencia" : field.value === "CASH" ? "Efectivo" : field.value === "CHECK" ? "Cheque" : field.value === "CREDIT_30" ? "Crédito 30 días" : field.value === "CREDIT_60" ? "Crédito 60 días" : "Selecciona"}
                      </span>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="TRANSFER">Transferencia</SelectItem>
                    <SelectItem value="CASH">Efectivo</SelectItem>
                    <SelectItem value="CHECK">Cheque</SelectItem>
                    <SelectItem value="CREDIT_30">Crédito 30 días</SelectItem>
                    <SelectItem value="CREDIT_60">Crédito 60 días</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Moneda</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <span data-slot="select-value">
                        {field.value === "CLP" ? "CLP (Pesos)" : field.value === "USD" ? "USD (Dólar)" : "UF"}
                      </span>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="CLP">CLP (Pesos)</SelectItem>
                    <SelectItem value="USD">USD (Dólar)</SelectItem>
                    <SelectItem value="UF">UF</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="folio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Folio SII</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: 001234" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="clientSupplier"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cliente / Proveedor</FormLabel>
              <FormControl>
                <Input placeholder="Nombre o razón social (opcional)..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observaciones internas</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Notas privadas: contexto, número de OC, detalle del servicio..." 
                  className="resize-none h-20"
                  {...field} 
                />
              </FormControl>
              <FormDescription className="text-[10px]">Solo visible internamente. Útil para auditoría y contexto.</FormDescription>
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Registrar Transacción
        </Button>
      </form>
    </Form>
  )
}
