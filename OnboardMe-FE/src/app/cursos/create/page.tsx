"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useDropzone } from "react-dropzone"
import { useRouter } from "next/navigation"
import type { Section } from "@/app/models/Section"
import { useAuth } from "@/auth/authContext"
import { toast } from "react-toastify"
import { createCourse } from "../../services/curso.service"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import es from "date-fns/locale/es"
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd"
import {
    LockIcon,
    Trash2,
    GripVertical,
    BookOpen,
    Calendar,
    FileText,
    Tag,
    Upload,
    Plus,
    Save,
    Video,
    FileImage,
    ClipboardCheck,
    LinkIcon,
    X,
} from "lucide-react"
import ExamBuilder from "@/app/components/ExamBuilder"

export default function CreateCoursePage() {
    const router = useRouter()
    const { user } = useAuth()

    const fileInputRef = useRef<HTMLInputElement>(null)
    const sectionTitleRef = useRef<HTMLInputElement>(null);

    const flashBlue = (el: HTMLElement) => {
        el.classList.add("ring-2", "ring-blue-500");
        setTimeout(() => el.classList.remove("ring-2", "ring-blue-500"), 800);
    };

    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [expiryDate, setexpiryDate] = useState<Date>(null)
    const [area, setArea] = useState("")
    const [sections, setSections] = useState<Section[]>([])
    const [newSection, setNewSection] = useState<Section>({
        id: 0,
        title: "",
        order: "",
        idCourse: 0,
        content: {
            type: "VIDEO",
            url: "",
            file: null,
        },
    })

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        let type: "VIDEO" | "DOCUMENT" | "IMAGE" = "DOCUMENT"
        if (file.type.startsWith("image/")) type = "IMAGE"
        else if (file.type.startsWith("video/")) type = "VIDEO"

        const url = URL.createObjectURL(file)

        setNewSection({
            ...newSection,
            content: {
                ...newSection.content,
                type,
                url,
                file,
            },
        })
    }

    const handleRemoveFile = () => {
        if (newSection.content.file) {
            if (newSection.content.url && newSection.content.url.startsWith("blob:")) {
                URL.revokeObjectURL(newSection.content.url)
            }
            setNewSection({
                ...newSection,
                content: {
                    ...newSection.content,
                    file: null,
                    url: "",
                },
            })
            if (fileInputRef.current) {
                fileInputRef.current.value = ""
            }
        }
    }

    const handleRemoveSection = (index: number) => {
        const updated = sections
            .filter((_, i) => i !== index)
            .map((sec, idx) => ({
                ...sec,
                order: (idx + 1).toString(),
            }))
        setSections(updated)
    }

    const handleAddSection = () => {
        const { title, content } = newSection
        const hasFile = !!content?.file
        const isExam = content.type === "EXAM"
        const examErrors: string[] = []

        if (!title?.trim()) {
            if (sectionTitleRef.current) {
                sectionTitleRef.current.scrollIntoView({ behavior: "smooth", block: "center" })
                sectionTitleRef.current.focus()
                flashBlue(sectionTitleRef.current)
            }
            toast.warn("Completá el título de la sección.", { containerId: "app" })
            return
        }

        if (isExam) {
            const qs = content.questions ?? []
            if (qs.length === 0) examErrors.push("El examen debe tener al menos 1 pregunta.")
            qs.forEach((q, qi) => {
                if (!q.text?.trim()) examErrors.push(`La pregunta ${qi + 1} no tiene enunciado.`)
                if (!q.options || q.options.length < 2) examErrors.push(`La pregunta ${qi + 1} debe tener al menos 2 opciones.`)
                const anyCorrect = q.options?.some((o) => !!o.correct)
                if (!anyCorrect) examErrors.push(`La pregunta ${qi + 1} debe tener al menos una opción correcta.`)
                q.options?.forEach((o, oi) => {
                    if (!o.text?.trim()) examErrors.push(`La opción ${oi + 1} de la pregunta ${qi + 1} está vacía.`)
                })
            })
        }

        if (!title || !content?.type || (!isExam && !hasFile && !content.url) || (isExam && examErrors.length > 0)) {
            toast.warn(isExam ? examErrors[0] : "Completá todos los campos de la sección antes de agregarla.", {
                containerId: "app",
            })
            return
        }

        const newOrder = sections.length + 1
        const sectionWithOrder: Section = {
            ...newSection,
            order: newOrder.toString(),
        }

        setSections([...sections, sectionWithOrder])
        setNewSection({
            id: 0,
            title: "",
            order: "",
            idCourse: 0,
            content: {
                type: "VIDEO",
                url: "",
                file: null,
            },
        })
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        if (sections.length === 0) {
            toast.error("Debe cargar al menos una sección para el curso.", { containerId: "app" })
            return
        }

        const surveySection: Section = {
            title: "Encuesta",
            order: String(sections.length + 1),
            idCourse: 0,
            content: {
                type: "SURVEY",
                url: "",
                file: null,
                questions: [
                    {
                        type: "SINGLE_CHOICE",
                        id: 1,
                        text: "¿Qué tan satisfecho estás con el curso en general?",
                        options: [
                            { id: 1, text: "Muy satisfecho" },
                            { id: 2, text: "Bastante satisfecho" },
                            { id: 3, text: "Algo satisfecho" },
                            { id: 4, text: "Poco satisfecho" },
                            { id: 5, text: "Nada satisfecho" },
                        ],
                    },
                    {
                        type: "SINGLE_CHOICE",
                        id: 2,
                        text: "¿El contenido fue claro, útil y bien estructurado?",
                        options: [
                            { id: 1, text: "Si" },
                            { id: 2, text: "No" },
                        ],
                    },
                    {
                        type: "SINGLE_CHOICE",
                        id: 3,
                        text: "¿Qué tan efectivo fue el instructor al enseñar el material?",
                        options: [
                            { id: 1, text: "Muy efectivo" },
                            { id: 2, text: "Bastante efectivo" },
                            { id: 3, text: "Algo efectivo" },
                            { id: 4, text: "Poco efectivo" },
                            { id: 5, text: "Nada efectivo" },
                        ],
                    },
                    {
                        type: "SINGLE_CHOICE",
                        id: 4,
                        text: "¿Qué tan satisfecho estas con tu Buddy asignado hasta el momento?",
                        options: [
                            { id: 1, text: "Muy satisfecho" },
                            { id: 2, text: "Bastante satisfecho" },
                            { id: 3, text: "Algo satisfecho" },
                            { id: 4, text: "Poco satisfecho" },
                            { id: 5, text: "Nada satisfecho" },
                        ],
                    },
                ],
                id: 0,
                contentId: 0,
                sectionId: 0,
            },
        }
        setSections([...sections, surveySection])

        try {
            const processed: Section[] = []
            for (const s of sections) {
                const content = { ...s.content }
                if (content.file) {
                    const formData = new FormData()
                    formData.append("file", content.file)
                    const res = await fetch("/api/upload", {
                        method: "POST",
                        body: formData,
                    })
                    if (res.ok) {
                        const data = await res.json()
                        content.url = `http://localhost:3000${data.url}`
                    }
                    content.file = null
                }

                processed.push({ ...s, content })
            }
            processed.push(surveySection)
            await createCourse({
                title,
                description,
                expiryDate: new Date(expiryDate),
                createdBy: user,
                area,
                sections: processed,
                enrollments: [],
            })

            toast.success("Curso creado con éxito 🎉", { containerId: "app" })
            router.push("/cursos")
        } catch (error) {
            toast.error("Error al crear el curso", { containerId: "app" })
            console.error(error)
        }
    }

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: (acceptedFiles) => {
            const file = acceptedFiles[0]
            if (!file) return
            const type = file.type.startsWith("image/") ? "IMAGE" : file.type.startsWith("video/") ? "VIDEO" : "DOCUMENT"
            const url = URL.createObjectURL(file)
            setNewSection({
                ...newSection,
                content: {
                    ...newSection.content,
                    type,
                    file,
                    url,
                },
            })
        },
        multiple: false,
        accept: {
            "video/*": [],
            "image/*": [],
            "application/pdf": [],
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [],
        },
    })

    const getContentIcon = (type: string) => {
        switch (type) {
            case "VIDEO":
                return <Video className="h-4 w-4" />
            case "IMAGE":
                return <FileImage className="h-4 w-4" />
            case "DOCUMENT":
                return <FileText className="h-4 w-4" />
            case "EXAM":
                return <ClipboardCheck className="h-4 w-4" />
            default:
                return <FileText className="h-4 w-4" />
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="space-y-6">
                    {/* Header */}
                    <div className="bg-white/80 backdrop-blur rounded-xl shadow-lg border-0 p-6">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                                <BookOpen className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Crear nuevo curso</h1>
                                <p className="text-gray-600 text-sm mt-0.5">Configurá el contenido y estructura del curso</p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Información básica */}
                        <div className="bg-white/80 backdrop-blur rounded-xl shadow-lg border-0">
                            <div className="p-5 pb-3 border-b border-gray-200">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-blue-600" />
                                    <h2 className="text-lg md:text-xl font-semibold text-gray-900">Información básica</h2>
                                </div>
                            </div>

                            <div className="p-5 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Título */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Título del curso</label>
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            required
                                            placeholder="Ingresá el título del curso"
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                        />
                                    </div>

                                    {/* Fecha de finalización */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                                            <Calendar className="h-4 w-4" />
                                            Fecha de finalización
                                        </label>
                                        <DatePicker
                                            selected={expiryDate}
                                            onChange={(date: Date) => setexpiryDate(date)}
                                            dateFormat="dd/MM/yyyy"
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer transition-all"
                                            placeholderText="Seleccioná una fecha"
                                            showPopperArrow={false}
                                            wrapperClassName="w-full"
                                            locale={es}
                                            minDate={new Date(new Date().setDate(new Date().getDate() + 1))}
                                        />
                                    </div>

                                    {/* Área */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                                            <Tag className="h-4 w-4" />
                                            Área
                                        </label>
                                        <select
                                            value={area}
                                            onChange={(e) => setArea(e.target.value)}
                                            required
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                        >
                                            <option value="">Seleccioná un área</option>
                                            <option value="IT">IT</option>
                                            <option value="FINANZAS">Finanzas</option>
                                            <option value="SEGURIDAD">Seguridad</option>
                                            <option value="RRHH">RRHH</option>
                                            <option value="IA">Inteligencia Artificial</option>
                                            <option value="ADMINISTRATIVO">Administrativo</option>
                                            <option value="GERENCIAL">Gerencial</option>
                                            <option value="SOPORTE">Soporte</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Descripción */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Descripción</label>
                                    <textarea
                                        rows={4}
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        required
                                        placeholder="Escribí una descripción del curso"
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Agregar sección */}
                        <div className="bg-white/80 backdrop-blur rounded-xl shadow-lg border-0">
                            <div className="p-5 pb-3 border-b border-gray-200">
                                <div className="flex items-center gap-2">
                                    <Plus className="h-5 w-5 text-purple-600" />
                                    <h2 className="text-lg md:text-xl font-semibold text-gray-900">Agregar sección</h2>
                                </div>
                            </div>

                            <div className="p-5 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                    {/* Título de sección */}
                                    <div className="md:col-span-9">
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Título de la sección</label>
                                        <input
                                            ref={sectionTitleRef}
                                            type="text"
                                            placeholder="Ej: Introducción, Módulo 1, etc."
                                            value={newSection.title}
                                            onChange={(e) => setNewSection({ ...newSection, title: e.target.value })}
                                            aria-invalid={!newSection.title?.trim()}
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                                        />
                                    </div>

                                    {/* Tipo de contenido */}
                                    <div className="md:col-span-3">
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo</label>
                                        <div className="relative">
                                            <select
                                                value={newSection.content?.type}
                                                onChange={(e) => {
                                                    const t = e.target.value as any
                                                    setNewSection((prev) => ({
                                                        ...prev,
                                                        content:
                                                            t === "EXAM"
                                                                ? {
                                                                    type: "EXAM",
                                                                    url: "",
                                                                    file: null,
                                                                    timeLimit: null,
                                                                    questions: [
                                                                        {
                                                                            text: "",
                                                                            type: "SINGLE_CHOICE",
                                                                            options: [
                                                                                { text: "", correct: false },
                                                                                { text: "", correct: false },
                                                                            ],
                                                                        },
                                                                    ],
                                                                }
                                                                : {
                                                                    ...prev.content,
                                                                    type: t,
                                                                    url: "",
                                                                    file: null,
                                                                    timeLimit: undefined,
                                                                    questions: undefined,
                                                                },
                                                    }))
                                                }}
                                                disabled={!!newSection.content?.file}
                                                className="w-full h-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                                            >
                                                <option value="VIDEO">Video</option>
                                                <option value="DOCUMENT">Documento</option>
                                                <option value="IMAGE">Imagen</option>
                                                <option value="EXAM">Examen</option>
                                            </select>
                                            {!!newSection.content?.file && (
                                                <LockIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                            )}
                                        </div>
                                    </div>

                                    {newSection.content?.type !== "EXAM" && (
                                        <>
                                            {/* Drop zone */}
                                            <div className="md:col-span-12">
                                                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                                                    <Upload className="h-4 w-4" />
                                                    Cargar archivo
                                                </label>
                                                <div
                                                    {...getRootProps({
                                                        className: `border-2 border-dashed rounded-xl p-8 text-center transition cursor-pointer
                              ${isDragActive ? "border-purple-500 bg-purple-50 text-purple-700" : "border-gray-300 text-gray-600 hover:border-purple-400 hover:bg-purple-50"}`,
                                                    })}
                                                >
                                                    <input {...getInputProps()} />
                                                    <Upload
                                                        className={`h-8 w-8 mx-auto mb-2 ${isDragActive ? "text-purple-500" : "text-gray-400"}`}
                                                    />
                                                    <p className="font-medium text-sm mb-1">
                                                        {isDragActive
                                                            ? "Soltá el archivo aquí"
                                                            : "Arrastrá un archivo aquí o hacé clic para examinar"}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        Formatos: PDF, DOCX, imágenes (PNG, JPG), videos (MP4, etc.)
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Archivo cargado */}
                                            {newSection.content?.file && (
                                                <div className="md:col-span-12">
                                                    <div className="rounded-xl bg-green-50 border border-green-200 p-4">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                                                                    {getContentIcon(newSection.content.type)}
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-medium text-green-900">{newSection.content.file.name}</p>
                                                                    <p className="text-xs text-green-700">
                                                                        {(newSection.content.file.size / 1024 / 1024).toFixed(2)} MB
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={handleRemoveFile}
                                                                className="p-2 rounded-lg hover:bg-red-100 text-red-600 transition-colors"
                                                                title="Eliminar archivo"
                                                            >
                                                                <X className="h-5 w-5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* URL alternativa */}
                                            {["VIDEO", "DOCUMENT", "IMAGE"].includes(newSection.content?.type) &&
                                                !newSection.content?.file && (
                                                    <div className="md:col-span-12">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <div className="h-px flex-1 bg-gray-300"></div>
                                                            <span className="text-sm text-gray-500 font-medium">ó ingresá una URL</span>
                                                            <div className="h-px flex-1 bg-gray-300"></div>
                                                        </div>
                                                        <div className="relative">
                                                            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                            <input
                                                                type="text"
                                                                placeholder="https://youtube.com/"
                                                                value={newSection.content.url || ""}
                                                                onChange={(e) =>
                                                                    setNewSection({
                                                                        ...newSection,
                                                                        content: {
                                                                            ...newSection.content,
                                                                            url: e.target.value,
                                                                        },
                                                                    })
                                                                }
                                                                className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                        </>
                                    )}

                                    {/* ExamBuilder */}
                                    {newSection.content?.type === "EXAM" && newSection.content.questions && (
                                        <div className="md:col-span-12">
                                            <ExamBuilder
                                                value={{
                                                    type: "EXAM",
                                                    timeLimit: newSection.content.timeLimit ?? null,
                                                    questions: newSection.content.questions,
                                                }}
                                                onChange={(next) =>
                                                    setNewSection((prev) => ({
                                                        ...prev,
                                                        content: { ...prev.content, ...next },
                                                    }))
                                                }
                                                sourceSections={sections}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Botón agregar */}
                                <div className="flex justify-end pt-2">
                                    <button
                                        type="button"
                                        onClick={handleAddSection}
                                        disabled={
                                            newSection.content?.type === "EXAM" &&
                                            (!newSection.content?.questions || newSection.content.questions.length === 0)
                                        }
                                        className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed font-medium shadow-sm"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Agregar sección
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Lista de secciones */}
                        {sections.length > 0 && (
                            <div className="bg-white/80 rounded-xl shadow-lg border-0">
                                <div className="p-5 pb-3 border-b border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <BookOpen className="h-5 w-5 text-emerald-600" />
                                            <h2 className="text-lg md:text-xl font-semibold text-gray-900">Secciones del curso</h2>
                                        </div>
                                        <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium">
                                            {sections.length} {sections.length === 1 ? "sección" : "secciones"}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5">
                                    <DragDropContext
                                        onDragEnd={(result: DropResult) => {
                                            if (!result.destination) return

                                            const reordered = Array.from(sections)
                                            const [removed] = reordered.splice(result.source.index, 1)
                                            reordered.splice(result.destination.index, 0, removed)

                                            const updated = reordered.map((sec, idx) => ({
                                                ...sec,
                                                order: (idx + 1).toString(),
                                            }))

                                            setSections(updated)
                                        }}
                                    >
                                        <Droppable droppableId="sections">
                                            {(provided) => (
                                                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                                                    {sections.map((s, index) => (
                                                        <Draggable key={index.toString()} draggableId={index.toString()} index={index}>
                                                            {(provided, snapshot) => (
                                                                <div
                                                                    ref={provided.innerRef}
                                                                    {...provided.draggableProps}
                                                                    className={`group rounded-xl border bg-white hover:shadow-md transition-all ${
                                                                        snapshot.isDragging
                                                                            ? "shadow-lg border-purple-300 bg-purple-50"
                                                                            : "border-gray-200 hover:border-purple-200"
                                                                    }`}
                                                                >
                                                                    <div className="p-4 flex items-center gap-4">
                                                                        {/* Drag handle */}
                                                                        <div
                                                                            {...provided.dragHandleProps}
                                                                            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
                                                                        >
                                                                            <GripVertical className="h-5 w-5" />
                                                                        </div>

                                                                        {/* Order badge */}
                                                                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-sm flex-shrink-0">
                                                                            {s.order}
                                                                        </div>

                                                                        {/* Content */}
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-center gap-2 mb-1">
                                                                                <p className="font-semibold text-gray-900 truncate">{s.title}</p>
                                                                                <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                                                                                    {getContentIcon(s.content?.type)}
                                                                                    <span>{s.content?.type}</span>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                                {s.content?.url && !s.content?.file && (
                                                                                    <span className="inline-flex items-center gap-1 truncate max-w-md">
                                            <LinkIcon className="h-3 w-3 flex-shrink-0" />
                                                                                        {s.content.url}
                                          </span>
                                                                                )}
                                                                                {s.content?.file && (
                                                                                    <span className="inline-flex items-center gap-1">
                                            <Upload className="h-3 w-3" />
                                                                                        {s.content.file.name}
                                          </span>
                                                                                )}
                                                                                {s.content?.type === "EXAM" && s.content?.questions && (
                                                                                    <span className="inline-flex items-center gap-1">
                                            <ClipboardCheck className="h-3 w-3" />
                                                                                        {s.content.questions.length} pregunta
                                                                                        {s.content.questions.length !== 1 ? "s" : ""}
                                          </span>
                                                                                )}
                                                                                {s.content?.type === "EXAM" && (s.content.timeLimit ?? 0) > 0 && (
                                                                                    <span className="inline-flex items-center gap-1">
                                            · {s.content.timeLimit} min
                                          </span>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        {/* Delete button */}
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleRemoveSection(index)}
                                                                            className="p-2 rounded-lg hover:bg-red-100 text-red-600 transition-colors flex-shrink-0"
                                                                            title="Eliminar sección"
                                                                        >
                                                                            <Trash2 className="h-5 w-5" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </Draggable>
                                                    ))}
                                                    {provided.placeholder}
                                                </div>
                                            )}
                                        </Droppable>
                                    </DragDropContext>
                                </div>
                            </div>
                        )}

                        {/* Botón guardar */}
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold px-8 py-3 rounded-xl transition shadow-lg hover:shadow-xl"
                            >
                                <Save className="h-5 w-5" />
                                Guardar curso
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
