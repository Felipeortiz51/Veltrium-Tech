"use client"

import { ExportButtons } from "@/components/shared/export-buttons"
import { exportEstadoResultadosExcel, exportEstadoResultadosPDF } from "@/lib/exports"

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

export function DashboardExport({ metrics, monthLabel }: { metrics: MonthlyMetrics; monthLabel: string }) {
  return (
    <ExportButtons
      onExcel={() => exportEstadoResultadosExcel(metrics, monthLabel)}
      onPDF={() => exportEstadoResultadosPDF(metrics, monthLabel)}
    />
  )
}
