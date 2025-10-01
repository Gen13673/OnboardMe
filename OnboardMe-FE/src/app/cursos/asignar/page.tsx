"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/auth/authContext"
import { getCourses, assignCourse, getCoursesByUser } from "@/app/services/curso.service"
import { getUsersByBuddy } from "@/app/services/usuario.service"
import type { Course } from "@/app/models/Course"
import type { User } from "@/app/models/User"
import { Label } from "@/app/components/ui/label"
import { Button } from "@/app/components/ui/button"
import { toast } from "react-toastify"
import { Search, BookOpen, Users, UserCheck, GraduationCap, Mail } from 'lucide-react'

export default function AssignCoursePage() {
  const { user } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [mentees, setMentees] = useState<User[]>([])
  const [selectedCourseIds, setSelectedCourseIds] = useState<Set<number>>(new Set())
  const [selectedMentees, setSelectedMentees] = useState<Set<number>>(new Set())
  const [courseSearchTerm, setCourseSearchTerm] = useState("")
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState("")
  const [isAssigning, setIsAssigning] = useState(false)
  const [courseAreaFilter, setCourseAreaFilter] = useState<string>("all")
  const [employeeAreaFilter, setEmployeeAreaFilter] = useState<string>("all")

  useEffect(() => {
    if (!user) return
    getCourses().then(setCourses)
    getUsersByBuddy(user.id).then(setMentees)
  }, [user])

  // Filtrar cursos basado en el término de búsqueda
  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.title.toLowerCase().includes(courseSearchTerm.toLowerCase())
    const matchesArea = courseAreaFilter === "all" || course.area === courseAreaFilter
    return matchesSearch && matchesArea
  })

  // Filtrar empleados basado en el término de búsqueda
  const filteredMentees = mentees.filter((mentee) => {
    const matchesSearch =
      `${mentee.firstName} ${mentee.lastName}`.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
      mentee.email.toLowerCase().includes(employeeSearchTerm.toLowerCase())

    const matchesArea = employeeAreaFilter === "all" || mentee.area === employeeAreaFilter
    return matchesSearch && matchesArea
  })

  const selectedCourses = courses.filter((c) => selectedCourseIds.has(c.id))

  const toggle = (id: number) => {
    const s = new Set(selectedMentees)
    s.has(id) ? s.delete(id) : s.add(id)
    setSelectedMentees(s)
  }

  const toggleCourse = (id: number) => {
    const s = new Set(selectedCourseIds)
    s.has(id) ? s.delete(id) : s.add(id)
    setSelectedCourseIds(s)
  }

  const selectAllMentees = () => {
    if (selectedMentees.size === filteredMentees.length && filteredMentees.every((m) => selectedMentees.has(m.id))) {
      // Deseleccionar solo los empleados filtrados
      const newSelection = new Set(selectedMentees)
      filteredMentees.forEach((m) => newSelection.delete(m.id))
      setSelectedMentees(newSelection)
    } else {
      // Seleccionar todos los empleados filtrados
      const newSelection = new Set(selectedMentees)
      filteredMentees.forEach((m) => newSelection.add(m.id))
      setSelectedMentees(newSelection)
    }
  }

  const handleAssign = async () => {
    if (!user) return
    if (selectedCourseIds.size === 0) {
      toast.error("Seleccioná al menos un curso")
      return
    }
    if (selectedMentees.size === 0) {
      toast.error("Seleccioná al menos un empleado")
      return
    }

    setIsAssigning(true)
    try {
      const menteeIds = Array.from(selectedMentees)
      const menteeCourseMap = new Map<number, Set<number>>()

      await Promise.all(
        menteeIds.map(async (menteeId) => {
          const existing = await getCoursesByUser(menteeId) // [{id,title,...}]
          menteeCourseMap.set(menteeId, new Set(existing.map((c) => c.id)))
        })
      )

      let ok = 0
      let skipped = 0
      let failed = 0

      for (const courseId of selectedCourseIds) {
        const course = courses.find((c) => c.id === courseId)
        for (const menteeId of menteeIds) {
          const mentee = mentees.find((m) => m.id === menteeId)
          const menteeName = mentee ? `${mentee.firstName} ${mentee.lastName ?? ""}`.trim() : `Empleado #${menteeId}`

          const alreadyHas = menteeCourseMap.get(menteeId)?.has(courseId)
          if (alreadyHas) {
            skipped++
            toast.warn(`${menteeName} ya tiene asignado "${course?.title}".`, {
              toastId: `dup-${menteeId}-${courseId}`,
            })
            continue
          }

          try {
            await assignCourse(courseId, user.id, menteeId)
            ok++
          } catch (e: any) {
            const isDup =
              e?.response?.status === 409 ||
              /already.*assign|ya.*asignad/i.test(e?.message || "") ||
              /duplicate/i.test(e?.message || "")

            if (isDup) {
              skipped++
              toast.warn(`${menteeName} ya tiene asignado "${course?.title}".`, {
                toastId: `dup-${menteeId}-${courseId}`,
              })
            } else {
              failed++
              toast.error(`No se pudo asignar "${course?.title}" a ${menteeName}.`)
            }
          }
        }
      }

      if (ok > 0) {
        toast.success(`Cursos asignados correctamente (${ok} asignación${ok > 1 ? "es" : ""}).`)
      }
      if (skipped > 0 && ok === 0 && failed === 0) {
        toast.info(`No se realizaron asignaciones nuevas: ${skipped} ya estaban asignadas.`)
      }
      if (failed > 0) {
        toast.error(`${failed} asignación${failed > 1 ? "es" : ""} falló/fallaron.`)
      }

      setSelectedMentees(new Set())
      setSelectedCourseIds(new Set())
      setCourseSearchTerm("")
      setEmployeeSearchTerm("")
    } catch (err: any) {
      toast.error(err?.message || "Error al asignar. Revisá la consola.")
    } finally {
      setIsAssigning(false)
    }
  }

  const getInitials = (firstName: string, lastName?: string) => {
    return `${firstName.charAt(0)}${lastName?.charAt(0) || ""}`.toUpperCase()
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur rounded-xl shadow-lg border-0 p-6">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Asignar Cursos</h1>
              <p className="text-gray-600 text-sm mt-1">Asigna cursos a los empleados bajo tu mentoría</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Course Selection */}
          <div className="bg-white/80 backdrop-blur rounded-xl shadow-lg border-0">
            <div className="p-6 pb-4">
              <div className="flex items-center space-x-2 mb-2">
                <BookOpen className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Seleccionar Curso</h2>
              </div>
              <p className="text-gray-600 text-sm">Busca y selecciona el curso que deseas asignar</p>
            </div>

            <div className="p-6 pt-0 space-y-4">
              {/* Search Input */}
              <div className="space-y-2">
                <Label htmlFor="course-search" className="text-sm font-medium">
                  Buscar curso
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    id="course-search"
                    type="text"
                    placeholder="Escribe el nombre del curso..."
                    value={courseSearchTerm}
                    onChange={(e) => setCourseSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/80 backdrop-blur border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all duration-300"
                  />
                </div>
                <select
                  value={courseAreaFilter}
                  onChange={(e) => setCourseAreaFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 bg-white/80 backdrop-blur"
                >
                  <option value="all">Todas las áreas</option>
                  <option value="IT">IT</option>
                  <option value="FINANZAS">Finanzas</option>
                  <option value="SEGURIDAD">Seguridad</option>
                  <option value="RRHH">RRHH</option>
                  <option value="IA">IA</option>
                  <option value="ADMINISTRATIVO">Administrativo</option>
                  <option value="GERENCIAL">Gerencial</option>
                  <option value="SOPORTE">Soporte</option>
                </select>
              </div>

              {/* Course List */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Cursos disponibles</Label>
                <div className="max-h-64 overflow-y-auto space-y-2 bg-gray-50/50 rounded-lg p-3">
                  {filteredCourses.length === 0 ? (
                    <div className="text-center py-8">
                      <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">
                        {courseSearchTerm ? "No se encontraron cursos" : "No hay cursos disponibles"}
                      </p>
                    </div>
                  ) : (
                    filteredCourses.map((course) => (
                      <div
                        key={course.id}
                        onClick={() => toggleCourse(course.id)}
                        className={`p-4 rounded-lg border cursor-pointer transition-all duration-300 ${selectedCourseIds.has(course.id)
                          ? "bg-blue-50 border-blue-300 shadow-md"
                          : "bg-white/60 border-gray-200 hover:bg-white/80 hover:border-gray-300"
                          }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div
                            className={`h-10 w-10 rounded-lg flex items-center justify-center ${selectedCourseIds.has(course.id) ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-600"
                              }`}
                          >
                            <BookOpen className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <h3
                              className={`font-medium ${selectedCourseIds.has(course.id) ? "text-blue-900" : "text-gray-900"
                                }`}
                            >
                              {course.title}
                            </h3>
                            {course.area && (
                              <span
                                className={`
        inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded-full
        ${course.area === "IT"
                                    ? "bg-blue-100 text-blue-700"
                                    : course.area === "FINANZAS"
                                      ? "bg-green-100 text-green-700"
                                      : course.area === "SEGURIDAD"
                                        ? "bg-red-100 text-red-700"
                                        : course.area === "RRHH"
                                          ? "bg-purple-100 text-purple-700"
                                          : course.area === "IA"
                                            ? "bg-yellow-100 text-yellow-700"
                                            : course.area === "ADMINISTRATIVO"
                                              ? "bg-gray-100 text-gray-700"
                                              : course.area === "GERENCIAL"
                                                ? "bg-indigo-100 text-indigo-700"
                                                : course.area === "SOPORTE"
                                                  ? "bg-pink-100 text-pink-700"
                                                  : "bg-gray-200 text-gray-600"
                                  }
      `}
                              >
                                {course.area}
                              </span>
                            )}
                            {course.description && (
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{course.description}</p>
                            )}
                          </div>
                          {selectedCourseIds.has(course.id) && (
                            <div className="text-blue-500">
                              <UserCheck className="h-5 w-5" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Selected Course Summary */}
              {selectedCourses.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <UserCheck className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-900">
                      {selectedCourses.length === 1 ? "Curso seleccionado" : "Cursos seleccionados"}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {selectedCourses.map((course) => (
                      <p key={course.id} className="text-blue-800 font-medium text-sm">
                        • {course.title}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Employee Selection */}
          <div className="bg-white/80 backdrop-blur rounded-xl shadow-lg border-0">
            <div className="p-6 pb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Users className="h-6 w-6 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Empleados</h2>
                </div>
                <div className="text-sm text-gray-500">
                  {selectedMentees.size} de {mentees.length} seleccionados
                  {employeeSearchTerm && ` (${filteredMentees.length} mostrados)`}
                </div>
              </div>
              <p className="text-gray-600 text-sm">Selecciona los empleados que recibirán el curso</p>
            </div>

            <div className="p-6 pt-0 space-y-4">
              {/* Search Input for Employees */}
              <div className="space-y-2">
                <Label htmlFor="employee-search" className="text-sm font-medium">
                  Buscar empleado
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    id="employee-search"
                    type="text"
                    placeholder="Buscar por nombre o email..."
                    value={employeeSearchTerm}
                    onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/80 backdrop-blur border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all duration-300"
                  />
                </div>
                <select
                  value={employeeAreaFilter}
                  onChange={(e) => setEmployeeAreaFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 bg-white/80 backdrop-blur"
                >
                  <option value="all">Todas las áreas</option>
                  <option value="IT">IT</option>
                  <option value="FINANZAS">Finanzas</option>
                  <option value="SEGURIDAD">Seguridad</option>
                  <option value="RRHH">RRHH</option>
                  <option value="IA">IA</option>
                  <option value="ADMINISTRATIVO">Administrativo</option>
                  <option value="GERENCIAL">Gerencial</option>
                  <option value="SOPORTE">Soporte</option>
                </select>
              </div>

              {/* Select All Button */}
              {filteredMentees.length > 0 && (
                <Button
                  variant="outline"
                  onClick={selectAllMentees}
                  className="w-full bg-white/60 backdrop-blur hover:bg-white/80"
                >
                  {filteredMentees.every((m) => selectedMentees.has(m.id))
                    ? "Deseleccionar filtrados"
                    : "Seleccionar filtrados"}
                </Button>
              )}

              {/* Employee List */}
              <div className="space-y-2">
                <div className="max-h-64 overflow-y-auto space-y-3 bg-gray-50/50 rounded-lg p-3">
                  {filteredMentees.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">
                        {employeeSearchTerm ? "No se encontraron empleados" : "No tienes empleados asignados"}
                      </p>
                    </div>
                  ) : (
                    filteredMentees.map((mentee) => (
                      <div
                        key={mentee.id}
                        onClick={() => toggle(mentee.id)}
                        className={`p-4 rounded-lg border cursor-pointer transition-all duration-300 ${selectedMentees.has(mentee.id)
                          ? "bg-blue-50 border-blue-300 shadow-md"
                          : "bg-white/60 border-gray-200 hover:bg-white/80 hover:border-gray-300"
                          }`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-sm">
                              <span className="text-white text-sm font-bold">
                                {getInitials(mentee.firstName, mentee.lastName)}
                              </span>
                            </div>
                            {selectedMentees.has(mentee.id) && (
                              <div className="absolute -top-1 -right-1 h-5 w-5 bg-blue-500 rounded-full flex items-center justify-center">
                                <UserCheck className="h-3 w-3 text-white" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1">
                            <h3
                              className={`font-medium ${selectedMentees.has(mentee.id) ? "text-blue-900" : "text-gray-900"
                                }`}
                            >
                              {mentee.firstName} {mentee.lastName}
                            </h3>
                            {mentee.area && (
                              <span
                                className={`
        inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded-full
        ${mentee.area === "IT"
                                    ? "bg-blue-100 text-blue-700"
                                    : mentee.area === "FINANZAS"
                                      ? "bg-green-100 text-green-700"
                                      : mentee.area === "SEGURIDAD"
                                        ? "bg-red-100 text-red-700"
                                        : mentee.area === "RRHH"
                                          ? "bg-purple-100 text-purple-700"
                                          : mentee.area === "IA"
                                            ? "bg-yellow-100 text-yellow-700"
                                            : mentee.area === "ADMINISTRATIVO"
                                              ? "bg-gray-100 text-gray-700"
                                              : mentee.area === "GERENCIAL"
                                                ? "bg-indigo-100 text-indigo-700"
                                                : mentee.area === "SOPORTE"
                                                  ? "bg-pink-100 text-pink-700"
                                                  : "bg-gray-200 text-gray-600"
                                  }
      `}
                              >
                                {mentee.area}
                              </span>
                            )}
                            <div className="flex items-center space-x-2 mt-1">
                              <Mail className="h-4 w-4 text-gray-400" />
                              <p className="text-sm text-gray-600">{mentee.email}</p>
                            </div>
                          </div>

                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedMentees.has(mentee.id)}
                              onChange={() => toggle(mentee.id)}
                              className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="bg-white/80 backdrop-blur rounded-xl shadow-lg border-0 p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {selectedCourses.length > 0 && selectedMentees.size > 0 && (
                <p>
                  Asignar <span className="font-medium text-blue-600">{selectedCourses.length}</span>{" "}
                  {selectedCourses.length === 1 ? "curso" : "cursos"} a{" "}
                  <span className="font-medium text-blue-600">{selectedMentees.size}</span>{" "}
                  {selectedMentees.size === 1 ? "empleado" : "empleados"}
                </p>
              )}
            </div>
            <Button
              onClick={handleAssign}
              disabled={selectedCourseIds.size === 0 || selectedMentees.size === 0 || isAssigning}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50"
            >
              {isAssigning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Asignando...
                </>
              ) : (
                <>
                  <GraduationCap className="h-4 w-4 mr-2" />
                  Asignar Curso
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}