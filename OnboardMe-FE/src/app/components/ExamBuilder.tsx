"use client"

import { useState } from "react"
import type { ExamQuestion } from "@/app/models/exam"
import {
  Plus,
  Trash2,
  Timer,
  GripVertical,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
} from "lucide-react"
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd"
import { Wand2, Loader2 } from "lucide-react"
import type { Section } from "@/app/models/Section"


type ExamContentDraft = {
  type: "EXAM"
  timeLimit: number | null
  questions: ExamQuestion[]
}

type Props = {
  value: ExamContentDraft
  onChange: (next: ExamContentDraft) => void
  sourceSections?: Section[]
}

export default function ExamBuilder({ value, onChange, sourceSections = [] }: Props) {
  // ------- UI state -------
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({})

  // ------- helpers -------
  const setTimeLimit = (raw: string) => {
    const val = raw.trim()
    const num = val === "" ? null : Number(val)
    onChange({
      ...value,
      timeLimit: num !== null && Number.isFinite(num) && num >= 0 ? num : null,
    })
  }

  const isYouTube = (u: string) =>
    /(^https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|youtube-nocookie\.com)/i.test(u)
  const isDriveUrl = (u: string) =>
    /^https?:\/\/(drive\.google\.com|docs\.google\.com)\//i.test(u || "")
  const isPdfUrl = (u: string) =>
    /^https?:\/\//i.test(u || "") && /\.pdf(\?|#|$)/i.test(u || "")

  const [busy, setBusy] = useState(false)

  const stageIfNeeded = async (file: File) => {
    const fd = new FormData()
    fd.append("file", file)
    const res = await fetch("/api/files/stage", { method: "POST", body: fd })
    if (!res.ok) throw new Error("Falló el staging")
    const data = await res.json()
    return data as (
      | { kind: "fileData"; fileUri: string; mimeType: string; displayName: string }
      | { kind: "text"; text: string; displayName: string }
    )
  }

  const handleGenerate = async () => {
    try {
      setBusy(true)

      // Tomamos las secciones del wizard (sin EXAM), en el ORDEN actual
      const materials = await Promise.all(
        (sourceSections || [])
          .filter((s) => s?.content?.type && s.content.type !== "EXAM")
          .map(async (s) => {
            let url = s.content?.url || ""
            const isBlob = !!url && url.startsWith("blob:")
            let textFallback = ""
            let fileUri: string | undefined
            let mimeType: string | undefined
            let displayName: string | undefined

            if ((!url || isBlob) && s.content?.file instanceof File) {
              try {
                const staged = await stageIfNeeded(s.content.file)
                if (staged.kind === "fileData") {
                  fileUri = staged.fileUri
                  mimeType = staged.mimeType
                  displayName = staged.displayName
                  url = ""
                } else if (staged.kind === "text") {
                  textFallback = staged.text || ""
                }
              } catch {}
            }

            return {
              title: s.title,
              type: s.content!.type as "VIDEO" | "DOCUMENT" | "IMAGE",
              url,
              textFallback,
              fileUri,
              mimeType,
              displayName,
            }
          })
      )

      const hasUsableSource = materials.some(m =>
        m.fileUri ||
        (m.textFallback && m.textFallback.trim().length >= 80) ||
        (m.url && isYouTube(m.url)) ||
        (m.url && isDriveUrl(m.url)) ||
        (m.url && isPdfUrl(m.url))
      )

      if (!hasUsableSource) {
        alert(
          "Para generar preguntas ancladas al contenido:\n" +
          "• Subí los archivos reales (PDF/DOCX/PNG/JPG/MP4) en las secciones previas, o\n"
        )
        return
      }

      if (!materials.length) {
        alert("Agregá primero al menos una sección con contenido (documento/video/imagen)")
        return
      }

      const res = await fetch("/api/exams/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sections: materials,
          perSourceMin: 5,
          lang: "es"
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || "No se pudo generar el examen")
      }

      const data = await res.json()
      if (!data || !Array.isArray(data.questions)) {
        throw new Error(data?.error || "Data not found")
      }

      type InQ = {
        text: string
        type?: "SINGLE_CHOICE" | "MULTIPLE_CHOICE"
        options: string[]
        correctIndex?: number
        correctIndices?: number[]
      }

      const questions = data.questions as InQ[]

      const mapped = questions.map((q, idx) => {
        const isMulti =
          q.type === "MULTIPLE_CHOICE" ||
          Array.isArray(q.correctIndices)

        const correctSet = new Set<number>(
          isMulti
            ? (q.correctIndices ?? []).map(n => Number(n)).filter(n => Number.isInteger(n))
            : [Number(q.correctIndex)]
        )

        return {
          id: Date.now() + idx,
          text: q.text,
          type: isMulti ? "MULTIPLE_CHOICE" as const : "SINGLE_CHOICE" as const,
          options: (q.options || []).map((opt, i) => ({
            text: opt,
            correct: correctSet.has(i),
          })),
        }
      })

      // Autorrellena el borrador
      onChange({ ...value, questions: mapped })
    } catch (e: any) {
      alert(e?.message || "Error generando preguntas")
    } finally {
      setBusy(false)
    }
  }

  // Snippet de una línea para el encabezado colapsado
  const snippet = (s: string, max = 90) => {
    const t = (s || "").replace(/\s+/g, " ").trim()
    return t.length > max ? t.slice(0, max) + "…" : t
  }

  // Preguntas
  const addQuestion = () => {
    const next: ExamQuestion = {
      text: "",
      options: [
        { text: "", correct: false },
        { text: "", correct: false },
      ],
    }
    onChange({ ...value, questions: [...value.questions, next] })
  }

  const removeQuestion = (qIdx: number) => {
    const next = value.questions.filter((_, i) => i !== qIdx)
    onChange({ ...value, questions: next })
  }

  const setQuestionText = (qIdx: number, text: string) => {
    const qs = [...value.questions]
    qs[qIdx] = { ...qs[qIdx], text }
    onChange({ ...value, questions: qs })
  }

  // Opciones
  const addOption = (qIdx: number) => {
    const qs = [...value.questions]
    qs[qIdx] = {
      ...qs[qIdx],
      options: [...qs[qIdx].options, { text: "", correct: false }],
    }
    onChange({ ...value, questions: qs })
  }

  const removeOption = (qIdx: number, oIdx: number) => {
    const qs = [...value.questions]
    const opts = qs[qIdx].options.filter((_, i) => i !== oIdx)
    qs[qIdx] = { ...qs[qIdx], options: opts }
    onChange({ ...value, questions: qs })
  }

  const setOptionText = (qIdx: number, oIdx: number, text: string) => {
    const qs = [...value.questions]
    const opts = [...qs[qIdx].options]
    opts[oIdx] = { ...opts[oIdx], text }
    qs[qIdx] = { ...qs[qIdx], options: opts }
    onChange({ ...value, questions: qs })
  }

  const toggleOptionCorrect = (qIdx: number, oIdx: number) => {
    const qs = [...value.questions]
    const q = { ...qs[qIdx] }
    const isSingle = (q.type ?? 'SINGLE_CHOICE') === 'SINGLE_CHOICE'

    if (isSingle) {
      // SINGLE: solo la clickeada queda en true
      q.options = q.options.map((o, i) => ({ ...o, correct: i === oIdx }))
    } else {
      // MULTIPLE: toggle
      q.options = q.options.map((o, i) =>
        i === oIdx ? { ...o, correct: !o.correct } : o
      )
    }

    qs[qIdx] = q
    onChange({ ...value, questions: qs })
  }

  // Validación mínima por pregunta
  const issuesFor = (q: ExamQuestion) => {
    const issues: string[] = []
    if (!q.text.trim()) issues.push("Falta el enunciado.")
    if (q.options.length < 2) issues.push("Agregá al menos 2 opciones.")
    if (!q.options.some(o => o.correct)) issues.push("Marcá al menos 1 correcta.")
    if (q.options.some(o => !o.text.trim())) issues.push("Hay opciones vacías.")
    if ((q.type ?? 'SINGLE_CHOICE') === 'MULTIPLE_CHOICE') {
      const corrects = q.options.filter(o => o.correct).length
      if (corrects < 2) issues.push("Marcá al menos 2 correctas para preguntas múltiples.")
    }
    return issues
  }

  // Drag & Drop SOLO preguntas
  const reorder = <T,>(list: T[], startIndex: number, endIndex: number): T[] => {
    const result = Array.from(list)
    const [removed] = result.splice(startIndex, 1)
    result.splice(endIndex, 0, removed)
    return result
  }

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return
    const { source, destination, type } = result
    if (type !== "QUESTION") return
    onChange({
      ...value,
      questions: reorder(value.questions, source.index, destination.index),
    })
  }

  // ------- render -------
  return (
    <div className="space-y-4">
      {/* Header simple */}
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Timer className="h-4 w-4" />
            <span className="font-medium">Tiempo límite</span>
            <input
              type="number"
              min={0}
              value={value.timeLimit ?? ""}
              onChange={e => setTimeLimit(e.target.value)}
              placeholder="min"
              className="w-24 rounded border px-2 py-1"
            />
            <span className="text-xs text-gray-500">Vacío/0 = sin límite</span>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={busy || (sourceSections?.filter(s => s?.content?.type !== "EXAM").length ?? 0) === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-60"
            title="Generar preguntas automáticamente con IA"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            {busy ? "Generando..." : "Generar preguntas"}
          </button>

          <button
            type="button"
            onClick={addQuestion}
            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100"
          >
            <Plus className="h-4 w-4" />
            Agregar pregunta
          </button>
        </div>
      </div>

      {/* Lista de preguntas (drag & drop solo preguntas) */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="questions" type="QUESTION">
          {provided => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="space-y-2"
            >
              {value.questions.map((q, qIdx) => {
                const issues = issuesFor(q)
                const isCollapsed = !!collapsed[qIdx]
                return (
                  <Draggable
                    draggableId={`q-${qIdx}`}
                    index={qIdx}
                    key={`q-${qIdx}`}
                  >
                    {drag => (
                      <div
                        ref={drag.innerRef}
                        {...drag.draggableProps}
                        className={`rounded-xl border bg-white shadow-sm ${
                          isCollapsed ? "px-3 py-2" : "p-4"
                        }`}
                        onClick={
                          isCollapsed
                            ? () => setCollapsed(c => ({ ...c, [qIdx]: false }))
                            : undefined
                        }
                        role="group"
                      >
                        {/* Encabezado pregunta (compacto al colapsar) */}
                        <div
                          className={`flex items-center justify-between ${
                            isCollapsed ? "" : "mb-3"
                          }`}
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <span
                              {...drag.dragHandleProps}
                              className="cursor-grab text-gray-400 hover:text-gray-600"
                              title="Arrastrá para reordenar"
                              onClick={e => e.stopPropagation()}
                            >
                              <GripVertical className="h-4 w-4" />
                            </span>

                            <div className="text-sm font-semibold leading-none text-gray-900">
                              Pregunta {qIdx + 1}
                            </div>

                            <select
                              className="ml-3 rounded-md border px-2 py-1 text-xs"
                              value={value.questions[qIdx].type ?? 'SINGLE_CHOICE'}
                              onChange={(e) => {
                                const newType = e.target.value as 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE'
                                const qs = [...value.questions]
                                const qCopy = { ...qs[qIdx], type: newType }

                                if (newType === 'SINGLE_CHOICE') {
                                  let kept = false
                                  qCopy.options = (qCopy.options ?? []).map(o => {
                                    if (o.correct && !kept) { kept = true; return { ...o, correct: true } }
                                    return { ...o, correct: false }
                                  })
                                }

                                qs[qIdx] = qCopy
                                onChange({ ...value, questions: qs })
                              }}
                            >
                              <option value="SINGLE_CHOICE">Única respuesta</option>
                              <option value="MULTIPLE_CHOICE">Múltiples respuestas</option>
                            </select>

                            {/* Snippet del enunciado (solo colapsada) */}
                            {isCollapsed && q.text?.trim() && (
                              <span
                                className="ml-2 truncate text-xs text-gray-500 max-w-[60vw]"
                                title={q.text}
                              >
                                — {snippet(q.text, 90)}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation()
                                setCollapsed(c => ({ ...c, [qIdx]: !c[qIdx] }))
                              }}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md border text-gray-600 hover:bg-gray-50"
                              title={isCollapsed ? "Expandir" : "Colapsar"}
                            >
                              {isCollapsed ? (
                                <ChevronDown className="h-3.5 w-3.5" />
                              ) : (
                                <ChevronUp className="h-3.5 w-3.5" />
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation()
                                removeQuestion(qIdx)
                              }}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md border text-red-600 hover:bg-red-50"
                              title="Eliminar pregunta"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Cuerpo colapsable */}
                        {!isCollapsed && (
                          <>
                            {/* Enunciado */}
                            <textarea
                              value={q.text}
                              onChange={e => setQuestionText(qIdx, e.target.value)}
                              placeholder="Escribí el enunciado de la pregunta…"
                              rows={2}
                              className="w-full resize-y rounded-xl border px-3 py-2"
                            />

                            {/* Bloque Opciones (simple) */}
                            <div className="mt-4 space-y-2">
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  Opciones
                                </p>
                                <p className="text-xs text-gray-500">
                                  Agregá al menos 2. Marcá las correctas.
                                </p>
                              </div>

                              {q.options.map((o, oIdx) => (
                                <div
                                  key={`q-${qIdx}-o-${oIdx}`}
                                  className="flex items-center gap-2 rounded-xl border bg-white px-2 py-1.5 shadow-sm hover:bg-gray-50"
                                >
                                  <label className="inline-flex items-center gap-2 rounded-lg border px-2 py-1 text-sm hover:bg-emerald-50">
                                    <input
                                      type={(value.questions[qIdx].type ?? 'SINGLE_CHOICE') === 'SINGLE_CHOICE' ? 'radio' : 'checkbox'}
                                      checked={!!o.correct}
                                      onChange={() => toggleOptionCorrect(qIdx, oIdx)}
                                      className="h-4 w-4"
                                    />
                                    <span className="text-emerald-700">Correcta</span>
                                  </label>

                                  <input
                                    value={o.text}
                                    onChange={e =>
                                      setOptionText(qIdx, oIdx, e.target.value)
                                    }
                                    placeholder={`Opción ${oIdx + 1}`}
                                    className="flex-1 rounded-lg border px-3 py-1.5"
                                  />

                                  <button
                                    type="button"
                                    onClick={() => removeOption(qIdx, oIdx)}
                                    className="rounded-lg border px-2 py-1 text-red-600 hover:bg-red-50"
                                    title="Quitar opción"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              ))}

                              <div>
                                <button
                                  type="button"
                                  onClick={() => addOption(qIdx)}
                                  className="mt-1 inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
                                >
                                  <Plus className="h-4 w-4" />
                                  Agregar opción
                                </button>
                              </div>

                              {/* Hint mínimo por pregunta (solo si falta algo) */}
                              {issues.length > 0 && (
                                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                                  {issues[0]}
                                </div>
                              )}

                              {/* Guardar (colapsar) */}
                              <div className="pt-3 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setCollapsed(c => ({ ...c, [qIdx]: true }))
                                  }
                                  className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
                                  title="Guardar y colapsar"
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                  Guardar pregunta
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </Draggable>
                )
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* CTA también abajo */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={addQuestion}
          className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100"
        >
          <Plus className="h-4 w-4" />
          Agregar pregunta
        </button>
      </div>

      {/* Estado vacío */}
      {value.questions.length === 0 && (
        <div className="rounded-xl border border-dashed bg-white p-6 text-center text-sm text-gray-600">
          No hay preguntas.
        </div>
      )}
    </div>
  )
}