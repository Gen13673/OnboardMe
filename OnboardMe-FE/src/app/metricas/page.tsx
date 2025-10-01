"use client"

import { useEffect, useState, useRef } from "react"
import { useAuth } from "@/auth/authContext"
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend
} from "recharts"
import { Label } from "@/app/components/ui/label"
import CourseUserTime from "@/app/components/CourseUserTime"
import UserCourseCompletion from "@/app/components/UserCourseCompletion"
import type { DataPointDTO, MetricTypeDTO } from "../models/MetricTypes"
import { RoleName } from "@/auth/permissions"
import { BarChart3, Target, ShieldAlert } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"

const metricOptionsByRole: Record<
  RoleName,
  { key: MetricTypeDTO; label: string; icon: string; color: string; chartType: "bar" | "pie" | "gauge"; description: string; unit: string }[]
> = {
  [RoleName.ADMIN]: [
    {
      key: "COURSE_USER_ELAPSED_DAYS", label: "Tiempo promedio de completitud de curso", icon: "⏳",
      color: "from-blue-500 to-indigo-600", chartType: "gauge",
      description: "Tiempo transcurrido por usuario desde inscripción a finalización (o hasta hoy) a nivel organizacional.",
      unit: " días",
    },
    {
      key: "USER_COURSE_COMPLETION", label: "Completitud de cursos por empleado", icon: "📚",
      color: "from-emerald-500 to-green-600", chartType: "bar",
      description: "Totales (completaron vs no) y desglose por empleado con cursos pendientes.",
      unit: "",
    },
  ],
  [RoleName.RRHH]: [
    {
      key: "COURSE_USER_ELAPSED_DAYS", label: "Tiempo promedio de completitud de curso", icon: "⏳",
      color: "from-blue-500 to-indigo-600", chartType: "gauge",
      description: "Tiempo transcurrido por usuario desde inscripción a finalización (o hasta hoy) a nivel organizacional.",
      unit: " días",
    },
    {
      key: "USER_COURSE_COMPLETION", label: "Completitud de cursos por empleado", icon: "📚",
      color: "from-emerald-500 to-green-600", chartType: "bar",
      description: "Totales (completaron vs no) y desglose por empleado con cursos pendientes.",
      unit: "",
    },
  ],
  [RoleName.BUDDY]: [
    {
      key: "COURSE_USER_ELAPSED_DAYS", label: "Tiempo promedio de completitud de curso", icon: "⏳",
      color: "from-indigo-500 to-violet-600", chartType: "gauge",
      description: "Tiempo transcurrido por usuario en tus asignados (desde inscripción a finalización o hasta hoy).",
      unit: " días",
    },
    {
      key: "USER_COURSE_COMPLETION", label: "Completitud de cursos por empleado", icon: "📚",
      color: "from-teal-500 to-cyan-600", chartType: "bar",
      description: "Totales (completaron vs no) y desglose por empleado con cursos pendientes (solo tus asignados).",
      unit: "",
    },
  ],
}

const PIE_CHART_COLORS = ["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6", "#06B6D4"]

