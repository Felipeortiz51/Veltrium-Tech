import { Sidebar } from '@/components/shared/sidebar'
import { Toaster } from '@/components/ui/sonner'
import { getAuthSession } from '@/lib/auth'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getAuthSession()

  return (
    <div className="flex bg-background min-h-screen">
      <Sidebar user={{ name: session.name, email: session.email, role: session.role }} />
      <div className="flex-1 flex flex-col min-w-0 bg-[#F8F9FA]">
        <main className="flex-1 p-4 md:p-8 md:pt-6">
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  )
}
