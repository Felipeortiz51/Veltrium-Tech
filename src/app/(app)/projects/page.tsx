import prisma from '@/lib/prisma'
import { ProjectsClient } from '@/components/projects/projects-client'

export const dynamic = 'force-dynamic'

export default async function ProjectsPage() {
  const company = await prisma.company.findFirst()
  
  if (!company) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground w-full text-center">No hay empresa configurada.</p>
      </div>
    )
  }

  const projects = await prisma.project.findMany({
    where: { companyId: company.id },
    include: {
      transactions: {
        where: { isVoided: false }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Format projected data to frontend P&L
  const enrichedProjects = projects.map(p => {
    let income = 0;
    let expense = 0;
    p.transactions.forEach(t => {
      if(t.type === 'INCOME') income += t.netAmount; // B2B usually tracks P&L in Net
      if(t.type === 'EXPENSE') expense += t.netAmount;
    });

    return {
      ...p,
      totalIncome: income,
      totalExpense: expense,
      margin: income - expense,
      marginPercent: income > 0 ? ((income - expense) / income) * 100 : 0
    }
  })

  return (
    <ProjectsClient data={enrichedProjects} companyId={company.id} />
  )
}