export default function MetricsPage() {
  const { user } = useAuth()
  const role = (user?.role?.name as RoleName) || RoleName.EMPLOYEE
  const isRestricted = role === RoleName.EMPLOYEE
  const options = metricOptionsByRole[role]?.length ? metricOptionsByRole[role] : []

  const [selected, setSelected] = useState<MetricTypeDTO>("COURSE_USER_ELAPSED_DAYS")
  const [data, setData] = useState<DataPointDTO[]>([])
  const [isLoading] = useState(false)
  const [hoveredMetricKey, setHoveredMetricKey] = useState<MetricTypeDTO | null>(null)
  const metricHoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [buddyFilterId, setBuddyFilterId] = useState<number | null>(null)

  useEffect(() => {
    if (options.length) setSelected(options[0].key)
  }, [options])

  const handleMetricMouseEnter = (key: MetricTypeDTO) => {
    metricHoverTimeoutRef.current = setTimeout(() => setHoveredMetricKey(key), 1000)
  }
  const handleMetricMouseLeave = () => {
    if (metricHoverTimeoutRef.current) clearTimeout(metricHoverTimeoutRef.current)
    setHoveredMetricKey(null)
  }

  const currentOption = options.find((o) => o.key === selected)
  const currentLabel = currentOption?.label || selected
  const currentChartType = currentOption?.chartType || "bar"
  const currentDescription = currentOption?.description || "Visualización de datos."
  const currentUnit = currentOption?.unit || ""

  const getChartComponent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-80">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600">Cargando métricas...</p>
          </div>
        </div>
      )
    }
    if (data.length === 0) {
      return (
        <div className="flex items-center justify-center h-80">
          <div className="text-center">
            <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">No hay datos disponibles</p>
            <p className="text-gray-400 text-sm">Intenta seleccionar otra métrica o verifica tus asignaciones.</p>
          </div>
        </div>
      )
    }
    switch (currentChartType) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data} margin={{ top: 20, bottom: 60, left: 20, right: 20 }}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopOpacity={0.8} />
                  <stop offset="100%" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" interval={0} angle={-45} textAnchor="end" height={80} />
              <YAxis unit={currentUnit} allowDecimals={false} />
              <Tooltip formatter={(value: number) => [`${value.toFixed(1)}${currentUnit}`, currentLabel]} />
              <Bar dataKey="value" name={currentLabel} fill="url(#barGradient)" radius={[6, 6, 0, 0]} barSize={50} />
            </BarChart>
          </ResponsiveContainer>
        )
      case "pie":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={120} labelLine={false}
                   label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}${currentUnit}`}>
                {data.map((_, i) => <Cell key={i} fill={PIE_CHART_COLORS[i % PIE_CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: number, n: string) => [`${v.toFixed(1)}${currentUnit}`, n]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )
      case "gauge":
        const v = data[0]?.value || 0
        const r = 80
        const c = 2 * Math.PI * r
        const off = c - (v / 100) * c
        return (
          <div className="flex items-center justify-center h-80">
            <div className="relative w-48 h-48">
              <svg className="w-full h-full" viewBox="0 0 200 200">
                <circle strokeWidth="20" stroke="currentColor" className="text-gray-200" fill="transparent" r={r} cx="100" cy="100" />
                <circle strokeWidth="20" strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
                        stroke="currentColor" className="text-blue-600" fill="transparent" r={r} cx="100" cy="100"
                        transform="rotate(-90 100 100)" />
                <text x="100" y="100" textAnchor="middle" dominantBaseline="middle" className="text-5xl font-bold">
                  {v.toFixed(0)}{currentUnit}
                </text>
              </svg>
              <div className="absolute bottom-8 left-0 right-0 text-center text-sm">Progreso Total</div>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  if (!user) {
    return (
      <main className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/80 rounded-xl shadow p-8 text-center">
            <p className="text-gray-600">Cargando...</p>
          </div>
        </div>
      </main>
    )
  }

  if (isRestricted) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 p-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white/80 backdrop-blur rounded-xl shadow-lg border-0 p-8 text-center">
            <div className="mx-auto mb-4 h-14 w-14 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <ShieldAlert className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-semibold">Acceso restringido</h1>
            <p className="text-gray-600 mt-2">Tu rol no tiene acceso al Dashboard de Métricas.</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur rounded-xl shadow-lg border-0 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold">Dashboard de Métricas</h1>
                <p className="text-gray-600 text-sm mt-1">Analiza el rendimiento y progreso de la organización</p>
              </div>
            </div>
          </div>
        </div>

        {/* Selector de Métrica */}
        <div className="bg-white/80 backdrop-blur rounded-xl shadow-lg border-0">
          <div className="p-6 pb-4">
            <div className="flex items-center space-x-2 mb-2">
              <Target className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold">Seleccionar Métrica</h2>
            </div>
            <p className="text-gray-600 text-sm">Elige la métrica que deseas visualizar</p>
          </div>

          <div className="p-6 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {options.map((option) => (
                <div
                  key={option.key}
                  onClick={() => setSelected(option.key)}
                  className={`relative p-4 rounded-lg border cursor-pointer transition-all duration-300 ${
                    selected === option.key ? "bg-blue-50 border-blue-300 shadow-md"
                                             : "bg-white/60 border-gray-200 hover:bg-white/80 hover:border-gray-300"
                  }`}
                  onMouseEnter={() => handleMetricMouseEnter(option.key)}
                  onMouseLeave={handleMetricMouseLeave}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                      selected === option.key ? `bg-gradient-to-br ${option.color} text-white`
                                              : "bg-gray-100 text-gray-600"
                    }`}>
                      <span className="text-lg">{option.icon}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-medium text-sm ${selected === option.key ? "text-blue-900" : "text-gray-900"}`}>
                        {option.label}
                      </h3>
                    </div>
                  </div>

                  {hoveredMetricKey === option.key && (
                    <div className="absolute z-10 left-1/2 -translate-x-1/2 top-full mt-2 p-2 bg-gray-800 text-white text-xs rounded shadow-lg w-48 text-center">
                      {option.description}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Select móvil */}
            <div className="md:hidden">
              <Label htmlFor="metric-select" className="text-sm font-medium mb-2 block">Métrica seleccionada</Label>
              <Select value={selected} onValueChange={(v) => setSelected(v as MetricTypeDTO)}>
                <SelectTrigger className="bg-white/80 backdrop-blur"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-white/95 backdrop-blur-xl border-0 shadow-xl">
                  {options.map((option) => (
                    <SelectItem key={option.key} value={option.key}>
                      <div className="flex items-center space-x-2">
                        <span>{option.icon}</span><span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Contenido según métrica seleccionada */}
        {selected === "COURSE_USER_ELAPSED_DAYS" && (
          <CourseUserTime buddyId={role === RoleName.BUDDY ? user!.id : undefined} />
        )}

        {selected === "USER_COURSE_COMPLETION" && (
            <UserCourseCompletion buddyId={role === RoleName.BUDDY ? user!.id : undefined} />
        )}
      </div>
    </main>
  )
}
