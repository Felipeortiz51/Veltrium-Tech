import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

// ============================================================
// HELPERS
// ============================================================

function fmtCLP(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function fmtDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function fmtPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

const DOC_TYPE_LABELS: Record<string, string> = {
  INVOICE: 'Factura',
  RECEIPT: 'Boleta',
  NO_DOCUMENT: 'Sin Doc.',
}

const PAYMENT_LABELS: Record<string, string> = {
  TRANSFER: 'Transferencia',
  CASH: 'Efectivo',
  CHECK: 'Cheque',
  CREDIT_30: 'Crédito 30d',
  CREDIT_60: 'Crédito 60d',
}

const STATUS_LABELS: Record<string, string> = {
  PAID: 'Pagado',
  PENDING: 'Pendiente',
}

function createPDF(title: string, subtitle: string): jsPDF {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  // Header
  doc.setFontSize(18)
  doc.setTextColor(26, 50, 74) // Navy
  doc.text('Veltrium Tech SpA', 14, 15)

  doc.setFontSize(14)
  doc.setTextColor(60, 60, 60)
  doc.text(title, 14, 23)

  doc.setFontSize(9)
  doc.setTextColor(120, 120, 120)
  doc.text(subtitle, 14, 29)

  doc.setDrawColor(184, 134, 11) // Gold
  doc.setLineWidth(0.5)
  doc.line(14, 32, 283, 32)

  return doc
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ============================================================
// TRANSACCIONES
// ============================================================

interface TransactionExport {
  date: Date | string
  type: string
  category: { name: string }
  description: string
  amount: number
  netAmount: number
  taxAmount: number
  documentType: string
  paymentMethod: string
  status: string
  clientSupplier?: string | null
  notes?: string | null
  isVoided: boolean
}

export function exportTransactionsExcel(transactions: TransactionExport[], monthLabel: string) {
  const data = transactions
    .filter(t => !t.isVoided)
    .map(t => ({
      'Fecha': fmtDate(t.date),
      'Tipo': t.type === 'INCOME' ? 'Ingreso' : 'Egreso',
      'Categoría': t.category.name,
      'Descripción': t.description,
      'Bruto': t.amount,
      'Neto': t.netAmount,
      'IVA': t.taxAmount,
      'Documento': DOC_TYPE_LABELS[t.documentType] || t.documentType,
      'Método Pago': PAYMENT_LABELS[t.paymentMethod] || t.paymentMethod,
      'Estado': STATUS_LABELS[t.status] || t.status,
      'Cliente/Proveedor': t.clientSupplier || '',
      'Notas': t.notes || '',
    }))

  const ws = XLSX.utils.json_to_sheet(data)

  // Column widths
  ws['!cols'] = [
    { wch: 12 }, { wch: 8 }, { wch: 22 }, { wch: 35 },
    { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 12 },
    { wch: 14 }, { wch: 10 }, { wch: 20 }, { wch: 25 },
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Transacciones')
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
  downloadBlob(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `Transacciones_${monthLabel}.xlsx`)
}

export function exportTransactionsPDF(transactions: TransactionExport[], monthLabel: string) {
  const rows = transactions
    .filter(t => !t.isVoided)
    .map(t => [
      fmtDate(t.date),
      t.type === 'INCOME' ? 'Ingreso' : 'Egreso',
      t.category.name,
      t.description.length > 40 ? t.description.slice(0, 37) + '...' : t.description,
      fmtCLP(t.amount),
      fmtCLP(t.netAmount),
      fmtCLP(t.taxAmount),
      DOC_TYPE_LABELS[t.documentType] || t.documentType,
      STATUS_LABELS[t.status] || t.status,
    ])

  const doc = createPDF('Libro de Transacciones', `Período: ${monthLabel} | Generado: ${fmtDate(new Date())}`)

  autoTable(doc, {
    startY: 36,
    head: [['Fecha', 'Tipo', 'Categoría', 'Descripción', 'Bruto', 'Neto', 'IVA', 'Documento', 'Estado']],
    body: rows,
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [26, 50, 74], textColor: [255, 255, 255], fontSize: 7 },
    alternateRowStyles: { fillColor: [248, 249, 250] },
    columnStyles: {
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'right' },
    },
  })

  // Totals summary
  const active = transactions.filter(t => !t.isVoided)
  const totalIncome = active.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0)
  const totalExpense = active.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0)

  const finalY = (doc as any).lastAutoTable?.finalY || 200
  doc.setFontSize(9)
  doc.setTextColor(60, 60, 60)
  doc.text(`Total Ingresos: ${fmtCLP(totalIncome)}    |    Total Egresos: ${fmtCLP(totalExpense)}    |    Registros: ${active.length}`, 14, finalY + 8)

  doc.save(`Transacciones_${monthLabel}.pdf`)
}

