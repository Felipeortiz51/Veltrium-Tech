import { z } from 'zod'
import { TransactionType, DocumentType, PaymentMethod } from '@prisma/client'

// ====== TRANSACTIONS ======

export const transactionFormSchema = z.object({
  id: z.string().optional(),
  date: z.date({
    required_error: "La fecha es requerida.",
  }),
  type: z.nativeEnum(TransactionType, {
    required_error: "Debes seleccionar un tipo de transacción.",
  }),
  categoryId: z.string().min(1, "Debes seleccionar una categoría."),
  description: z.string().min(3, "La descripción debe tener al menos 3 caracteres."),
  amount: z.coerce.number().positive("El monto debe ser numérico y mayor a cero."),
  documentType: z.nativeEnum(DocumentType, {
    required_error: "El tipo de documento es requerido.",
  }),
  paymentMethod: z.nativeEnum(PaymentMethod, {
    required_error: "El método de pago es requerido.",
  }),
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
