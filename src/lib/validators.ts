import { z } from 'zod'
import { TransactionType, DocumentType, PaymentMethod } from '@prisma/client'

// ====== TRANSACTIONS ======

export const transactionFormSchema = z.object({
  id: z.string().optional(),
  date: z.date({
    required_error: "La fecha es requerida.",
  }),
  type: z.nativeEnum(TransactionType),
  categoryId: z.string().min(1, "Debes seleccionar una categoría."),
  description: z.string().min(3, "La descripción debe tener al menos 3 caracteres."),
  amount: z.coerce.number().positive("El monto debe ser numérico y mayor a cero."),
  documentType: z.nativeEnum(DocumentType),
  paymentMethod: z.nativeEnum(PaymentMethod),
  status: z.enum(['PENDING', 'PAID']).default('PAID'),
  currency: z.enum(['CLP', 'USD', 'UF']).default('CLP'),
  originalAmount: z.coerce.number().optional(),
  exchangeRate: z.coerce.number().optional(),
  folio: z.string().optional(),
  projectId: z.string().optional(),
  clientSupplier: z.string().optional(),
  clientId: z.string().optional(),
  notes: z.string().optional(),
})

export type TransactionFormValues = z.infer<typeof transactionFormSchema>

// ====== VOID TRANSACTION ======

export const voidTransactionSchema = z.object({
  id: z.string().min(1, "ID de transacción requerido."),
  voidReason: z.string().min(5, "Debes proporcionar una razón detallada para anular."),
})

export type VoidTransactionValues = z.infer<typeof voidTransactionSchema>

// ====== PROJECTS ======

export const projectFormSchema = z.object({
  name: z.string().min(3, "El nombre del proyecto debe tener al menos 3 caracteres."),
  code: z.string().optional(),
  budget: z.coerce.number().optional(),
})

export type ProjectFormValues = z.infer<typeof projectFormSchema>
