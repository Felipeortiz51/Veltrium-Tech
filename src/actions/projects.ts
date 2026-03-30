'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { getAuthSession } from '@/lib/auth'

export async function createProjectAction(data: { name: string; code?: string; budget?: number }) {
  try {
    const session = await getAuthSession()

    const project = await prisma.project.create({
      data: {
        name: data.name,
        code: data.code,
        budget: data.budget,
        companyId: session.companyId,
      }
    })

    revalidatePath('/projects')
    revalidatePath('/transactions')

    return { success: true, project }
  } catch (error) {
    console.error("Error al crear proyecto:", error)
    return { success: false, error: "Ocurrió un error inesperado al guardar el centro de costo." }
  }
}
