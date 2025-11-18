"use client";

import { useEffect, useMemo, useState, Fragment } from "react";
import type { DataPointDTO } from "@/app/models/MetricTypes";
import { getMetric } from "@/app/services/metrics.service";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Users,
  BookOpen,
  Target,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { Checkbox } from "@/app/components/ui/checkbox";
import { useAuth } from "@/auth/authContext";
import { getUsers } from "@/app/services/usuario.service";
import { Button } from "@/app/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/app/components/ui/command";
import { BuddyCombobox } from "@/app/components/BuddyCombobox";
import { getCoursesForCalendar } from "@/app/services/curso.service";
import type { CourseSummary } from "@/app/models/CourseSummary";

type UserLite = {
  id: number;
  firstName: string;
  lastName: string;
  role?: { name?: string };
  area?: string | null;
  email?: string | null;
};

type Row = {
  userId: number;
  fullName: string;
  completed: number;
  total: number;
  pct: number;
  missing: { courseId: number; title: string; progressPct: number }[];
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function UserCourseCompletion({
  buddyId,
}: {
  buddyId?: number;
}) {
  const [data, setData] = useState<DataPointDTO[] | null>(null);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();
  const role = (user?.role?.name ?? "").toUpperCase();
  const canToggleUnassigned =
    role === "ADMIN" || role === "RRHH" || role === "BUDDY";
  const canToggleHideCompleted =
    role === "ADMIN" || role === "RRHH" || role === "BUDDY";

  const [hideUnassigned, setHideUnassigned] = useState(false);
  const [hideFullyCompleted, setHideFullyCompleted] = useState(false);
  const [hideZeroCompleted, setHideZeroCompleted] = useState(false);

  const isAdminLike = role === "ADMIN" || role === "RRHH";

  const [allUsers, setAllUsers] = useState<UserLite[]>([]);
  const [buddies, setBuddies] = useState<UserLite[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [areaQuery, setAreaQuery] = useState("");
  const [selectedArea, setSelectedArea] = useState<string | undefined>(
    undefined,
  );
  const [areaOpen, setAreaOpen] = useState(false);

  const [selectedBuddy, setSelectedBuddy] = useState<UserLite | null>(null);
  const [selectedBuddyId, setSelectedBuddyId] = useState<number | undefined>(
    undefined,
  );

    const [calendarByUser, setCalendarByUser] = useState<Record<number, CourseSummary[] | undefined>>({});
    const [calendarLoading, setCalendarLoading] = useState<Record<number, boolean>>({});
    const [calendarError, setCalendarError] = useState<Record<number, string | undefined>>({});


    useEffect(() => {
    if (!isAdminLike) return;
    getUsers()
      .then((arr: UserLite[] = []) => {
        setAllUsers(arr);
        const onlyBuddies = arr
          .filter((u) => (u.role?.name ?? "").toUpperCase() !== "EMPLEADO")
          .sort((a, b) =>
            `${a.firstName} ${a.lastName}`.localeCompare(
              `${b.firstName} ${b.lastName}`,
            ),
          );
        setBuddies(onlyBuddies);

        const uniqAreas = Array.from(
          new Set(
            (arr || [])
              .map((u) => (u.area ?? "") as string)
              .filter((a) => a && a.trim().length > 0),
          ),
        ).sort((a, b) => a.localeCompare(b));
        setAreas(uniqAreas);
      })
      .catch(() => {
        setAllUsers([]);
        setBuddies([]);
        setAreas([]);
      });
  }, [isAdminLike]);

  useEffect(() => {
    if (
      selectedBuddy &&
      selectedArea &&
      (selectedBuddy.area ?? "") !== selectedArea
    ) {
      setSelectedBuddy(null);
      setSelectedBuddyId(undefined);
    }
  }, [selectedArea, selectedBuddy]);

  const effectiveBuddyId = selectedBuddyId ?? buddyId;

  const effectiveBuddyName = useMemo(() => {
    if (!effectiveBuddyId) return null;
    const buddy = buddies.find((b) => b.id === effectiveBuddyId);
    return buddy ? `${buddy.firstName} ${buddy.lastName}` : null;
  }, [effectiveBuddyId, buddies]);

  useEffect(() => {
    setLoading(true);
    getMetric(
      "USER_COURSE_COMPLETION",
      effectiveBuddyId ? { idBuddy: effectiveBuddyId } : undefined,
    )
      .then((r) => {
        setData(r.data.data);
        setLoading(false);
      })
      .catch(() => {
        setData(null);
        setLoading(false);
      });
  }, [effectiveBuddyId]);

    const ensureCalendarLoaded = async (userId: number) => {
        if (calendarByUser[userId] || calendarLoading[userId]) return;
        setCalendarLoading((p) => ({ ...p, [userId]: true }));
        try {
            const data = await getCoursesForCalendar(userId);
            setCalendarByUser((p) => ({ ...p, [userId]: data }));
            setCalendarError((p) => ({ ...p, [userId]: undefined }));
        } catch (e) {
            setCalendarError((p) => ({ ...p, [userId]: "No se pudieron cargar los cursos" }));
        } finally {
            setCalendarLoading((p) => ({ ...p, [userId]: false }));
        }
    };

    const { completedAll, notCompletedAll, rows } = useMemo(() => {
    let completedAll = 0,
      notCompletedAll = 0;
    const users: Record<number, Row> = {};

    if (!data) return { completedAll, notCompletedAll, rows: [] as Row[] };

    for (const dp of data) {
      if (dp.label === "SUMMARY_COMPLETED_ALL") completedAll = dp.value;
      else if (dp.label === "SUMMARY_NOT_COMPLETED_ALL")
        notCompletedAll = dp.value;
    }

    for (const dp of data) {
      if (dp.label.startsWith("USER|")) {
        const [, userIdStr, fullNameEsc, completedStr, totalStr] =
          dp.label.split("|");
        const userId = Number(userIdStr);
        const fullName = fullNameEsc.replace(/¦/g, "|");
        users[userId] = {
          userId,
          fullName,
          completed: Number(completedStr),
          total: Number(totalStr),
          pct: Math.round(Number(dp.value) || 0),
          missing: [],
        };
      }
    }

    for (const dp of data) {
      if (dp.label.startsWith("MISSING|")) {
        const [, userIdStr, courseIdStr, titleEsc] = dp.label.split("|");
        const userId = Number(userIdStr);
        const courseId = Number(courseIdStr);
        const title = titleEsc.replace(/¦/g, "|");
        if (users[userId]) {
          users[userId].missing.push({
            courseId,
            title,
            progressPct: Math.round(Number(dp.value) || 0),
          });
        }
      }
    }

    const rows = Object.values(users).sort((a, b) => {
      const aDone = a.total > 0 && a.completed === a.total;
      const bDone = b.total > 0 && b.completed === b.total;
      if (aDone !== bDone) return aDone ? 1 : -1;
      if (a.pct !== b.pct) return a.pct - b.pct;
      return a.fullName.localeCompare(b.fullName);
    });

    return { completedAll, notCompletedAll, rows };
  }, [data]);

  const areaByUserId = useMemo(() => {
    const m: Record<number, string> = {};
    for (const u of allUsers) m[u.id] = (u.area ?? "") as string;
    return m;
  }, [allUsers]);

  const areaFilteredRows = useMemo(() => {
    if (!selectedArea) return rows;
    return rows.filter((r) => (areaByUserId[r.userId] ?? "") === selectedArea);
  }, [rows, selectedArea, areaByUserId]);

  const visibleRows = useMemo(() => {
    return areaFilteredRows.filter((r) => {
      const noAsignados = (r.total ?? 0) === 0;
      const completoTodo = (r.total ?? 0) > 0 && r.completed === r.total;
      if (hideUnassigned && noAsignados) return false;
      if (hideFullyCompleted && completoTodo) return false;
      if (
        hideZeroCompleted &&
        (r.total ?? 0) > 0 &&
        (r.completed ?? 0) < (r.total ?? 0)
      )
        return false;
      return true;
    });
  }, [areaFilteredRows, hideUnassigned, hideFullyCompleted, hideZeroCompleted]);

  const globalSummary = useMemo(() => {
    const base = areaFilteredRows;
    const sumCompleted = base.reduce(
      (acc, r) => acc + (Number.isFinite(r.completed) ? r.completed : 0),
      0,
    );
    const sumTotal = base.reduce(
      (acc, r) => acc + (Number.isFinite(r.total) ? r.total : 0),
      0,
    );
    const pct = sumTotal > 0 ? Math.round((sumCompleted / sumTotal) * 100) : 0;
    return { sumCompleted, sumTotal, pct };
  }, [areaFilteredRows]);

  const kpisByArea = useMemo(() => {
    const base = areaFilteredRows;
    let done = 0;
    let pending = 0;
    for (const r of base) {
      const isDone = r.total > 0 && r.completed === r.total;
      if (isDone) done++;
      else pending++;
    }
    return { done, pending };
  }, [areaFilteredRows]);

  const kpiCompletedAll = selectedArea ? kpisByArea.done : completedAll;
  const kpiNotCompletedAll = selectedArea
    ? kpisByArea.pending
    : notCompletedAll;

  const titleText =
    isAdminLike && effectiveBuddyId
      ? `Progreso Total de Usuarios a Cargo de ${effectiveBuddyName || "Buddy"}`
      : role === "BUDDY"
        ? "Progreso Total de tus Usuarios Asignados"
        : "Progreso Total General de la Empresa";

  const subtitleText =
    isAdminLike && effectiveBuddyId
      ? `Resumen consolidado del progreso de todos los usuarios asignados a ${effectiveBuddyName || "este buddy"}`
      : role === "BUDDY"
        ? "Resumen consolidado del progreso de todos tus usuarios asignados"
        : "Resumen consolidado del progreso de todos los usuarios de la organización";

  const COLS = 4;

  return (
    <section className="space-y-3">

      {/* Filtros y Configuración (solo ADMIN/RRHH) */}
      {isAdminLike && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Filtros y Configuración
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Área (usuario) */}
            <div className="col-span-1">
              <p className="text-xs text-gray-500 mb-1">Filtrar por Área</p>

              <Popover open={areaOpen} onOpenChange={setAreaOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {selectedArea ?? "Todas las áreas"}
                    <span aria-hidden>▾</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                  <Command shouldFilter={false}>
                    <CommandList>
                      <div className="px-2 pt-2">
                        <CommandInput
                          value={areaQuery}
                          onValueChange={setAreaQuery}
                          placeholder="Buscar área..."
                          className="text-sm"
                        />
                      </div>
                      <CommandEmpty className="px-3 py-2">
                        Sin resultados…
                      </CommandEmpty>
                      <CommandGroup heading="Áreas">
                        <CommandItem
                          onSelect={() => {
                            setSelectedArea(undefined);
                            setAreaOpen(false);
                          }}
                        >
                          Todas
                        </CommandItem>
                        {areas
                          .filter(
                            (a) =>
                              !areaQuery ||
                              a.toLowerCase().includes(areaQuery.toLowerCase()),
                          )
                          .map((a) => (
                            <CommandItem
                              key={a}
                              onSelect={() => {
                                setSelectedArea(a);
                                setAreaOpen(false);
                              }}
                            >
                              {a}
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Buddy */}
            <div className="col-span-1">
              <p className="text-xs text-gray-500 mb-1">Filtrar por Buddy</p>
              <BuddyCombobox
                buddies={
                  (selectedArea
                    ? buddies.filter((b) => (b.area ?? "") === selectedArea)
                    : buddies) as any
                }
                value={selectedBuddy as any}
                onChange={(b: any) => {
                  setSelectedBuddy(b);
                  setSelectedBuddyId(b?.id);
                }}
                onClear={() => {
                  setSelectedBuddy(null);
                  setSelectedBuddyId(undefined);
                }}
                showAllOption
                placeholder="Todos los buddies"
              />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl shadow-lg p-6 h-full flex flex-col justify-center">
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">{titleText}</h2>
          </div>

          <p className="text-gray-600 text-sm mb-6">{subtitleText}</p>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] items-center gap-6">
            {/* Barra */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">
                  Progreso General
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {globalSummary.pct}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-300 bg-gradient-to-r from-blue-500 to-blue-600"
                  style={{ width: `${globalSummary.pct}%` }}
                />
              </div>
            </div>

            {/* Cursos Completados */}
            <div className="flex flex-col items-start md:items-end gap-1">
              <span className="text-sm font-medium text-gray-700">
                Cursos Completados
              </span>
              <div className="flex items-baseline gap-2">
                <BookOpen className="w-4 h-4 text-gray-600" />
                <span className="text-lg font-bold text-gray-900 tabular-nums">
                  {loading ? "—" : globalSummary.sumCompleted}
                </span>
                <span className="text-gray-400">/</span>
                <span className="text-base font-semibold text-gray-600 tabular-nums">
                  {loading ? "—" : globalSummary.sumTotal}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="flex flex-col gap-3 h-full">
          <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-5 flex-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Completaron Todos los Cursos
                </p>
                <p className="text-3xl font-bold text-gray-900 tabular-nums">
                  {loading ? "—" : kpiCompletedAll}
                </p>
                <p className="text-sm text-gray-500">Usuarios</p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-5 flex-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Aún no Completaron Todos los Cursos
                </p>
                <p className="text-3xl font-bold text-gray-900 tabular-nums">
                  {loading ? "—" : kpiNotCompletedAll}
                </p>
                <p className="text-sm text-gray-500">Usuarios</p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-orange-100 to-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg">
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Users className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Detalle por Usuario
              </h2>
            </div>

            {/* Checkboxes */}
            <div className="flex items-center gap-6">
              {canToggleUnassigned && (
                <label className="group flex items-center gap-2 text-sm text-gray-700 select-none cursor-pointer">
                  <Checkbox
                    checked={hideUnassigned}
                    onCheckedChange={(v) => setHideUnassigned(Boolean(v))}
                    className="h-4 w-4 rounded-md border border-gray-300 transition-colors data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 data-[state=checked]:text-white data-[state=checked]:hover:bg-blue-600 data-[state=checked]:hover:border-blue-600 data-[state=unchecked]:hover:bg-transparent data-[state=unchecked]:hover;border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
                  />
                  <span className="group-hover:text-blue-700">
                    Ocultar sin cursos asignados
                  </span>
                </label>
              )}
              {canToggleHideCompleted && (
                <label className="group flex items-center gap-2 text-sm text-gray-700 select-none cursor-pointer">
                  <Checkbox
                    checked={hideFullyCompleted}
                    onCheckedChange={(v) => setHideFullyCompleted(Boolean(v))}
                    className="h-4 w-4 rounded-md border border-gray-300 transition-colors data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 data-[state=checked]:text-white data-[state=checked]:hover:bg-blue-600 data-[state=checked]:hover:border-blue-600 data-[state=unchecked]:hover:bg-transparent data-[state=unchecked]:hover;border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
                  />
                  <span className="group-hover:text-blue-700">
                    Ocultar con cursos completados
                  </span>
                </label>
              )}
              {canToggleHideCompleted && (
                <label className="group flex items-center gap-2 text-sm text-gray-700 select-none cursor-pointer">
                  <Checkbox
                    checked={hideZeroCompleted}
                    onCheckedChange={(v) => setHideZeroCompleted(Boolean(v))}
                    className="h-4 w-4 rounded-md border border-gray-300 transition-colors data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 data-[state=checked]:text-white data-[state=checked]:hover:bg-blue-600 data-[state=checked]:hover:border-blue-600 data-[state=unchecked]:hover:bg-transparent data-[state=unchecked]:hover;border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
                  />
                  <span className="group-hover:text-blue-700">
                    Ocultar sin cursos completados
                  </span>
                </label>
              )}
            </div>
          </div>

          <p className="text-gray-600 text-sm">
            Progreso individual de completitud de cursos
          </p>
        </div>

        <div className="overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="text-gray-600">Cargando datos...</p>
              </div>
            </div>
          ) : !data ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">
                  No hay datos disponibles
                </p>
                <p className="text-gray-400 text-sm">
                  No se pudieron obtener las métricas
                </p>
              </div>
            </div>
          ) : areaFilteredRows.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">
                  No hay usuarios en esta área
                </p>
                <p className="text-gray-400 text-sm">
                  Probá con otra área o quitá el filtro
                </p>
              </div>
            </div>
          ) : (
            <div className="max-h-[70vh] overflow-auto">
              <table className="min-w-full">
                <thead className="sticky top-0 bg-gray-50/95 backdrop-blur border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 w-12"></th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 w-56">
                      Usuario
                    </th>
                    <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">
                      Progreso
                    </th>
                    <th className="text-center px-4 py-3 text-sm font-medium text-gray-600 w-48 whitespace-nowrap">
                      Cursos Completados
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {visibleRows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center">
                        <div className="flex flex-col items-center space-y-3">
                          <Users className="h-12 w-12 text-gray-300" />
                          <p className="text-gray-500 font-medium">
                            No hay usuarios para mostrar
                          </p>
                          <p className="text-gray-400 text-sm">
                            Ajustá los toggles (ocultar sin asignados /
                            completos) o verificá asignaciones
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    visibleRows.map((row) => {
                      const ratio = `${row.completed}/${row.total}`;
                      const isOpen = !!expanded[row.userId];
                      const isDone =
                        row.total > 0 && row.completed === row.total;
                        const toggle = () => {
                            setExpanded((prev) => {
                                const nextOpen = !prev[row.userId];
                                if (nextOpen) ensureCalendarLoaded(row.userId);
                                return { ...prev, [row.userId]: nextOpen };
                            });
                        };

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
                                  <span className="text-white text-xs font-bold">
                                    {getInitials(row.fullName)}
                                  </span>
                                </div>

                                <div className="min-w-0">
                                  <div className="font-medium text-gray-900 truncate text-sm">
                                    {row.fullName}
                                  </div>

                                  {isDone && (
                                    <div className="flex items-center space-x-1 mt-1">
                                      <CheckCircle2 className="w-3 h-3 text-green-600 flex-shrink-0" />
                                      <span className="text-xs text-green-600">
                                        Completó todos
                                      </span>
                                    </div>
                                  )}
                                  {!isDone && row.total === 0 && (
                                    <div className="flex items-center space-x-1 mt-1">
                                      <AlertTriangle className="w-3 h-3 text-amber-600 flex-shrink-0" />
                                      <span className="text-xs text-amber-600">
                                        Sin cursos asignados
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col items-center space-y-2">
                                <div className="w-full max-w-[500px]">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-gray-600">
                                      Progreso
                                    </span>
                                    <span className="text-xs font-medium text-gray-900">
                                      {row.pct}%
                                    </span>
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
                                <span className="text-sm text-gray-900 font-medium">
                                  {ratio}
                                </span>
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
                                    <span className="text-sm font-medium text-gray-700">
                                      Cursos Pendientes
                                    </span>
                                  </div>
                                  <div className="space-y-3 pl-6">
                                    {row.missing.map((c) => (
                                      <div
                                        key={c.courseId}
                                        className="flex items-center space-x-4"
                                      >
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium text-gray-900 truncate">
                                            {c.title}
                                          </p>
                                        </div>
                                        <div className="flex items-center space-x-3 flex-shrink-0">
                                          <div className="w-24 bg-gray-200 rounded-full h-2">
                                            <div
                                              className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                                              style={{
                                                width: `${c.progressPct}%`,
                                              }}
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

                                  {/* --- COMPELTADOS --- */}
                                  <div className="space-y-3 mt-6">
                                      <div className="flex items-center space-x-2">
                                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                                          <span className="text-sm font-medium text-gray-700">
      Cursos Completados
    </span>
                                      </div>

                                      {/* estados de carga / error */}
                                      {calendarLoading[row.userId] && (
                                          <div className="pl-6 text-xs text-gray-500">Cargando cursos...</div>
                                      )}
                                      {calendarError[row.userId] && (
                                          <div className="pl-6 text-xs text-red-600">{calendarError[row.userId]}</div>
                                      )}

                                      {/* lista */}
                                      {!calendarLoading[row.userId] && !calendarError[row.userId] && (
                                          <div className="space-y-3 pl-6">
                                              {(() => {
                                                  const list = (calendarByUser[row.userId] ?? [])
                                                      .filter((c) => (c.progressPercent ?? 0) >= 100);

                                                  if (list.length === 0) {
                                                      return (
                                                          <div className="rounded-lg border border-dashed border-gray-200 p-3 text-xs text-gray-500 dark:border-zinc-800">
                                                              Aún no hay cursos completados.
                                                          </div>
                                                      );
                                                  }

                                                  return list.map((c) => (
                                                      <div key={c.id} className="flex items-center space-x-4">
                                                          <div className="flex-1 min-w-0">
                                                              <p className="text-sm font-medium text-gray-900 truncate">
                                                                  {c.title}
                                                              </p>
                                                          </div>
                                                      </div>
                                                  ));
                                              })()}
                                          </div>
                                      )}
                                  </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
