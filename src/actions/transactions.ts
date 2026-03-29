'use server'

import { revalidatePath } from 'next/cache'
import { createTransaction, voidTransaction, updateTransaction } from '@/services/transactions'
import { TransactionFormValues, voidTransactionSchema, VoidTransactionValues } from '@/lib/validators'

// TODO: In Phase 5 we will use NextAuth to get the real session
const DEFAULT_COMPANY_ID = 'clp8a2x4f000xyzcompany123' // ID ficticio inicial, se corregirá con Prisma fetch
const DEFAULT_USER_ID = 'clp8a2y4g001xyzuser456'

// Fetch real context dynamically for MVP (before NextAuth)
import prisma from '@/lib/prisma'

async function getSessionContext() {
  const company = await prisma.company.findFirst()
  const user = await prisma.user.findFirst()
  
  if (!company || !user) throw new Error("No hay empresa o usuario configurado (Run Seed).")
  
  return { companyId: company.id, userId: user.id }
}

export async function createTransactionAction(data: TransactionFormValues) {
  try {
    const { companyId, userId } = await getSessionContext()
    await createTransaction(data, companyId, userId)
    revalidatePath('/transactions')
    return { success: true }
  } catch (error: any) {
    console.error(error)
    return { success: false, error: "Ha ocurrido un error al guardar la transacción." }
  }
}

export async function updateTransactionAction(data: TransactionFormValues) {
  if (!data.id) return { success: false, error: "ID de transacción requerido." }
  
  try {
    const { companyId } = await getSessionContext()
    await updateTransaction(data.id, data, companyId)
    revalidatePath('/transactions')
    return { success: true }
  } catch (error: any) {
    console.error(error)
    return { success: false, error: "Verifique si el mes está cerrado o los datos ingresados." }
  }
}

export async function voidTransactionAction(data: VoidTransactionValues) {
  const parsed = voidTransactionSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: "Razón detallada requerida." }

  try {
    const { companyId } = await getSessionContext()
    await voidTransaction(parsed.data.id, parsed.data.voidReason, companyId)
    revalidatePath('/transactions')
    return { success: true }
  } catch (error: any) {
    console.error(error)
    return { success: false, error: "Error al anular la transacción." }
  }
}
