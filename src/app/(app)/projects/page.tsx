import prisma from '@/lib/prisma'
import { ProjectsClient } from '@/components/projects/projects-client'
import { getAuthSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function ProjectsPage() {
  const session = await getAuthSession()

  const projects = await prisma.project.findMany({
    where: { companyId: session.companyId },
    include: {
      transactions: {
        where: { isVoided: false }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  const enrichedProjects = projects.map(p => {
    let income = 0;
    let expense = 0;
    p.transactions.forEach(t => {
      if(t.type === 'INCOME') income += t.netAmount;
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
    <ProjectsClient data={enrichedProjects} />
  )
}
