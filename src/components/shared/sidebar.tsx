'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ReceiptText,
  CalendarDays,
  CreditCard,
  History,
  Landmark,
  LineChart,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const routes = [
  { href: '/dashboard', label: 'Estado Resultados', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transacciones', icon: ReceiptText },
  { href: '/simulator', label: 'Simulador', icon: LineChart },
  { href: '/history', label: 'Historial', icon: History },
  { href: '/clients', label: 'Clientes', icon: CalendarDays },
  { href: '/balance', label: 'Balance General', icon: Landmark },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col w-64 h-full bg-primary text-primary-foreground border-r border-sidebar-border hidden md:flex">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-accent tracking-tighter">Veltrium<span className="text-white">Tech</span></h1>
        <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest text-[#AB8755]">ERP Financiero</p>
      </div>
      <nav className="flex-1 px-4 mt-6 space-y-2 relative">
        {routes.map((route) => {
          const isActive = pathname.startsWith(route.href)
          const Icon = route.icon

          return (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium group",
                isActive 
                  ? "bg-accent text-accent-foreground shadow-sm" 
                  : "text-primary-foreground/80 hover:bg-secondary hover:text-white"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive ? "text-accent-foreground" : "text-[#D4A84B] group-hover:text-accent")} />
              {route.label}
            </Link>
          )
        })}
      </nav>
      <div className="p-4 border-t border-[#AB8755]/20 bg-secondary/50">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-bold">
            A
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-white">Admin System</span>
            <span className="text-xs text-[#AB8755]">admin@veltriumgroup.cl</span>
          </div>
        </div>
      </div>
    </div>
  )
}
