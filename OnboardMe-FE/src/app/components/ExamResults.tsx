"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/auth/authContext"
import { getMetric } from "@/app/services/metrics.service"
import { getCourses, getCourseById } from "@/app/services/curso.service"
import { getUsers } from "@/app/services/usuario.service"
import type { DataPointDTO } from "@/app/models/MetricTypes"
import type { User } from "@/app/models/User"

import { BuddyCombobox } from "@/app/components/BuddyCombobox"

import { Label } from "@/app/components/ui/label"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/app/components/ui/command"

import { Check, ChevronDown, Users, ClipboardCheck, CheckCircle2, XCircle, Timer, BarChart3, Award } from "lucide-react"

type Row = {
    userId: number
    fullName: string
    status: "PENDING" | "PASSED" | "FAILED"
    score: number
    total: number
    pct: number
}

type Group = { courseId: number; courseTitle: string; rows: Row[] }
type CourseLite = { id: number; title: string; area?: string }

function getInitials(name: string) {
    return name
        .split(" ")
        .map((n) => n.charAt(0))
        .join("")
        .toUpperCase()
        .slice(0, 2)
}

export default function ExamResults() {
    const { role, user } = useAuth()

    const roleName = useMemo(() => {
        const r = (typeof role === "string" ? role : (role as any)?.name) ?? (user as any)?.role?.name ?? ""
        return String(r).toUpperCase()
    }, [role, user])

    const isAdminLike = roleName === "ADMIN" || roleName === "RRHH"

    const ownBuddyId = useMemo<number | undefined>(() => {
        const u: any = user ?? {}
        return (u.buddyId as number | undefined) ?? (u.buddy?.id as number | undefined) ?? (u.id as number | undefined)
    }, [user])

    // ---- Buddies (solo para Admin/RRHH) ----
    const [allUsers, setAllUsers] = useState<User[]>([])
    const buddies: User[] = useMemo(
        () =>
            (allUsers ?? [])
                .filter((u) => ((u as any)?.role?.name ?? "").toUpperCase() !== "EMPLEADO")
                .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)),
        [allUsers],
    )
    const [selectedBuddy, setSelectedBuddy] = useState<User | null>(null)
    const [selectedBuddyId, setSelectedBuddyId] = useState<number | undefined>(undefined)

    // ADMIN/RRHH -> el elegido; BUDDY -> el propio
    const effectiveBuddyId = useMemo<number | undefined>(
        () => (isAdminLike ? selectedBuddyId : ownBuddyId),
        [isAdminLike, selectedBuddyId, ownBuddyId],
    )

    const [courses, setCourses] = useState<CourseLite[]>([])
    const [filteredCourses, setFilteredCourses] = useState<CourseLite[]>([])
    const [courseId, setCourseId] = useState<number | null>(null)
    const [openCourseCbx, setOpenCourseCbx] = useState(false)

    const [data, setData] = useState<DataPointDTO[]>([])
    const [pending, setPending] = useState(0)
    const [passed, setPassed] = useState(0)
    const [failed, setFailed] = useState(0)
    const [groups, setGroups] = useState<Group[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [filteringCourses, setFilteringCourses] = useState(false)

    const ALL_COURSES_OPTION: CourseLite = { id: 0, title: "Todos los cursos" }

    const sortCourses = (arr: CourseLite[]) =>
        [...arr].sort((a, b) =>
            a.title.localeCompare(b.title, "es", { sensitivity: "base", numeric: true })
        );

    const withAllFirst = (arr: CourseLite[], ALL: CourseLite) =>
        [ALL, ...sortCourses(arr)];

    // Cargar buddies para Admin/RRHH
    useEffect(() => {
        if (!isAdminLike) return
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
    }, [isAdminLike])

    useEffect(() => {
        let mounted = true
            ; (async () => {
                try {
                    const base = await getCourses()
                    const detailed = await Promise.all(
                        (base ?? []).map(async (c: any) => {
                            try {
                                const full = await getCourseById(c.id)
                                const hasExam = Array.isArray(full?.sections) && full.sections.some((s: any) => s?.content?.type === "EXAM")
                                if (!hasExam) return null
                                return {
                                    id: full.id,
                                    title: full.title,
                                    area: (full?.area?.name ?? full?.area ?? full?.category?.name ?? "") || undefined,
                                } as CourseLite
                            } catch {
                                return null
                            }
                        }),
                    )
                    if (!mounted) return
                    const onlyWithExam = (detailed.filter(Boolean) as CourseLite[]) || []
                    setCourses(onlyWithExam)
                    const withAll = withAllFirst(onlyWithExam, ALL_COURSES_OPTION);
                    setFilteredCourses(withAll);
                    if (courseId === null && withAll.length) setCourseId(0)
                } catch {
                    if (!mounted) return
                    setCourses([])
                    setFilteredCourses([ALL_COURSES_OPTION])
                    if (courseId === null) setCourseId(0)
                }
            })()
        return () => {
            mounted = false
        }
    }, [])

    useEffect(() => {
        let mounted = true

        if (!effectiveBuddyId) {
            const withAll = withAllFirst(courses, ALL_COURSES_OPTION);
            setFilteredCourses(withAll)
            if (withAll.length && !withAll.some((c) => c.id === courseId)) {
                setCourseId(0)
            }
            return () => {
                mounted = false
            }
        }

        ; (async () => {
            setFilteringCourses(true)
            try {
                const checks = await Promise.all(
                    courses.map(async (c) => {
                        try {
                            const { data: metric } = await getMetric("EXAM_RESULTS", { idCourse: c.id, idBuddy: effectiveBuddyId })
                            const hasRows = Array.isArray(metric?.data) && (metric!.data as DataPointDTO[]).some((d) => d.label?.startsWith?.("ROW|"))
                            return hasRows ? c : null
                        } catch {
                            return null
                        }
                    }),
                )
                const onlyWithRows = checks.filter(Boolean) as CourseLite[]
                if (!mounted) return
                const withAll = withAllFirst(onlyWithRows, ALL_COURSES_OPTION);
                setFilteredCourses(withAll)
                if (withAll.length && !withAll.some((c) => c.id === courseId)) {
                    setCourseId(0)
                }
                if (!withAll.length) {
                    setCourseId(0)
                }
            } finally {
                if (mounted) setFilteringCourses(false)
            }
        })()

        return () => {
            mounted = false
        }
    }, [effectiveBuddyId, courses, courseId])

    useEffect(() => {
        if (courseId === null) {
            setData([])
            return
        }
        let mounted = true
            ; (async () => {
                setLoading(true)
                setError(null)
                try {
                    if (courseId === 0) {
                        const courseIds = filteredCourses.filter((c) => c.id !== 0).map((c) => c.id)
                        const results = await Promise.all(
                            courseIds.map(async (cid) => {
                                const params: Record<string, any> = { idCourse: Number(cid) }
                                if (effectiveBuddyId !== undefined && effectiveBuddyId !== null) {
                                    params.idBuddy = Number(effectiveBuddyId)
                                }
                                try {
                                    const { data: metric } = await getMetric("EXAM_RESULTS", params)
                                    return metric?.data ?? []
                                } catch {
                                    return []
                                }
                            }),
                        )
                        const merged = ([] as DataPointDTO[]).concat(...results)
                        if (!mounted) return
                        setData(merged)
                    } else {
                        const params: Record<string, any> = { idCourse: Number(courseId) }
                        if (effectiveBuddyId !== undefined && effectiveBuddyId !== null) {
                            params.idBuddy = Number(effectiveBuddyId)
                        }
                        const { data: metric } = await getMetric("EXAM_RESULTS", params)
                        if (!mounted) return
                        setData(metric?.data ?? [])
                    }
                } catch (e: any) {
                    if (!mounted) return
                    setError(e?.message ?? "Error cargando métrica")
                    setData([])
                } finally {
                    if (mounted) setLoading(false)
                }
            })()
        return () => {
            mounted = false
        }
    }, [courseId, effectiveBuddyId, filteredCourses])

    // Parseo de DataPoints
    useEffect(() => {
        let pnd = 0,
            ok = 0,
            ko = 0
        const rows: Array<{
            courseId: number
            courseTitle: string
            userId: number
            fullName: string
            status: "PENDING" | "PASSED" | "FAILED"
            score: number
            total: number
            pct: number
        }> = []

        for (const dp of data) {
            if (dp.label === "SUMMARY_PENDING") pnd = Number(dp.value) || 0
            else if (dp.label === "SUMMARY_PASSED") ok = Number(dp.value) || 0
            else if (dp.label === "SUMMARY_FAILED") ko = Number(dp.value) || 0
        }

        for (const dp of data) {
            if (!dp.label?.startsWith?.("ROW|")) continue
            const [, courseIdStr, courseTitleEsc, userIdStr, fullNameEsc, status, scoreStr, totalStr] = dp.label.split("|")

            rows.push({
                courseId: Number(courseIdStr),
                courseTitle: courseTitleEsc.replace(/¦/g, "|"),
                userId: Number(userIdStr),
                fullName: fullNameEsc.replace(/¦/g, "|"),
                status: status as Row["status"],
                score: Number(scoreStr),
                total: Number(totalStr),
                pct: Math.round(Number(dp.value) || 0),
            })
        }

        const byCourse = new Map<number, Group>()
        for (const r of rows) {
            if (!byCourse.has(r.courseId)) {
                byCourse.set(r.courseId, {
                    courseId: r.courseId,
                    courseTitle: r.courseTitle,
                    rows: [],
                })
            }
            byCourse.get(r.courseId)!.rows.push({
                userId: r.userId,
                fullName: r.fullName,
                status: r.status,
                score: r.score,
                total: r.total,
                pct: r.pct,
            })
        }

        setPending(pnd)
        setPassed(ok)
        setFailed(ko)
        setGroups(Array.from(byCourse.values()))
    }, [data])

    const allUsersAggregated = useMemo(() => {
        if (courseId !== 0)
            return [] as { userId: number; fullName: string; finished: number; passed: number; total: number; pct: number }[]

        const rows: { userId: number; fullName: string; status: "PENDING" | "PASSED" | "FAILED" }[] = []

        for (const dp of data) {
            if (!dp.label?.startsWith?.("ROW|")) continue
            const parts = dp.label.split("|")
            const userId = Number(parts[3])
            const fullName = parts[4]?.replace(/¦/g, "|") ?? ""
            const status = (parts[5] ?? "PENDING") as "PENDING" | "PASSED" | "FAILED"
            rows.push({ userId, fullName, status })
        }

        const byUser = new Map<number, { userId: number; fullName: string; finished: number; passed: number; total: number }>()
        for (const r of rows) {
            if (!byUser.has(r.userId)) byUser.set(r.userId, { userId: r.userId, fullName: r.fullName, finished: 0, passed: 0, total: 0 })
            const acc = byUser.get(r.userId)!
            acc.total += 1
            if (r.status !== "PENDING") acc.finished += 1
            if (r.status === "PASSED") acc.passed += 1
        }

        return Array.from(byUser.values())
            .map((x) => ({
                ...x,
                pct: x.finished > 0 ? Math.round((x.passed * 100) / x.finished) : 0,
            }))
            .sort((a, b) => b.pct - a.pct || a.fullName.localeCompare(b.fullName))
    }, [data, courseId])

    const selectedCourse = useMemo(() => {
        if (courseId === 0) return ALL_COURSES_OPTION
        return filteredCourses.find((c) => c.id === courseId)
    }, [filteredCourses, courseId])

    const totalUsers = pending + passed + failed

    return (
        <div className="space-y-3">

            {/* Filtros */}
            <div className="bg-white/80 backdrop-blur rounded-xl shadow-lg border-0">
                <div className="p-5 pb-3">
                    <div className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-blue-600" />
                        <h2 className="text-lg md:text-1xl font-semibold text-gray-900">Filtros y Configuración</h2>
                    </div>
                </div>

                <div className="p-5 pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        {/* Buddy (solo para Admin/RRHH) */}
                        {isAdminLike && (
                            <div className="space-y-1.5 md:col-span-1">
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
                        )}

                        {/* Curso */}
                        <div className="space-y-1.5 md:col-span-1">
                            <Label className="text-sm font-medium">
                                Curso{filteringCourses ? " (filtrando…)" : ""}
                            </Label>
                            <Popover open={openCourseCbx} onOpenChange={setOpenCourseCbx}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={openCourseCbx}
                                        disabled={filteredCourses.length === 0}
                                        className="h-10 w-full justify-between bg-white/80 backdrop-blur border border-gray-200 hover:bg-white/90 hover:border-gray-300 disabled:opacity-60"
                                    >
                                        {selectedCourse ? (
                                            <>
                                                <span className="truncate">{selectedCourse.title}</span>
                                                <span className="inline-flex items-center gap-2 shrink-0 text-xs text-gray-500">
                                                    {selectedCourse.area && selectedCourse.id !== 0 && (
                                                        <span className="uppercase tracking-wide">· {selectedCourse.area}</span>
                                                    )}
                                                    <ChevronDown className={`h-4 w-4 opacity-50 transition-transform ${openCourseCbx ? "rotate-180" : ""}`} />
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <span className="text-gray-500">
                                                    {filteredCourses.length ? "Seleccionar curso" : "Sin cursos disponibles"}
                                                </span>
                                                <ChevronDown className="h-4 w-4 opacity-50" />
                                            </>
                                        )}
                                    </Button>
                                </PopoverTrigger>

                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 max-h-80 overflow-hidden bg-white/95 backdrop-blur-xl border-0 shadow-xl">
                                    <Command>
                                        <CommandInput placeholder="Buscar por curso o área" />
                                        <CommandList className="max-h-64 overflow-y-auto">
                                            <CommandEmpty>Sin resultados</CommandEmpty>
                                            <CommandGroup>
                                                {filteredCourses.map((c) => (
                                                    <CommandItem
                                                        key={c.id}
                                                        value={c.title}
                                                        onSelect={() => {
                                                            setCourseId(c.id)
                                                            setOpenCourseCbx(false)
                                                        }}
                                                        className="cursor-pointer gap-2 px-2 py-1.5 h-9"
                                                    >
                                                        <Check className={`mr-1 h-4 w-4 ${c.id === courseId ? "opacity-100" : "opacity-0"}`} />
                                                        <span className="truncate">{c.title}</span>
                                                        {c.area && c.id !== 0 && (
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
                        <div className="hidden md:block md:col-span-1" />
                    </div>
                </div>
            </div>

            {/* Contenido */}
            {courses.length === 0 ? (
                <div className="bg-white/80 backdrop-blur rounded-xl shadow-lg border-0 p-10">
                    <div className="text-center">
                        <ClipboardCheck className="h-14 w-14 text-gray-300 mx-auto mb-3.5" />
                        <p className="text-gray-500 text-lg font-medium">No hay cursos con examen</p>
                        <p className="text-gray-400 text-sm mt-1.5">
                            Los cursos deben tener al menos una sección de tipo examen para aparecer aquí
                        </p>
                    </div>
                </div>
            ) : error ? (
                <div className="bg-white/80 backdrop-blur rounded-xl shadow-lg border-0 p-10">
                    <div className="text-center">
                        <div className="h-14 w-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3.5">
                            <span className="text-red-600 text-2xl">⚠️</span>
                        </div>
                        <p className="text-red-600 font-medium">{error}</p>
                    </div>
                </div>
            ) : loading ? (
                <div className="bg-white/80 backdrop-blur rounded-xl shadow-lg border-0 p-10">
                    <div className="flex items-center justify-center">
                        <div className="flex flex-col items-center space-y-3">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                            <p className="text-gray-600">Cargando resultados...</p>
                        </div>
                    </div>
                </div>
            ) : (courseId === 0 && allUsersAggregated.length === 0) || (courseId !== 0 && groups.length === 0) ? (
                <div className="bg-white/80 backdrop-blur rounded-xl shadow-lg border-0 p-10">
                    <div className="text-center">
                        <Award className="h-14 w-14 text-gray-300 mx-auto mb-3.5" />
                        <p className="text-gray-500 text-lg font-medium">No hay resultados para mostrar</p>
                        <p className="text-gray-400 text-sm mt-1.5">Selecciona un curso o verifica que tenga usuarios asignados</p>
                    </div>
                </div>
            ) : (
                <>
                    {/* Summary cards */}
                    {courseId === 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                            <div className="bg-white/80 backdrop-blur rounded-xl shadow-lg border-0 p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Total de Usuarios</p>
                                        <p className="text-2xl md:text-3xl font-bold text-gray-900 tabular-nums">
                                            {loading ? "—" : allUsersAggregated.length}
                                        </p>
                                        <p className="text-sm text-gray-500">usuarios</p>
                                    </div>
                                    <div className="h-11 w-11 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                                        <Users className="h-5 w-5 text-blue-600" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-white/80 backdrop-blur rounded-xl shadow-lg border-0 p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Total de Usuarios</p>
                                        <p className="text-2xl md:text-3xl font-bold text-gray-900 tabular-nums">{loading ? "—" : totalUsers}</p>
                                        <p className="text-sm text-gray-500">usuarios</p>
                                    </div>
                                    <div className="h-11 w-11 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                                        <Users className="h-5 w-5 text-blue-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/80 backdrop-blur rounded-xl shadow-lg border-0 p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Aún no Realizaron</p>
                                        <p className="text-2xl md:text-3xl font-bold text-gray-900 tabular-nums">{loading ? "—" : pending}</p>
                                        <p className="text-sm text-gray-500">pendientes</p>
                                    </div>
                                    <div className="h-11 w-11 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                                        <Timer className="h-5 w-5 text-gray-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/80 backdrop-blur rounded-xl shadow-lg border-0 p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Aprobaron</p>
                                        <p className="text-2xl md:text-3xl font-bold text-gray-900 tabular-nums">{loading ? "—" : passed}</p>
                                        <p className="text-sm text-gray-500">usuarios</p>
                                    </div>
                                    <div className="h-11 w-11 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg flex items-center justify-center">
                                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/80 backdrop-blur rounded-xl shadow-lg border-0 p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Desaprobaron</p>
                                        <p className="text-2xl md:text-3xl font-bold text-gray-900 tabular-nums">{loading ? "—" : failed}</p>
                                        <p className="text-sm text-gray-500">usuarios</p>
                                    </div>
                                    <div className="h-11 w-11 bg-gradient-to-br from-red-100 to-rose-100 rounded-lg flex items-center justify-center">
                                        <XCircle className="h-5 w-5 text-red-600" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {courseId === 0 ? (
                        <div className="bg-white/80 backdrop-blur rounded-xl shadow-lg border-0">
                            <div className="p-5 pb-3">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <Award className="h-5 w-5 text-blue-600" />
                                    <h2 className="text-lg md:text-xl font-semibold text-gray-900">Todos los cursos</h2>
                                </div>
                                <p className="text-gray-600 text-sm">Resultados de examen consolidados por usuario</p>
                            </div>

                            <div className="overflow-hidden">
                                <div className="max-h-[60vh] overflow-auto">
                                    <table className="min-w-full">
                                        <thead className="sticky top-0 bg-gray-50/95 backdrop-blur border-b border-gray-200">
                                            <tr>
                                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Usuario</th>
                                                <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">Total de Exámenes Finalizados</th>
                                                <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">Total de Exámenes Aprobados</th>
                                                <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">Porcentaje de Exámenes Aprobados</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {allUsersAggregated.map((r) => (
                                                <tr key={r.userId} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-sm">
                                                                <span className="text-white text-xs font-bold">{getInitials(r.fullName)}</span>
                                                            </div>
                                                            <span className="font-medium text-gray-900">{r.fullName}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className="text-sm font-medium text-gray-900 tabular-nums">
                                                            {r.finished}/{r.total}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className="text-sm font-medium text-gray-900 tabular-nums">
                                                            {r.passed}/{r.finished > 0 ? r.finished : 0}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center justify-center gap-2.5">
                                                            <div className="w-24 bg-gray-200 rounded-full h-2">
                                                                <div
                                                                    className="h-2 rounded-full transition-all duration-300 bg-gradient-to-r from-blue-500 to-indigo-500"
                                                                    style={{ width: `${r.pct}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-sm font-medium text-gray-900 w-11 text-right tabular-nums">
                                                                {r.pct}%
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    ) : (
                        groups.map((g) => (
                            <div key={g.courseId} className="bg-white/80 backdrop-blur rounded-xl shadow-lg border-0">
                                <div className="p-5 pb-3">
                                    <div className="flex items中心 gap-2 mb-0.5">
                                        <Award className="h-5 w-5 text-blue-600" />
                                        <h2 className="text-lg md:text-xl font-semibold text-gray-900">{g.courseTitle}</h2>
                                    </div>
                                    <p className="text-gray-600 text-sm">Resultados de examen por usuario</p>
                                </div>

                                <div className="overflow-hidden">
                                    <div className="max-h-[60vh] overflow-auto">
                                        <table className="min-w-full">
                                            <thead className="sticky top-0 bg-gray-50/95 backdrop-blur border-b border-gray-200">
                                                <tr>
                                                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Usuario</th>
                                                    <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">Estado</th>
                                                    <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">Puntaje</th>
                                                    <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">Porcentaje</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {g.rows.map((r) => (
                                                    <tr key={r.userId} className="hover:bg-gray-50/50 transition-colors">
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-sm">
                                                                    <span className="text-white text-xs font-bold">{getInitials(r.fullName)}</span>
                                                                </div>
                                                                <span className="font-medium text-gray-900">{r.fullName}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            {r.status === "PENDING" && (
                                                                <Badge variant="secondary" className="bg-gray-100 text-gray-700">Pendiente</Badge>
                                                            )}
                                                            {r.status === "PASSED" && (
                                                                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border border-green-200">Aprobado</Badge>
                                                            )}
                                                            {r.status === "FAILED" && (
                                                                <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border border-red-200">Desaprobado</Badge>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className="text-sm font-medium text-gray-900 tabular-nums">
                                                                {r.total > 0 ? `${r.score}/${r.total}` : "—"}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center justify-center gap-2.5">
                                                                <div className="w-24 bg-gray-200 rounded-full h-2">
                                                                    <div
                                                                        className="h-2 rounded-full transition-all duration-300 bg-gradient-to-r from-blue-500 to-indigo-500"
                                                                        style={{ width: `${r.pct}%` }}
                                                                    />
                                                                </div>
                                                                <span className="text-sm font-medium text-gray-900 w-11 text-right tabular-nums">
                                                                    {r.pct}%
                                                                </span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </>
            )}
        </div>
    )
}
