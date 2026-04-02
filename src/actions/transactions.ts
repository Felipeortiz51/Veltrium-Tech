'use server'

import { revalidatePath } from 'next/cache'
import { createTransaction, voidTransaction, updateTransaction, markTransactionPaid } from '@/services/transactions'
import { TransactionFormValues, voidTransactionSchema, VoidTransactionValues } from '@/lib/validators'
import { getAuthSession } from '@/lib/auth'

export async function createTransactionAction(data: TransactionFormValues) {
  try {
    const session = await getAuthSession()
    await createTransaction(data, session.companyId, session.userId)
    revalidatePath('/transactions')
    return { success: true }
  } catch (error: any) {
    console.error(error)
    if (error?.code === 'P2002') {
      return { success: false, error: "Ya existe un registro con esos datos únicos." }
    }
    return { success: false, error: error.message || "Ha ocurrido un error al guardar la transacción." }
  }
}

export async function updateTransactionAction(data: TransactionFormValues) {
  if (!data.id) return { success: false, error: "ID de transacción requerido." }

  try {
    const session = await getAuthSession()
    await updateTransaction(data.id, data, session.companyId)
    revalidatePath('/transactions')
    return { success: true }
  } catch (error: any) {
    console.error(error)
    if (error?.code === 'P2002') {
      return { success: false, error: "Conflicto de duplicidad en la base de datos." }
    }
    return { success: false, error: error.message || "Verifique si el mes está cerrado o los datos ingresados." }
  }
}

export async function markPaidAction(id: string) {
  try {
    const session = await getAuthSession()
    await markTransactionPaid(id, session.companyId)
    revalidatePath('/transactions')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Error al marcar como pagada." }
  }
}

export async function voidTransactionAction(data: VoidTransactionValues) {
  const parsed = voidTransactionSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: "Razón detallada requerida." }

  try {
    const session = await getAuthSession()
    await voidTransaction(parsed.data.id, parsed.data.voidReason, session.companyId)
    revalidatePath('/transactions')
    return { success: true }
  } catch (error: any) {
    console.error(error)
    return { success: false, error: error.message || "Error al anular la transacción." }
  }
}
