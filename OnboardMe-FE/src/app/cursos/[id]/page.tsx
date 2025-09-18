"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/auth/authContext"
import { getCourseById, updateCourseProgress } from "@/app/services/curso.service"
import { getEnrollment } from "@/app/services/enrollment.service"
import type { Course as CourseModel } from "@/app/models"
import type { Enrollment } from "@/app/models/Enrollment"
import { Button } from "@/app/components/ui/button"
import { CourseStepper } from "@/app/components/courseStepper"
import { submitExam, getExamResult } from "@/app/services/section.service"
import type { ExamResult, ExamSubmission } from "@/app/models/exam"
import { CheckCircle2, XCircle, Lock, Timer } from "lucide-react"

const toAbsoluteUrl = (u?: string) => {
  if (!u) return ""
  try {
    const base = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"
    return new URL(u, base).href
  } catch {
    return u
  }
}

const isLikelyLocal = (u?: string) => {
  if (!u) return false
  try {
    const base = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"
    const url = new URL(u, base)
    const h = url.hostname

    // localhost explícito
    if (["localhost", "127.0.0.1", "::1"].includes(h)) return true

    // IP privada
    if (/^\d+\.\d+\.\d+\.\d+$/.test(h)) {
      const [a, b] = h.split(".").map(Number)
      if (a === 10) return true
      if (a === 192 && b === 168) return true
      if (a === 172 && b >= 16 && b <= 31) return true
    }

    // misma-origen (tu Next en dev)
    if (typeof window !== "undefined" && url.origin === window.location.origin) return true

    return false
  } catch {
    return false
  }
}

const isGoogleDriveLike = (u?: string) => {
  if (!u) return false
  try {
    const base = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"
    const url = new URL(u, base)
    return /(?:^|\.)drive\.google\.com$|(?:^|\.)docs\.google\.com$/.test(url.hostname)
  } catch {
    return false
  }
}

const toDrivePreview = (u: string) => {
  const base = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"
  const url = new URL(u, base)
  const host = url.hostname
  const path = url.pathname
  const idQP = url.searchParams.get("id")

  // docs.google.com/document/d/<ID>/...
  if (/docs\.google\.com$/.test(host)) {
    const m = path.match(/^\/document\/d\/([^/]+)/)
    if (m) return `https://docs.google.com/document/d/${m[1]}/preview`
  }

  // drive.google.com/file/d/<ID>/view...
  if (/drive\.google\.com$/.test(host)) {
    const m = path.match(/^\/file\/d\/([^/]+)/)
    if (m) return `https://drive.google.com/file/d/${m[1]}/preview`
    // /open?id=<ID>
    if (path === "/open" && idQP) return `https://drive.google.com/file/d/${idQP}/preview`
    // /uc?id=<ID>&export=download
    if (path.startsWith("/uc") && idQP) return `https://drive.google.com/file/d/${idQP}/preview`
  }

  // si no matchea, dejo la URL original
  return u
}

function DocxInlineViewer({ url }: { url: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("No pude descargar el .docx");
        const buf = await res.arrayBuffer();

        const { renderAsync } = await import("docx-preview");
        if (cancelled || !containerRef.current) return;

        containerRef.current.innerHTML = "";
        await renderAsync(buf, containerRef.current, undefined, {
          className: "docx",
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          breakPages: true,
          ignoreLastRenderedPageBreak: true,
        });
      } catch (e) {
        console.error(e);
        setError("No se pudo previsualizar este .docx");
      }
    };

    render();
    return () => { cancelled = true; };
  }, [url]);

  if (error) {
    return (
      <div>
        <p className="mb-2 text-gray-700">No pude previsualizar el documento. Podés descargarlo:</p>
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
          Descargar documento
        </a>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="h-[600px] max-h-[75vh] overflow-auto overflow-x-auto p-4">
        <div ref={containerRef} className="docx-wrapper min-w-0" />
      </div>
    </div>
  );
}