// ============================================================
// HISTORIAL MENSUAL
// ============================================================

interface HistoryMonth {
  monthKey: string
  ingresosBrutos: number
  costosDirectos: number
  margenBruto: number
  gastosOperacionales: number
  utilidadNeta: number
  ivaPagado: number
  numeroTrabajos: number
}

export function exportHistoryExcel(history: HistoryMonth[]) {
  const data = history.map(m => ({
    'Mes': m.monthKey,
    'Ingresos Brutos': m.ingresosBrutos,
    'Costos Directos': m.costosDirectos,
    'Margen Bruto': m.margenBruto,
    'Gastos Operacionales': m.gastosOperacionales,
    'Utilidad Neta': m.utilidadNeta,
    'IVA Pagado SII': m.ivaPagado,
    'Nº Trabajos': m.numeroTrabajos,
  }))

  const ws = XLSX.utils.json_to_sheet(data)
  ws['!cols'] = [
    { wch: 10 }, { wch: 16 }, { wch: 16 }, { wch: 14 },
    { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 12 },
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Historial')
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
  downloadBlob(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `Historial_Mensual_Veltrium.xlsx`)
}

export function exportHistoryPDF(history: HistoryMonth[]) {
  const rows = history.map(m => [
    m.monthKey,
    fmtCLP(m.ingresosBrutos),
    fmtCLP(m.costosDirectos),
    fmtCLP(m.margenBruto),
    fmtCLP(m.gastosOperacionales),
    fmtCLP(m.utilidadNeta),
    fmtCLP(m.ivaPagado),
    String(m.numeroTrabajos),
  ])

  const doc = createPDF('Historial Financiero Mensual', `Generado: ${fmtDate(new Date())} | Veltrium Tech SpA`)

  autoTable(doc, {
    startY: 36,
    head: [['Mes', 'Ingresos Brutos', 'Costos Directos', 'Margen Bruto', 'G. Operacionales', 'Utilidad Neta', 'IVA SII', 'Trabajos']],
    body: rows,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [26, 50, 74], textColor: [255, 255, 255], fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 249, 250] },
    columnStyles: {
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'right' },
      7: { halign: 'center' },
    },
  })

  // Summary row
  const totalIngresos = history.reduce((s, m) => s + m.ingresosBrutos, 0)
  const totalUtilidad = history.reduce((s, m) => s + m.utilidadNeta, 0)
  const avgMargen = history.length > 0
    ? history.reduce((s, m) => s + (m.ingresosBrutos > 0 ? (m.margenBruto / m.ingresosBrutos) * 100 : 0), 0) / history.length
    : 0

  const finalY = (doc as any).lastAutoTable?.finalY || 200
  doc.setFontSize(9)
  doc.setTextColor(60, 60, 60)
  doc.text(`Facturación Acumulada: ${fmtCLP(totalIngresos)}    |    Utilidad Acumulada: ${fmtCLP(totalUtilidad)}    |    Margen Promedio: ${fmtPercent(avgMargen)}`, 14, finalY + 8)

  doc.save('Historial_Mensual_Veltrium.pdf')
}

// ============================================================
// ESTADO DE RESULTADOS (Dashboard Mensual)
// ============================================================

interface MonthlyMetrics {
  ingresosBrutos: number
  ingresosNetos: number
  flujoCajaReal: number
  costosDirectosNeto: number
  gastosOperacionalesNeto: number
  margenBruto: number
  margenBrutoPorcentaje: number
  utilidadNeta: number
  ivaDebito: number
  ivaCredito: number
  ivaAPagar: number
  numeroTrabajosRealizados: number
}

