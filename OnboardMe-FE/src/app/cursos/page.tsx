"use client"

import { useEffect, useState } from "react"
import type { Course } from "../models/Course"
import { getCoursesByUser, favCourse, getCourseProgress } from "../services/curso.service"
import { useAuth } from "@/auth/authContext"
import { useRouter } from "next/navigation"
import { toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { toZonedTime, format } from "date-fns-tz"
import { ExternalLink } from "lucide-react"

// ---------- helpers disponibles para CourseCard ----------
const formatDate = (dateString: string) => {
  const timeZone = "America/Argentina/Buenos_Aires"
  const zonedDate = toZonedTime(dateString, timeZone)
  return format(zonedDate, "dd/MM/yyyy", { timeZone })
}

const getInitials = (firstName: string, lastName: string) => {
  return `${firstName?.charAt(0) ?? ""}${lastName?.charAt(0) ?? ""}`.toUpperCase()
}

// ---------- Tarjeta aislada con estado local ----------
function CourseCard({
  course,
  progress,
  isFavorite,
  onToggleFavorite,
}: {
  course: Course
  progress: number
  isFavorite: boolean
  onToggleFavorite: (courseId: number) => void
}) {
  const [open, setOpen] = useState(false)

  // calcula siguiente sección para el botón "continuar/revisar"
  const getNextSectionId = () => {
    const total = course.sections?.length ?? 0
    if (!total) return null
    const completed = Math.floor((progress / 100) * total)
    if (progress === 100) return course.sections![total - 1].id
    if (completed < total) return course.sections![completed].id
    return course.sections![0].id
  }

  return (
    <div
      className="relative bg-white/80 backdrop-blur rounded-xl shadow-md hover:shadow-lg transition-all duration-200 border-0 overflow-visible"
    >
      {/* Header */}
      <div className="p-6 pb-4 relative">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-gray-900 line-clamp-1">{course.title}</h3>
              <span
                className={`
                  inline-block px-2 py-0.5 text-xs font-semibold rounded-full
                  ${
                    course.area === "IT" ? "bg-blue-100 text-blue-700" :
                    course.area === "FINANZAS" ? "bg-green-100 text-green-700" :
                    course.area === "SEGURIDAD" ? "bg-red-100 text-red-700" :
                    course.area === "RRHH" ? "bg-purple-100 text-purple-700" :
                    course.area === "IA" ? "bg-yellow-100 text-yellow-700" :
                    course.area === "ADMINISTRATIVO" ? "bg-gray-100 text-gray-700" :
                    course.area === "GERENCIAL" ? "bg-indigo-100 text-indigo-700" :
                    course.area === "SOPORTE" ? "bg-pink-100 text-pink-700" :
                    "bg-gray-200 text-gray-600"
                  }
                `}
              >
                {course.area}
              </span>

              {/* Favorito */}
              <button
                onClick={() => onToggleFavorite(course.id)}
                className="p-1 h-8 w-8 rounded hover:bg-gray-100 transition-colors"
                aria-label={isFavorite ? "Quitar de favoritos" : "Marcar como favorito"}
              >
                <svg
                  className={`h-4 w-4 transition-colors ${isFavorite ? "fill-yellow-400 text-yellow-400" : "text-gray-400 hover:text-yellow-400"}`}
                  fill={isFavorite ? "currentColor" : "none"}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-.118l-3.976-2.888c-.784-.57-.38-1.81.588-.588h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
              </button>
            </div>

            <p className="text-gray-600 line-clamp-2">{course.description}</p>
          </div>
        </div>

        {/* Abrir curso en nueva pestaña (continuar / revisar) */}
        {course.sections && course.sections.length > 0 && (
          <button
            onClick={() => {
              const sectionId = getNextSectionId()
              if (sectionId) {
                window.open(`/cursos/${course.id}?seccion=${sectionId}`, "_blank", "noopener,noreferrer")
              }
            }}
            className="absolute top-4 right-4 p-2 bg-transparent rounded-full transition-transform duration-150 transform hover:bg-blue-50 hover:scale-105 hover:shadow-sm"
            title={progress === 100 ? "Revisar curso" : progress === 0 ? "Empezar curso" : "Continuar curso"}
          >
            <ExternalLink className="w-5 h-5 text-blue-600 transition-colors duration-150 hover:text-blue-700" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="px-6 pb-6 space-y-4">
        {/* Course Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
              {getInitials(course.createdBy.firstName, course.createdBy.lastName)}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {course.createdBy.firstName} {course.createdBy.lastName}
              </p>
              <p className="text-xs text-gray-500">Instructor</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a2 2 0 012 2v1a1 1 0 01-1 1H3a1 1 0 01-1-1V9a2 2 0 012-2h3z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 13h20v6a2 2 0 01-2 2H4a2 2 0 01-2-2v-6z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-gray-900">{formatDate(course.expiryDate)}</p>
              <p className="text-xs text-gray-500">Fecha de vencimiento</p>
            </div>
          </div>
        </div>

        {/* Progreso + botón abrir secciones */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 w-full">
            <div className="w-full">
              <div className="text-xs text-gray-600 mb-1">Progreso: {progress}%</div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          {course.sections && course.sections.length > 0 && (
            <button
              onClick={() => setOpen(v => !v)}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg
                         text-gray-600 hover:text-gray-800 hover:bg-gray-50 border border-gray-200 hover:border-gray-300
                         ml-3 whitespace-nowrap"
            >
              <svg
                className={`h-3 w-3 transition-transform duration-200 ${open ? "rotate-180" : ""} shrink-0`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              <span>{open ? "Ocultar" : "Ver"} Secciones</span>
            </button>
          )}
        </div>

        {/* Secciones expandibles */}
        {open && course.sections && course.sections.length > 0 && (
          <>
            <div className="border-t border-gray-100 my-3" />
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="font-medium">Secciones del curso</span>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {course.sections.map((section, index) => (
                  <div
                    key={`${course.id}-${section.id}`}
                    className="group bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors duration-150"
                  >
                    <div className="p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className={`text-xs font-semibold rounded-full w-6 h-6 flex items-center justify-center ${
                                // badge de estado
                                index + 1 <= (progress / 100) * (course.sections?.length ?? 0)
                                  ? "bg-blue-400 text-gray-700"
                                  : "bg-gray-300 text-gray-700"
                              }`}
                            >
                              {index + 1}
                            </span>
                            <div className="flex items-center justify-between">
                              <h5 className="font-medium text-gray-800 text-sm leading-tight">
                                {section.title}
                              </h5>
                              <button
                                onClick={() => window.open(`/cursos/${course.id}?seccion=${section.id}`, "_blank", "noopener,noreferrer")}
                                title="Ir a esta sección"
                                className="ml-2 p-1 bg-transparent rounded-full text-blue-500 transition-all duration-150 transform hover:bg-blue-50 hover:scale-110 hover:shadow-sm hover:text-blue-700"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 3h7m0 0v7m0-7L10 14" />
                                </svg>
                              </button>
                            </div>
                          </div>

                          {section.contentURL && (
                            <div className="flex items-center gap-2 mt-2">
                              <button
                                onClick={() => window.open(section.contentURL, "_blank", "noopener,noreferrer")}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 text-xs font-medium rounded border border-gray-200 hover:border-gray-300 transition-colors duration-150"
                              >
                                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                Acceder
                              </button>

                              <button
                                onClick={() => navigator.clipboard.writeText(section.contentURL!)}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-700 text-xs rounded border border-gray-200 transition-colors duration-150"
                                title="Copiar enlace"
                              >
                                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function CursosPage() {
  const { user } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [message, setMessage] = useState<string>("")
  const [currentPage, setCurrentPage] = useState(1)
  const [progressMap, setProgressMap] = useState<Record<number, number>>({})
  const coursesPerPage = 6
  const router = useRouter()

  const [searchTerm, setSearchTerm] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("date-desc")

  const fetchCourses = async (userId: number) => {
    try {
      const data = await getCoursesByUser(userId)
      setCourses(data)
    } catch (error) {
      setMessage("Error al obtener los cursos.")
      console.error("Error fetching courses:", error)
    }
  }

  useEffect(() => {
    if (!user?.id) return
    fetchCourses(user.id)
  }, [user])

  useEffect(() => {
    const fetchProgress = async () => {
      if (!user?.id) return
      const map: Record<number, number> = {}
      for (const course of courses) {
        try {
          const progress = await getCourseProgress(course.id, user.id)
          map[course.id] = progress
        } catch (error) {
          console.error("Error al obtener progreso de curso", error)
        }
      }
      setProgressMap(map)
    }
    fetchProgress()
  }, [courses, user])

  const isFavorite = (course: Course) => {
    if (!user?.id) return false
    const userEnrollment = course.enrollments?.find((e) => e.idUser === user.id)
    return userEnrollment?.favorite === true
  }

  const handleMarkFavorite = async (courseId: number) => {
    try {
      if (!user?.id) return
      const course = courses.find((c) => c.id === courseId)
      const wasFavorite = isFavorite(course!)
      await favCourse(courseId, user.id)
      await fetchCourses(user.id)
      if (wasFavorite) toast.info("Curso quitado de favoritos.")
      else toast.success("Curso marcado como favorito.")
    } catch (error) {
      toast.error("Error al marcar/desmarcar como favorito.")
      console.error(error)
    }
  }

  // Filtro + orden
  const filteredAndSortedCourses = courses
    .filter((course) => {
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        const matchesTitle = course.title.toLowerCase().includes(searchLower)
        const matchesDescription = course.description.toLowerCase().includes(searchLower)
        const matchesInstructor = `${course.createdBy.firstName} ${course.createdBy.lastName}`.toLowerCase().includes(searchLower)
        if (!matchesTitle && !matchesDescription && !matchesInstructor) return false
      }
      if (statusFilter !== "all") {
        const progress = progressMap[course.id] || 0
        const fav = isFavorite(course)
        switch (statusFilter) {
          case "favorites": return fav
          case "completed": return progress === 100
          case "in-progress": return progress > 0 && progress < 100
          case "not-started": return progress === 0
          default: return true
        }
      }
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "date-asc": return new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime()
        case "date-desc": return new Date(b.expiryDate).getTime() - new Date(a.expiryDate).getTime()
        case "name-asc": return a.title.localeCompare(b.title)
        case "name-desc": return b.title.localeCompare(a.title)
        case "progress-desc": return (progressMap[b.id] || 0) - (progressMap[a.id] || 0)
        case "progress-asc": return (progressMap[a.id] || 0) - (progressMap[b.id] || 0)
        default: return 0
      }
    })

  // Paginación
  const indexOfLastCourse = currentPage * coursesPerPage
  const indexOfFirstCourse = indexOfLastCourse - coursesPerPage
  const currentCourses = filteredAndSortedCourses.slice(indexOfFirstCourse, indexOfLastCourse)
  const totalPages = Math.ceil(filteredAndSortedCourses.length / coursesPerPage)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="h-6 w-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Cursos Asignados</h1>
                <p className="text-gray-600">Gestiona y accede a tus cursos de formación</p>
              </div>
            </div>
          </div>

          {(user?.role?.name === "Admin" || user?.role?.name === "RRHH") && (
            <button
              className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg shadow-lg transition-colors duration-200"
              onClick={() => router.push("/cursos/create")}
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nuevo Curso
            </button>
          )}
        </div>

        {/* Filtros */}
        <div className="bg-white/80 backdrop-blur rounded-xl shadow-md border-0 p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
              <div className="relative flex-1 max-w-md">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar cursos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="all">Todos los cursos</option>
                <option value="favorites">Favoritos</option>
                <option value="completed">Completados</option>
                <option value="in-progress">En progreso</option>
                <option value="not-started">Sin empezar</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
              </svg>
              <span className="text-sm text-gray-600 font-medium">Ordenar por:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="date-desc">Más recientes</option>
                <option value="date-asc">Más antiguos</option>
                <option value="name-asc">Nombre A-Z</option>
                <option value="name-desc">Nombre Z-A</option>
                <option value="progress-desc">Mayor progreso</option>
                <option value="progress-asc">Menor progreso</option>
              </select>
            </div>
          </div>

          {(searchTerm || statusFilter !== "all" || sortBy !== "date-desc") && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-sm text-gray-600">Filtros activos:</span>
                {searchTerm && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    Búsqueda: "{searchTerm}"
                    <button onClick={() => setSearchTerm("")} className="hover:bg-blue-200 rounded-full p-0.5">
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}
                {statusFilter !== "all" && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    Estado: {statusFilter === "favorites" ? "Favoritos" : statusFilter === "completed" ? "Completados" : statusFilter === "in-progress" ? "En progreso" : "Sin empezar"}
                    <button onClick={() => setStatusFilter("all")} className="hover:bg-green-200 rounded-full p-0.5">
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}
                <button
                  onClick={() => {
                    setSearchTerm("")
                    setStatusFilter("all")
                    setSortBy("date-desc")
                  }}
                  className="
                      text-xs underline decoration-blue-500/70
                      text-blue-600 hover:text-blue-700 hover:decoration-blue-700
                      bg-transparent hover:bg-transparent focus:bg-transparent active:bg-transparent
                      appearance-none focus:outline-none focus:ring-0
                    "
                  >
                  Limpiar filtros
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Errores */}
        {message && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{message}</p>
          </div>
        )}

        {/* Grid de cursos */}
        <div className="space-y-6">
          {currentCourses.length === 0 ? (
            <div className="bg-white/80 backdrop-blur rounded-xl shadow-md border-0 p-12 text-center">
              <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm || statusFilter !== "all" ? "No se encontraron cursos" : "No hay cursos disponibles"}
              </h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== "all"
                  ? "Intenta ajustar los filtros para ver más resultados."
                  : "Aún no tienes cursos asignados."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {currentCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  progress={progressMap[course.id] || 0}
                  isFavorite={isFavorite(course)}
                  onToggleFavorite={handleMarkFavorite}
                />
              ))}
            </div>
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>

              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 text-sm rounded-md transition-colors ${
                      currentPage === page ? "bg-blue-500 text-white" : "border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
