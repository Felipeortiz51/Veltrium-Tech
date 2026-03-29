'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { AssetType, LiabilityType } from "@prisma/client"

export async function createAssetAction(data: { name: string; value: number; type: AssetType }) {
  try {
    const company = await prisma.company.findFirst()
    if (!company) throw new Error("No company found")

    await prisma.asset.create({
      data: { ...data, companyId: company.id }
    })

    revalidatePath("/balance")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteAssetAction(id: string) {
  try {
    await prisma.asset.delete({ where: { id } })
    revalidatePath("/balance")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function createLiabilityAction(data: { name: string; value: number; type: LiabilityType }) {
  try {
    const company = await prisma.company.findFirst()
    if (!company) throw new Error("No company found")

    await prisma.liability.create({
      data: { ...data, companyId: company.id }
    })

    revalidatePath("/balance")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteLiabilityAction(id: string) {
  try {
    await prisma.liability.delete({ where: { id } })
    revalidatePath("/balance")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
