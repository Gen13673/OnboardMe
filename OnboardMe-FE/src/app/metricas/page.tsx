"use client"

import { useEffect, useState, useRef } from "react"
import { useAuth } from "@/auth/authContext"
import { getMetric } from "../services/metrics.service"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import { Label } from "@/app/components/ui/label"
import CourseUserTime from "@/app/components/CourseUserTime"
import type { DataPointDTO, MetricTypeDTO } from "../models/MetricTypes"
import { RoleName } from "@/auth/permissions"
import { BarChart3, Target } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"

// Extender las opciones de métricas para incluir el tipo de gráfico, una descripción y la unidad
const metricOptionsByRole: Record<
  RoleName,
  {
    key: MetricTypeDTO
    label: string
    icon: string
    color: string
    chartType: "bar" | "pie" | "gauge"
    description: string
    unit: string // Nueva propiedad para la unidad de medida
  }[]
> = {
  [RoleName.ADMIN]: [
    {
      key: "COURSE_COMPLETION",
      label: "Tasa de Finalización (Org)",
      icon: "📊",
      color: "from-blue-500 to-indigo-600",
      chartType: "bar",
      description: "Porcentaje de cursos completados a nivel organizacional por departamento o categoría.",
      unit: "%",
    },
    {
      key: "AVG_COMPLETION_TIME",
      label: "Tiempo Promedio Finalización (Org)",
      icon: "⏱️",
      color: "from-green-500 to-emerald-600",
      chartType: "bar",
      description: "Tiempo promedio que toma completar los cursos a nivel organizacional.",
      unit: " dias",
    },
    {
      key: "SECTION_DROPOFF",
      label: "Drop-off por Sección (Org)",
      icon: "📉",
      color: "from-red-500 to-pink-600",
      chartType: "bar",
      description: "Porcentaje de usuarios que abandonan un curso en cada sección.",
      unit: "%",
    },
    {
      key: "BUDDY_COVERAGE",
      label: "Cobertura de Buddies",
      icon: "🤝",
      color: "from-purple-500 to-violet-600",
      chartType: "pie",
      description: "Distribución de empleados con y sin buddy asignado.",
      unit: "%",
    },
  ],
  [RoleName.RRHH]: [
    {
      key: "COURSE_COMPLETION",
      label: "Tasa de Finalización (Org)",
      icon: "📊",
      color: "from-blue-500 to-indigo-600",
      chartType: "bar",
      description: "Porcentaje de cursos completados a nivel organizacional por departamento o categoría.",
      unit: "%",
    },
    {
      key: "AVG_COMPLETION_TIME",
      label: "Tiempo Promedio Finalización (Org)",
      icon: "⏱️",
      color: "from-green-500 to-emerald-600",
      chartType: "bar",
      description: "Tiempo promedio que toma completar los cursos a nivel organizacional.",
      unit: " dias",
    },
    {
      key: "SECTION_DROPOFF",
      label: "Drop-off por Sección (Org)",
      icon: "📉",
      color: "from-red-500 to-pink-600",
      chartType: "bar",
      description: "Porcentaje de usuarios que abandonan un curso en cada sección.",
      unit: "%",
    },
    {
      key: "BUDDY_COVERAGE",
      label: "Cobertura de Buddies",
      icon: "🤝",
      color: "from-purple-500 to-violet-600",
      chartType: "pie",
      description: "Distribución de empleados con y sin buddy asignado.",
      unit: "%",
    },
  ],
  [RoleName.BUDDY]: [
    {
      key: "COURSE_COMPLETION",
      label: "Tasa de Finalización de mis Empleados",
      icon: "📊",
      color: "from-blue-500 to-indigo-600",
      chartType: "bar",
      description: "Porcentaje de cursos completados por los empleados que tienes asignados.",
      unit: "%",
    },
    {
      key: "AVG_COMPLETION_TIME",
      label: "Tiempo Promedio de mis Empleados",
      icon: "⏱️",
      color: "from-green-500 to-emerald-600",
      chartType: "bar",
      description: "Tiempo promedio que les toma a tus empleados completar los cursos.",
      unit: " dias",
    },
    {
      key: "COURSE_USER_AVG_COMPLETION_TIME",
      label: "Tiempo promedio por usuario (por curso)",
      icon: "👥⏱️",
      color: "from-indigo-500 to-violet-600",
      chartType: "bar",
      description: "Elegí un curso y mirá cuánto tardó cada empleado en completarlo (promedio en días).",
      unit: " días",
    },
  ],
  [RoleName.EMPLOYEE]: [
    {
      key: "USER_PROGRESS",
      label: "Mi Progreso en Cursos",
      icon: "🎯",
      color: "from-indigo-500 to-purple-600",
      chartType: "gauge",
      description: "Tu progreso general en todos los cursos asignados.",
      unit: "%",
    },
  ],
}

