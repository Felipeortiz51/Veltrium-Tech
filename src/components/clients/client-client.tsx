"use client"

import { useState } from "react"
import { Plus, Building2, Phone, Mail, FileText, Search, MoreHorizontal } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { createClientAction } from "@/actions/clients"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

const clientSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres").max(100),
  rut: z.string().optional(),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Debe ser un email válido").optional().or(z.literal('')),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof clientSchema>

interface DBClient {
  id: string
  name: string
  rut: string | null
  contactName: string | null
  phone: string | null
  email: string | null
  notes: string | null
  createdAt: Date
  _count: {
    transactions: number
  }
}

export function ClientClient({ clients }: { clients: DBClient[] }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const router = useRouter()

  const form = useForm<FormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: "",
      rut: "",
      contactName: "",
      phone: "",
      email: "",
      notes: ""
    }
  })

  async function onSubmit(data: FormValues) {
    const formData = {
      name: data.name,
      rut: data.rut || undefined,
      contactName: data.contactName || undefined,
      phone: data.phone || undefined,
      email: data.email || undefined,
      notes: data.notes || undefined,
    }

    const res = await createClientAction(formData)
    
    if (res.success) {
      toast.success(`Cliente ${data.name} registrado en sistema.`)
      setOpen(false)
      form.reset()
      router.refresh()
    } else {
      toast.error(res.error || "No se pudo crear cliente")
    }
  }

  const filtered = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.rut && c.rut.toLowerCase().includes(search.toLowerCase())) ||
    (c.contactName && c.contactName.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <Card className="shadow-sm border-border">
      <CardHeader className="flex flex-col md:flex-row md:items-center justify-between pb-6 gap-4 border-b bg-secondary/10">
        <div>
          <CardTitle className="text-xl">Base de Datos de Clientes</CardTitle>
          <CardDescription>Directorio de cuentas corporativas y estado actual</CardDescription>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="text" 
              placeholder="Buscar cliente, RUT..." 
              className="pl-9 bg-white" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={props => (
              <Button {...props} className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" /> Nuevo
              </Button>
            )} />
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Registrar Cliente Veltrium</DialogTitle>
                <DialogDescription>
                  Ingresa los datos para asentar una nueva cuenta en el Holding.
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                  {/* Empresa y RUT */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Empresa / Cliente *</FormLabel>
                          <FormControl>
                            <Input placeholder="Veltrium Tech SpA..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="rut"
                      render={({ field }) => (
                        <FormItem className="col-span-1">
                          <FormLabel>RUT</FormLabel>
                          <FormControl>
                            <Input placeholder="76.000.000-K" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="contactName"
                      render={({ field }) => (
                        <FormItem className="col-span-1">
                          <FormLabel>Contacto Base</FormLabel>
                          <FormControl>
                            <Input placeholder="Juan Pérez..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Vías de Comunicación */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Teléfono</FormLabel>
                          <FormControl>
                            <Input placeholder="+56 9..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-mail (DTE)</FormLabel>
                          <FormControl>
                            <Input placeholder="dte@empresa.cl" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Servicio / Cotización Actual / Notas</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej. Aprobado, Pendiente $1M..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end pt-4 space-x-2">
                    <DialogClose render={props => (
                      <Button {...props} variant="outline" type="button">Cancelar</Button>
                    )} />
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                      {form.formState.isSubmitting ? "Guardando..." : "Añadir Cliente"}
                    </Button>
                  </div>
                </form>
              </Form>

            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-xs text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Cliente / Empresa</th>
                <th className="px-6 py-4 font-semibold">Contacto Base</th>
                <th className="px-6 py-4 font-semibold">Vías Comunicación</th>
                <th className="px-6 py-4 font-semibold">CRM Notas</th>
                <th className="px-6 py-4 font-semibold text-center">Interacciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No se encontraron clientes en el sistema corporativo. Ingresa uno para comenzar.
                  </td>
                </tr>
              ) : (
                filtered.map((client) => (
                  <tr key={client.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {client.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground text-sm">{client.name}</span>
                          <span className="text-xs text-muted-foreground">{client.rut || "-"}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium">{client.contactName || "-"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-xs">
                        {client.phone && <span className="flex items-center text-muted-foreground"><Phone className="h-3 w-3 mr-1" />{client.phone}</span>}
                        {client.email && <span className="flex items-center text-muted-foreground"><Mail className="h-3 w-3 mr-1" />{client.email}</span>}
                        {!client.phone && !client.email && <span className="text-muted-foreground/50">-</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-muted-foreground line-clamp-2 max-w-[200px]">
                        {client.notes || "Sin registros comerciales."}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <div className="px-2.5 py-1 text-xs font-semibold rounded-full bg-accent/10 border border-accent/20 text-accent-foreground">
                          {client._count.transactions} Trx.
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
