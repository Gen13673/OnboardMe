"use client";

import { useState, useEffect, useRef } from "react";
import type { ExamQuestion } from "@/app/models/exam";
import {
    Plus,
    Trash2,
    Timer,
    GripVertical,
    ChevronDown,
    ChevronUp,
    CheckCircle2,
} from "lucide-react";
import {
    DragDropContext,
    Droppable,
    Draggable,
    type DropResult,
} from "@hello-pangea/dnd";
import { Wand2, Loader2 } from "lucide-react";
import type { Section } from "@/app/models/Section";

type ExamContentDraft = {
    type: "EXAM";
    timeLimit: number | null;
    questions: ExamQuestion[];
};

type Props = {
    value: ExamContentDraft;
    onChange: (next: ExamContentDraft) => void;
    sourceSections?: Section[];
};

export default function ExamBuilder({
                                        value,
                                        onChange,
                                        sourceSections = [],
                                    }: Props) {
    // ------- UI state -------
    const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});

    const [soundEnabled] = useState(true)

    const doneAudioRef = useRef<HTMLAudioElement | null>(null)

    const valueRef = useRef(value);
    useEffect(() => {
        valueRef.current = value;
    }, [value]);

    useEffect(() => {
        const a = new Audio()
        a.preload = "auto"
        a.src = "/sounds/done.mp3"
        a.volume = 0.6
        doneAudioRef.current = a

        return () => {
            if (doneAudioRef.current) {
                doneAudioRef.current.pause()
                doneAudioRef.current = null
            }
        }
    }, [])

    const [timeLimitLocal, setTimeLimitLocal] = useState<number | null>(value.timeLimit ?? null);

    useEffect(() => {
        setTimeLimitLocal(value.timeLimit ?? null);
    }, [value.timeLimit]);

    const setTimeLimit = (raw: string) => {
        const val = raw.trim();
        const parsed = val === "" ? null : Math.max(0, Number(val));
        setTimeLimitLocal(parsed);
        onChange({ ...value, timeLimit: parsed });
    };

    const isYouTube = (u: string) =>
        /(^https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|youtube-nocookie\.com)/i.test(
            u,
        );
    const isDriveUrl = (u: string) =>
        /^https?:\/\/(drive\.google\.com|docs\.google\.com)\//i.test(u || "");
    const isPdfUrl = (u: string) =>
        /^https?:\/\//i.test(u || "") && /\.pdf(\?|#|$)/i.test(u || "");

    const [busy, setBusy] = useState(false);

    const [showAdvanced, setShowAdvanced] = useState(false);
    const [perSource, setPerSource] = useState<Record<number, { SO: number; MO: number }>>({});

    const [customPrompt, setCustomPrompt] = useState("");

    useEffect(() => {
        setPerSource(prev => {
            const next = { ...prev };
            const usable = (sourceSections ?? []).filter(s => s?.content?.type && s.content.type !== "EXAM");
            usable.forEach((_, i) => {
                if (!next[i]) next[i] = { SO: 3, MO: 2 };
            });
            Object.keys(next).forEach(k => {
                const idx = Number(k);
                if (idx >= usable.length) delete next[idx];
            });
            return next;
        });
    }, [sourceSections]);

    const stageIfNeeded = async (file: File) => {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/files/stage", { method: "POST", body: fd });
        if (!res.ok) throw new Error("Falló el staging");
        const data = await res.json();
        return data as
            | {
            kind: "fileData";
            fileUri: string;
            mimeType: string;
            displayName: string;
        }
            | { kind: "text"; text: string; displayName: string };
    };

    const handleGenerate = async () => {

        if (soundEnabled && doneAudioRef.current) {
            doneAudioRef.current
                .play()
                .then(() => {
                    doneAudioRef.current!.pause()
                    doneAudioRef.current!.currentTime = 0
                })
                .catch(() => {})
        }

        try {
            setBusy(true);

            // Tomamos las secciones del wizard (sin EXAM), en el ORDEN actual
            const materials = await Promise.all(
                (sourceSections || [])
                    .filter((s) => s?.content?.type && s.content.type !== "EXAM")
                    .map(async (s) => {
                        let url = s.content?.url || "";
                        const isBlob = !!url && url.startsWith("blob:");
                        let textFallback = "";
                        let fileUri: string | undefined;
                        let mimeType: string | undefined;
                        let displayName: string | undefined;

                        if ((!url || isBlob) && s.content?.file instanceof File) {
                            try {
                                const staged = await stageIfNeeded(s.content.file);
                                if (staged.kind === "fileData") {
                                    fileUri = staged.fileUri;
                                    mimeType = staged.mimeType;
                                    displayName = staged.displayName;
                                    url = "";
                                } else if (staged.kind === "text") {
                                    textFallback = staged.text || "";
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
                        };
                    }),
            );

            const hasUsableSource = materials.some(
                (m) =>
                    m.fileUri ||
                    (m.textFallback && m.textFallback.trim().length >= 80) ||
                    (m.url && isYouTube(m.url)) ||
                    (m.url && isDriveUrl(m.url)) ||
                    (m.url && isPdfUrl(m.url)),
            );

            if (!hasUsableSource) {
                alert(
                    "Para generar preguntas ancladas al contenido:\n" +
                    "• Subí los archivos reales (PDF/DOCX/PNG/JPG/MP4) en las secciones previas, o\n",
                );
                return;
            }

            if (!materials.length) {
                alert(
                    "Agregá primero al menos una sección con contenido (documento/video/imagen)",
                );
                return;
            }

            const totalRequested = Object.values(perSource).reduce(
                (acc, v) => acc + (v?.SO ?? 0) + (v?.MO ?? 0),
                0
            );
            if (totalRequested === 0 && !customPrompt.trim()) {
                alert("Configuraste 0 preguntas. Ajustá alguna parámetro o escribí un prompt.");
                setBusy(false);
                return;
            }

            const byOverride = (i:number) => ((perSource[i]?.SO ?? 0) + (perSource[i]?.MO ?? 0)) > 0;

            const norm = (s: string) =>
                (s || "")
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(/\p{Diacritic}/gu, "");

            const p = norm(customPrompt.trim());

            const mentioned = (title: string, i: number) => {
                const t = norm(title);
                const n = i + 1;

                const needles = [
                    `seccion ${n}`,
                    `sección ${n}`,
                    t
                ];

                return needles.some(x => x && p.includes(x));
            };

            const allowed = materials
                .map((m, i) => ({ m, i }))
                .filter(({ m, i }) => byOverride(i) || mentioned(m.title ?? "", i));

            if (allowed.length === 0) {
                alert("No hay secciones habilitadas por override ni mencionadas en el prompt.");
                setBusy(false);
                return;
            }

            const sectionsAllowed = allowed.map(a => a.m);

            const overridesAllowed = allowed.map((a, newIdx) => ({
                index: newIdx,
                SINGLE_CHOICE: perSource[a.i]?.SO ?? 0,
                MULTIPLE_CHOICE: perSource[a.i]?.MO ?? 0,
            }));

            const strictNote =
                "\n\nRESTRICCIÓN: SOLO usa las secciones enviadas. No utilices ninguna otra fuente.";
            const promptOut = customPrompt.trim()
                ? customPrompt.trim() + strictNote
                : undefined;


            const res = await fetch("/api/exams/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sections: sectionsAllowed,
                    lang: "es",
                    overrides: overridesAllowed,
                    customPrompt: promptOut,
                }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err?.error || "No se pudo generar el examen");
            }

            const data = await res.json();
            if (!data || !Array.isArray(data.questions)) {
                throw new Error(data?.error || "Data not found");
            }

            type InQ = {
                text: string;
                type?: "SINGLE_CHOICE" | "MULTIPLE_CHOICE";
                options: string[];
                correctIndex?: number;
                correctIndices?: number[];
            };

            const questions = data.questions as InQ[];

            const mapped = (questions || []).map((q, idx) => {
                const isMulti =
                    q?.type === "MULTIPLE_CHOICE" || Array.isArray(q?.correctIndices);

                const correctSet = new Set<number>(
                    isMulti
                        ? (q?.correctIndices ?? [])
                            .map((n) => Number(n))
                            .filter((n) => Number.isInteger(n))
                        : [Number(q?.correctIndex)]
                );

                const options = Array.isArray(q?.options) ? q.options : [];
                const safeOptions = options.map((opt, i) => ({
                    text: String(opt ?? ""),
                    correct: correctSet.has(i),
                }));

                return {
                    id: Date.now() + idx,
                    text: String(q?.text ?? "").trim(),
                    type: isMulti ? ("MULTIPLE_CHOICE" as const) : ("SINGLE_CHOICE" as const),
                    options: safeOptions,
                };
            })

            // Autorrellena el borrador
            onChange({ ...valueRef.current, questions: mapped });

            //Sonido de finalización
            if (soundEnabled && doneAudioRef.current) {
                try {
                    doneAudioRef.current.currentTime = 0
                    await doneAudioRef.current.play()
                } catch {}
            }
        } catch (e: any) {
            alert(e?.message || "Error generando preguntas");
        } finally {
            setBusy(false);
        }
    };

    // Snippet de una línea para el encabezado colapsado
    const snippet = (s: string, max = 90) => {
        const t = (s || "").replace(/\s+/g, " ").trim();
        return t.length > max ? t.slice(0, max) + "…" : t;
    };

    // Preguntas
    const addQuestion = () => {
        const next: ExamQuestion = {
            text: "",
            options: [
                { text: "", correct: false },
                { text: "", correct: false },
            ],
        };
        onChange({ ...value, questions: [...value.questions, next] });
    };

    const removeQuestion = (qIdx: number) => {
        const next = value.questions.filter((_, i) => i !== qIdx);
        onChange({ ...value, questions: next });
    };

    const setQuestionText = (qIdx: number, text: string) => {
        const qs = [...value.questions];
        qs[qIdx] = { ...qs[qIdx], text };
        onChange({ ...value, questions: qs });
    };

    // Opciones
    const addOption = (qIdx: number) => {
        const qs = [...value.questions];
        qs[qIdx] = {
            ...qs[qIdx],
            options: [...qs[qIdx].options, { text: "", correct: false }],
        };
        onChange({ ...value, questions: qs });
    };

    const removeOption = (qIdx: number, oIdx: number) => {
        const qs = [...value.questions];
        const opts = qs[qIdx].options.filter((_, i) => i !== oIdx);
        qs[qIdx] = { ...qs[qIdx], options: opts };
        onChange({ ...value, questions: qs });
    };

    const setOptionText = (qIdx: number, oIdx: number, text: string) => {
        const qs = [...value.questions];
        const opts = [...qs[qIdx].options];
        opts[oIdx] = { ...opts[oIdx], text };
        qs[qIdx] = { ...qs[qIdx], options: opts };
        onChange({ ...value, questions: qs });
    };

    const toggleOptionCorrect = (qIdx: number, oIdx: number) => {
        const qs = [...value.questions];
        const q = { ...qs[qIdx] };
        const isSingle = (q.type ?? "SINGLE_CHOICE") === "SINGLE_CHOICE";

        if (isSingle) {
            // SINGLE: solo la clickeada queda en true
            q.options = q.options.map((o, i) => ({ ...o, correct: i === oIdx }));
        } else {
            // MULTIPLE: toggle
            q.options = q.options.map((o, i) =>
                i === oIdx ? { ...o, correct: !o.correct } : o,
            );
        }

        qs[qIdx] = q;
        onChange({ ...value, questions: qs });
    };

    // Validación mínima por pregunta
    const issuesFor = (q: ExamQuestion) => {
        const issues: string[] = [];
        const text = (q.text ?? "").trim();
        if (!text) issues.push("Falta el enunciado.");

        const opts = Array.isArray(q.options) ? q.options : [];
        if (opts.length < 2) issues.push("Agregá al menos 2 opciones.");
        if (!opts.some(o => !!o?.correct)) issues.push("Marcá al menos 1 correcta.");
        if (opts.some(o => !(o?.text ?? "").trim())) issues.push("Hay opciones vacías.");

        if ((q.type ?? "SINGLE_CHOICE") === "MULTIPLE_CHOICE") {
            const corrects = opts.filter(o => !!o?.correct).length;
            if (corrects < 2) issues.push("Marcá al menos 2 correctas para preguntas múltiples.");
        }
        return issues;
    };

    // Drag & Drop SOLO preguntas
    const reorder = <T,>(
        list: T[],
        startIndex: number,
        endIndex: number,
    ): T[] => {
        const result = Array.from(list);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
        return result;
    };

    const onDragEnd = (result: DropResult) => {
        if (!result.destination) return;
        const { source, destination, type } = result;
        if (type !== "QUESTION") return;
        onChange({
            ...value,
            questions: reorder(value.questions, source.index, destination.index),
        });
    };

    const canGenerate =
        !busy &&
        ((sourceSections?.filter((s) => s?.content?.type && s.content.type !== "EXAM").length ?? 0) > 0) &&
        (
            Object.values(perSource).reduce((acc, v) => acc + (v?.SO ?? 0) + (v?.MO ?? 0), 0) > 0
            || !!customPrompt.trim()
        );

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
                            value={timeLimitLocal ?? ""}
                            onChange={(e) => setTimeLimit(e.target.value)}
                            placeholder="min"
                            className="w-24 rounded border px-2 py-1 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                        />
                        <span className="text-xs text-gray-500">Vacío/0 = sin límite</span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="inline-flex overflow-hidden rounded-lg">
                            <button
                                type="button"
                                onClick={handleGenerate}
                                disabled={!canGenerate}
                                className="inline-flex items-center gap-2 bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-60 rounded-none"
                                title="Generar preguntas automáticamente con IA"
                            >
                                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                                {busy ? "Generando..." : "Generar preguntas"}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowAdvanced((v) => !v)}
                                className="inline-flex h-[34px] w-8 items-center justify-center bg-purple-600 text-white hover:bg-purple-700 border-l border-white/20 rounded-none"
                                title={showAdvanced ? "Ocultar opciones" : "Mostrar opciones"}
                            >
                                {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>
                        </div>

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
            </div>

            {showAdvanced && (
                <div className="rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50 to-white p-5 shadow-md">
                    {/* Header con icono */}
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-sm">
                            <Wand2 className="h-4 w-4 text-white" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-gray-900">Opciones Avanzadas de Generación</h3>
                            <p className="text-xs text-gray-600">Personalizá la cantidad y tipo de preguntas por sección</p>
                        </div>
                    </div>

                    {/* Info card */}
                    <div className="rounded-xl bg-blue-50 border border-blue-200 p-2.5 mb-4">
                        <div className="flex items-start gap-2">
                            <div className="h-3.5 w-3.5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-white text-[9px] font-bold">i</span>
                            </div>
                            <p className="text-xs text-blue-800">
                                <span className="font-medium"></span> Cada pregunta se genera con 4 opciones de respuesta.
                                Podés ajustar las cantidad de preguntas por sección o usar el prompt libre para mayor control.
                            </p>
                        </div>
                    </div>

                    {/* Cantidad por Sección */}
                    <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="h-6 w-6 rounded-md bg-purple-100 flex items-center justify-center text-purple-700 text-xs font-bold">
                {(sourceSections ?? []).filter((s) => s?.content?.type && s.content.type !== "EXAM").length}
              </span>
                            Cantidad por Sección
                        </h4>

                        <div className="space-y-2 max-h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-purple-200 scrollbar-track-gray-100">
                            {(sourceSections ?? [])
                                .filter((s) => s?.content?.type && s.content.type !== "EXAM")
                                .map((s, i) => {
                                    const curr = perSource[i] ?? { SO: 3, MO: 2 }
                                    const total = curr.SO + curr.MO
                                    return (
                                        <div
                                            key={i}
                                            className="group rounded-xl border border-gray-200 bg-white p-3 hover:border-purple-300 hover:shadow-sm transition-all"
                                        >
                                            {/* Todo en una línea */}
                                            <div className="flex items-center gap-3">
                                                {/* Sección info a la izquierda */}
                                                <div className="flex items-center gap-2 min-w-0 flex-shrink">
                                                    <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0">
                                                        {i + 1}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="font-medium text-sm text-gray-900 truncate">{s.title}</div>
                                                        <div className="text-xs text-gray-500">
                                                            Total: <span className="font-semibold text-purple-600">{total}</span> pregunta
                                                            {total !== 1 ? "s" : ""}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Controles a la derecha */}
                                                <div className="flex items-center gap-3 ml-auto flex-shrink-0">
                                                    {/* Única respuesta */}
                                                    <div className="flex items-center gap-2">
                                                        <label className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                                                            <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                                                            Única respuesta
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            value={curr.SO}
                                                            onChange={(e) =>
                                                                setPerSource((prev) => ({
                                                                    ...prev,
                                                                    [i]: { ...(prev[i] || { SO: 3, MO: 2 }), SO: Number(e.target.value || 0) },
                                                                }))
                                                            }
                                                            className="w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-sm font-semibold text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                                                        />
                                                    </div>

                                                    {/* Múltiples respuestas */}
                                                    <div className="flex items-center gap-2">
                                                        <label className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                                                            <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                                                            Múltiples respuestas
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            value={curr.MO}
                                                            onChange={(e) =>
                                                                setPerSource((prev) => ({
                                                                    ...prev,
                                                                    [i]: { ...(prev[i] || { SO: 3, MO: 2 }), MO: Number(e.target.value || 0) },
                                                                }))
                                                            }
                                                            className="w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-sm font-semibold text-gray-900 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                                                        />
                                                    </div>

                                                    {/* Reset button */}
                                                    <button
                                                        type="button"
                                                        onClick={() => setPerSource((prev) => ({ ...prev, [i]: { SO: 0, MO: 0 } }))}
                                                        className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-red-300 hover:text-red-600 transition-colors"
                                                    >
                                                        Ninguna de esta sección
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                        </div>
                    </div>

                    <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent my-4"></div>

                    {/* Prompt libre */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-sm">
                                <span className="text-white text-xs">✎</span>
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-gray-900">Prompt Personalizado</h4>
                                <p className="text-xs text-gray-600">Opcional: describí tus propias instrucciones</p>
                            </div>
                        </div>

                        <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
                            <p className="text-xs text-amber-800 leading-relaxed">
                                <span className="font-medium">Ejemplos de uso:</span>
                                <br />• "De la Sección 1: 3 de múltiples respuestas con 5 opciones"
                                <br />• "De la Sección 2: 2 de única respuesta" (toma 4 opciones por defecto)
                                <br />• Podés referirte a las secciones por número o por título
                            </p>
                        </div>

                        <div className="relative">
              <textarea
                  id="customPrompt"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Ej: De la Sección 1 'Introducción': 5 preguntas de única respuesta con 6 opciones. De la Sección 2: 3 de múltiples respuestas..."
                  rows={4}
                  maxLength={2000}
                  className="w-full resize-y rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all placeholder:text-gray-400"
              />
                            <div className="absolute bottom-2 right-2 text-xs text-gray-400 bg-white px-2 py-1 rounded-md">
                                {customPrompt.length}/2000
                            </div>
                        </div>
                    </div>
                    {/* Footer acciones del panel avanzado */}
                    <div className="mt-4 pt-3 border-t flex items-center justify-end">
                        <button
                            type="button"
                            onClick={handleGenerate}
                            disabled={!canGenerate}
                            className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-60 shadow-sm"
                        >
                            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                            {busy ? "Generando..." : "Generar preguntas"}
                        </button>
                    </div>
                </div>
            )}

            {/* Lista de preguntas (drag & drop solo preguntas) */}
            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="questions" type="QUESTION">
                    {(provided) => (
                        <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                            {value.questions.map((q, qIdx) => {
                                const issues = issuesFor(q)
                                const isCollapsed = !!collapsed[qIdx]
                                return (
                                    <Draggable draggableId={`q-${qIdx}`} index={qIdx} key={`q-${qIdx}`}>
                                        {(drag) => (
                                            <div
                                                ref={drag.innerRef}
                                                {...drag.draggableProps}
                                                className={`rounded-xl border bg-white shadow-sm ${isCollapsed ? "px-3 py-2" : "p-4"}`}
                                                onClick={isCollapsed ? () => setCollapsed((c) => ({ ...c, [qIdx]: false })) : undefined}
                                                role="group"
                                            >
                                                {/* Encabezado pregunta (compacto al colapsar) */}
                                                <div className={`flex items-center justify-between ${isCollapsed ? "" : "mb-3"}`}>
                                                    <div className="flex min-w-0 items-center gap-2">
                            <span
                                {...drag.dragHandleProps}
                                className="cursor-grab text-gray-400 hover:text-gray-600"
                                title="Arrastrá para reordenar"
                                onClick={(e) => e.stopPropagation()}
                            >
                              <GripVertical className="h-4 w-4" />
                            </span>

                                                        <div className="text-sm font-semibold leading-none text-gray-900">Pregunta {qIdx + 1}</div>

                                                        <select
                                                            className="ml-3 rounded-md border px-2 py-1 text-xs"
                                                            value={value.questions[qIdx].type ?? "SINGLE_CHOICE"}
                                                            onChange={(e) => {
                                                                const newType = e.target.value as "SINGLE_CHOICE" | "MULTIPLE_CHOICE"
                                                                const qs = [...value.questions]
                                                                const qCopy = { ...qs[qIdx], type: newType }

                                                                if (newType === "SINGLE_CHOICE") {
                                                                    let kept = false
                                                                    qCopy.options = (qCopy.options ?? []).map((o) => {
                                                                        if (o.correct && !kept) {
                                                                            kept = true
                                                                            return { ...o, correct: true }
                                                                        }
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
                                                            <span className="ml-2 truncate text-xs text-gray-500 max-w-[60vw]" title={q.text}>
                                — {snippet(q.text ?? "", 90)}
                              </span>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                setCollapsed((c) => ({
                                                                    ...c,
                                                                    [qIdx]: !c[qIdx],
                                                                }))
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
                                                            onClick={(e) => {
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
                                                            value={q.text ?? ""}
                                                            onChange={(e) => setQuestionText(qIdx, e.target.value)}
                                                            placeholder="Escribí el enunciado de la pregunta…"
                                                            rows={2}
                                                            className="w-full resize-y rounded-xl border px-3 py-2"
                                                        />

                                                        {/* Bloque Opciones (simple) */}
                                                        <div className="mt-4 space-y-2">
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900">Opciones</p>
                                                                <p className="text-xs text-gray-500">Agregá al menos 2. Marcá las correctas.</p>
                                                            </div>

                                                            {q.options.map((o, oIdx) => (
                                                                <div
                                                                    key={`q-${qIdx}-o-${oIdx}`}
                                                                    className="flex items-center gap-2 rounded-xl border bg-white px-2 py-1.5 shadow-sm hover:bg-gray-50"
                                                                >
                                                                    <label className="inline-flex items-center gap-2 rounded-lg border px-2 py-1 text-sm hover:bg-emerald-50">
                                                                        <input
                                                                            type={
                                                                                (value.questions[qIdx].type ?? "SINGLE_CHOICE") === "SINGLE_CHOICE"
                                                                                    ? "radio"
                                                                                    : "checkbox"
                                                                            }
                                                                            checked={!!o.correct}
                                                                            onChange={() => toggleOptionCorrect(qIdx, oIdx)}
                                                                            className="h-4 w-4"
                                                                        />
                                                                        <span className="text-emerald-700">Correcta</span>
                                                                    </label>

                                                                    <input
                                                                        value={o.text ?? ""}
                                                                        onChange={(e) => setOptionText(qIdx, oIdx, e.target.value)}
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
                                                                        setCollapsed((c) => ({
                                                                            ...c,
                                                                            [qIdx]: true,
                                                                        }))
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
