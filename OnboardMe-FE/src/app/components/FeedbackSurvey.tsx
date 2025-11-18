"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/auth/authContext"
import { getMetric } from "@/app/services/metrics.service"
import { getCourses } from "@/app/services/curso.service"
import { getUsers } from "@/app/services/usuario.service"

import type { DataPointDTO } from "@/app/models/MetricTypes"
import type { User } from "@/app/models/User"
import type { Course } from "@/app/models/Course"

import { BuddyCombobox } from "@/app/components/BuddyCombobox"

import { Label } from "@/app/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/app/components/ui/command"
import { Check, ChevronDown, MessageSquare, BarChart3, TrendingUp, Award, Users, Target, Star } from "lucide-react"

// ===== helpers ui =====
function unesc(p: string) {
    return p?.replaceAll?.("¦", "|") ?? p
}
function parseLabel(raw: string): string[] {
    return (raw || "").split("|").map(unesc)
}

// ===== tipos internos =====
type QuestionScore = { idx: number; question: string; pct: number }

export default function FeedbackSurvey({ buddyId }: { buddyId?: number }) {
    const { user, role } = useAuth()

    // ----- Buddy
    const [allUsers, setAllUsers] = useState<User[]>([])
    const buddies = useMemo(
        () =>
            (allUsers ?? [])
                .filter((u) => ((u as any)?.role?.name ?? "").toUpperCase() !== "EMPLEADO")
                .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)),
        [allUsers],
    )
    const [selectedBuddy, setSelectedBuddy] = useState<User | null>(null)
    const [selectedBuddyId, setSelectedBuddyId] = useState<number | undefined>(undefined)

    // Área del buddy (fallbacks comunes)
    const buddyArea = useMemo(() => {
        const b: any = selectedBuddy ?? {}
        return (
            b?.areaName ??
            b?.area?.name ??
            b?.area ??
            b?.department?.name ??
            b?.department ??
            b?.team?.name ??
            b?.team ??
            null
        )
    }, [selectedBuddy])

    const buddyName = useMemo(
        () => (selectedBuddy ? `${selectedBuddy.firstName} ${selectedBuddy.lastName}` : ""),
        [selectedBuddy],
    )

    // ----- Curso
    const [courses, setCourses] = useState<Course[]>([])
    const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
    const [courseId, setCourseId] = useState<number | null>(null)
    const [openCourseCbx, setOpenCourseCbx] = useState(false)
    const [filteringCourses, setFilteringCourses] = useState(false)
    const [loading, setLoading] = useState(false)
    const selectedCourse = useMemo(
        () => filteredCourses.find((c) => c.id === courseId) ?? null,
        [filteredCourses, courseId],
    )

    // datos de la métrica
    const [points, setPoints] = useState<DataPointDTO[]>([])

    // ===== carga inicial: users + courses
    useEffect(() => {
        let mounted = true
            ; (async () => {
                try {
                    const users = await getUsers()
                    if (!mounted) return
                    setAllUsers(users ?? [])
                } catch {
                    if (!mounted) return
                    setAllUsers([])
                }
            })()
        return () => {
            mounted = false
        }
    }, [])

    useEffect(() => {
        let mounted = true
            ; (async () => {
                try {
                    setFilteringCourses(true)
                    const base = await getCourses()
                    if (!mounted) return
                    const onlyWithSurvey: Course[] = (base ?? [])
                        .filter((c) => (c.sections ?? []).some((s) => s.content?.type === "SURVEY"))
                        .sort((a, b) => a.title.localeCompare(b.title))
                    setCourses(onlyWithSurvey)
                    setFilteredCourses(onlyWithSurvey)
                    setCourseId(onlyWithSurvey[0]?.id ?? null)
                } finally {
                    if (mounted) setFilteringCourses(false)
                }
            })()
        return () => {
            mounted = false
        }
    }, [])

    useEffect(() => {
        if (!buddyId || !allUsers?.length) return
        const me = allUsers.find((u) => u.id === buddyId) ?? null
        setSelectedBuddy(me)
        setSelectedBuddyId(me?.id)
    }, [buddyId, allUsers])

    // ===== fetch métrica
    useEffect(() => {
        let mounted = true
            ; (async () => {
                if (!courseId) {
                    setPoints([])
                    return
                }
                setLoading(true)
                const params: Record<string, any> = { idCourse: Number(courseId) }
                if (selectedBuddyId !== undefined && selectedBuddyId !== null) {
                    params.idBuddy = Number(selectedBuddyId)
                }
                try {
                    const { data: metric } = await getMetric("SURVEY_FEEDBACK", params)
                    if (!mounted) return
                    setPoints(metric?.data ?? [])
                } catch {
                    if (!mounted) return
                    setPoints([])
                } finally {
                    if (mounted) setLoading(false)
                }
            })()
        return () => {
            mounted = false
        }
    }, [courseId, selectedBuddyId])

    // ===== parseo
    const parsed = useMemo(() => {
        const questions: QuestionScore[] = []
        let buddyCoursePct: number | null = null
        let buddyAllPct: number | null = null

        for (const p of points) {
            const parts = parseLabel(p.label)
            const v = Math.round(p.value ?? 0)

            if (parts[0] === "QSCORE") {
                const idx = Number(parts[1] ?? "0")
                const qText = parts[2] ?? ""
                questions.push({ idx, question: qText, pct: v })
            }
            if (parts[0] === "BUDDY_COURSE_SCORE") buddyCoursePct = v
            if (parts[0] === "BUDDY_ALL_SCORE") buddyAllPct = v
        }

        questions.sort((a, b) => a.idx - b.idx)
        return { questions, buddyCoursePct, buddyAllPct }
    }, [points])

    const averageScore = useMemo(() => {
        if (parsed.questions.length === 0) return 0
        const sum = parsed.questions.reduce((acc, q) => acc + q.pct, 0)
        return Math.round(sum / parsed.questions.length)
    }, [parsed.questions])

    return (
        <div className="space-y-3">

            {/* Filtros */}
            <div className="bg-white/80 backdrop-blur rounded-xl shadow-lg border-0">
                <div className="p-6 pb-4">
                    <div className="flex items-center space-x-2 mb-2">
                        <BarChart3 className="h-6 w-6 text-blue-600" />
                        <h2 className="text-xl font-semibold text-gray-900">Filtros y Configuración</h2>
                    </div>
                    <p className="text-gray-600 text-sm">Selecciona el curso y buddy para ver el feedback</p>
                </div>

                <div className="p-6 pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                        {/* Buddy */}
                        <div className="space-y-2 md:col-span-1">
                            <Label className="text-sm font-medium">Filtrar por Buddy</Label>
                            <BuddyCombobox
                                buddies={buddies as any}
                                value={selectedBuddy as any}
                                onChange={(b: any) => {
                                    setSelectedBuddy(b)
                                    setSelectedBuddyId(b?.id)
                                }}
                                onClear={() => {
                                    setSelectedBuddy(null)
                                    setSelectedBuddyId(undefined)
                                }}
                                showAllOption
                                placeholder="Todos los buddies"
                            />
                        </div>

                        {/* Curso */}
                        <div className="space-y-2 md:col-span-1">
                            <Label className="text-sm font-medium">Curso{filteringCourses ? " (filtrando…)" : ""}</Label>
                            <Popover open={openCourseCbx} onOpenChange={setOpenCourseCbx}>
                                <PopoverTrigger asChild>
                                    <button
                                        type="button"
                                        className="h-10 w-full rounded-lg border border-gray-200 bg-white/80 backdrop-blur px-3 text-left text-gray-900 hover:border-gray-300 hover:bg-white/90 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        disabled={filteredCourses.length === 0}
                                    >
                                        <div className="flex w-full items-center gap-2">
                                            {selectedCourse ? (
                                                <>
                                                    <span className="truncate">{selectedCourse.title}</span>
                                                    <span className="ml-auto inline-flex items-center gap-2 shrink-0 text-xs text-gray-500">
                                                        {selectedCourse.area && (
                                                            <span className="uppercase tracking-wide">· {selectedCourse.area}</span>
                                                        )}
                                                        <ChevronDown
                                                            className={`h-4 w-4 opacity-50 transition-transform ${openCourseCbx ? "rotate-180" : ""}`}
                                                        />
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="text-gray-500">
                                                        {filteredCourses.length ? "Seleccionar curso" : "Sin cursos disponibles"}
                                                    </span>
                                                    <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
                                                </>
                                            )}
                                        </div>
                                    </button>
                                </PopoverTrigger>

                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 overflow-hidden bg-white/95 backdrop-blur-xl border-0 shadow-xl">
                                    <Command>
                                        <CommandInput placeholder="Buscar por curso o área" />
                                        <CommandList className="max-h-64 overflow-y-auto">
                                            <CommandEmpty>Sin resultados</CommandEmpty>
                                            <CommandGroup>
                                                {filteredCourses.map((c) => (
                                                    <CommandItem
                                                        key={c.id}
                                                        value={`${c.title} ${c.area}`}
                                                        onSelect={() => {
                                                            setCourseId(c.id)
                                                            setOpenCourseCbx(false)
                                                        }}
                                                        className="cursor-pointer"
                                                    >
                                                        <Check className={`mr-2 h-4 w-4 ${c.id === courseId ? "opacity-100" : "opacity-0"}`} />
                                                        <span className="truncate">{c.title}</span>
                                                        {c.area && (
                                                            <span className="ml-2 text-xs text-gray-500 uppercase tracking-wide">· {c.area}</span>
                                                        )}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Espaciador */}
                        <div className="md:col-span-1" />
                    </div>
                </div>
            </div>

            {/* Empty state si no hay cursos */}
            {filteredCourses.length === 0 ? (
                <div className="bg-white/80 backdrop-blur rounded-xl shadow-lg border-0 p-12">
                    <div className="text-center">
                        <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg font-medium">No hay cursos con encuestas</p>
                        <p className="text-gray-400 text-sm mt-2">
                            Los cursos deben tener al menos una sección de tipo encuesta para aparecer aquí
                        </p>
                    </div>
                </div>
            ) : (
                <>
                    {/* KPI Cards del Buddy (si está seleccionado) */}
                    {selectedBuddy && (
                        <div className="grid gap-6 md:grid-cols-3">
                            {/* Buddy Seleccionado */}
                            <div className="bg-white/80 backdrop-blur rounded-xl shadow-lg border-0 p-6">
                                <div className="h-full w-full flex items-center justify-center">
                                    <div className="flex items-center space-x-3">
                                        <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-sm">
                                            <Users className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-600">Buddy Seleccionado</p>
                                            <p className="text-lg font-semibold text-gray-900">
                                                {buddyName}
                                            </p>
                                            {buddyArea && (
                                                <p className="text-xs text-gray-500 uppercase tracking-wide mt-0.5">
                                                    {String(buddyArea)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Satisfacción en Curso */}
                            <div className="bg-white/80 backdrop-blur rounded-xl shadow-lg border-0 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">
                                            {`Satisfacción de ${buddyName} en este Curso`}
                                        </p>
                                        <p className="text-3xl font-bold text-gray-900 tabular-nums">
                                            {loading ? "—" : `${parsed.buddyCoursePct ?? 0}%`}
                                        </p>
                                        <p className="text-sm text-gray-500">{selectedCourse?.title}</p>
                                    </div>
                                    <div className="h-12 w-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
                                        <Target className="h-6 w-6 text-purple-600" />
                                    </div>
                                </div>
                            </div>

                            {/* Satisfacción General */}
                            <div className="bg-white/80 backdrop-blur rounded-xl shadow-lg border-0 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">
                                            {`Satisfacción de ${buddyName} en General`}
                                        </p>
                                        <p className="text-3xl font-bold text-gray-900 tabular-nums">
                                            {loading ? "—" : `${parsed.buddyAllPct ?? 0}%`}
                                        </p>
                                        <p className="text-sm text-gray-500">Todos los cursos</p>
                                    </div>
                                    <div className="h-12 w-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg flex items-center justify-center">
                                        <TrendingUp className="h-6 w-6 text-green-600" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Resumen General*/}
                    <div className="bg-white/80 backdrop-blur rounded-xl shadow-lg border-0 p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="h-12 w-12 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg flex items-center justify-center">
                                    <Award className="h-6 w-6 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Satisfacción Promedio del Curso</p>
                                    <p className="text-3xl font-bold text-gray-900 tabular-nums">
                                        {loading ? "—" : `${averageScore}%`}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                                <span className="text-sm text-gray-600">{parsed.questions.length} preguntas</span>
                            </div>
                        </div>
                    </div>

                    {/* Preguntas */}
                    {loading ? (
                        <div className="bg-white/80 backdrop-blur rounded-xl shadow-lg border-0 p-12">
                            <div className="flex items-center justify-center">
                                <div className="flex flex-col items-center space-y-4">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                                    <p className="text-gray-600">Cargando resultados...</p>
                                </div>
                            </div>
                        </div>
                    ) : parsed.questions.length === 0 ? (
                        <div className="bg-white/80 backdrop-blur rounded-xl shadow-lg border-0 p-12">
                            <div className="text-center">
                                <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 text-lg font-medium">No hay resultados disponibles</p>
                                <p className="text-gray-400 text-sm mt-2">
                                    Selecciona un curso diferente o verifica que tenga respuestas
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white/80 backdrop-blur rounded-xl shadow-lg border-0">
                            <div className="p-6 pb-4">
                                <div className="flex items-center space-x-2 mb-2">
                                    <Star className="h-6 w-6 text-blue-600" />
                                    <h2 className="text-xl font-semibold text-gray-900">Resultados por Pregunta</h2>
                                </div>
                                <p className="text-gray-600 text-sm">Nivel de satisfacción para cada pregunta de la encuesta</p>
                            </div>

                            <div className="p-6 pt-0">
                                <div className="grid gap-6 md:grid-cols-2">
                                    {parsed.questions.map((q) => (
                                        <div key={`q-${q.idx}`} className="bg-gray-50/50 rounded-lg p-5 border border-gray-100">
                                            <div className="mb-4">
                                                <div className="flex items-start space-x-3">
                                                    <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                                                        <span className="text-white text-sm font-bold">{q.idx}</span>
                                                    </div>
                                                    <p className="text-sm font-medium text-gray-900 leading-relaxed">{q.question}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 rounded-full bg-gray-200 h-3">
                                                    <div
                                                        className="h-3 rounded-full transition-all duration-300 bg-gradient-to-r from-blue-500 to-indigo-600"
                                                        style={{ width: `${q.pct}%` }}
                                                    />
                                                </div>
                                                <div className="w-14 text-right">
                                                    <span className="text-lg font-bold text-gray-900 tabular-nums">{q.pct}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
