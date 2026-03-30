"use client"

import { ExportButtons } from "@/components/shared/export-buttons"
import { exportHistoryExcel, exportHistoryPDF } from "@/lib/exports"

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

export function HistoryExport({ history }: { history: HistoryMonth[] }) {
  return (
    <ExportButtons
      onExcel={() => exportHistoryExcel(history)}
      onPDF={() => exportHistoryPDF(history)}
    />
  )
}
