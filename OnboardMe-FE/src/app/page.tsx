"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/auth/authContext"
import { hasPermission, PermissionEnum } from "@/auth/permissions"
import { getCoursesByUser } from "@/app/services/curso.service"
import type { Course } from "./models/Course"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card"
import { CourseCalendar } from "./components/course-calendar"
import { Calendar } from "lucide-react"
import { UserAvatar } from "./components/UserAvatar"

export default function HomePage() {
  const { user } = useAuth()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [favoriteCourses, setFavoriteCourses] = useState<Course[]>([])

  useEffect(() => {
    const finished = localStorage.getItem("course_finished")
    console.log("🔍 Valor de course_finished en HomePage:", finished)
    if (finished === "true") {
      toast.success("🎉 ¡Curso finalizado con éxito!")
      setTimeout(() => {
        localStorage.removeItem("course_finished")
      }, 1000)
    }
  }, [])

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user?.id) return
      try {
        const courses = await getCoursesByUser(user.id)
        const favorites = courses.filter((course) => {
          const enrollment = course.enrollments?.find((e) => e.idUser === user.id)
          return enrollment?.favorite
        })
        setFavoriteCourses(favorites)
      } catch (error) {
        console.error("Error fetching favorite courses", error)
      }
    }
    fetchFavorites()
  }, [user])

  if (!user) return null

  const getInitials = (firstName: string, lastName?: string) => {
    return `${firstName.charAt(0)}${lastName?.charAt(0) || ""}`.toUpperCase()
  }

  const colorClasses = [
    "from-blue-500 to-indigo-600",
    "from-pink-500 to-rose-600",
    "from-green-500 to-emerald-600",
    "from-purple-500 to-violet-600",
    "from-orange-500 to-amber-600",
    "from-cyan-500 to-teal-600",
    "from-yellow-500 to-orange-600",
  ];

  function getColorIndex(name: string) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = (hash + name.charCodeAt(i)) % 2147483647;
    }
    return hash % colorClasses.length;
  }

  function getColorClass(firstName?: string, lastName?: string) {
    const key = `${firstName ?? ""}${lastName ?? ""}`.trim().toUpperCase();
    return colorClasses[getColorIndex(key)];
  }

  // Helper component for a simple progress bar
  const ProgressBar = ({ value, className = "" }: { value: number; className?: string }) => (
    <div className={`bg-gray-200 rounded-full h-2 ${className}`}>
      <div
        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      ></div>
    </div>
  )

  // Helper component for a stat card
  const StatCard = ({
    title,
    value,
    symbol,
    bgColor,
    symbolColor,
  }: {
    title: string
    value: string | number
    symbol: string
    bgColor: string
    symbolColor: string
  }) => (
    <div className="bg-white/80 backdrop-blur rounded-xl shadow-lg border-0 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`h-12 w-12 ${bgColor} rounded-lg flex items-center justify-center`}>
          <span className={`text-2xl ${symbolColor}`}>{symbol}</span>
        </div>
      </div>
    </div>
  )

  // HR Resource Card Component
  const HRResourceCard = ({
    title,
    icon,
    href,
    description,
  }: {
    title: string
    icon: string
    href: string
    description: string
  }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group bg-white/80 backdrop-blur rounded-xl shadow-lg border-0 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
    >
      <div className="flex items-start space-x-4">
        <div className="h-12 w-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center group-hover:from-blue-200 group-hover:to-indigo-200 transition-all duration-300">
          <span className="text-2xl">{icon}</span>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
            {title}
          </h3>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="text-blue-500">→</span>
        </div>
      </div>
    </a>
  )

  return (
    <main>
      {/*       <RRHHModal /> */}
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative max-w-7xl mx-auto px-6 py-12">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <UserAvatar firstName={user.firstName} lastName={user.lastName} size="sm" />
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2">¡Bienvenido de vuelta, {user.firstName}! 👋</h1>
                  <p className="text-blue-100 text-lg">Continúa tu viaje de aprendizaje en OnboardMe</p>
                </div>
              </div>
              <div className="hidden md:flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{favoriteCourses.length}</div>
                  <div className="text-blue-100 text-sm">Favoritos</div>
                </div>
                <div className="w-px h-12 bg-white/20"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">85%</div>
                  <div className="text-blue-100 text-sm">Progreso</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 -mt-6">
            <StatCard title="Cursos Activos" value="12" symbol="📚" bgColor="bg-blue-100" symbolColor="text-blue-600" />
            <StatCard
              title="Horas Completadas"
              value="47"
              symbol="⏱️"
              bgColor="bg-green-100"
              symbolColor="text-green-600"
            />
            <StatCard
              title="Certificados"
              value="8"
              symbol="🏆"
              bgColor="bg-yellow-100"
              symbolColor="text-yellow-600"
            />
            <StatCard
              title="Racha Actual"
              value="15 días"
              symbol="🎯"
              bgColor="bg-orange-100"
              symbolColor="text-orange-600"
            />
          </div>

          {/* HR Resources Section - Moved up with better spacing */}
          <div className="bg-white/80 backdrop-blur rounded-xl shadow-lg border-0 mb-12">
            <div className="p-6 pb-4">
              <div className="flex items-center space-x-2 mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xl text-blue-600">🏢</span>
                  <h2 className="text-xl font-semibold text-gray-900">Recursos de RRHH</h2>
                </div>
              </div>
              <p className="text-gray-600 text-sm">Gestiona tu información personal y accede a recursos importantes</p>
            </div>
            <div className="p-6 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <HRResourceCard
                  title="Firmar Recibo"
                  icon="📄"
                  href="/onboarding#recibo"
                  description="Firma tu recibo de sueldo digital"
                />
                <HRResourceCard
                  title="Obra Social"
                  icon="🩺"
                  href="/onboarding#obra-social"
                  description="Gestiona tu cobertura médica"
                />
                <HRResourceCard
                  title="Correo Corporativo"
                  icon="📧"
                  href="/onboarding#correo"
                  description="Configura tu email empresarial"
                />
                <HRResourceCard
                  title="Acceso VPN"
                  icon="🔐"
                  href="/onboarding#vpn"
                  description="Conecta a la red corporativa"
                />
                <HRResourceCard
                  title="Tu Buddy"
                  icon="🧑‍🤝‍🧑"
                  href="/onboarding#buddy"
                  description="Conoce a tu compañero guía"
                />
                <HRResourceCard
                  title="Beneficios"
                  icon="🎁"
                  href="/onboarding#beneficios"
                  description="Descubre tus beneficios"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-8">
              {/* Favorite Courses */}
              <div className="bg-white rounded-xl shadow-lg border-0">
                <div className="p-6 pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl text-yellow-500">⭐</span>
                      <h2 className="text-xl font-semibold text-gray-900">Cursos Favoritos</h2>
                    </div>
                    <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      {favoriteCourses.length} cursos
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">Tus cursos marcados como favoritos para acceso rápido</p>
                </div>
                <div className="p-6 pt-0">
                  {favoriteCourses.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-4xl text-gray-400">⭐</span>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No hay cursos favoritos</h3>
                      <p className="text-gray-500 mb-4">Marca cursos como favoritos para verlos aquí</p>
                      <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        <span className="mr-2">📚</span>
                        Explorar Cursos
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {favoriteCourses.map((course) => (
                        <div
                          key={course.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                              <span className="text-2xl text-blue-600">📚</span>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{course.title}</h4>
                              <p className="text-sm text-gray-500">Progreso: 75%</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <ProgressBar value={75} className="w-20" />
                            <button className="p-1 hover:bg-gray-200 rounded">
                              <span className="text-gray-400">›</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Metrics Section */}
              {hasPermission(user.role.name, PermissionEnum.viewMetrics) && (
                <div className="bg-white rounded-xl shadow-lg border-0">
                  <div className="p-6 pb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-xl text-green-600">📈</span>
                      <h2 className="text-xl font-semibold text-gray-900">Métricas de Rendimiento</h2>
                    </div>
                    <p className="text-gray-600 text-sm">Análisis detallado de tu progreso y participación</p>
                  </div>
                  <div className="p-6 pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-700">Cursos Completados</span>
                            <span className="text-sm text-gray-500">8/12</span>
                          </div>
                          <ProgressBar value={67} />
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-700">Tiempo Promedio por Curso</span>
                            <span className="text-sm text-gray-500">3.2h</span>
                          </div>
                          <ProgressBar value={85} />
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-700">Participación en Capacitaciones</span>
                            <span className="text-sm text-gray-500">92%</span>
                          </div>
                          <ProgressBar value={92} />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-lg text-blue-600">📊</span>
                            <span className="text-sm font-medium text-blue-900">Actividad Semanal</span>
                          </div>
                          <p className="text-2xl font-bold text-blue-900">12.5h</p>
                          <p className="text-xs text-blue-700">+2.3h vs semana anterior</p>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-lg text-green-600">👥</span>
                            <span className="text-sm font-medium text-green-900">Ranking</span>
                          </div>
                          <p className="text-2xl font-bold text-green-900">#3</p>
                          <p className="text-xs text-green-700">Top 5% en tu departamento</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {/* Calendar Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5" />
                    <span>Calendario de Cursos</span>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">Fechas de expiración de tus cursos</p>
                </CardHeader>
                <CardContent>
                  <CourseCalendar />
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-lg border-0">
                <div className="p-6 pb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl text-purple-600">✨</span>
                    <h2 className="text-xl font-semibold text-gray-900">Acciones Rápidas</h2>
                  </div>
                </div>
                <div className="p-6 pt-0 space-y-3">
                  <button className="w-full flex items-center justify-start px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                    <span className="mr-3">📚</span>
                    Continuar Último Curso
                  </button>
                  <button className="w-full flex items-center justify-start px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                    <span className="mr-3">🗓️</span>
                    Ver Próximas Actividades
                  </button>
                  <button className="w-full flex items-center justify-start px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                    <span className="mr-3">🏆</span>
                    Mis Certificados
                  </button>
                  <button className="w-full flex items-center justify-start px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                    <span className="mr-3">📈</span>
                    Ver Progreso Detallado
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <ToastContainer position="top-center" autoClose={3000} />
      </div>
    </main>
  )
}