import prisma from "@/lib/prisma"
import { ClientClient } from "@/components/clients/client-client"
import { Users2 } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function ClientsPage() {
  const company = await prisma.company.findFirst()
  if (!company) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-muted-foreground">
        No hay empresa configurada.
      </div>
    )
  }

  const clients = await prisma.client.findMany({
    where: { companyId: company.id, isActive: true },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { transactions: true } }
    }
  })

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-primary flex items-center">
          <Users2 className="mr-3 h-8 w-8 text-muted-foreground" />
          Directorio de Clientes
        </h2>
        <p className="text-muted-foreground mt-1">Gestión corporativa de cartera de clientes (CRM Veltrium Tech).</p>
      </div>
      
      <ClientClient clients={clients} />
    </div>
  )
}
