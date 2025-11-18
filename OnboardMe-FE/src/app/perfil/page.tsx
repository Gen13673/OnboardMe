"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Calendar,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Eye,
  EyeOff,
  Lock,
  Copy,
} from "lucide-react";
import { Badge } from "../components/ui/badge";
import { useAuth } from "@/auth/authContext";
import { Separator } from "../components/ui/separator";
import { RoleName } from "@/auth/permissions";
import {
  getUsersByBuddy,
  changePassword,
  getUserById,
} from "../services/usuario.service";
import type { User } from "@/app/models/User";
import { UserAvatar } from "../components/UserAvatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ChatWidget from "../components/ChatWidget";

export default function PerfilPage() {
  const { user } = useAuth();
  const [fullUser, setFullUser] = useState<User | null>(null);
  const [mentees, setMentees] = useState<User[]>([]);
  const [contactOpen, setContactOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<User | null>(null);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;

    async function fetchData() {
      try {
        const response = await getUserById(user.id);
        setFullUser(response);

        if (user.role.name === RoleName.BUDDY) {
          const menteesList = await getUsersByBuddy(user.id);
          setMentees(menteesList);
        }
      } catch (error) {
        console.error("Error al cargar datos del usuario:", error);
      }
    }

    fetchData();
  }, [user]);

  const isBuddy = fullUser?.role.name === RoleName.BUDDY;

  async function handleChangePassword() {
    if (!user) return;
    if (!newPassword || !confirmPassword)
      return toast.error("Debe completar ambos campos.");
    if (newPassword !== confirmPassword)
      return toast.error("Las contraseñas no coinciden.");

    try {
      setLoading(true);
      await changePassword(user.id, { newPassword, confirmPassword });
      toast.success("Contraseña actualizada correctamente.");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordOpen(false);
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message || "No se pudo actualizar la contraseña."
      );
    } finally {
      setLoading(false);
    }
  }

  function openContact(u: User) {
    setSelectedContact(u);
    setContactOpen(true);
  }

  function normalizePhoneForWhatsApp(phone?: string) {
    if (!phone) return "";
    const digits = phone.replace(/\D/g, "");
    if (digits.startsWith("549")) return digits;
    if (digits.startsWith("54")) return "549" + digits.slice(2);
    return "549" + digits;
  }

  const faqs = [
    {
      question: "¿Cómo accedo a mis cursos?",
      answer:
        "Desde el panel principal, hacé clic en 'Cursos'. Ahí vas a encontrar la lista completa.",
    },
    {
      question: "¿Qué hago si un curso no carga?",
      answer:
        "Probá recargar la página. Si el problema persiste, contactá a soporte.",
    },
    {
      question: "¿Cómo cambio mi contraseña?",
      answer: "Podés hacerlo desde la sección 'Acciones Rápidas' dentro de tu perfil.",
    },
    {
      question: "¿Cómo contacto a mi mentor?",
      answer: "En la sección de tu perfil, vas a ver quién es tu mentor asignado y podés enviarle un mensaje directo.",
    },
    {
      question: "¿Qué hago si olvidé mi contraseña?",
      answer:
        "En la página de login, hacé clic en 'Olvidé mi contraseña' y seguí las instrucciones para restablecerla.",
    },
  ];

  return (
    <main>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 shadow-md">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative max-w-7xl mx-auto px-6 py-10">
            <div className="flex items-center space-x-6">
              <UserAvatar
                firstName={fullUser?.firstName}
                lastName={fullUser?.lastName}
                size="sm"
              />
              <div>
                <h1 className="text-3xl font-bold text-white">
                  {fullUser?.firstName} {fullUser?.lastName}
                </h1>
                <p className="text-blue-100 text-sm">
                  {fullUser?.role.name} · En la empresa desde{" "}
                  {fullUser?.createdDate
                    ? new Date(fullUser.createdDate + 'Z').toLocaleDateString('es-ES', {
                      timeZone: 'UTC',
                    })
                    : ""}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="bg-white/80 backdrop-blur border-0 shadow-md hover:shadow-lg transition-all">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  🧍 Información Personal
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-gray-800">{fullUser?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-500">Teléfono</p>
                    <p className="font-medium text-gray-800">{fullUser?.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-500">Dirección</p>
                    <p className="font-medium text-gray-800">{fullUser?.address}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-500">Fecha de Nacimiento</p>
                    {fullUser?.birthDate && (
                      <p className="font-medium text-gray-800">
                        {new Date(fullUser.birthDate).toLocaleDateString("es-ES", {
                          timeZone: "UTC",
                        })}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {isBuddy && mentees.length > 0 && (
              <Card className="bg-white/80 backdrop-blur border-0 shadow-md hover:shadow-lg transition-all">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    👥 Empleados Asignados
                    <Badge variant="secondary" className="ml-2">
                      {mentees.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mentees.map((employee, index) => (
                    <div key={employee.id}>
                      <div className="flex items-center gap-4">
                        <UserAvatar
                          firstName={employee.firstName}
                          lastName={employee.lastName}
                          size="sm"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">
                            {employee.firstName} {employee.lastName}
                          </p>
                          <p className="text-sm text-gray-500">
                            En la empresa desde{" "}
                            {new Date(employee.createdDate).toLocaleDateString(
                              "es-ES",
                              { timeZone: "UTC" }
                            )}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openContact(employee)}
                        >
                          <MessageCircle className="h-4 w-4 mr-1" /> Contactar
                        </Button>
                      </div>
                      {index < mentees.length - 1 && (
                        <Separator className="mt-4" />
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card className="bg-white/80 backdrop-blur border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  ❓ Preguntas Frecuentes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {faqs.map((faq, i) => {
                  const isOpen = openIndex === i;
                  return (
                    <div
                      key={i}
                      className="border border-gray-200 rounded-lg overflow-hidden bg-white/70 transition-shadow hover:shadow-md"
                    >
                      <button
                        className="w-full flex justify-between items-center px-5 py-3 text-left focus:outline-none hover:bg-transparent !important"
                        onClick={() =>
                          setOpenIndex((prev) => (prev === i ? null : i))
                        }
                      >
                        <span className="font-medium text-gray-800">{faq.question}</span>
                        <span className="text-blue-500 text-xl">{isOpen ? "−" : "+"}</span>
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-3 text-sm text-gray-600 bg-white/70">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            {fullUser?.buddy && (
              <Card className="bg-white/80 backdrop-blur border-0 shadow-md hover:shadow-lg transition-all">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    🧑‍🤝‍🧑 Tu Buddy Asignado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-4">
                    <UserAvatar
                      firstName={fullUser.buddy.firstName}
                      lastName={fullUser.buddy.lastName}
                      size="sm"
                    />
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {fullUser.buddy.firstName} {fullUser.buddy.lastName}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {fullUser.buddy.email}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => fullUser.buddy && openContact(fullUser.buddy)}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" /> Enviar Mensaje
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card className="bg-white/80 backdrop-blur border-0 shadow-md hover:shadow-lg transition-all">
              <CardHeader>
                <CardTitle className="text-gray-900">⚙️ Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setPasswordOpen(true)}
                >
                  <Lock className="h-4 w-4 mr-2" /> Cambiar Contraseña
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Cambiar Contraseña</DialogTitle>
            <DialogDescription>
              Ingresá y confirmá tu nueva contraseña.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nueva Contraseña</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="********"
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:bg-transparent focus:outline-none"
                  onClick={() => setShowNewPassword((p) => !p)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="********"
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:bg-transparent focus:outline-none"
                  onClick={() => setShowConfirmPassword((p) => !p)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleChangePassword} disabled={loading}>
              {loading ? "Guardando..." : "Actualizar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Contacto del Empleado</DialogTitle>
          </DialogHeader>
          {selectedContact && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <UserAvatar
                  firstName={selectedContact.firstName}
                  lastName={selectedContact.lastName}
                  size="sm"
                />
                <div>
                  <p className="font-semibold text-gray-900">
                    {selectedContact.firstName} {selectedContact.lastName}
                  </p>
                  {selectedContact.address && (
                    <p className="text-xs text-gray-500">
                      {selectedContact.address}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-3 text-sm">
                {selectedContact.email && (
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-blue-500" />
                      <a
                        href={`mailto:${selectedContact.email}`}
                        className="font-medium text-gray-800 hover:underline"
                      >
                        {selectedContact.email}
                      </a>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        navigator.clipboard.writeText(selectedContact.email)
                      }
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                {selectedContact.phone && (
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-blue-500" />
                      <a
                        href={`tel:${selectedContact.phone}`}
                        className="font-medium text-gray-800 hover:underline"
                      >
                        {selectedContact.phone}
                      </a>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        navigator.clipboard.writeText(selectedContact.phone)
                      }
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {selectedContact.email && (
                  <Button asChild>
                    <a href={`mailto:${selectedContact.email}`}>Enviar Email</a>
                  </Button>
                )}
                {selectedContact.phone && (
                  <Button variant="outline" asChild>
                    <a
                      href={`https://wa.me/${normalizePhoneForWhatsApp(
                        selectedContact.phone
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      WhatsApp
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
      />
      <ChatWidget />
    </main>
  );
}
