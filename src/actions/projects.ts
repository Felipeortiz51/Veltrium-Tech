'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'

export async function createProjectAction(data: { name: string; code?: string; budget?: number; companyId: string }) {
  try {
    const project = await prisma.project.create({
      data: {
        name: data.name,
        code: data.code,
        budget: data.budget,
        companyId: data.companyId,
        // En una app real de multitenant asociaremos createdById basado en sesion
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
