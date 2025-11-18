"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { getCoursesForCalendar } from "../services/curso.service";
import type { CourseSummary } from "../models/CourseSummary";
import { useAuth } from "@/auth/authContext";
import { gcalAllDayUrl } from "@/app/components/lib/googleCalendar";
import { createNotification } from "../services/notification.service";

function getUrgencyLevel(expiryDate: Date): "expired" | "warning" | "safe" {
  const now = new Date();
  const diffTime = new Date(expiryDate).getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "expired";
  if (diffDays <= 7) return "warning";
  return "safe";
}

const endOfDayMs = (d: Date | string) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x.getTime();
};

const startOfDayMs = (d: Date | string) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
};

export function CourseCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const firstDayWeekday = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const weekDays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const { user } = useAuth();
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [message, setMessage] = useState<string>("");

  const lsKey = (uid: number) => `exp-notified:${uid}`;
  const loadNotified = (uid: number) => {
    try {
      return new Set<number>(JSON.parse(localStorage.getItem(lsKey(uid)) || "[]"));
    } catch {
      return new Set<number>();
    }
  };
  const saveNotified = (uid: number, set: Set<number>) =>
    localStorage.setItem(lsKey(uid), JSON.stringify([...set]));

  const prevExpiryLSKey = (uid: number) => `exp-prev-expiry:${uid}`;
  const loadPrevExpiryMap = (uid: number) => {
    try {
      const raw = localStorage.getItem(prevExpiryLSKey(uid));
      if (!raw) return new Map<number, number>();
      const obj = JSON.parse(raw) as Record<string, number>;
      return new Map<number, number>(
        Object.entries(obj).map(([k, v]) => [Number(k), Number(v)])
      );
    } catch {
      return new Map<number, number>();
    }
  };
  const savePrevExpiryMap = (uid: number, map: Map<number, number>) => {
    const obj: Record<number, number> = {};
    map.forEach((v, k) => {
      obj[k] = v;
    });
    localStorage.setItem(prevExpiryLSKey(uid), JSON.stringify(obj));
  };

  const notifiedRef = useRef<Set<number>>(new Set()); // courseIds ya notificados
  const timerRef = useRef<number | null>(null);
  const prevExpiryRef = useRef<Map<number, number>>(new Map()); // snapshot día de vencimiento
  const coursesRef = useRef<CourseSummary[]>([]);
  const userIdRef = useRef<number | null>(null);

  const fetchCourses = async (userId: number) => {
    try {
      const data = await getCoursesForCalendar(userId);
      setCourses(data);
    } catch (error) {
      setMessage("Error al obtener los cursos.");
      console.error("Error fetching courses:", error);
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    notifiedRef.current = loadNotified(user.id);
    prevExpiryRef.current = loadPrevExpiryMap(user.id);
    userIdRef.current = user.id;
    fetchCourses(user.id);
  }, [user?.id]);

  // Mantener un ref con los cursos actuales (para el scheduler)
  useEffect(() => {
    coursesRef.current = courses;
  }, [courses]);

  // Detectar transición FUTURO -> PASADO y notificar (al montar / al cambiar cursos)
  useEffect(() => {
    if (!user?.id || courses.length === 0) return;

    const today0 = startOfDayMs(new Date());
    const prevMap = prevExpiryRef.current ?? new Map<number, number>();

    // snapshot actual: día de vencimiento por curso
    const curMap = new Map<number, number>();
    for (const c of courses) {
      curMap.set(c.id, startOfDayMs(c.expiryDate));
    }

    // detectar transición (prevDay > today0) && (curDay <= today0)
    const toNotify = courses.filter((c) => {
      const prevDay = prevMap.get(c.id); // number | undefined
      const curDay = curMap.get(c.id)!; // number
      const becameExpired =
        prevDay !== undefined && prevDay > today0 && curDay <= today0;
      return becameExpired && !notifiedRef.current.has(c.id);
    });

    (async () => {
      for (const c of toNotify) {
        try {
          await createNotification({
            idUser: user.id!,
            title: "Curso vencido",
            message: `${c.title} venció el ${new Date(c.expiryDate).toLocaleDateString(
              "es-AR"
            )}.`,
            sentDate: new Date(),
            id: 0,
            seen: false,
          });
          notifiedRef.current.add(c.id);
          saveNotified(user.id!, notifiedRef.current);
        } catch (e) {
          console.error("createNotification (transition) failed", c.id, e);
        }
      }

      // persistir snapshot de días
      prevExpiryRef.current = curMap;
      savePrevExpiryMap(user.id!, curMap);
    })();
  }, [user?.id, courses]);

  // Scheduler: programa notificación al fin del día del próximo curso a vencer
  useEffect(() => {
    scheduleNext();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, courses]);

  function scheduleNext(): void {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const uid = userIdRef.current;
    const list = coursesRef.current;
    if (uid == null || !list || list.length === 0) return;

    const today0 = startOfDayMs(new Date());

    // cursos con fecha hoy o posterior y aún no notificados
    const future = list
      .filter(
        (c) =>
          startOfDayMs(c.expiryDate) >= today0 &&
          !notifiedRef.current.has(c.id)
      )
      .sort((a, b) => startOfDayMs(a.expiryDate) - startOfDayMs(b.expiryDate));

    if (future.length === 0) return;

    const next = future[0];
    const nextAt = endOfDayMs(next.expiryDate);
    const now = Date.now();
    const delay = Math.max(0, nextAt - now + 1);
    const MAX = 2147483647; // ~24.8 días
    const safeDelay = Math.min(delay, MAX);

    timerRef.current = window.setTimeout(async () => {
      try {
        const today2 = startOfDayMs(new Date());

        // procesar TODOS los vencidos en este instante que aún no están notificados
        const due = list.filter(
          (c) =>
            startOfDayMs(c.expiryDate) <= today2 &&
            !notifiedRef.current.has(c.id)
        );

        for (const c of due) {
          try {
            await createNotification({
              idUser: uid,
              title: "Curso vencido",
              message: `${c.title} venció el ${new Date(c.expiryDate).toLocaleDateString(
                "es-AR"
              )}.`,
              sentDate: new Date(),
              id: 0,
              seen: false,
            });
            notifiedRef.current.add(c.id);
            saveNotified(uid, notifiedRef.current);
          } catch (e) {
            console.error("createNotification (timer batch) failed", e);
          }
        }
      } finally {
        // encadenar siguiente
        scheduleNext();
      }
    }, safeDelay);
  }

  const getCoursesForDate = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    return courses.filter((course) => {
      const courseDate = new Date(course.expiryDate);
      return (
        courseDate.getDate() === day &&
        courseDate.getMonth() === currentMonth &&
        courseDate.getFullYear() === currentYear
      );
    });
  };

  const renderCalendarDays = () => {
    const days = [];

    // celdas vacías antes del primer día del mes
    for (let i = 0; i < firstDayWeekday; i++) {
      days.push(<div key={`empty-${i}`} className="h-20 p-1"></div>);
    }

    // días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      const coursesForDay = getCoursesForDate(day);
      const isToday =
        new Date().getDate() === day &&
        new Date().getMonth() === currentMonth &&
        new Date().getFullYear() === currentYear;

      days.push(
        <div
          key={day}
          className={`h-20 p-1 border border-gray-200 relative ${isToday ? "bg-blue-50 border-blue-300" : "bg-white"
            }`}
        >
          <div
            className={`text-sm font-medium mb-1 ${isToday ? "text-blue-600 font-bold" : "text-gray-900"
              }`}
          >
            {day}
          </div>
          <div className="space-y-0.5">
            {coursesForDay.slice(0, 2).map((course) => {
              const urgency = getUrgencyLevel(course.expiryDate as unknown as Date);
              const progress = Math.round(course.progressPercent ?? 0);
              const url = gcalAllDayUrl({
                title: course.title,
                date: new Date(course.expiryDate),
                details: `Vence el ${new Date(
                  course.expiryDate
                ).toLocaleDateString("es-AR")} · Progreso: ${progress}%`,
                timezone: "America/Argentina/Buenos_Aires",
              });

              return (
                <a
                  key={course.id}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block text-xs px-1.5 py-0.5 rounded-sm relative overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 ${urgency === "expired"
                      ? "bg-red-50 text-red-800 focus:ring-red-300"
                      : urgency === "warning"
                        ? "bg-yellow-50 text-yellow-800 focus:ring-yellow-300"
                        : "bg-green-50 text-green-800 focus:ring-green-300"
                    }`}
                  title={`${course.title} - ${progress}% completado`}
                >
                  <span
                    className={`absolute left-0 top-0 bottom-0 w-1 ${urgency === "expired"
                        ? "bg-red-500"
                        : urgency === "warning"
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      }`}
                  />
                  <span className="truncate block pl-1">{course.title}</span>
                  <span className="sr-only">Agregar a Google Calendar</span>
                </a>
              );
            })}
            {coursesForDay.length > 2 && (
              <div className="text-xs text-gray-500 text-center">
                +{coursesForDay.length - 2} más
              </div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  // Próximos cursos (sidebar)
  const now = Date.now();
  const sevenDaysFromNow = now + 7 * 24 * 60 * 60 * 1000;

  const upcomingCourses = courses
    .filter((c) => {
      const expiry = new Date(c.expiryDate).getTime();
      return expiry >= now && expiry <= sevenDaysFromNow;
    })
    .sort(
      (a, b) =>
        new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
    )
    .slice(0, 5);

  const expiredCourses = courses.filter(
    (c) => startOfDayMs(c.expiryDate) < startOfDayMs(new Date())
  );

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          {monthNames[currentMonth]} {currentYear}
        </h3>
        <div className="flex space-x-1">
          <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
        {/* Week days header */}
        <div className="grid grid-cols-7 bg-gray-100">
          {weekDays.map((day) => (
            <div
              key={day}
              className="p-3 text-center text-sm font-medium text-gray-700 border-r border-gray-200 last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7">{renderCalendarDays()}</div>
      </div>

      {/* Upcoming Courses */}
      <div className="space-y-4">
        <h4 className="font-medium flex items-center gap-2 text-gray-900">
          🕒 Próximos a Vencer
        </h4>
        <div className="space-y-3">
          {upcomingCourses.map((course) => {
            const expiryDate = new Date(course.expiryDate);
            const urgency = getUrgencyLevel(expiryDate);
            const daysLeft = Math.ceil(
              (expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            );
            return (
              <div
                key={course.id}
                className={`p-4 border-2 rounded-lg space-y-3 bg-white ${urgency === "expired"
                    ? "border-red-300"
                    : urgency === "warning"
                      ? "border-yellow-300"
                      : "border-green-300"
                  }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h5
                      className={`font-medium text-sm ${urgency === "expired"
                          ? "text-red-700"
                          : urgency === "warning"
                            ? "text-yellow-700"
                            : "text-green-700"
                        }`}
                    >
                      {course.title}
                    </h5>
                  </div>
                  {message && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-800">{message}</p>
                    </div>
                  )}
                  <Badge
                    variant={
                      urgency === "expired"
                        ? "destructive"
                        : urgency === "warning"
                          ? "secondary"
                          : "outline"
                    }
                    className={`px-2 py-1 rounded-full text-xs font-medium border ${urgency === "expired"
                        ? "bg-red-50 text-red-700 border-red-200"
                        : urgency === "warning"
                          ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                          : "bg-green-50 text-green-700 border-green-200"
                      }`}
                  >
                    {daysLeft} días
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  Vence: {expiryDate.toLocaleDateString("es-ES")}
                </div>

                <a
                  href={gcalAllDayUrl({
                    title: course.title,
                    date: new Date(course.expiryDate),
                    details: `Vence el ${new Date(course.expiryDate).toLocaleDateString(
                      "es-AR"
                    )} · Progreso: ${Math.round(course.progressPercent ?? 0)}%`,
                    timezone: "America/Argentina/Buenos_Aires",
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 px-3 py-1 text-xs font-medium rounded-full bg-yellow-50 text-yellow-700 border border-yellow-300 hover:bg-yellow-100 hover:text-yellow-800 transition"
                >
                  📅 Agregar a Google Calendar
                </a>
              </div>
            );
          })}

          {/* Expired Courses Alert */}
          {expiredCourses.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                Cursos Vencidos ({expiredCourses.length})
              </h4>
              <div className="space-y-2">
                {expiredCourses.map((course) => (
                  <div
                    key={course.id}
                    className="p-3 border border-destructive/20 bg-destructive/5 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium text-sm text-destructive">
                          {course.title}
                        </h5>
                        <p className="text-xs text-muted-foreground">
                          Venció:{" "}
                          {new Date(course.expiryDate).toLocaleDateString("es-ES")}
                        </p>
                      </div>
                      <Badge variant="destructive" className="text-xs">
                        Vencido
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
