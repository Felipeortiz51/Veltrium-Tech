"use client"

import { Button } from "@/components/ui/button"
import { Download, FileSpreadsheet } from "lucide-react"

export function ExportButtons({ onExcel, onPDF }: { onExcel: () => void; onPDF: () => void }) {
  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" className="h-8" onClick={onExcel}>
        <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" /> Excel
      </Button>
      <Button variant="outline" size="sm" className="h-8" onClick={onPDF}>
        <Download className="mr-1.5 h-3.5 w-3.5" /> PDF
      </Button>
    </div>
  )
}
