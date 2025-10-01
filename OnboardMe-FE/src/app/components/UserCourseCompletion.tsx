"use client"

import { useEffect, useMemo, useState, Fragment } from "react"
import type { DataPointDTO } from "@/app/models/MetricTypes"
import { getMetric } from "@/app/services/metrics.service"
import { ChevronDown, ChevronRight, CheckCircle2, AlertTriangle, Users, BookOpen, Target } from "lucide-react"

type Row = {
  userId: number
  fullName: string
  completed: number
  total: number
  pct: number
  missing: { courseId: number; title: string; progressPct: number }[]
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export default function UserCourseCompletion({ buddyId }: { buddyId?: number }) {
  const [data, setData] = useState<DataPointDTO[] | null>(null)
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getMetric("USER_COURSE_COMPLETION", buddyId ? { idBuddy: buddyId } : undefined)
      .then((r) => {
        setData(r.data.data)
        setLoading(false)
      })
      .catch(() => {
        setData(null)
        setLoading(false)
      })
  }, [buddyId])

  const { completedAll, notCompletedAll, rows } = useMemo(() => {
    let completedAll = 0,
      notCompletedAll = 0
    const users: Record<number, Row> = {}

    if (!data) return { completedAll, notCompletedAll, rows: [] as Row[] }

    for (const dp of data) {
      if (dp.label === "SUMMARY_COMPLETED_ALL") completedAll = dp.value
      else if (dp.label === "SUMMARY_NOT_COMPLETED_ALL") notCompletedAll = dp.value
    }

    for (const dp of data) {
      if (dp.label.startsWith("USER|")) {
        const [, userIdStr, fullNameEsc, completedStr, totalStr] = dp.label.split("|")
        const userId = Number(userIdStr)
        const fullName = fullNameEsc.replace(/¦/g, "|")
        users[userId] = {
          userId,
          fullName,
          completed: Number(completedStr),
          total: Number(totalStr),
          pct: Math.round(Number(dp.value) || 0),
          missing: [],
        }
      }
    }

    for (const dp of data) {
      if (dp.label.startsWith("MISSING|")) {
        const [, userIdStr, courseIdStr, titleEsc] = dp.label.split("|")
        const userId = Number(userIdStr)
        const courseId = Number(courseIdStr)
        const title = titleEsc.replace(/¦/g, "|")
        if (users[userId]) {
          users[userId].missing.push({
            courseId,
            title,
            progressPct: Math.round(Number(dp.value) || 0),
          })
        }
      }
    }

    const rows = Object.values(users).sort((a, b) => {
      const aDone = a.total > 0 && a.completed === a.total
      const bDone = b.total > 0 && b.completed === b.total
      if (aDone !== bDone) return aDone ? 1 : -1
      if (a.pct !== b.pct) return a.pct - b.pct
      return a.fullName.localeCompare(b.fullName)
    })

    return { completedAll, notCompletedAll, rows }
  }, [data])

  return (
    <section className="space-y-8">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6">
        <div className="flex items-center space-x-4">
          <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
            <Target className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Completitud de Cursos</h1>
            <p className="text-gray-600 text-sm mt-1">Seguimiento del progreso de completitud de cursos por usuario</p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completaron Todos los Cursos</p>
              <p className="text-3xl font-bold text-gray-900 tabular-nums">{loading ? "—" : completedAll}</p>
              <p className="text-sm text-gray-500">usuarios</p>
            </div>
            <div className="h-12 w-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Aún no Completaron Todos los Cursos</p>
              <p className="text-3xl font-bold text-gray-900 tabular-nums">{loading ? "—" : notCompletedAll}</p>
              <p className="text-sm text-gray-500">usuarios</p>
            </div>
            <div className="h-12 w-12 bg-gradient-to-br from-orange-100 to-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
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
          <p className="text-gray-600 text-sm">Progreso individual de completitud de cursos</p>
        </div>

        <div className="overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="text-gray-600">Cargando datos...</p>
              </div>
            </div>
          ) : !data || rows.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">No hay datos disponibles</p>
                <p className="text-gray-400 text-sm">No se encontraron usuarios con cursos asignados</p>
              </div>
            </div>
          ) : (
            <div className="max-h-[70vh] overflow-auto">
              <table className="min-w-full">
                <thead className="sticky top-0 bg-gray-50/95 backdrop-blur border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 w-12"></th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 w-56">Usuario</th>
                    <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">Progreso</th>
                    <th className="text-center px-4 py-3 text-sm font-medium text-gray-600 w-48 whitespace-nowrap">
                      Cursos Completados
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((row) => {
                    const ratio = `${row.completed}/${row.total}`
                    const isOpen = !!expanded[row.userId]
                    const isDone = row.total > 0 && row.completed === row.total
                    const toggle = () => setExpanded((prev) => ({ ...prev, [row.userId]: !prev[row.userId] }))

                    return (
                      <Fragment key={row.userId}>
                        <tr className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3">
                            {row.missing.length > 0 ? (
                              <button
                                onClick={toggle}
                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors"
                              >
                                {isOpen ? (
                                  <ChevronDown className="w-4 h-4 text-gray-600" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-gray-600" />
                                )}
                              </button>
                            ) : (
                              <span className="inline-block w-8" />
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-3">
                              <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
                                <span className="text-white text-xs font-bold">{getInitials(row.fullName)}</span>
                              </div>

                              <div className="min-w-0">
                                <div className="font-medium text-gray-900 truncate text-sm">{row.fullName}</div>

                                {isDone && (
                                  <div className="flex items-center space-x-1 mt-1">
                                    <CheckCircle2 className="w-3 h-3 text-green-600 flex-shrink-0" />
                                    <span className="text-xs text-green-600">Completó todos</span>
                                  </div>
                                )}
                                {!isDone && row.total === 0 && (
                                  <div className="flex items-center space-x-1 mt-1">
                                    <AlertTriangle className="w-3 h-3 text-amber-600 flex-shrink-0" />
                                    <span className="text-xs text-amber-600">Sin cursos asignados</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col items-center space-y-2">
                              <div className="w-full max-w-[500px]">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-gray-600">Progreso</span>
                                  <span className="text-xs font-medium text-gray-900">{row.pct}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="h-2 rounded-full transition-all duration-300 bg-gradient-to-r from-blue-500 to-blue-600"
                                    style={{ width: `${row.pct}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <BookOpen className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-900 font-medium">{ratio}</span>
                            </div>
                          </td>
                        </tr>

                        {isOpen && row.missing.length > 0 && (
                          <tr className="bg-gray-50/50">
                            <td></td>
                            <td colSpan={3} className="px-4 py-4">
                              <div className="space-y-3">
                                <div className="flex items-center space-x-2">
                                  <BookOpen className="w-4 h-4 text-gray-500" />
                                  <span className="text-sm font-medium text-gray-700">Cursos Pendientes</span>
                                </div>
                                <div className="space-y-3 pl-6">
                                  {row.missing.map((c) => (
                                    <div key={c.courseId} className="flex items-center space-x-4">
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{c.title}</p>
                                      </div>
                                      <div className="flex items-center space-x-3 flex-shrink-0">
                                        <div className="w-24 bg-gray-200 rounded-full h-2">
                                          <div
                                            className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                                            style={{ width: `${c.progressPct}%` }}
                                          />
                                        </div>
                                        <span className="text-xs font-medium text-gray-900 w-10 text-right">
                                          {c.progressPct}%
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
