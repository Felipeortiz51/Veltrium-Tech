'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getAuthSession } from '@/lib/auth'

export async function createEquityAction(data: {
  partnerName: string
  description?: string
  amount: number
  status: 'PENDING' | 'DEPOSITED'
  promisedDate?: Date
}) {
  try {
    const session = await getAuthSession()
    await prisma.equityContribution.create({
      data: {
        partnerName: data.partnerName,
        description: data.description,
        amount: data.amount,
        status: data.status,
        promisedDate: data.promisedDate,
        depositedAt: data.status === 'DEPOSITED' ? new Date() : null,
        companyId: session.companyId,
      }
    })
    revalidatePath('/balance')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al registrar aporte.' }
  }
}

export async function markDepositedAction(id: string) {
  try {
    const session = await getAuthSession()
    await prisma.equityContribution.update({
      where: { id, companyId: session.companyId },
      data: {
        status: 'DEPOSITED',
        depositedAt: new Date(),
      }
    })
    revalidatePath('/balance')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al actualizar.' }
  }
}

export async function deleteEquityAction(id: string) {
  try {
    const session = await getAuthSession()
    await prisma.equityContribution.delete({
      where: { id, companyId: session.companyId }
    })
    revalidatePath('/balance')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al eliminar.' }
  }
}
