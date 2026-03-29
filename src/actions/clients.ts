'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createClientAction(data: {
  name: string
  rut?: string
  contactName?: string
  phone?: string
  email?: string
  notes?: string
}) {
  try {
    // TODO(SECURITY): Reemplazar findFirst arbitrario por sesión NextAuth real (ej: session.user.companyId)
    // para evitar cruce de datos entre diferentes empresas en el mismo servidor.
    const company = await prisma.company.findFirst()
    if (!company) throw new Error("No company found")

    if (!data.name) throw new Error("Name is required")

    const client = await prisma.client.create({
      data: {
        ...data,
        companyId: company.id
      }
    })

    revalidatePath("/clients")
    revalidatePath("/transactions") // In case they select it
    return { success: true, client }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
