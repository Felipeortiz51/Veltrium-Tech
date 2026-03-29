import { Sidebar } from '@/components/shared/sidebar'
import { Toaster } from '@/components/ui/sonner'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex bg-background min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-[#F8F9FA]">
        <main className="flex-1 p-4 md:p-8 md:pt-6">
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  )
}
