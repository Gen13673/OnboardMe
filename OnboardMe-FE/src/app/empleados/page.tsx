"use client"

import { useEffect, useState, ChangeEvent } from "react"
import { Badge } from "@/app/components/ui/badge"
import { Users, UserPlus, Mail, Settings, Search, UploadCloud } from 'lucide-react'
import type { User } from "../models/User"
import type { Course } from "../models/Course"
import { BuddyCombobox, type Buddy } from "@/app/components/BuddyCombobox";
import { getCoursesByUser, getCourseProgress } from "../services/curso.service"
import { assignBuddy, getUsers, uploadUsersCsv } from "../services/usuario.service"
import { Button } from "@/app/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog"
import { Label } from "@/app/components/ui/label"
import { RoleName } from "@/auth/permissions"
import { toast } from "react-toastify"

// Extender el tipo Course para incluir la propiedad de progreso
interface CourseWithProgress extends Course {
  progress?: number // El progreso del curso, opcional
}

export default function OnboardingManagement() {
  const [employees, setEmployees] = useState<User[]>()
  const [userCourses, setUserCourses] = useState<Record<string, CourseWithProgress[]>>({})
  const [selectedEmployees, setSelectedEmployees] = useState<Set<number>>(new Set())
  const [searchTerm, setSearchTerm] = useState("")
  const [isAssignBuddyOpen, setIsAssignBuddyOpen] = useState(false)
  const [availableBuddies, setAvailableBuddies] = useState<User[]>([])
  const [selectedBuddy, setSelectedBuddy] = useState<User | null>(null)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [csvErrors, setCsvErrors] = useState<string[]>([])
  const [csvLogs, setCsvLogs] = useState<{ line: number, message: string, success: boolean }[]>([]);



  useEffect(() => {
    const fetchEmployees = async () => {
      const response = await getUsers()
      setEmployees(response)
      const buddies = response.filter((employee: User) => employee.role.name === RoleName.BUDDY)
      setAvailableBuddies(buddies)
      response.forEach((employee: User) => {
        fetchCourses(employee.id)
      })
    }

    const fetchCourses = async (userId: number) => {
      try {
        const coursesData = await getCoursesByUser(userId)
        const coursesWithProgress = await Promise.all(
          coursesData.map(async (course) => {
            const progress = await getCourseProgress(course.id, userId)
            return { ...course, progress } as CourseWithProgress
          }),
        )
        setUserCourses((prev) => ({ ...prev, [userId]: coursesWithProgress }))
      } catch (error) {
        console.error("Error fetching courses or progress:", error)
      }
    }

    fetchEmployees()
  }, [])

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleProcessFile = async () => {
    if (!file) {
      toast.info("Por favor seleccioná un archivo primero.");
      return;
    }

    // Validación de extensión
    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    if (fileExtension !== "csv") {
      setCsvLogs([{ line: NaN, message: "El formato soportado es CSV.", success: false }]);
      return;
    }

    setIsProcessing(true);
    setCsvLogs([]); // Limpiamos logs previos

    try {
      const response = await uploadUsersCsv(file); // Llama al FE que llama al BE

      // Logs de procesados correctos
      const successLogs = response.created > 0 ?
        Array.from({ length: response.created }, (_, i) => ({
          line: i + 1,
          message: "Usuario procesado correctamente",
          success: true
        })) : [];

      // Logs de errores
      const errorLogs = response.errors.map(err => ({
        line: NaN,
        message: err.replace("Error at line", "Error en la línea")
          .replace("Rol no encontrado:", "No se encontró el rol:"),
        success: false
      }));

      setCsvLogs([...successLogs, ...errorLogs]);

      toast.success(`Usuarios procesados: ${response.created} de ${response.totalRecords}`);

      // Actualizamos lista de empleados
      const updatedUsers = await getUsers();
      setEmployees(updatedUsers);

    } catch (error) {
      console.error(error);
      setCsvLogs([{ line: NaN, message: "Ocurrió un error procesando el archivo.", success: false }]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Filtrar empleados basado en el término de búsqueda
  const filteredEmployees = employees?.filter((employee) =>
    `${employee.firstName} ${employee.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []
  // Selección dentro del filtro actual
  const selectedInFilteredCount = filteredEmployees.filter(emp => selectedEmployees.has(emp.id)).length
  const allFilteredSelected = selectedInFilteredCount === filteredEmployees.length && filteredEmployees.length > 0
  const noneSelectedInFiltered = selectedInFilteredCount === 0

  const toggleEmployee = (employeeId: number) => {
    const newSelection = new Set(selectedEmployees)
    if (newSelection.has(employeeId)) {
      newSelection.delete(employeeId)
    } else {
      newSelection.add(employeeId)
    }
    setSelectedEmployees(newSelection)
  }

  const selectAllEmployees = () => {
    if (filteredEmployees.length === 0) return

    const newSelection = new Set(selectedEmployees)

    if (noneSelectedInFiltered) {
      // No hay seleccionados dentro del filtro -> seleccionar todos los filtrados
      filteredEmployees.forEach(emp => newSelection.add(emp.id))
    } else if (allFilteredSelected) {
      // Todos los filtrados están seleccionados -> deseleccionar todos los filtrados
      filteredEmployees.forEach(emp => newSelection.delete(emp.id))
    } else {
      // Hay algunos seleccionados dentro del filtro -> deseleccionar solo esos seleccionados
      filteredEmployees.forEach(emp => {
        if (newSelection.has(emp.id)) newSelection.delete(emp.id)
      })
    }

    setSelectedEmployees(newSelection)
  }

  const assignBuddyToSelected = async () => {
    if (!selectedBuddy || selectedEmployees.size === 0) {
      toast.info("Elegí al menos un empleado y un buddy.")
      return
    }

    const ids = Array.from(selectedEmployees)
    const buddyFullName = `${selectedBuddy.firstName} ${selectedBuddy.lastName ?? ""}`.trim()

    const duplicates = ids.filter((employeeId) => {
      const emp = employees?.find((e) => e.id === employeeId)
      return emp?.buddy?.id === selectedBuddy.id
    })

    duplicates.forEach((employeeId) => {
      const emp = employees?.find((e) => e.id === employeeId)
      const employeeName = emp ? `${emp.firstName} ${emp.lastName ?? ""}`.trim() : `Empleado #${employeeId}`
      toast.warn(`${employeeName} ya tiene asignado ${buddyFullName}.`, {
        toastId: `buddy-dup-${employeeId}-${selectedBuddy.id}`,
      })
    })

    const targets = ids.filter((id) => !duplicates.includes(id))

    if (targets.length === 0) return

    try {
      const results = await Promise.allSettled(
        targets.map(async (employeeId) => {
          await assignBuddy(employeeId, selectedBuddy.id)
          return employeeId
        })
      )

      results.forEach((res, idx) => {
        const employeeId = targets[idx]
        const emp = employees?.find((e) => e.id === employeeId)
        const employeeName = emp ? `${emp.firstName} ${emp.lastName ?? ""}`.trim() : `Empleado #${employeeId}`

        if (res.status === "fulfilled") {
          toast.success(`A ${employeeName} se le asignó correctamente ${buddyFullName}.`, {
            toastId: `assign-ok-${employeeId}-${selectedBuddy.id}`,
          })
        } else {
          const reason: any = (res as PromiseRejectedResult).reason
          const isDup =
            reason?.response?.status === 409 ||
            /ya.*asignad|already.*assign/i.test(reason?.message || "")
          if (isDup) {
            toast.warn(`${employeeName} ya tenía asignado ${buddyFullName}.`, {
              toastId: `buddy-dup-${employeeId}-${selectedBuddy.id}`,
            })
          } else {
            toast.error(`Falló la asignación de ${buddyFullName} a ${employeeName}.`)
          }
        }
      })

      const updatedUsers = await getUsers()
      setEmployees(updatedUsers)
      setSelectedEmployees(new Set())
      setIsAssignBuddyOpen(false)
      setSelectedBuddy(null)
    } catch (error) {
      console.error("Error asignando buddies:", error)
      toast.error("Ocurrió un error inesperado. Intenta nuevamente.")
    }
  }

  const getInitials = (firstName: string, lastName?: string) => {
    return `${firstName.charAt(0)}${lastName?.charAt(0) || ""}`.toUpperCase()
  }

  const getProgressPercentage = (employeeId: number) => {
    const courses = userCourses[employeeId] || []
    if (courses.length === 0) return 0

    const totalProgress = courses.reduce((sum, course) => sum + (course.progress || 0), 0)
    return Math.round(totalProgress / courses.length)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="bg-white/80 backdrop-blur rounded-xl shadow-lg border-0 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Gestión de Empleados</h1>
                <p className="text-gray-600 text-sm mt-1">Administra el onboarding y asignación de buddies</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setIsUploadModalOpen(true)}
                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
              >
                <UploadCloud className="h-4 w-" /> ALTA USUARIOS
              </Button>
            </div>

            <div className="flex items-center space-x-6 text-sm">
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">{employees?.length || 0}</div>
                <div className="text-gray-500">Empleados</div>
              </div>
              <div className="w-px h-8 bg-gray-300"></div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">{availableBuddies?.length || 0}</div>
                <div className="text-gray-500">Buddies</div>
              </div>
            </div>
          </div>
        </div>

        {/* Dialog ALTA USUARIOS */}
        <Dialog
          open={isUploadModalOpen}
          onOpenChange={(open) => {
            setIsUploadModalOpen(open);
            if (!open) setCsvLogs([]);
          }}
        >
          <DialogContent className="bg-white/95 backdrop-blur-xl border-0 shadow-2xl max-w-2xl mx-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Cargar Usuarios</DialogTitle>
              <DialogDescription className="text-gray-600">
                Arrastrá o seleccioná un archivo CSV para procesar la alta masiva de usuarios.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-4">
              <div
                className="border-dashed border-2 border-gray-300 rounded-lg h-32 flex items-center justify-center cursor-pointer hover:border-blue-400"
                onClick={() => document.getElementById("upload-input")?.click()}
              >
                {file ? (
                  <p>{file.name}</p>
                ) : (
                  <p className="text-gray-400">Arrastrá un archivo aquí o hacé click para seleccionar</p>
                )}
              </div>
              <input
                id="upload-input"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />

              {/* ⚡ Info extra sobre formatos soportados */}
              <p className="text-sm text-gray-600">
                <strong>Formato soportado:</strong> Solo se admiten archivos <code>.CSV</code>.
              </p>

              {/* ⚡ Botón para descargar ejemplo */}
              <Button
                variant="outline"
                onClick={() => {
                  const exampleCsv =
                    "Nombre,Apellido,Email,Contrasenia,Id_Rol\n" +
                    "Juan,Pérez,juan.perez@empresa.com,Password123,Empleado\n" +
                    "María,Gómez,maria.gomez@empresa.com,Password456,Buddy\n";
                  const blob = new Blob([exampleCsv], { type: "text/csv;charset=utf-8;" });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.setAttribute("download", "usuarios_ejemplo.csv");
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="bg-white/80 backdrop-blur transition-colors duration-150 hover:text-blue-700 hover:border-blue-700"
              >
                Descargar archivo de ejemplo
              </Button>

              <div className="max-h-48 overflow-y-auto border-t border-gray-200 pt-2">
                {csvLogs.length > 0 && (
                  <ul className="space-y-1">
                    {csvLogs.map((log, index) => (
                      <li
                        key={index}
                        className={`text-sm ${log.success ? "text-green-600" : "text-red-600"}`}
                      >
                        {log.message}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsUploadModalOpen(false)
                    setFile(null)
                    setCsvLogs([])
                  }}
                  className="bg-white/80 backdrop-blur transition-colors duration-150 hover:text-blue-700 hover:border-blue-700"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleProcessFile}
                  disabled={!file || isProcessing}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  {isProcessing ? "Procesando..." : "PROCESAR"}
                </Button>
              </div>
            </div>
          </DialogContent>

        </Dialog>

        {/* Employee List */}
        <div className="bg-white/80 backdrop-blur rounded-xl shadow-lg border-0">
          <div className="p-6 pb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Users className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Lista de Empleados</h2>
              </div>
              <div className="text-sm text-gray-500">
                {selectedEmployees.size} de {employees?.length || 0} seleccionados
                {searchTerm && ` (${filteredEmployees.length} mostrados)`}
              </div>
            </div>
            <p className="text-gray-600 text-sm">Gestiona el proceso de onboarding de todos los empleados</p>
          </div>

          <div className="p-6 pt-0">
            {/* Search Input */}
            <div className="mb-6">
              <Label htmlFor="employee-search" className="text-sm font-medium mb-2 block">
                Buscar empleado
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  id="employee-search"
                  type="text"
                  placeholder="Buscar por nombre o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/80 backdrop-blur border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all duration-300"
                />
              </div>
            </div>

            {/* Selection Controls */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  onClick={selectAllEmployees}
                  className="bg-white/60 backdrop-blur border border-gray-200 transition-all duration-200 hover:bg-white/90 hover:text-blue-700 hover:border-blue-600 hover:shadow-md hover:translate-y-[1px]"
                  disabled={filteredEmployees.length === 0}
                >
                  {noneSelectedInFiltered
                    ? "Seleccionar todos"
                    : allFilteredSelected
                      ? "Deseleccionar todos"
                      : `Deseleccionar seleccionados (${selectedInFilteredCount})`}
                </Button>
                {selectedEmployees.size > 0 && (
                  <span className="text-sm text-gray-600">
                    {selectedEmployees.size} empleado{selectedEmployees.size > 1 ? 's' : ''} seleccionado{selectedEmployees.size > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {selectedEmployees.size > 0 && (
                <Dialog open={isAssignBuddyOpen} onOpenChange={setIsAssignBuddyOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Asignar Buddy a Seleccionados
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white/95 backdrop-blur-xl border-0 shadow-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-semibold">
                        Asignar Buddy a {selectedEmployees.size} Empleado{selectedEmployees.size > 1 ? 's' : ''}
                      </DialogTitle>
                      <DialogDescription className="text-gray-600">
                        Selecciona un buddy para asignar a todos los empleados seleccionados
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 pt-4">
                      {/* Lista de empleados seleccionados */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Empleados seleccionados:</Label>
                        <div className="max-h-32 overflow-y-auto bg-gray-50 rounded-lg p-3 space-y-2">
                          {employees?.filter(emp => selectedEmployees.has(emp.id)).map(employee => (
                            <div key={employee.id} className="flex items-center space-x-2 text-sm">
                              <div className="h-6 w-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-bold">
                                  {getInitials(employee.firstName, employee.lastName)}
                                </span>
                              </div>
                              <span>{employee.firstName} {employee.lastName}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="buddy" className="text-sm font-medium">
                          Buddy a Asignar
                        </Label>
                        <BuddyCombobox
                          buddies={availableBuddies}
                          value={selectedBuddy}
                          onChange={(b) => setSelectedBuddy(b)}
                          placeholder="Seleccionar buddy"
                        />
                      </div>

                      <div className="flex justify-end gap-3 pt-4">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsAssignBuddyOpen(false)
                            setSelectedBuddy(null)
                          }}
                          className="bg-white/80 backdrop-blur transition-colors duration-150 hover:text-blue-700 hover:border-blue-700"
                        >
                          Cancelar
                        </Button>
                        <Button
                          onClick={assignBuddyToSelected}
                          disabled={!selectedBuddy}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                        >
                          Confirmar Asignación
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            <div className="space-y-4">
              {filteredEmployees.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg font-medium">
                    {searchTerm ? "No se encontraron empleados" : "No hay empleados disponibles"}
                  </p>
                  {searchTerm && (
                    <p className="text-gray-400 text-sm mt-2">
                      Intenta con un término de búsqueda diferente
                    </p>
                  )}
                </div>
              ) : (
                filteredEmployees.map((employee) => {
                  const progress = getProgressPercentage(employee.id)
                  const isSelected = selectedEmployees.has(employee.id)
                  return (
                    <div
                      key={employee.id}
                      className={`group rounded-lg border p-6 transition-all duration-300 cursor-pointer ${isSelected
                        ? "bg-blue-50 border-blue-300 shadow-md"
                        : "bg-white/60 backdrop-blur border-gray-200/50 hover:shadow-lg hover:bg-white/80"
                        }`}
                      onClick={() => toggleEmployee(employee.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleEmployee(employee.id)}
                              className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="relative">
                              <div className="h-14 w-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                                <span className="text-white text-lg font-bold">
                                  {getInitials(employee.firstName, employee.lastName)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex-1">
                            <h3 className={`text-lg font-semibold ${isSelected ? "text-blue-900" : "text-gray-900"}`}>
                              {employee.firstName} {employee.lastName}
                            </h3>
                            <div className="flex items-center space-x-2 mt-1">
                              <Mail className="h-4 w-4 text-gray-400" />
                              <p className="text-sm text-gray-600">{employee.email}</p>
                            </div>
                            <div className="flex items-center gap-3 mt-2">
                              {employee.role && (
                                <Badge
                                  title="Rol"
                                  variant="outline"
                                  className="text-xs border transition-colors duration-150 hover:bg-black/10"
                                >
                                  {employee.role.name}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-6">
                          <div className="text-right space-y-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-700">Buddy:</span>
                              <span className="text-sm text-gray-900">
                                {employee.buddy?.firstName && employee.buddy?.lastName
                                  ? `${employee.buddy.firstName} ${employee.buddy.lastName}`
                                  : "Sin asignar"}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-700">Cursos:</span>
                              <span className="text-sm text-gray-900">{userCourses[employee.id]?.length || 0}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-700">Progreso:</span>
                              <div className="flex items-center space-x-2">
                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                                <span className="text-sm text-gray-900">{progress}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
      {isProcessing && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center space-y-4">
            <svg
              className="animate-spin h-10 w-10 text-blue-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              ></path>
            </svg>
            <p className="text-lg font-semibold text-gray-800">Procesando archivo...</p>
            <div className="w-64 bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full animate-pulse"
                style={{ width: "75%" }}
              />
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
