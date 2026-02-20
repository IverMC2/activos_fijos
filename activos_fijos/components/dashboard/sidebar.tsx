"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Package,
  TrendingDown,
  Wrench,
  MapPin,
  Users,
  ArrowLeftRight,
  Trash2,
  FileBarChart,
  LogOut,
  Building2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "CONTABILIDAD", "CONSULTA"] },
  { href: "/dashboard/activos", label: "Activos", icon: Package, roles: ["ADMIN", "CONTABILIDAD", "CONSULTA"] },
  { href: "/dashboard/depreciacion", label: "Depreciación", icon: TrendingDown, roles: ["ADMIN", "CONTABILIDAD"] },
  { href: "/dashboard/mantenimiento", label: "Mantenimiento", icon: Wrench, roles: ["ADMIN", "CONTABILIDAD"] },
  { href: "/dashboard/ubicaciones", label: "Ubicaciones", icon: MapPin, roles: ["ADMIN"] },
  { href: "/dashboard/responsables", label: "Responsables", icon: Users, roles: ["ADMIN"] },
  { href: "/dashboard/traslados", label: "Traslados", icon: ArrowLeftRight, roles: ["ADMIN", "CONTABILIDAD"] },
  { href: "/dashboard/bajas", label: "Bajas", icon: Trash2, roles: ["ADMIN", "CONTABILIDAD"] },
  { href: "/dashboard/reportes", label: "Reportes", icon: FileBarChart, roles: ["ADMIN", "CONTABILIDAD"] },
]

interface SidebarProps {
  rol: string
  nombre: string
}

export function Sidebar({ rol, nombre }: SidebarProps) {
  const pathname = usePathname()

  const itemsVisibles = navItems.filter((item) =>
    item.roles.includes(rol)
  )

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <Building2 className="h-8 w-8 text-blue-400" />
          <div>
            <h2 className="font-bold text-sm">Activos Fijos</h2>
            <p className="text-xs text-slate-400">Sistema de Control</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {itemsVisibles.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href))

          return (
            <Link key={item.href} href={item.href}>
              <span className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                active
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}>
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* Footer usuario */}
      <div className="p-4 border-t border-slate-700">
        <div className="mb-3">
          <p className="text-sm font-medium truncate">{nombre}</p>
          <Badge variant="secondary" className="text-xs mt-1">
            {rol}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Cerrar sesión
        </Button>
      </div>
    </aside>
  )
}