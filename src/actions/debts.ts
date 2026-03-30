'use server'

import { revalidatePath } from "next/cache"
import { createDebt, registerPayment, updateDebtStatus } from "@/services/debts"
import { DebtFormValues, DebtPaymentFormValues } from "@/lib/validators"
import { getAuthSession } from "@/lib/auth"

export async function createDebtAction(data: DebtFormValues) {
  try {
    const session = await getAuthSession()
    await createDebt(data, session.companyId)

    revalidatePath("/debts")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function registerPaymentAction(data: DebtPaymentFormValues) {
  try {
    const session = await getAuthSession()
    await registerPayment(data, session.companyId)

    revalidatePath("/debts")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateDebtStatusAction(id: string, status: 'ACTIVE' | 'DELINQUENT' | 'RESTRUCTURED') {
  try {
    const session = await getAuthSession()
    await updateDebtStatus(id, status, session.companyId)

    revalidatePath("/debts")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
