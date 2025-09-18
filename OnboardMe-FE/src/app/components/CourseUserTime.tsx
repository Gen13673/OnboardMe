"use client"

import { useEffect, useMemo, useState } from "react"
import { getCourses } from "@/app/services/curso.service"
import { getMetric } from "@/app/services/metrics.service"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { Label } from "@/app/components/ui/label"
import { Clock, TrendingUp, Users, Award, BarChart3 } from "lucide-react"

type DataPoint = { label: string; value: number } // /metrics -> label=usuario, value=numero

type Row = { user: string; days: number | null; progressPct: number }

interface Props {
  buddyId?: number
}

// Normaliza 0..1 a 0..100 y clamp
function toPct0_100(v: unknown) {
  const n = Number(v)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(100, n <= 1 ? n * 100 : n))
}

// Texto de días SIN saltos de línea (usa espacios no separables)
function daysText(days: number | null, pct: number) {
  if (days == null) return "—"
  const d = Number(days).toFixed(1)
  // NBSP entre número y "días" para que no se parta
  const unit = "\u00A0días"
  if (pct >= 100) return `✓ ${d}${unit}`
  return `lleva\u00A0${d}${unit}`
}

// Helper para obtener iniciales
function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export default function CourseUserTime({ buddyId }: Props) {
  // UI
  const [courses, setCourses] = useState<Array<{ id: number; title: string }>>([])
  const [courseId, setCourseId] = useState<number | null>(null)
  const [sortBy, setSortBy] = useState<"days" | "label">("days")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  // data
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // cursos
  useEffect(() => {
    getCourses()
      .then((arr: any[]) => {
        const mapped = (arr || []).map((c: any) => ({ id: c.id, title: c.title }))
        setCourses(mapped)
        if (!courseId && mapped.length) setCourseId(mapped[0].id)
      })
      .catch(() => setCourses([]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // métricas para el curso (progress + days)
  useEffect(() => {
    if (!courseId) return
    setLoading(true)
    setError(null)

    const p1 = getMetric("COURSE_USER_PROGRESS" as any, {
      idUser: Number(courseId),
      ...(buddyId ? { idBuddy: buddyId } : {}),
    }).then((r: any) => (Array.isArray(r?.data?.data) ? (r.data.data as DataPoint[]) : []))

    const p2 = getMetric("COURSE_USER_ELAPSED_DAYS" as any, {
      idUser: Number(courseId),
      ...(buddyId ? { idBuddy: buddyId } : {}),
    }).then((r: any) => (Array.isArray(r?.data?.data) ? (r.data.data as DataPoint[]) : []))

    Promise.all([p1, p2])
      .then(([prog, days]) => {
        const pMap = new Map(prog.map((x) => [x.label, toPct0_100(x.value)]))
        const dMap = new Map(days.map((x) => [x.label, Number(x.value)]))
        const users = Array.from(new Set([...prog.map((x) => x.label), ...days.map((x) => x.label)]))
        const merged: Row[] = users.map((u) => ({
          user: u,
          progressPct: pMap.get(u) ?? 0,
          days: dMap.has(u) ? (dMap.get(u) as number) : null,
        }))
        setRows(merged)
      })
      .catch(() => {
        setRows([])
        setError("No se pudieron cargar las métricas del curso")
      })
      .finally(() => setLoading(false))
  }, [courseId, buddyId])

  // KPIs (solo completados con días)
  const completed = useMemo(() => rows.filter((r) => r.progressPct >= 100 && r.days != null), [rows])
  const avgDays = useMemo(() => {
    if (!completed.length) return null
    const s = completed.reduce((acc, r) => acc + (r.days as number), 0)
    return s / completed.length
  }, [completed])
  const fastest = useMemo(() => {
    if (!completed.length) return null
    return completed.reduce(
      (min, r) => (min == null || (r.days as number) < (min.days as number) ? r : min),
      null as Row | null,
    )
  }, [completed])
  const slowest = useMemo(() => {
    if (!completed.length) return null
    return completed.reduce(
      (max, r) => (max == null || (r.days as number) > (max.days as number) ? r : max),
      null as Row | null,
    )
  }, [completed])

  // orden
  const sorted = useMemo(() => {
    const a = [...rows]
    a.sort((x, y) => {
      if (sortBy === "label") {
        const cmp = x.user.toLowerCase().localeCompare(y.user.toLowerCase())
        return sortDir === "asc" ? cmp : -cmp
      } else {
        // Para ordenar por días, los valores null van al final
        const xv = x.days
        const yv = y.days

        // Si ambos son null, mantener orden original
        if (xv === null && yv === null) return 0
        // Si x es null, va al final
        if (xv === null) return sortDir === "asc" ? 1 : -1
        // Si y es null, va al final
        if (yv === null) return sortDir === "asc" ? -1 : 1

        // Ambos tienen valores, comparar normalmente
        const cmp = xv - yv
        return sortDir === "asc" ? cmp : -cmp
      }
    })
    return a
  }, [rows, sortBy, sortDir])

  const courseName = useMemo(() => courses.find((c) => c.id === courseId)?.title ?? "", [courses, courseId])

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Tiempo por Usuario</h1>
              <p className="text-gray-600 text-sm mt-1">
                Analiza el tiempo que tardan los usuarios en completar cursos
              </p>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Filtros y Configuración</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Curso</Label>
              <Select
                value={courseId?.toString() || ""}
                onValueChange={(value) => setCourseId(value ? Number(value) : null)}
              >
                <SelectTrigger className="bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300">
                  <SelectValue placeholder="Seleccionar curso" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-xl">
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Ordenar por</Label>
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as "days" | "label")}>
                <SelectTrigger className="bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-xl">
                  <SelectItem value="days">Días</SelectItem>
                  <SelectItem value="label">Nombre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Dirección</Label>
              <Select value={sortDir} onValueChange={(value) => setSortDir(value as "asc" | "desc")}>
                <SelectTrigger className="bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-xl">
                  <SelectItem value="desc">Descendente</SelectItem>
                  <SelectItem value="asc">Ascendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Promedio de Finalización</p>
                <p className="text-3xl font-bold text-gray-900 tabular-nums">
                  {avgDays != null ? `${avgDays.toFixed(1)}` : "—"}
                </p>
                <p className="text-sm text-gray-500">días</p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Más Rápido</p>
                <p className="text-lg font-semibold text-gray-900">{fastest?.user ?? "—"}</p>
                <p className="text-sm text-gray-500 tabular-nums">
                  {fastest?.days != null ? `${fastest.days.toFixed(1)} días` : "—"}
                </p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                <Award className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Más Lento</p>
                <p className="text-lg font-semibold text-gray-900">{slowest?.user ?? "—"}</p>
                <p className="text-sm text-gray-500 tabular-nums">
                  {slowest?.days != null ? `${slowest.days.toFixed(1)} días` : "—"}
                </p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg">
          <div className="p-6 pb-4">
            <div className="flex items-center space-x-2 mb-2">
              <Users className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Detalle por Usuario</h2>
            </div>
            <p className="text-gray-600 text-sm">Progreso y tiempo de cada usuario en el curso seleccionado</p>
          </div>

          <div className="overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <p className="text-gray-600">Cargando métricas...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-red-600 text-2xl">⚠️</span>
                  </div>
                  <p className="text-red-600 font-medium">{error}</p>
                </div>
              </div>
            ) : (
              <div className="max-h-[60vh] overflow-auto">
                <table className="min-w-full">
                  <thead className="sticky top-0 bg-gray-50/95 backdrop-blur border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 w-16">#</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Usuario</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Progreso</th>
                      <th className="text-right px-4 py-3 text-sm font-medium text-gray-600 w-32">Tiempo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sorted.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-12 text-center">
                          <div className="flex flex-col items-center space-y-3">
                            <Users className="h-12 w-12 text-gray-300" />
                            <p className="text-gray-500 font-medium">Sin datos para este curso</p>
                            <p className="text-gray-400 text-sm">
                              Selecciona un curso diferente o verifica que tenga usuarios asignados
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      sorted.map((r, idx) => {
                        const pct = Math.round(toPct0_100(r.progressPct))
                        const w = Math.max(0, Math.min(100, pct))
                        const inProgress = pct < 100

                        return (
                          <tr key={r.user + idx} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-3">
                                <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-sm">
                                  <span className="text-white text-xs font-bold">{getInitials(r.user)}</span>
                                </div>
                                <span className="text-sm font-medium text-gray-900">{r.user}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-3">
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-gray-600">Progreso</span>
                                    <span className="text-xs font-medium text-gray-900">{pct}%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                      className={`h-2 rounded-full transition-all duration-300 bg-gradient-to-r from-blue-500 to-blue-600`}
                                      style={{ width: `${w}%` }}
                                    />
                                  </div>
                                </div>
                                <span
                                  className={`text-xs px-2 py-1 rounded-full font-medium bg-blue-50 text-blue-700 border border-blue-200`}
                                >
                                  {inProgress ? "En progreso" : "Completado"}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="text-sm font-medium text-gray-900 tabular-nums">
                                {daysText(r.days, pct)}
                              </span>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