export default function CoursePage() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()

  const courseId = Number(params.id)

  const [course, setCourse] = useState<CourseModel | null>(null)
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [completedSectionIds, setCompletedSectionIds] = useState<number[]>([])
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  // Para EXAM
  const [answers, setAnswers] = useState<Record<number, Set<number>>>({})
  const [examResult, setExamResult] = useState<ExamResult | null>(null)
  const [submittingExam, setSubmittingExam] = useState(false)
  // Countdown & autosubmit
  const [timeLeftSec, setTimeLeftSec] = useState<number | null>(null)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const autoSubmittingRef = useRef(false)
  // Snapshot vivo para evitar closures viejos en el timer
  const answersRef = useRef<Record<number, Set<number>>>({})
  useEffect(() => { answersRef.current = answers }, [answers])


  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    if (course) {
      const sectionIdParam = searchParams.get("seccion")
      if (sectionIdParam && course.sections) {
        const index = course.sections.findIndex((sec) => sec.id === Number(sectionIdParam))
        if (index !== -1) {
          setCurrentSectionIndex(index)
        }
      }
    }
  }, [course])

  useEffect(() => {
    if (isNaN(courseId) || !user?.id) return

    getCourseById(courseId).then((data) => {
      const sortedSections = data.sections?.sort((a, b) => (a.order && b.order ? Number(a.order) - Number(b.order) : 0))
      setCourse({ ...data, sections: sortedSections })
    })

    getEnrollment(courseId, user.id).then((data) => {
      setEnrollment(data)
    })
  }, [courseId, user])

  useEffect(() => {
    // limpiar intervalos previos si se cambia de sección
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }
    setTimeLeftSec(null)

    const section = course?.sections?.[currentSectionIndex]
    if (!section || section.content?.type !== "EXAM") {
      setExamResult(null)
      setAnswers({})
      return
    }

    // Inicializar contenedor vacío
    const init: Record<number, Set<number>> = {}
    section.content.questions?.forEach(q => { init[q.id] = new Set() })
    setAnswers(init)

    // Si ya hay resultado en memoria, aplicarlo y limpiar storage
    if (examResult?.results?.length) {
      applyResultToAnswers(examResult)
      clearExamStorage()
      return
    }

    // Intentar recuperar resultado del backend
    if (user?.id) {
      getExamResult(section.id, user.id)
        .then(res => {
          setExamResult(res)
          applyResultToAnswers(res)
          clearExamStorage()
        })
        .catch(() => {
          setExamResult(null)

          // Restaurar respuestas guardadas si todavía no se envió
          try {
            const raw = localStorage.getItem(answersKey(user.id!, section.id))
            if (raw) {
              const obj = JSON.parse(raw) as Record<string, number[]>
              const restored: Record<number, Set<number>> = {}
              Object.entries(obj).forEach(([qid, arr]) => {
                restored[Number(qid)] = new Set(arr as number[])
              })
              // mezclamos sobre init para asegurar todas las keys
              setAnswers(prev => ({ ...prev, ...restored }))
            }
          } catch {}

          // Configurar countdown estricto si hay timeLimit
          const minutes = section.content.timeLimit ?? 0
          if (minutes > 0) {
            const key = timerKey(user.id!, section.id)
            let expireAt = Number(localStorage.getItem(key))
            const now = Date.now()
            if (!expireAt || isNaN(expireAt) || expireAt <= now) {
              expireAt = now + minutes * 60 * 1000
              localStorage.setItem(key, String(expireAt))
            }

            const tick = () => {
              const left = Math.max(0, Math.floor((expireAt - Date.now()) / 1000))
              setTimeLeftSec(left)
              if (left === 0 && !examResult) {
                handleAutoSubmitExam()
              }
            }
            tick()
            timerIntervalRef.current = setInterval(tick, 1000)
          }
        })
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
    }
  }, [course, currentSectionIndex, user])

  useEffect(() => {
    const section = course?.sections?.[currentSectionIndex]
    if (!section || section.content?.type !== "EXAM" || !user?.id || examResult) return

    const payload = Object.fromEntries(
      Object.entries(answers).map(([qid, set]) => [qid, Array.from(set ?? [])])
    )
    try {
      localStorage.setItem(answersKey(user.id, section.id), JSON.stringify(payload))
    } catch {}
  }, [answers, examResult, user?.id, course, currentSectionIndex])

  const toggleAnswer = (questionId: number, optionId: number) => {
    if (examResult) return
    setAnswers(prev => {
      const next = { ...prev }
      const set = new Set(next[questionId] ?? [])
      set.has(optionId) ? set.delete(optionId) : set.add(optionId)
      next[questionId] = set
      return next
    })
  }


  const formatSeconds = (s: number) => {
    const sec = Math.max(0, s | 0)
    const h = Math.floor(sec / 3600)
    const m = Math.floor((sec % 3600) / 60)
    const r = sec % 60
    return h > 0
      ? `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`
      : `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`
  }

  const timerKey = (userId: number, sectionId: number) => `examTimer:${userId}:${sectionId}`
  const answersKey = (userId: number, sectionId: number) => `examAnswers:${userId}:${sectionId}`

  const clearExamStorage = () => {
    const section = course?.sections?.[currentSectionIndex]
    if (!section || !user?.id) return
    localStorage.removeItem(timerKey(user.id, section.id))
    localStorage.removeItem(answersKey(user.id, section.id))
  }

  const applyResultToAnswers = (res: ExamResult) => {
    const map: Record<number, Set<number>> = {}
    res.results.forEach(r => { map[r.questionId] = new Set(r.selectedOptionIds) })
    setAnswers(map)
  }

  const handleSubmitExam = async () => {
    const section = course?.sections?.[currentSectionIndex]
    if (!section) return
    setSubmittingExam(true)
    try {
      const snapshot = answersRef.current
      const payload: ExamSubmission = {
        answers: Object.entries(snapshot).map(([qid, set]) => ({
          questionId: Number(qid),
          selectedOptionIds: Array.from(set ?? []),
        }))
      }
      const result = await submitExam(section.id, user.id, payload)
      setExamResult(result)
      applyResultToAnswers(result)

      await updateCourseProgress(course!.id, user.id, section.id)

    } finally {
      clearExamStorage()
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
      setTimeLeftSec(null)
      setSubmittingExam(false)
    }
  }

  const handleAutoSubmitExam = async () => {
    if (autoSubmittingRef.current) return
    autoSubmittingRef.current = true

    const section = course?.sections?.[currentSectionIndex]
    if (!section || !user?.id) return

    setSubmittingExam(true)
    try {
      const snapshot = answersRef.current
      const payload: ExamSubmission = {
        answers: Object.entries(snapshot).map(([qid, set]) => ({
          questionId: Number(qid),
          selectedOptionIds: Array.from(set ?? []),
        })),
      }
      const result = await submitExam(section.id, user.id, payload)
      setExamResult(result)
      applyResultToAnswers(result)
      await updateCourseProgress(course!.id, user.id, section.id)
    } finally {
      // limpiar countdown + storage
      clearExamStorage()
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
      setTimeLeftSec(null)
      setSubmittingExam(false)
    }
  }

  function calculateCompleted(course, enrollment): number[] {
    const storageKey = `updated_sections_course_${course.id}`
    const localCompleted = new Set<number>(
      JSON.parse(localStorage.getItem(storageKey) || "[]")
    )

    const enrollmentSectionId = enrollment?.idSection

    const lastCompletedIndex = course.sections.findIndex(
      (sec) => sec.id === enrollmentSectionId
    )

    const backendCompleted = new Set<number>(
      course.sections.slice(0, lastCompletedIndex + 2).map((s) => s.id)
    )

    const combined = new Set<number>([...localCompleted, ...backendCompleted])

    console.log("✅ Secciones completadas (local + backend):", [...combined])

    return [...combined]
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-blue-50 text-xl text-gray-600">
        Cargando curso...
      </div>
    )
  }

  const totalSections = course.sections?.length || 0
  const currentSection = course.sections?.[currentSectionIndex]
  const isLastSection = currentSectionIndex === totalSections - 1

  const handleNextSection = async () => {
    if (!isNaN(courseId) && user?.id && currentSection?.id) {
      const storageKey = `updated_sections_course_${courseId}`
      const stored = localStorage.getItem(storageKey)
      const updatedSectionIds = stored ? new Set<number>(JSON.parse(stored)) : new Set<number>()

      if (!updatedSectionIds.has(currentSection.id)) {
        try {
          console.log("🛰️ Enviando updateCourseProgress:", {
            courseId,
            userId: user.id,
            sectionId: currentSection.id,
          })

          await updateCourseProgress(courseId, user.id, currentSection.id)

          updatedSectionIds.add(currentSection.id)
          localStorage.setItem(storageKey, JSON.stringify([...updatedSectionIds]))

          if (enrollment) {
            setEnrollment({
              ...enrollment,
              idSection: currentSection.id
            })
          }

          const newsCompleted = calculateCompleted(course, enrollment)
          setCompletedSectionIds(newsCompleted)

        } catch (error) {
          console.error("❌ Error al actualizar progreso:", error)
        }
      } else {
        console.log("⏩ Sección ya actualizada anteriormente:", currentSection.id)
      }
    }

    if (isLastSection) {
      const finishedCoursesKey = "finished_courses"
      const finishedRaw = localStorage.getItem(finishedCoursesKey)
      const finishedSet = new Set<number>(finishedRaw ? JSON.parse(finishedRaw) : [])

      const lastSection = course.sections?.[course.sections.length - 1]
      const alreadyFinished = enrollment?.idSection === lastSection?.id

      if (!finishedSet.has(courseId) && !alreadyFinished) {
        finishedSet.add(courseId)
        localStorage.setItem(finishedCoursesKey, JSON.stringify([...finishedSet]))
        localStorage.setItem("course_finished", "true")
      }
      setTimeout(() => {
        router.push("/")
      }, 50)
    } else {
      setCurrentSectionIndex((prev) => prev + 1)
    }
  }

  const handlePreviousSection = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex((prev) => prev - 1)
    }
  }

  function getYouTubeEmbedUrl(url: string): string {
    const match = url.match(
      /(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/|)([\w-]{11})(?:\S+)?/,
    )
    return match ? `https://www.youtube.com/embed/${match[1]}` : url
  }

  return (
    <div className="min-h-screen bg-blue-50 py-12">
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-md">
        <h1 className="text-3xl font-bold mb-6 text-center">{course.title}</h1>

        {course.sections && course.sections.length > 0 && (
          <CourseStepper
            currentStep={currentSectionIndex + 1}
            totalSteps={course.sections.length}
            sections={course.sections}
            courseId={courseId}
            onStepClick={(index) => setCurrentSectionIndex(index)}
            completedSectionIds={completedSectionIds}
          />
        )}

        {currentSection?.content && (
          <div className="my-4">
            {currentSection.content.type === "VIDEO" && currentSection.content.url && (
              <iframe
                className="w-full h-96"
                src={getYouTubeEmbedUrl(currentSection.content.url)}
                title="Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            )}
            {currentSection.content.type === "DOCUMENT" &&
              currentSection.content.url &&
              (() => {
                let embedUrl = toAbsoluteUrl(currentSection.content.url)

                // 1) Google Drive/Docs primero: forzar /preview y SIN sandbox
                if (isGoogleDriveLike(embedUrl)) {
                  const preview = toDrivePreview(embedUrl)
                  return (
                    <iframe
                      src={preview}
                      className="w-full h-[600px] border rounded-lg shadow-md"
                      allow="autoplay; fullscreen"
                    />
                  )
                }

                // 2) Resto de tipos
                const isDocx = embedUrl?.toLowerCase().endsWith(".docx") ?? false
                const isPdf  = embedUrl?.toLowerCase().endsWith(".pdf") ?? false

                if (isDocx) {
                  // Local / misma-origen / IP privada -> render bonito en cliente
                  if (isLikelyLocal(embedUrl)) {
                    return <DocxInlineViewer url={embedUrl} />
                  }

                  // Público -> Office Viewer
                  const officeUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(embedUrl)}`
                  return (
                    <iframe
                      src={officeUrl}
                      className="w-full h-[600px] border rounded-lg shadow-md"
                      allow="autoplay"
                      sandbox="allow-scripts allow-same-origin"
                    />
                  )
                }

                if (isPdf) {
                  return (
                    <iframe
                      src={encodeURI(embedUrl)}
                      className="w-full h-[600px] border rounded-lg shadow-md"
                      allow="autoplay"
                      sandbox="allow-scripts allow-same-origin"
                    />
                  )
                }

                // Default: otro tipo de archivo por iframe
                return (
                  <iframe
                    src={embedUrl}
                    className="w-full h-[600px] border rounded-lg shadow-md"
                    allow="autoplay"
                    sandbox="allow-scripts allow-same-origin"
                  />
                )
              })()}
            {currentSection.content.type === "IMAGE" && currentSection.content.url && (
              <img
                src={currentSection.content.url || "/placeholder.svg"}
                alt="Imagen"
                className="w-full object-contain max-h-96"
              />
            )}
            {currentSection.content.type === "EXAM" && (
              <div className="space-y-6">
                {/* Widget de tiempo fijo en pantalla */}
                {(currentSection.content.timeLimit ?? 0) > 0 && !examResult && (
                  <div className="fixed right-4 top-24 z-40">
                    <div className={`rounded-xl border bg-white/90 px-4 py-2 shadow-lg backdrop-blur
                      ${timeLeftSec !== null && timeLeftSec <= 60 ? "border-red-300" :
                         timeLeftSec !== null && timeLeftSec <= 300 ? "border-amber-300" : "border-blue-300"}`}>
                      <div className="flex items-center gap-2 text-sm">
                        <Timer className="h-4 w-4" />
                        <span className="font-medium">Tiempo restante</span>
                      </div>
                      <div
                        className={`text-center text-2xl font-bold
                        ${timeLeftSec !== null && timeLeftSec <= 60 ? "text-red-600" :
                           timeLeftSec !== null && timeLeftSec <= 300 ? "text-amber-600" : "text-blue-700"}`}
                        aria-live="polite"
                      >
                        {formatSeconds(timeLeftSec ?? 0)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Encabezado + progreso */}
                <div className="flex items-start justify-between gap-4 rounded-xl border bg-white p-4 shadow-sm">
                  <div className="space-y-1">
                    <p className="text-lg font-semibold">Examen de la sección</p>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                      <span className="inline-flex items-center rounded-full border px-2.5 py-0.5">
                        {Object.values(answers).filter(s => (s?.size ?? 0) > 0).length} /
                        {currentSection.content.questions?.length ?? 0} respondidas
                      </span>
                      {(currentSection.content.timeLimit ?? 0) > 0 && (
                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5">Tiempo estricto</span>
                      )}
                    </div>
                  </div>

                  {examResult && (
                    <div className="flex items-center gap-3 rounded-lg border bg-green-50 px-3 py-2 text-green-800">
                      <Lock className="h-5 w-5" />
                      <div className="text-sm">
                        <div className="font-semibold">
                          Enviado · Puntaje: {examResult.score} / {examResult.totalQuestions}
                        </div>
                        <div className="text-green-700">Tus respuestas quedaron guardadas.</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Progreso */}
                {(() => {
                  const total = currentSection.content.questions?.length ?? 0
                  const done = Object.values(answers).filter(s => (s?.size ?? 0) > 0).length
                  const pct = total ? Math.round((done / total) * 100) : 0
                  return (
                    <div className="w-full">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                        <div className="h-2 bg-blue-600" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="mt-1 text-right text-xs text-gray-500">{pct}%</div>
                    </div>
                  )
                })()}

                {/* Pregunta por tarjeta */}
                <div className="space-y-5">
                  {currentSection.content.questions?.map((q, idx) => {
                    const selected = answers[q.id] ?? new Set<number>()
                    const resByQ = examResult?.results?.find(r => r.questionId === q.id)
                    const correctSet = new Set(resByQ?.correctOptionIds ?? [])
                    const isCorrect = resByQ?.correct ?? null

                    return (
                      <div key={q.id} className="rounded-2xl border bg-white p-5 shadow-sm">
                        {/* encabezado pregunta */}
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div className="text-sm font-semibold text-gray-900">Pregunta {idx + 1}</div>

                          {examResult ? (
                            <div className="flex items-center gap-2">
                              {/* Chip Correcta/Incorrecta */}
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs border
                                  ${isCorrect ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                              : "bg-red-50 text-red-700 border-red-200"}`}
                              >
                                {isCorrect ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                                {isCorrect ? "Correcta" : "Incorrecta"}
                              </span>

                              {/* Aciertos X/Y (ayuda en multi-respuesta) */}
                              {(() => {
                                const selectedCorrectCount = Array.from(selected).filter(id => correctSet.has(id)).length
                                const totalCorrectCount = correctSet.size
                                return (
                                  <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-600">
                                    {selectedCorrectCount}/{totalCorrectCount} correctas
                                  </span>
                                )
                              })()}
                            </div>
                          ) : null}
                        </div>

                        <p className="mb-4 text-base">{q.text}</p>

                        {/* opciones con mejor separación y dot a la IZQUIERDA */}
                        <div className="space-y-3">
                          {q.options.map(opt => {
                            const isSelected = selected.has(opt.id)
                            const isAnswerKey = correctSet.has(opt.id)

                            const selectedCorrect = isSelected && isAnswerKey
                            const missedCorrect   = !isSelected && isAnswerKey
                            const selectedIncorrect = isSelected && !isAnswerKey

                            // base sin "group" y con overrides de hover para disabled
                            let cls =
                              "relative flex items-center gap-3 rounded-xl border px-3 py-2 text-left " +
                              "transition-colors duration-150 shadow-sm focus:outline-none " +
                              "disabled:cursor-default disabled:hover:bg-white disabled:hover:shadow-sm disabled:hover:border-inherit " +
                              "disabled:dark:hover:bg-neutral-900"

                            if (!examResult) {
                              // Durante el examen (hover suave — nada de negro)
                              cls += isSelected
                                ? " border-blue-600 bg-blue-50 hover:bg-blue-100 hover:border-blue-700 hover:shadow-md"
                                : " border-gray-200 bg-white hover:bg-gray-100 hover:border-gray-300 hover:shadow-md"
                            } else {
                              // Revisión (sin hover efectivos)
                              if (selectedCorrect) {
                                cls += " border-emerald-600 bg-emerald-50 ring-2 ring-emerald-100"
                              } else if (missedCorrect) {
                                cls += " border-dashed border-emerald-500 bg-white"
                              } else if (selectedIncorrect) {
                                cls += " border-red-600 bg-red-50 ring-2 ring-red-100"
                              } else {
                                cls += " border-gray-200 bg-white opacity-80"
                              }
                              // killswitch extra por si hay CSS global que pinta hover oscuro
                              cls += " hover:!bg-white hover:!shadow-sm hover:!border-inherit dark:hover:!bg-neutral-900"
                            }

                            return (
                              <button
                                key={opt.id}
                                type="button"
                                className={cls}
                                onClick={() => toggleAnswer(q.id, opt.id)}
                                disabled={!!examResult}
                                aria-pressed={isSelected}
                              >
                                {/* ICONO IZQUIERDO */}
                                {!examResult ? (
                                  <span className={`h-3 w-3 shrink-0 rounded-full ${isSelected ? "bg-blue-600" : "bg-gray-300"}`} />
                                ) : selectedCorrect ? (
                                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                                ) : missedCorrect ? (
                                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                                ) : selectedIncorrect ? (
                                  <XCircle className="h-5 w-5 shrink-0 text-red-600" />
                                ) : (
                                  <span className="h-5 w-5 shrink-0" />
                                )}

                                {/* TEXTO */}
                                <span className="flex-1 text-left leading-relaxed">{opt.text}</span>

                                {/* BADGES (solo revisión) */}
                                {examResult && (
                                  <div className="ml-2 flex items-center gap-2">
                                    {selectedCorrect && (
                                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        Correcta (tu elección)
                                      </span>
                                    )}
                                    {missedCorrect && (
                                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        Correcta (no marcada)
                                      </span>
                                    )}
                                    {selectedIncorrect && (
                                      <span className="inline-flex items-center gap-1 rounded-full border border-red-300 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                                        <XCircle className="h-3.5 w-3.5" />
                                        Tu elección (incorrecta)
                                      </span>
                                    )}
                                  </div>
                                )}
                              </button>
                            )
                          })}
                        </div>

                        {/* hint (solo si no enviado) */}
                        {!examResult && (
                          <div className="mt-2 text-xs text-gray-500">
                            Podés marcar más de una opción.
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-between mt-8">
          <Button onClick={handlePreviousSection} disabled={currentSectionIndex === 0}>
            Anterior
          </Button>

          {currentSection.content.type === "EXAM" ? (
            examResult ? (
              <Button onClick={handleNextSection}>
                {isLastSection ? "Finalizar" : "Siguiente"}
              </Button>
            ) : (
              <Button onClick={handleSubmitExam} disabled={submittingExam}>
                {submittingExam ? "Enviando..." : "Enviar examen"}
              </Button>
            )
          ) : (
            <Button onClick={handleNextSection}>
              {isLastSection ? "Finalizar" : "Siguiente"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}