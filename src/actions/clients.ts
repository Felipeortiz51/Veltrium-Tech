'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getAuthSession } from "@/lib/auth"

export async function createClientAction(data: {
  name: string
  rut?: string
  contactName?: string
  phone?: string
  email?: string
  notes?: string
}) {
  try {
    const session = await getAuthSession()

    if (!data.name) throw new Error("Name is required")

    const client = await prisma.client.create({
      data: {
        ...data,
        companyId: session.companyId
      }
    })

    revalidatePath("/clients")
    revalidatePath("/transactions")
    return { success: true, client }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
