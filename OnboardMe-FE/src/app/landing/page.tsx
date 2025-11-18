"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/auth/authContext";
import { getFavoriteCoursesSummaryByUser, getCourseById } from "@/app/services/curso.service";
import { toast } from "react-toastify";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { CourseCalendar } from "../components/course-calendar";
import { Calendar } from "lucide-react";
import { UserAvatar } from "../components/UserAvatar";
import { CourseSummary } from "@/app/models/CourseSummary";
import { getUserOverview } from "@/app/services/usuario.service";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [favoriteCourses, setFavoriteCourses] = useState<CourseSummary[]>([]);
  const [overallProgress, setOverallProgress] = useState<number | null>(null);

  useEffect(() => {
    const finished = localStorage.getItem("course_finished");
    if (finished === "true") {
      toast.success("🎉 ¡Curso finalizado con éxito!", {
        containerId: "app",
        toastId: "course-finished",
        position: "top-center",
        className: "toast-one-line",
      });
      setTimeout(() => {
        localStorage.removeItem("course_finished");
      }, 1000);
    }
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    const ac = new AbortController();
    (async () => {
      try {
        const favorites = await getFavoriteCoursesSummaryByUser(user.id);
        if (ac.signal.aborted) return;
        setFavoriteCourses(favorites);
      } catch (err) {
        console.error("Error fetching favorite courses", err);
        toast.error("No se pudieron cargar tus favoritos");
      }
    })();
    return () => ac.abort();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const ac = new AbortController();
    (async () => {
      try {
        const dto = await getUserOverview(user.id);
        if (ac.signal.aborted) return;
        setOverallProgress(
          dto?.avgProgress != null ? Math.round(dto.avgProgress) : 0
        );
      } catch (err) {
        console.error("Error fetching overall progress", err);
        setOverallProgress(null);
      }
    })();
    return () => ac.abort();
  }, [user?.id]);

  if (!user) return null;

  // Helper component for a simple progress bar
  const ProgressBar = ({
    value,
    className = "",
  }: {
    value: number;
    className?: string;
  }) => (
    <div className={`bg-gray-200 rounded-full h-2 ${className}`}>
      <div
        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      ></div>
    </div>
  );

    // HR Resource Card Component
    const HRResourceCard = ({
                                title,
                                icon,
                                href,
                                description,
                            }: {
        title: string;
        icon: string;
        href: string;
        description: string;
    }) => (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-white/80 backdrop-blur rounded-xl shadow-lg border-0 p-4 hover:bg-white hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex items-center justify-between"
        >
            <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl">
                    <span>{icon}</span>
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                        {title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">{description}</p>
                </div>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="text-blue-500">→</span>
            </div>
        </a>
    );

    const openFavoriteCourseAtLastSection = async (course: CourseSummary) => {
        try {
            const fullCourse = await getCourseById(course.id);
            const total = fullCourse.sections?.length ?? 0;

            if (!total) {
                router.push(`/cursos/${course.id}`);
                return;
            }

            const progress = course.progressPercent ?? 0;
            const completed = Math.floor((progress / 100) * total);

            let sectionId: number;
            if (progress === 100) {
                sectionId = fullCourse.sections[total - 1].id;
            } else if (completed < total) {
                sectionId = fullCourse.sections[completed].id;
            } else {
                sectionId = fullCourse.sections[0].id;
            }

            window.open(
                `/cursos/${course.id}?seccion=${sectionId}`,
                "_blank",
                "noopener,noreferrer",
            );
        } catch (error) {
            console.error("Error abriendo curso favorito", error);
            toast.error("No se pudo abrir el curso. Intentá de nuevo.");
        }
    };

    const getCourseActionLabel = (progressPercent?: number) => {
        const progress = progressPercent ?? 0;
        if (progress <= 0) return "Iniciar curso";
        if (progress >= 100) return "Revisar curso";
        return "Continuar curso";
    };

    return (
    <main>
      {/*<RRHHModal/>*/}
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative max-w-7xl mx-auto px-6 py-12">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <UserAvatar
                  firstName={user.firstName}
                  lastName={user.lastName}
                  size="sm"
                />
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2">
                    ¡Bienvenid@ de vuelta, {user.firstName}! 👋
                  </h1>
                  <p className="text-blue-100 text-lg">
                    Continúa tu viaje de aprendizaje en OnboardMe
                  </p>
                </div>
              </div>
              <div className="hidden md:flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {favoriteCourses.length}
                  </div>
                  <div className="text-blue-100 text-sm">Favoritos</div>
                </div>
                <div className="w-px h-12 bg-white/20"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {overallProgress == null ? "—" : `${overallProgress}%`}
                  </div>
                  <div className="text-blue-100 text-sm">Progreso Total</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* HR Resources Section - Moved up with better spacing */}
          <div className="bg-white/80 backdrop-blur rounded-xl shadow-lg border-0 mb-12">
            <div className="p-6 pb-4">
              <div className="flex items-center space-x-2 mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xl text-blue-600">🏢</span>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Recursos de RRHH
                  </h2>
                </div>
              </div>
              <p className="text-gray-600 text-sm">
                Gestiona tu información personal y accede a recursos importantes
              </p>
            </div>
            <div className="p-6 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <HRResourceCard
                  title="Firmar Recibo"
                  icon="📄"
                  href="/onboarding#recibo"
                  description="Firma tu recibo de sueldo digital"
                />
                <HRResourceCard
                  title="Obra Social"
                  icon="🩺"
                  href="/onboarding#obra-social"
                  description="Gestiona tu cobertura médica"
                />
                <HRResourceCard
                  title="Correo Corporativo"
                  icon="📧"
                  href="/onboarding#correo"
                  description="Configura tu email empresarial"
                />
                <HRResourceCard
                  title="Acceso VPN"
                  icon="🔐"
                  href="/onboarding#vpn"
                  description="Conecta a la red corporativa"
                />
                <HRResourceCard
                  title="Tu Buddy"
                  icon="🧑‍🤝‍🧑"
                  href="/onboarding#buddy"
                  description="Conoce a tu compañero guía"
                />
                <HRResourceCard
                  title="Beneficios"
                  icon="🎁"
                  href="/onboarding#beneficios"
                  description="Descubre tus beneficios"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 mb-8">
            <div className="space-y-8">
              {/* Favorite Courses */}
              <div className="bg-white rounded-xl shadow-lg border-0">
                <div className="p-6 pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl text-yellow-500">⭐</span>
                      <h2 className="text-xl font-semibold text-gray-900">
                        Cursos Favoritos
                      </h2>
                    </div>
                    <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      {favoriteCourses.length} cursos
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Tus cursos marcados como favoritos para acceso rápido
                  </p>
                </div>
                <div className="p-6 pt-0">
                  {favoriteCourses.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-4xl text-gray-400">⭐</span>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No hay cursos favoritos
                      </h3>
                      <p className="text-gray-500 mb-4">
                        Marca cursos como favoritos para verlos aquí
                      </p>
                      <button onClick={() => router.push("/cursos")} className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        <span className="mr-2">📚</span>
                        Explorar Cursos
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {favoriteCourses.map((course) => (
                        <div
                          key={course.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                              <span className="text-2xl text-blue-600">📚</span>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {course.title}
                              </h4>
                              <p className="text-sm text-gray-500">
                                Progreso: {Math.round(course.progressPercent ?? 0)}%
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <ProgressBar value={course.progressPercent ?? 0} className="w-20" />
                              <button
                                  className="p-1 hover:bg-gray-200 rounded"
                                  onClick={() => openFavoriteCourseAtLastSection(course)}
                                  title={getCourseActionLabel(course.progressPercent)}
                              >
                              <span className="text-gray-400">›</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {/* Calendar Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5" />
                    <span>Calendario de Cursos</span>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Fechas de expiración de tus cursos
                  </p>
                </CardHeader>
                <CardContent>
                  <CourseCalendar />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