export function exportEstadoResultadosPDF(metrics: MonthlyMetrics, monthLabel: string) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  // Header
  doc.setFontSize(18)
  doc.setTextColor(26, 50, 74)
  doc.text('Veltrium Tech SpA', 14, 18)

  doc.setFontSize(14)
  doc.setTextColor(60, 60, 60)
  doc.text('Estado de Resultados', 14, 26)

  doc.setFontSize(10)
  doc.setTextColor(120, 120, 120)
  doc.text(`Período: ${monthLabel} | Generado: ${fmtDate(new Date())}`, 14, 33)

  doc.setDrawColor(184, 134, 11)
  doc.setLineWidth(0.5)
  doc.line(14, 36, 196, 36)

  const rows = [
    ['Ingresos Brutos (Facturado)', fmtCLP(metrics.ingresosBrutos)],
    ['  (-) IVA Débito Fiscal', `- ${fmtCLP(metrics.ivaDebito)}`],
    ['Ingresos Netos', fmtCLP(metrics.ingresosNetos)],
    ['', ''],
    ['  (-) Costos Directos (Neto)', `- ${fmtCLP(metrics.costosDirectosNeto)}`],
    ['MARGEN BRUTO', fmtCLP(metrics.margenBruto)],
    ['  Margen Bruto %', fmtPercent(metrics.margenBrutoPorcentaje)],
    ['', ''],
    ['  (-) Gastos Operacionales (Neto)', `- ${fmtCLP(metrics.gastosOperacionalesNeto)}`],
    ['UTILIDAD NETA', fmtCLP(metrics.utilidadNeta)],
    ['', ''],
    ['Flujo de Caja Real (Pagado)', fmtCLP(metrics.flujoCajaReal)],
    ['Trabajos Realizados', String(metrics.numeroTrabajosRealizados)],
    ['', ''],
    ['IVA Débito', fmtCLP(metrics.ivaDebito)],
    ['IVA Crédito', fmtCLP(metrics.ivaCredito)],
    ['IVA A PAGAR AL SII', fmtCLP(metrics.ivaAPagar)],
  ]

  autoTable(doc, {
    startY: 42,
    body: rows,
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: {
      0: { cellWidth: 120, fontStyle: 'normal' },
      1: { cellWidth: 55, halign: 'right', fontStyle: 'bold' },
    },
    didParseCell: (data: any) => {
      const text = data.row.raw?.[0] || ''
      if (text === 'MARGEN BRUTO' || text === 'UTILIDAD NETA' || text === 'IVA A PAGAR AL SII') {
        data.cell.styles.fillColor = [26, 50, 74]
        data.cell.styles.textColor = [255, 255, 255]
        data.cell.styles.fontStyle = 'bold'
      }
      if (text === 'Ingresos Netos' || text === 'Flujo de Caja Real (Pagado)') {
        data.cell.styles.fillColor = [240, 245, 250]
        data.cell.styles.fontStyle = 'bold'
      }
    },
    theme: 'plain',
  })

  doc.save(`Estado_Resultados_${monthLabel}.pdf`)
}

export function exportEstadoResultadosExcel(metrics: MonthlyMetrics, monthLabel: string) {
  const data = [
    { 'Concepto': 'Ingresos Brutos (Facturado)', 'Monto': metrics.ingresosBrutos },
    { 'Concepto': '(-) IVA Débito Fiscal', 'Monto': -metrics.ivaDebito },
    { 'Concepto': 'Ingresos Netos', 'Monto': metrics.ingresosNetos },
    { 'Concepto': '', 'Monto': null },
    { 'Concepto': '(-) Costos Directos (Neto)', 'Monto': -metrics.costosDirectosNeto },
    { 'Concepto': 'MARGEN BRUTO', 'Monto': metrics.margenBruto },
    { 'Concepto': 'Margen Bruto %', 'Monto': `${metrics.margenBrutoPorcentaje.toFixed(1)}%` },
    { 'Concepto': '', 'Monto': null },
    { 'Concepto': '(-) Gastos Operacionales (Neto)', 'Monto': -metrics.gastosOperacionalesNeto },
    { 'Concepto': 'UTILIDAD NETA', 'Monto': metrics.utilidadNeta },
    { 'Concepto': '', 'Monto': null },
    { 'Concepto': 'Flujo de Caja Real (Pagado)', 'Monto': metrics.flujoCajaReal },
    { 'Concepto': 'Trabajos Realizados', 'Monto': metrics.numeroTrabajosRealizados },
    { 'Concepto': '', 'Monto': null },
    { 'Concepto': 'IVA Débito', 'Monto': metrics.ivaDebito },
    { 'Concepto': 'IVA Crédito', 'Monto': metrics.ivaCredito },
    { 'Concepto': 'IVA A PAGAR AL SII', 'Monto': metrics.ivaAPagar },
  ]

  const ws = XLSX.utils.json_to_sheet(data)
  ws['!cols'] = [{ wch: 35 }, { wch: 18 }]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Estado Resultados')
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
  downloadBlob(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `Estado_Resultados_${monthLabel}.xlsx`)
}