const PIE_CHART_COLORS = ["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6", "#06B6D4"]

export default function MetricsPage() {
  const { user } = useAuth()

  const role = (user?.role.name as RoleName) || RoleName.EMPLOYEE
  const options = metricOptionsByRole[role] || metricOptionsByRole[RoleName.EMPLOYEE]

  const [selected, setSelected] = useState(options[0].key)
  const [data, setData] = useState<DataPointDTO[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hoveredMetricKey, setHoveredMetricKey] = useState<MetricTypeDTO | null>(null) // Estado para la métrica sobre la que se hace hover
  const metricHoverTimeoutRef = useRef<NodeJS.Timeout | null>(null) // Ref para el timeout del hover
  const [buddyFilterId, setBuddyFilterId] = useState<number | null>(null);

  useEffect(() => {
    setSelected(options[0].key)
  }, [options])

  useEffect(() => {
    if (!user) return

    setIsLoading(true)

    if (selected === "COURSE_USER_AVG_COMPLETION_TIME") {
      setIsLoading(false); setData([]); return;
    }

    // 👉 decidir parámetros por TIPO de métrica (no por rol)
    const needsUser =
      selected === "USER_PROGRESS"

    const needsBuddy =
      (selected === "COURSE_COMPLETION" ||
       selected === "AVG_COMPLETION_TIME" ||
       selected === "SECTION_DROPOFF") &&
      role === RoleName.BUDDY

    const params: Record<string, any> = {}
    if (needsUser) params.idUser = user.id
    if (needsBuddy) params.idBuddy = user.id

    // RRHH/Admin: permitir filtrar por Buddy en la métrica seleccionada
    if ((role === RoleName.ADMIN || role === RoleName.RRHH)
        && selected === "AVG_COMPLETION_TIME"
        && buddyFilterId) {
      params.idBuddy = buddyFilterId
    }

    getMetric(selected, params)
      .then((res) => setData(res.data.data))
      .catch((error) => {
        console.error("Error fetching metrics:", error)
        setData([])
      })
      .finally(() => setIsLoading(false))
  }, [selected, role, user, buddyFilterId])

  // Manejadores para el hover de las tarjetas de métricas
  const handleMetricMouseEnter = (key: MetricTypeDTO) => {
    metricHoverTimeoutRef.current = setTimeout(() => {
      setHoveredMetricKey(key)
    }, 1000) // 1 segundo de retardo
  }

  const handleMetricMouseLeave = () => {
    if (metricHoverTimeoutRef.current) {
      clearTimeout(metricHoverTimeoutRef.current)
    }
    setHoveredMetricKey(null)
  }

  if (!user) return null

  const currentOption = options.find((o) => o.key === selected)
  const currentLabel = currentOption?.label || selected
  const currentChartType = currentOption?.chartType || "bar"
  const currentDescription = currentOption?.description || "Visualización de datos."
  const currentUnit = currentOption?.unit || "" // Obtener la unidad de medida

  // Calcular estadísticas resumidas (estas ya no se muestran, pero la lógica se mantiene)
  const totalDataPoints = data.length
  const averageValue = data.length > 0 ? data.reduce((sum, item) => sum + item.value, 0) / data.length : 0
  const maxValue = data.length > 0 ? Math.max(...data.map((item) => item.value)) : 0
  const minValue = data.length > 0 ? Math.min(...data.map((item) => item.value)) : 0

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

    if (selected === "COURSE_USER_AVG_COMPLETION_TIME") {
      const buddyId = role === RoleName.BUDDY ? user?.id : (buddyFilterId ?? undefined)
      return <CourseUserTime buddyId={buddyId} />
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
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#1D4ED8" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: "#6B7280" }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={80}
                axisLine={{ stroke: "#D1D5DB" }}
              />
              <YAxis
                unit={currentUnit} // Usar la unidad de medida de la opción seleccionada
                tick={{ fontSize: 12, fill: "#6B7280" }}
                allowDecimals={false}
                axisLine={{ stroke: "#D1D5DB" }}
              />
              <Tooltip
                formatter={(value: number) => [`${value.toFixed(1)}${currentUnit}`, currentLabel]} // Añadir la unidad al tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  border: "none",
                  borderRadius: "8px",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                }}
              />
              <Bar dataKey="value" name={currentLabel} fill="url(#barGradient)" radius={[6, 6, 0, 0]} barSize={50} />
            </BarChart>
          </ResponsiveContainer>
        )
      case "pie":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart margin={{ top: 20, bottom: 20, left: 20, right: 20 }}>
              <Pie
                data={data}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                outerRadius={120}
                fill="#8884d8"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}${currentUnit}`} // Añadir la unidad a la etiqueta de la torta
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [`${value.toFixed(1)}${currentUnit}`, name]} // Añadir la unidad al tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  border: "none",
                  borderRadius: "8px",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )
      case "gauge":
        const progressValue = data[0]?.value || 0
        const radius = 80
        const circumference = 2 * Math.PI * radius
        const strokeDashoffset = circumference - (progressValue / 100) * circumference

        return (
          <div className="flex items-center justify-center h-80">
            <div className="relative w-48 h-48">
              <svg className="w-full h-full" viewBox="0 0 200 200">
                <circle
                  className="text-gray-200"
                  strokeWidth="20"
                  stroke="currentColor"
                  fill="transparent"
                  r={radius}
                  cx="100"
                  cy="100"
                />
                <circle
                  className="text-blue-600"
                  strokeWidth="20"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r={radius}
                  cx="100"
                  cy="100"
                  transform="rotate(-90 100 100)"
                />
                <text
                  x="100"
                  y="100"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-5xl font-bold text-gray-900"
                  fill="#1F2937"
                >
                  {progressValue.toFixed(0)}
                  {currentUnit} {/* Añadir la unidad al valor del gauge */}
                </text>
              </svg>
              <div className="absolute bottom-8 left-0 right-0 text-center text-gray-600 text-sm">Progreso Total</div>
            </div>
          </div>
        )
      default:
        return null
    }
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
                <h1 className="text-2xl font-semibold text-gray-900">Dashboard de Métricas</h1>
                <p className="text-gray-600 text-sm mt-1">
                  Analiza el rendimiento y progreso de{" "}
                  {role === RoleName.EMPLOYEE ? "tu aprendizaje" : "la organización"}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-6 text-sm">{/* La línea divisora ha sido eliminada */}</div>
          </div>
        </div>

        {/* Metric Selection */}
        <div className="bg-white/80 backdrop-blur rounded-xl shadow-lg border-0">
          <div className="p-6 pb-4">
            <div className="flex items-center space-x-2 mb-2">
              <Target className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Seleccionar Métrica</h2>
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
                    selected === option.key
                      ? "bg-blue-50 border-blue-300 shadow-md"
                      : "bg-white/60 border-gray-200 hover:bg-white/80 hover:border-gray-300"
                  }`}
                  onMouseEnter={() => handleMetricMouseEnter(option.key)} // Manejador para el inicio del hover
                  onMouseLeave={handleMetricMouseLeave} // Manejador para el fin del hover
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                        selected === option.key
                          ? `bg-gradient-to-br ${option.color} text-white`
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      <span className="text-lg">{option.icon}</span>
                    </div>
                    <div className="flex-1">
                      <h3
                        className={`font-medium text-sm ${selected === option.key ? "text-blue-900" : "text-gray-900"}`}
                      >
                        {option.label}
                      </h3>
                      {/* La descripción ya no se muestra aquí permanentemente */}
                    </div>
                  </div>
                  {hoveredMetricKey === option.key && (
                    <div className="absolute z-10 left-1/2 -translate-x-1/2 top-full mt-2 p-2 bg-gray-800 text-white text-xs rounded shadow-lg whitespace-normal w-48 text-center">
                      {option.description}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Alternative Select Dropdown for mobile */}
            <div className="md:hidden">
              <Label htmlFor="metric-select" className="text-sm font-medium mb-2 block">
                Métrica seleccionada
              </Label>
              <Select value={selected} onValueChange={(value) => setSelected(value as MetricTypeDTO)}>
                <SelectTrigger className="bg-white/80 backdrop-blur">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white/95 backdrop-blur-xl border-0 shadow-xl">
                  {options.map((option) => (
                    <SelectItem key={option.key} value={option.key}>
                      <div className="flex items-center space-x-2">
                        <span>{option.icon}</span>
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white/80 backdrop-blur rounded-xl shadow-lg border-0">
          <div className="p-6 pb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-xl">{currentOption?.icon}</span>
                <h2 className="text-xl font-semibold text-gray-900">{currentLabel}</h2>
              </div>
              {data.length > 0 && currentChartType !== "gauge" && (
                <div className="text-sm text-gray-500">
                  {data.length} {data.length === 1 ? "elemento" : "elementos"}
                </div>
              )}
            </div>
          {( (role === RoleName.ADMIN || role === RoleName.RRHH)
              && selected === "AVG_COMPLETION_TIME") && (
            <div className="px-6 pt-0">
              <label className="block text-sm text-gray-600 mb-1">
                Filtrar por Buddy (ID opcional)
              </label>
              <input
                type="number"
                className="border rounded px-3 py-2 w-56"
                placeholder="Ej: 42"
                value={buddyFilterId ?? ""}
                onChange={(e) => setBuddyFilterId(e.target.value ? Number(e.target.value) : null)}
              />
            </div>
          )}
            {/* La descripción del gráfico se mantiene visible aquí */}
            <p className="text-gray-600 text-sm">{currentDescription}</p>
          </div>

          <div className="p-6 pt-0">{getChartComponent()}</div>
        </div>
      </div>
    </main>
  )
}
