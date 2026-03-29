import prisma from '@/lib/prisma'
import { TransactionFormValues } from '@/lib/validators'
import { format } from 'date-fns'
import { DocumentType } from '@prisma/client'

export async function createTransaction(data: TransactionFormValues, companyId: string, userId: string) {
  // 1. Calculate IVA and NetAmount based on DocumentType
  let taxAmount = 0
  let netAmount = data.amount

  if (data.documentType === DocumentType.INVOICE || 
      (data.documentType === DocumentType.RECEIPT && data.type === 'INCOME')) {
    taxAmount = Math.round((data.amount / 1.19) * 0.19)
    netAmount = data.amount - taxAmount
  }

  // 2. Calculate monthYear
  const monthYear = format(data.date, 'yyyy-MM')

  // 3. Create the transaction
  const transaction = await prisma.transaction.create({
    data: {
      date: data.date,
      type: data.type,
      categoryId: data.categoryId,
      description: data.description,
      amount: data.amount,
      documentType: data.documentType,
      taxAmount: taxAmount,
      netAmount: netAmount,
      paymentMethod: data.paymentMethod,
      clientSupplier: data.clientSupplier,
      clientId: data.clientId,
      notes: data.notes,
      monthYear: monthYear,
      status: data.status as any,
      currency: data.currency as any,
      originalAmount: data.originalAmount,
      exchangeRate: data.exchangeRate,
      folio: data.folio,
      projectId: data.projectId,
      companyId: companyId,
      createdById: userId,
    }
  })

  return transaction
}

export async function updateTransaction(id: string, data: TransactionFormValues, companyId: string) {
  // Validate ownership and verify if the month is closed? (Future rule)
  
  // 1. Calculate IVA and NetAmount based on DocumentType
  let taxAmount = 0
  let netAmount = data.amount

  if (data.documentType === DocumentType.INVOICE || 
      (data.documentType === DocumentType.RECEIPT && data.type === 'INCOME')) {
    taxAmount = Math.round((data.amount / 1.19) * 0.19)
    netAmount = data.amount - taxAmount
  }

  // 2. Calculate monthYear
  const monthYear = format(data.date, 'yyyy-MM')

  const transaction = await prisma.transaction.update({
    where: { id, companyId },
    data: {
      date: data.date,
      type: data.type,
      categoryId: data.categoryId,
      description: data.description,
      amount: data.amount,
      documentType: data.documentType,
      taxAmount: taxAmount,
      netAmount: netAmount,
      paymentMethod: data.paymentMethod,
      clientSupplier: data.clientSupplier,
      clientId: data.clientId,
      notes: data.notes,
      monthYear: monthYear,
      status: data.status as any,
      currency: data.currency as any,
      originalAmount: data.originalAmount,
      exchangeRate: data.exchangeRate,
      folio: data.folio,
      projectId: data.projectId,
    }
  })

  return transaction
}

export async function voidTransaction(id: string, voidReason: string, companyId: string) {
  const transaction = await prisma.transaction.update({
    where: { id, companyId },
    data: {
      isVoided: true,
      voidReason: voidReason
    }
  })
  return transaction
}

export async function getTransactions(companyId: string, filters?: { monthYear?: string, type?: string, categoryId?: string }) {
  const whereClause: any = { companyId }
  
  if (filters?.monthYear) whereClause.monthYear = filters.monthYear
  if (filters?.type) whereClause.type = filters.type
  if (filters?.categoryId) whereClause.categoryId = filters.categoryId

  const transactions = await prisma.transaction.findMany({
    where: whereClause,
    orderBy: { date: 'desc' },
    include: {
      category: true,
      createdBy: {
        select: { name: true }
      }
    }
  })

  return transactions
}