// ============================================================
// DEUDAS
// ============================================================

interface DebtExport {
  name: string
  initialBalance: number
  currentBalance: number
  monthlyRate: number
  basePayment: number
  totalPayments: number | null
  startDate: Date | string
  status: string
  payments: {
    month: string
    amountPaid: number
    interestCharged: number
    principalPaid: number
    balanceAfter: number
  }[]
}

const DEBT_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Activa',
  PAID: 'Pagada',
  DELINQUENT: 'Morosa',
  RESTRUCTURED: 'Reestructurada',
}

export function exportDebtsExcel(debts: DebtExport[]) {
  const wb = XLSX.utils.book_new()

  // Sheet 1: Resumen de deudas
  const summaryData = debts.map(d => ({
    'Nombre': d.name,
    'Saldo Inicial': d.initialBalance,
    'Saldo Actual': d.currentBalance,
    'Amortizado': d.initialBalance - d.currentBalance,
    'Tasa Mensual': `${(d.monthlyRate * 100).toFixed(1)}%`,
    'Cuota Base': d.basePayment,
    'Cuotas Totales': d.totalPayments ?? 'Rotativo',
    'Pagos Realizados': d.payments.length,
    'Inicio': fmtDate(d.startDate),
    'Estado': DEBT_STATUS_LABELS[d.status] || d.status,
  }))

  const ws1 = XLSX.utils.json_to_sheet(summaryData)
  ws1['!cols'] = [
    { wch: 25 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
    { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 14 },
    { wch: 12 }, { wch: 14 },
  ]
  XLSX.utils.book_append_sheet(wb, ws1, 'Resumen Deudas')

  // Sheet 2: Detalle de pagos
  const paymentRows: any[] = []
  for (const d of debts) {
    for (const p of d.payments) {
      paymentRows.push({
        'Deuda': d.name,
        'Mes': p.month,
        'Monto Pagado': p.amountPaid,
        'Interés': p.interestCharged,
        'Capital': p.principalPaid,
        'Saldo Después': p.balanceAfter,
      })
    }
  }
  if (paymentRows.length > 0) {
    const ws2 = XLSX.utils.json_to_sheet(paymentRows)
    ws2['!cols'] = [
      { wch: 25 }, { wch: 10 }, { wch: 14 },
      { wch: 14 }, { wch: 14 }, { wch: 14 },
    ]
    XLSX.utils.book_append_sheet(wb, ws2, 'Detalle Pagos')
  }

  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
  downloadBlob(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    'Deudas_Veltrium.xlsx')
}

export function exportDebtsPDF(debts: DebtExport[]) {
  const doc = createPDF('Control de Deudas', `Generado: ${fmtDate(new Date())} | Veltrium Tech SpA`)

  // Summary table
  const summaryRows = debts.map(d => [
    d.name,
    fmtCLP(d.initialBalance),
    fmtCLP(d.currentBalance),
    fmtCLP(d.initialBalance - d.currentBalance),
    `${(d.monthlyRate * 100).toFixed(1)}%`,
    fmtCLP(d.basePayment),
    DEBT_STATUS_LABELS[d.status] || d.status,
  ])

  autoTable(doc, {
    startY: 36,
    head: [['Deuda', 'Saldo Inicial', 'Saldo Actual', 'Amortizado', 'Tasa', 'Cuota', 'Estado']],
    body: summaryRows,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [26, 50, 74], textColor: [255, 255, 255], fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 249, 250] },
    columnStyles: {
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' },
      5: { halign: 'right' },
    },
  })

  // Totals
  const totalCurrent = debts.reduce((s, d) => s + d.currentBalance, 0)
  const totalAmortized = debts.reduce((s, d) => s + (d.initialBalance - d.currentBalance), 0)
  const finalY = (doc as any).lastAutoTable?.finalY || 200
  doc.setFontSize(9)
  doc.setTextColor(60, 60, 60)
  doc.text(`Deuda Vigente: ${fmtCLP(totalCurrent)}    |    Total Amortizado: ${fmtCLP(totalAmortized)}`, 14, finalY + 8)

  doc.save('Deudas_Veltrium.pdf')
}
