"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-toastify"
import { createUser } from "@/app/services/usuario.service"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import es from "date-fns/locale/es"
import type { Role } from "../../models/Role"
import { Users, Mail, MapPin, Phone, Calendar, Tag, Shield, Save } from "lucide-react"

export default function CreateUserPage() {
    const router = useRouter()
    const [isProcessing, setIsProcessing] = useState(false)
    const roles: Role[] = [
        { id: 2, name: "RRHH" },
        { id: 3, name: "BUDDY" },
        { id: 4, name: "EMPLEADO" },
    ]

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        area: "",
        createdDate: new Date(),
        status: 1,
        role: "",
        address: "",
        phone: "",
        birthDate: null as Date | null,
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsProcessing(true)

        try {
            const selectedRole = roles.find((r) => r.id === Number(formData.role))

            await createUser({
                ...formData,
                role: selectedRole,
                birthDate: formData.birthDate ? formData.birthDate.toISOString().split("T")[0] : null,
            })

            toast.success("Usuario creado con éxito", { containerId: "app" })
            setIsProcessing(false)
            router.push("/empleados")
        } catch (error: any) {
            setIsProcessing(false)
            const message = error.response?.data?.message
            if (error.response?.status === 401) {
                toast.error(message)
            } else {
                toast.error("Error al crear el usuario.", { containerId: "app" })
            }
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                {/* Header */}
                <div className="bg-white/80 backdrop-blur rounded-xl shadow-lg border-0 p-6">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                            <Users className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Crear nuevo usuario</h1>
                            <p className="text-gray-600 text-sm mt-0.5">Agregá un nuevo usuario al sistema</p>
                        </div>
                    </div>
                </div>

                {isProcessing && (
                    <div className="absolute inset-0 bg-white bg-opacity-70 backdrop-blur-sm z-50 flex items-center justify-center rounded-xl">
                        <div className="flex flex-col items-center gap-3">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                            <p className="text-gray-700 font-medium">Procesando...</p>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className={`space-y-6 ${isProcessing ? "pointer-events-none opacity-60" : ""}`}>
                    {/* Información personal */}
                    <div className="bg-white/80 backdrop-blur rounded-xl shadow-lg border-0">
                        <div className="p-5 pb-3 border-b border-gray-200">
                            <div className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-blue-600" />
                                <h2 className="text-lg md:text-xl font-semibold text-gray-900">Información personal</h2>
                            </div>
                        </div>

                        <div className="p-5 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Nombre */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre</label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        required
                                        placeholder="Ingresá el nombre"
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    />
                                </div>

                                {/* Apellido */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Apellido</label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        required
                                        placeholder="Ingresá el apellido"
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    />
                                </div>

                                {/* Email */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                                        <Mail className="h-4 w-4" />
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        placeholder="usuario@ejemplo.com"
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    />
                                </div>

                                {/* Fecha de nacimiento */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5 cursor-pointer">
                                        <Calendar className="h-4 w-4" />
                                        Fecha de nacimiento
                                    </label>
                                    <DatePicker
                                        selected={formData.birthDate}
                                        onChange={(date: Date) => setFormData({ ...formData, birthDate: date })}
                                        dateFormat="dd/MM/yyyy"
                                        wrapperClassName="w-full"
                                        locale={es}
                                        showPopperArrow={false}
                                        maxDate={new Date()}
                                        placeholderText="Seleccioná una fecha"
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer transition-all"
                                        portalId="datepickers-portal"
                                    />
                                </div>

                                {/* Teléfono */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                                        <Phone className="h-4 w-4" />
                                        Teléfono
                                    </label>
                                    <input
                                        type="text"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={(e) => {
                                            const onlyNumbers = e.target.value.replace(/\D/g, "")
                                            setFormData((prev) => ({ ...prev, phone: onlyNumbers }))
                                        }}
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        placeholder="Solo números"
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    />
                                </div>

                                {/* Dirección */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                                        <MapPin className="h-4 w-4" />
                                        Dirección
                                    </label>
                                    <input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        placeholder="Ingresá la dirección"
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Información organizacional */}
                    <div className="bg-white/80 backdrop-blur rounded-xl shadow-lg border-0">
                        <div className="p-5 pb-3 border-b border-gray-200">
                            <div className="flex items-center gap-2">
                                <Shield className="h-5 w-5 text-purple-600" />
                                <h2 className="text-lg md:text-xl font-semibold text-gray-900">Información organizacional</h2>
                            </div>
                        </div>

                        <div className="p-5 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Área */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                                        <Tag className="h-4 w-4" />
                                        Área
                                    </label>
                                    <select
                                        name="area"
                                        value={formData.area}
                                        onChange={handleChange}
                                        required
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
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

                                {/* Rol */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                                        <Shield className="h-4 w-4" />
                                        Rol
                                    </label>
                                    <select
                                        name="role"
                                        value={formData.role}
                                        onChange={handleChange}
                                        required
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                                    >
                                        <option value="">Seleccioná un rol</option>
                                        {roles.map((r) => (
                                            <option key={r.id} value={r.id}>
                                                {r.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Botones */}
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => router.push("/empleados")}
                            disabled={isProcessing}
                            className="px-6 py-2.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isProcessing}
                            className="inline-flex items-center gap-2 px-8 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold shadow-md hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save className="h-4 w-4" />
                            {isProcessing ? "Procesando..." : "Crear usuario"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
