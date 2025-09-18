"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useDropzone } from "react-dropzone"
import { useRouter } from "next/navigation"
import type { Section } from "@/app/models/Section"
import { useAuth } from "@/auth/authContext"
import { toast } from "react-toastify"
import { createCourse } from "../../services/curso.service"
import "react-toastify/dist/ReactToastify.css"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import es from "date-fns/locale/es"
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd"
import { LockIcon } from "lucide-react"
import ExamBuilder from "@/app/components/ExamBuilder"


export default function CreateCoursePage() {
  const router = useRouter()
  const { user } = useAuth()

  const fileInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [expiryDate, setexpiryDate] = useState<Date>(null)
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

  const handleAddSection = () => {
    const { title, content } = newSection
    const hasFile = !!content?.file
    const isExam = content.type === "EXAM"
    const examErrors: string[] = []

    if (isExam) {
      const qs = content.questions ?? []
      if (qs.length === 0) examErrors.push("El examen debe tener al menos 1 pregunta.")
      qs.forEach((q, qi) => {
        if (!q.text?.trim()) examErrors.push(`La pregunta ${qi + 1} no tiene enunciado.`)
        if (!q.options || q.options.length < 2) examErrors.push(`La pregunta ${qi + 1} debe tener al menos 2 opciones.`)
        const anyCorrect = q.options?.some(o => !!o.correct)
        if (!anyCorrect) examErrors.push(`La pregunta ${qi + 1} debe tener al menos una opción correcta.`)
        q.options?.forEach((o, oi) => {
          if (!o.text?.trim()) examErrors.push(`La opción ${oi + 1} de la pregunta ${qi + 1} está vacía.`)
        })
      })
    }

    if (
      !title ||
      !content?.type ||
      (!isExam && !hasFile && !content.url) ||
      (isExam && examErrors.length > 0)
    ) {
      toast.warn(isExam ? examErrors[0] : "Completá todos los campos de la sección antes de agregarla.")
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
      toast.error("Debe cargar al menos una sección para el curso.")
      return
    }

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
      await createCourse({
        title,
        description,
        expiryDate: new Date(expiryDate),
        createdBy: user,
        sections: processed,
        enrollments: [],
      })

      toast.success("Curso creado con éxito 🎉")
      router.push("/cursos")
    } catch (error) {
      toast.error("Error al crear el curso")
      console.error(error)
    }
  }

  const {
    getRootProps,
    getInputProps,
    isDragActive
  } = useDropzone({
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0]
      if (!file) return
      const type = file.type.startsWith("image/")
        ? "IMAGE"
        : file.type.startsWith("video/")
        ? "VIDEO"
        : "DOCUMENT"
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
      'video/*': [],
      'image/*': [],
      'application/pdf': [],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [],
    },
  })

  return (
    <div className="max-w-5xl mx-auto p-8 mt-10 bg-gray-50 rounded-3xl shadow-xl">
      <h1 className="text-4xl font-bold text-blue-700 text-center mb-10">
        <i className="pi pi-plus-circle mr-2 text-4xl" />
        Crear nuevo curso
      </h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <label className="block text-gray-800 font-semibold mb-2">Título del curso</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <label className="block text-gray-800 font-semibold mb-2 cursor-pointer">Fecha de finalización</label>
            <DatePicker
              selected={expiryDate}
              onChange={(date: Date) => setexpiryDate(date)}
              dateFormat="dd/MM/yyyy"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
              placeholderText="Seleccioná una fecha"
              showPopperArrow={false}
              wrapperClassName="w-full"
              locale={es}
              minDate={new Date(new Date().setDate(new Date().getDate() + 1))}
            />
          </div>

          <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border">
            <label className="block text-gray-800 font-semibold mb-2">Descripción</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>

        {/* Secciones */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-2xl font-semibold text-blue-700 mb-4">Agregar sección</h2>

          <div className="grid grid-cols-1 md:grid-cols-12 md:items-center gap-4">
            <div className="md:col-span-9">
              <input
                type="text"
                placeholder="Título"
                value={newSection.title}
                onChange={(e) => setNewSection({ ...newSection, title: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div className="relative w-full h-full md:col-span-3">
              <select
                value={newSection.content?.type}
                onChange={(e) => {
                  const t = e.target.value as any
                  setNewSection((prev) => ({
                    ...prev,
                    content: t === "EXAM"
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
                className="w-full h-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 pr-10"
              >
                <option value="VIDEO">Video</option>
                <option value="DOCUMENT">Documento</option>
                <option value="IMAGE">Imagen</option>
                <option value="EXAM">Examen</option>
              </select>
              {!!newSection.content?.file && (
                <LockIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              )}
            </div>

            {newSection.content?.type !== "EXAM" && (
              <>
                <div className="md:col-span-12">
                  <div
                    {...getRootProps({
                      className: `border-dashed border-2 p-6 rounded-xl text-center transition cursor-pointer
                        ${isDragActive ? 'border-blue-500 bg-blue-100 text-blue-700' : 'border-gray-300 text-gray-600 hover:border-blue-400 hover:bg-blue-50'}`
                    })}
                  >
                    <input {...getInputProps()} />
                    <p className="mb-1 font-semibold text-sm">
                      {isDragActive ? 'Soltá el archivo para cargarlo' : 'Arrastrá un archivo aquí o hacé clic para examinar'}
                    </p>
                    <p className="text-xs text-gray-400">Formatos permitidos: PDF, DOCX, imágenes, videos</p>
                  </div>
                </div>

                {newSection.content?.file && (
                  <div className="md:col-span-12 w-full bg-gray-50 border border-gray-300 rounded-lg p-4 mt-2 flex flex-col">
                    <div className="flex justify-between items-center mt-0">
                      <p className="text-sm text-gray-600 truncate">
                        Archivo cargado: <strong>{newSection.content.file.name}</strong>
                      </p>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="ml-4 text-red-600 hover:underline text-sm"
                      >
                        Eliminar archivo
                      </button>
                    </div>
                  </div>
                )}

                {["VIDEO", "DOCUMENT", "IMAGE"].includes(newSection.content?.type) && !newSection.content?.file && (
                  <div className="md:col-span-12 mt-0">
                    <div className="flex flex-col items-center w-full gap-2">
                        <span className="text-center text-gray-500 text-sm">ó</span>
                      <input
                        type="text"
                        placeholder="URL de contenido"
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
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                  </div>
                )}
              </>
            )}

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

          <div className="mt-4 text-right">
            <button
              type="button"
              onClick={handleAddSection}
              disabled={
                newSection.content?.type === "EXAM" &&
                (!newSection.content?.questions || newSection.content.questions.length === 0)
              }
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition disabled:opacity-60"
            >
              Agregar sección +
            </button>
          </div>
        </div>

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
              <div {...provided.droppableProps} ref={provided.innerRef} className="flex flex-col gap-4">
                {sections.map((s, index) => (
                  <Draggable key={index.toString()} draggableId={index.toString()} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="border border-gray-300 p-4 rounded-lg bg-white hover:bg-blue-50 cursor-move transition-shadow"
                      >
                        <p className="font-semibold text-blue-800">
                          {s.order}. {s.title}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Tipo: {s.content?.type} {s.content?.url && ` | URL: ${s.content.url}`}
                          {s.content?.file && ` | Archivo: ${s.content.file.name}`}
                          {s.content?.type === "EXAM" && s.content?.questions && ` | ${s.content.questions.length} pregunta(s)`}
                          {s.content?.type === "EXAM" && (s.content.timeLimit ?? 0) > 0 && ` | ${s.content.timeLimit} min`}
                        </p>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        <div className="text-right">
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-3 rounded-xl transition"
          >
            Guardar curso
          </button>
        </div>
      </form>
    </div>
  )
}