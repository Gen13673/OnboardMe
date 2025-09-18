"use client"

import { useAuth } from "@/auth/authContext"
import { hasPermission, PermissionEnum } from "@/auth/permissions"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import { Notification } from "@/app/models/Notification"
import { getNotificationsByUser, markNotificationAsRead } from "@/app/services/notification.service"
import { BellIcon } from "@heroicons/react/24/outline"
import { UserAvatar } from "./UserAvatar"

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (user?.id) {
      getNotificationsByUser(user.id).then((data) => setNotifications(data))
    }
  }, [user])

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const unreadCount = notifications.filter((n) => !n.seen).length

  const allTabs = [
    { label: "Inicio", permission: PermissionEnum.viewDashboard },
    { label: "Cursos", permission: PermissionEnum.viewCourses },
    { label: "Empleados", permission: PermissionEnum.editUsers },
    { label: "Metricas", permission: PermissionEnum.viewMetrics },
    { label: "Asignación de Cursos", permission: PermissionEnum.assignCourses },
  ]

  if (!user) return null

  const items = allTabs
    .filter((tab) => hasPermission(user.role.name, tab.permission))
    .map((item) => {
      const path = getPath(item.label)
      return {
        label: item.label,
        path: path,
        isActive: pathname === path,
      }
    })

  function getPath(label: string) {
    switch (label) {
      case "Inicio": return "/"
      case "Cursos": return "/cursos"
      case "Empleados": return "/empleados"
      case "Metricas": return "/metricas"
      case "Asignación de Cursos": return "/cursos/asignar"
      default:
        return `/${label.toLowerCase().replace(/\s+/g, "-")}`
    }
  }




  return (
    <header className="sticky top-0 z-40 w-full bg-blue-50/80 backdrop-blur-md shadow-sm border-b border-blue-100">
      <div className="container mx-auto h-16 flex items-center justify-between px-6">
        {/* Logo / Start Section */}
        <div className="flex items-center gap-4">
          <span className="text-2xl font-extrabold leading-none tracking-tight" style={{ color: "#2A659C" }}>
            OnboardMe
          </span>
          <div className="hidden md:block h-6 w-px bg-gray-300" />
          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1">
            {items.map((item) => (
              <button
                key={item.label}
                onClick={() => router.push(item.path)}
                className={`
                  px-4 py-2 rounded-md text-sm font-medium transition-colors
                  ${item.isActive
                    ? "bg-blue-400 text-white shadow-md"
                    : "text-gray-700 hover:bg-blue-100 hover:text-blue-700"
                  }
                `}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Notifications + User */}
        <div className="flex items-center gap-4" ref={dropdownRef}>
          {/* Bell Icon */}
          <div
            className="relative cursor-pointer p-2 rounded-full hover:bg-blue-100 transition-colors"
            onClick={() => setOpen(!open)}
          >
            <BellIcon className="h-6 w-6 text-gray-700" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>

          {/* Dropdown Notificaciones */}
          {open && (
            <div className="absolute right-16 top-14 w-80 bg-white shadow-lg rounded-lg border border-gray-200 z-50">
              <div className="p-3 border-b border-gray-200 font-bold text-gray-700">
                Notificaciones
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 border-b border-gray-100 cursor-pointer ${!n.seen ? "bg-blue-200" : "bg-white"
                        }`}
                      onMouseEnter={async () => {
                        if (!n.seen) {
                          try {
                            await markNotificationAsRead(n.id)
                            setNotifications((prev) =>
                              prev.map((notif) =>
                                notif.id === n.id ? { ...notif, seen: true } : notif
                              )
                            )
                          } catch (error) {
                            console.error("Error marcando notificación como leída", error)
                          }
                        }
                      }}
                    >
                      <div className="text-sm font-semibold text-blue-600">{n.title}</div>
                      <div className="text-xs text-gray-600">{n.message}</div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-sm text-gray-500 text-center">
                    No tienes notificaciones
                  </div>
                )}
              </div>
            </div>
          )}

          {/* User Avatar */}
          <div
            className="flex items-center gap-3 cursor-pointer p-1 rounded-full hover:bg-blue-100 transition-colors"
            onClick={() => router.push("/perfil")}
          >
            <UserAvatar firstName={user.firstName} lastName={user.lastName} size="sm" />
            <span className="hidden sm:block text-gray-800 font-medium">{user.firstName}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
