"use client";

import { useAuth } from "@/auth/authContext";
import { hasPermission, PermissionEnum } from "@/auth/permissions";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import { Notification } from "@/app/models/Notification";
import {
  getNotificationsByUser,
  markNotificationAsRead,
} from "@/app/services/notification.service";
import { BellIcon, ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import { UserAvatar } from "./UserAvatar";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout: authLogout } = useAuth();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifications = useCallback(async () => {
    if (!user?.id) {
      setNotifications([]);
      return;
    }
    try {
      const data = await getNotificationsByUser(user.id);
      setNotifications(data);
    } catch (error) {
      console.error("Error cargando notificaciones:", error);
    }
  }, [user]);

  useEffect(() => {
    loadNotifications();

    const interval = setInterval(() => {
      loadNotifications();
    }, 30000); 

    return () => clearInterval(interval); // limpia el intervalo al desmontar
  }, [loadNotifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.seen).length;

  const allTabs = [
    { label: "Inicio", permission: PermissionEnum.viewDashboard },
    { label: "Cursos", permission: PermissionEnum.viewCourses },
    { label: "Empleados", permission: PermissionEnum.editUsers },
    { label: "Metricas", permission: PermissionEnum.viewMetrics },
    { label: "Asignación de Cursos", permission: PermissionEnum.assignCourses },
  ];

  if (!user) return null;

  const items = allTabs
    .filter((tab) => hasPermission(user.role.name, tab.permission))
    .map((item) => {
      const path = getPath(item.label);
      return {
        label: item.label,
        path: path,
        isActive: pathname === path,
      };
    });

  function getPath(label: string) {
    switch (label) {
      case "Inicio":
        return "/landing";
      case "Cursos":
        return "/cursos";
      case "Empleados":
        return "/empleados";
      case "Metricas":
        return "/metricas";
      case "Asignación de Cursos":
        return "/cursos/asignar";
      default:
        return `/${label.toLowerCase().replace(/\s+/g, "-")}`;
    }
  }

  const handleNotificationClick = async (n: Notification) => {
    if (!n.seen) {
      try {
        await markNotificationAsRead(n.id);
        setNotifications((prev) =>
          prev.map((notif) => (notif.id === n.id ? { ...notif, seen: true } : notif))
        );
      } catch (error) {
        console.error("Error marcando notificación como leída", error);
      }
    }
    setSelectedNotification(n);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-blue-50/80 backdrop-blur-md shadow-sm border-b border-blue-100">
        <div className="container mx-auto h-16 flex items-center justify-between px-6">
          {/* Logo / Start Section */}
          <div className="flex items-center gap-4">
            <span
              className="text-2xl font-extrabold leading-none tracking-tight"
              style={{ color: "#2A659C" }}
            >
              OnboardMe
            </span>
            <div className="hidden md:block h-6 w-px bg-gray-300" />
            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center space-x-1">
              {items.map((item) => (
                <button
                  key={item.label}
                  onClick={() => router.push(item.path)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors
                    ${item.isActive
                      ? "bg-blue-400 text-white shadow-md"
                      : "text-gray-700 hover:bg-blue-100 hover:text-blue-700"
                    }`}
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
              <div className="absolute right-40 top-14 w-80 bg-white shadow-lg rounded-lg border border-gray-200 z-50">
                <div className="p-3 border-b border-gray-200 font-bold text-gray-700">
                  Notificaciones
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3 border-b border-gray-100 cursor-pointer ${!n.seen ? "bg-blue-200" : "bg-white"}`}
                        onClick={() => handleNotificationClick(n)}
                      >
                        <div className="text-sm font-semibold text-blue-600">
                          {n.title}
                        </div>
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
              <UserAvatar
                firstName={user.firstName}
                lastName={user.lastName}
                size="sm"
              />
              <span className="hidden sm:block text-gray-800 font-medium">
                {user.firstName}
              </span>
            </div>
            <div
              className="flex items-center gap-2 cursor-pointer p-1 rounded-full hover:bg-blue-100 transition-colors"
              onClick={() => authLogout(router)}
              title="Cerrar sesión"
            >
              <ArrowRightOnRectangleIcon className="h-6 w-6 text-gray-700" />
            </div>
          </div>
        </div>
      </header>

      {selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-11/12 max-w-3xl max-h-[80vh] p-8 overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-blue-700">{selectedNotification.title}</h2>
              <button
                className="text-gray-500 text-xl font-bold rounded-full p-1 cursor-pointer transition hover:bg-gray-200 hover:text-gray-700 hover:scale-105 active:scale-95"
                onClick={() => setSelectedNotification(null)}
              >
                ✕
              </button>
            </div>
            <div className="text-gray-700 whitespace-pre-line text-base leading-relaxed">
              {selectedNotification.message.split("\n").map((line, idx) => (
                <p
                  key={idx}
                  className={
                    line.toLowerCase().includes("error")
                      ? "text-red-600"
                      : line.toLowerCase().includes("éxito")
                      ? "text-green-600"
                      : ""
                  }
                >
                  {line}
                </p>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                onClick={() => setSelectedNotification(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
