import { z } from 'zod'
import { TransactionType, DocumentType, PaymentMethod } from '@prisma/client'

// ====== TRANSACTIONS ======

export const transactionFormSchema = z.object({
  id: z.string().optional(),
  date: z.date({ message: "La fecha es requerida." }),
  type: z.nativeEnum(TransactionType),
  categoryId: z.string().min(1, "Debes seleccionar una categoría."),
  description: z.string().min(3, "La descripción debe tener al menos 3 caracteres."),
  amount: z.number({ message: "El monto debe ser numérico y mayor a cero." }).positive("El monto debe ser mayor a cero."),
  documentType: z.nativeEnum(DocumentType),
  paymentMethod: z.nativeEnum(PaymentMethod),
  status: z.enum(['PENDING', 'PAID']).default('PAID'),
  currency: z.enum(['CLP', 'USD', 'UF']).default('CLP'),
  originalAmount: z.number().optional(),
  exchangeRate: z.number().optional(),
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

// ====== DEBTS ======

export const debtFormSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  initialBalance: z.number({ message: "El saldo inicial es requerido." }).int().positive("El saldo debe ser mayor a cero."),
  monthlyRate: z.number({ message: "La tasa mensual es requerida." }).min(0, "La tasa no puede ser negativa.").max(1, "La tasa debe ser un decimal (ej: 0.021 = 2.1%)."),
  basePayment: z.number({ message: "La cuota base es requerida." }).int().positive("La cuota debe ser mayor a cero."),
  totalPayments: z.number().int().positive().optional(),
  startDate: z.date({ message: "La fecha de inicio es requerida." }),
})

export type DebtFormValues = z.infer<typeof debtFormSchema>

// ====== DEBT PAYMENTS ======

export const debtPaymentFormSchema = z.object({
  debtId: z.string().min(1, "ID de deuda requerido."),
  month: z.string().min(7, "Mes requerido en formato YYYY-MM."),
  amountPaid: z.number({ message: "El monto pagado es requerido." }).int().positive("El monto debe ser mayor a cero."),
})

export type DebtPaymentFormValues = z.infer<typeof debtPaymentFormSchema>
