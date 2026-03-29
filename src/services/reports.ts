import prisma from "@/lib/prisma"

export async function getMonthlyMetrics(companyId: string, month: Date) {
  const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1)
  const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59, 999)

  // 1. Obtener todas las transacciones del mes
  const transactions = await prisma.transaction.findMany({
    where: {
      companyId: companyId,
      isVoided: false,
      date: {
        gte: startOfMonth,
        lte: endOfMonth
      }
    },
    include: {
      category: true
    }
  })

  // 2. Acumuladores B2B Veltrium
  let sumIngresosBrutos = 0
  let sumIngresosNetos = 0
  let flujoCajaReal = 0
  
  let sumCostosDirectosBruto = 0
  let sumCostosDirectosNeto = 0
  
  let sumGastosOperacionalesBruto = 0
  let sumGastosOperacionalesNeto = 0

  let sumIvaDebito = 0 // IVA generado por ventas (Se le debe al SII)
  let sumIvaCredito = 0 // IVA pagado en compras (A favor de la empresa)

  // 3. Procesar matemáticamente
  for (const t of transactions) {
    if (t.type === "INCOME") {
      sumIngresosBrutos += t.amount
      sumIngresosNetos += t.netAmount
      sumIvaDebito += t.taxAmount
      if (t.status === "PAID") { // Accrual vs Cash Flow
        flujoCajaReal += t.amount
      }
    } else if (t.type === "EXPENSE") {
      if (t.category.subtype === "DIRECT_COST") {
        sumCostosDirectosBruto += t.amount
        sumCostosDirectosNeto += t.netAmount
      } else if (t.category.subtype === "OPERATIONAL" || !t.category.subtype) {
        // Todo gasto no directo es operacional para la empresa
        sumGastosOperacionalesBruto += t.amount
        sumGastosOperacionalesNeto += t.netAmount
      }
      
      sumIvaCredito += t.taxAmount
    }
  }

  // 4. Calcular KPIs Estratégicos
  const margenBruto = sumIngresosNetos - sumCostosDirectosNeto
  const margenBrutoPorcentaje = sumIngresosNetos > 0 ? (margenBruto / sumIngresosNetos) * 100 : 0
  const utilidadNeta = margenBruto - sumGastosOperacionalesNeto
  const ivaAPagar = sumIvaDebito - sumIvaCredito

  // Para el Simulador de Punto de Equilibrio
  const numeroTrabajos = transactions.filter(t => t.type === "INCOME").length

  return {
    ingresosBrutos: sumIngresosBrutos,
    ingresosNetos: sumIngresosNetos,
    flujoCajaReal: flujoCajaReal,
    costosDirectosNeto: sumCostosDirectosNeto,
    gastosOperacionalesNeto: sumGastosOperacionalesNeto,
    margenBruto: margenBruto,
    margenBrutoPorcentaje: margenBrutoPorcentaje,
    utilidadNeta: utilidadNeta,
    ivaDebito: sumIvaDebito,
    ivaCredito: sumIvaCredito,
    ivaAPagar: ivaAPagar,
    numeroTrabajosRealizados: numeroTrabajos
  }
}

// Historial Mensual - Fase 4
export async function getCompanyHistory(companyId: string) {
  const transactions = await prisma.transaction.findMany({
    where: {
      companyId: companyId,
      isVoided: false
    },
    include: {
      category: true
    },
    orderBy: {
      date: 'asc'
    }
  })

  const monthlyHistory = new Map<string, any>()

  for (const t of transactions) {
    const d = new Date(t.date)
    // Usamos el formato "YYYY-MM" para agrupar
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    
    if (!monthlyHistory.has(monthKey)) {
      monthlyHistory.set(monthKey, {
        monthKey,
        monthDate: new Date(d.getFullYear(), d.getMonth(), 1),
        ingresosBrutos: 0,
        costosDirectosNetos: 0,
        gastosOperacionalesNetos: 0,
        ivaPagado: 0, // IVA a Pagar (Débito - Crédito)
        numeroTrabajos: 0,
        ivaDebito: 0,
        ivaCredito: 0
      })
    }
    
    const record = monthlyHistory.get(monthKey)

    if (t.type === "INCOME") {
      record.ingresosBrutos += t.amount
      record.ivaDebito += t.taxAmount
      record.numeroTrabajos += 1
    } else if (t.type === "EXPENSE") {
      if (t.category.subtype === "DIRECT_COST") {
        record.costosDirectosNetos += t.netAmount
      } else {
        record.gastosOperacionalesNetos += t.netAmount
      }
      record.ivaCredito += t.taxAmount
    }
  }

  // Convertimos el mapa en array y calculamos la recta final de métricas (Igual a la de tu Excel)
  const historyList = Array.from(monthlyHistory.values()).map(record => {
    // Todos los ingresos brutos se transforman a netos para rentabilidad (Ingreso Neto = Ingreso Bruto - IVA Débito)
    // En el simulador lo hicimos directo, aquí también usando la info contable:
    const ingresosNetos = record.ingresosBrutos - record.ivaDebito
    const margenBruto = ingresosNetos - record.costosDirectosNetos
    const utilidadNeta = margenBruto - record.gastosOperacionalesNetos
    const ivaPagado = Math.max(0, record.ivaDebito - record.ivaCredito) // Lo que realmente envías al SII

    return {
      monthKey: record.monthKey,
      monthDate: record.monthDate,
      ingresosBrutos: record.ingresosBrutos,
      costosDirectos: record.costosDirectosNetos,
      margenBruto: margenBruto,
      gastosOperacionales: record.gastosOperacionalesNetos,
      utilidadNeta: utilidadNeta,
      ivaPagado: ivaPagado,
      numeroTrabajos: record.numeroTrabajos
    }
  })

  // Order DESC to show newest months at top
  historyList.sort((a, b) => b.monthDate.getTime() - a.monthDate.getTime())

  return historyList
}
