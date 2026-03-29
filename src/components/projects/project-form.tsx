'use client'

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { projectFormSchema, ProjectFormValues } from "@/lib/validators"
import { createProjectAction } from "@/actions/projects"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"

export function ProjectForm({ 
  companyId,
  onSuccess 
}: { 
  companyId: string,
  onSuccess: () => void 
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: "",
      code: "",
      budget: undefined,
    },
  })

  async function onSubmit(data: ProjectFormValues) {
    setIsSubmitting(true)
    try {
      const res = await createProjectAction({ ...data, companyId })
      if (res.success) {
        toast.success("Centro de costo creado con éxito")
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
        
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Proyecto</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Mantenimiento Faena Minera XYZ" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código Interno</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: PRJ-001" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="budget"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Presupuesto (Meta)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Ej: 15000000" 
                    {...field}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Abrir Centro de Costo
        </Button>
      </form>
    </Form>
  )
}
