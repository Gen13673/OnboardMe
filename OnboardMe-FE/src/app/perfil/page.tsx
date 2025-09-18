"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Bell, Calendar, Heart, Mail, MapPin, MessageCircle, Phone, Users } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { useAuth } from "@/auth/authContext";
import { Separator } from "../components/ui/separator";
import { RoleName } from "@/auth/permissions";
import { getUsersByBuddy } from "../services/usuario.service";
import type { User } from "@/app/models/User"
import { UserAvatar } from "../components/UserAvatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../components/ui/dialog";
import { Copy } from "lucide-react";

export default function AyudaPage() {

  const { user } = useAuth()
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [contactOpen, setContactOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<User | null>(null);


  const isBuddy = user?.role.name === RoleName.BUDDY
  const [mentees, setMentees] = useState<User[]>([])

  const faqs = [
    {
      question: "¿Cómo accedo a mis cursos?",
      answer:
        "Desde el panel principal, hacé clic en 'Cursos'. Ahí vas a encontrar la lista completa.",
    },
    {
      question: "¿Qué hago si un curso no carga?",
      answer:
        "Probá recargar la página. Si el problema persiste, contactá a soporte para asistencia técnica.",
    },
    {
      question: "¿Cómo marco un curso como favorito?",
      answer:
        "Simplemente hacé clic en la estrella al lado del nombre del curso para marcarlo como favorito.",
    },
  ];

  useEffect(() => {
    if (!user) return
    getUsersByBuddy(user.id).then(setMentees)
  }, [user])

  function openContact(u: User) {
    setSelectedContact(u);
    setContactOpen(true);
  }

  // WhatsApp: intenta normalizar a formato internacional AR (549...)
  function normalizePhoneForWhatsApp(phone?: string) {
    if (!phone) return "";
    const digits = phone.replace(/\D/g, "");
    if (digits.startsWith("549")) return digits;
    if (digits.startsWith("54")) return "549" + digits.slice(2);
    return "549" + digits; // heurística simple
  }

  async function copyToClipboard(text?: string) {
    if (!text) return;
    try { await navigator.clipboard.writeText(text); } catch { }
  }

  return (

    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-start gap-6 mb-6">
            <UserAvatar firstName={user?.firstName} lastName={user?.lastName} size="sm" />
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  {user?.firstName} {user?.lastName}
                </h1>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700" style={{ paddingTop: "0.2em" }}>
                  {user?.role.name}
                </Badge>
              </div>
              {/* <p className="text-xl text-gray-600 mb-2">{user?.position}</p>
              <p className="text-gray-500">{user?.department}</p> */}
              <div>
                {user?.birthDate && (
                  <p className="font-medium text-sm text-gray-500">
                    En la empresa desde {new Date(user?.createdDate).toLocaleDateString("es-ES")}
                  </p>
                )}
              </div>

            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {/* <User className="h-5 w-5" /> */}
                  Información Personal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{user?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Teléfono</p>
                      {<p className="font-medium">{user?.phone}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Dirección</p>
                      {<p className="font-medium">{user?.address}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Fecha de Nacimiento</p>
                      {user?.birthDate && (
                        <p className="font-medium">
                          {new Date(user.birthDate).toLocaleDateString("es-ES")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {isBuddy && mentees.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Empleados Asignados
                    <Badge variant="secondary" className="ml-2">
                      {/* {{ mentees.length }} */}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mentees.map((employee, index) => (

                    <div key={employee.id}>
                      <div className="flex items-center gap-4">
                        <UserAvatar firstName={employee?.firstName} lastName={employee?.lastName} size="sm" />
                        <div className="flex-1">
                          <p className="font-medium">{employee.firstName + " " + employee.lastName}</p>
                          {/* <p className="text-sm text-gray-600">{employee.position}</p>*/}
                          <div>
                            {user?.birthDate && (
                              <p className="font-medium text-sm text-gray-500">
                                En la empresa desde {new Date(employee?.createdDate).toLocaleDateString("es-ES")}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => openContact(employee)} title="Ver contacto">
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {index < mentees.length - 1 && <Separator className="mt-4" />}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>


          <div className="space-y-6">
            {user?.buddy && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Tu Buddy Asignado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-4">
                    <UserAvatar firstName={user?.buddy?.firstName} lastName={user?.buddy?.lastName} size="sm" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{user?.buddy?.firstName + " " + user?.buddy?.lastName}</h3>
                      {/* <p className="text-gray-600">{user?.buddy.position}</p> */}
                      <p className="text-sm text-gray-500">{user?.buddy?.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-transparent"
                      onClick={() => user?.buddy && openContact(user.buddy)}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Mensaje
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            <Card>
              <CardHeader>
                <CardTitle>Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {/* <Button variant="outline" className="w-full justify-start bg-transparent">
                  <User className="h-4 w-4 mr-2" />
                  Editar Perfil
                </Button> */}
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Bell className="h-4 w-4 mr-2" />
                  Configurar Notificaciones
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Calendar className="h-4 w-4 mr-2" />
                  Ver Calendario
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="container mx-auto py-10 px-4">
          <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-6 md:p-10">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-8 text-center">
              🤔 Preguntas Frecuentes
            </h1>

            <div className="space-y-5">
              {faqs.map((faq, index) => {
                const isOpen = openIndex === index;

                return (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    <button
                      className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-gray-50 transition-all"
                      onClick={() =>
                        setOpenIndex((prev) => (prev === index ? null : index))
                      }
                    >
                      <span className="text-gray-800 font-semibold text-base md:text-lg">
                        {faq.question}
                      </span>
                      <span className="text-gray-400 text-xl font-bold">
                        {isOpen ? "−" : "+"}
                      </span>
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-4 text-gray-600 text-sm md:text-base transition-all duration-300 ease-in-out bg-gray-50">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-12 border-t pt-6 text-center text-gray-700 text-sm space-y-2">
              <p>
                📞 <strong>Teléfono:</strong> (011) 1234-5678
              </p>
              <p>
                ✉️ <strong>Email:</strong>{" "}
                <a
                  href="mailto:soporte@empresa.com"
                  className="text-blue-600 hover:underline"
                >
                  soporte@empresa.com
                </a>
              </p>
            </div>
          </div>
        </div>
        <Dialog open={contactOpen} onOpenChange={setContactOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Contacto del Empleado</DialogTitle>
              <DialogDescription>Información para comunicarte rápidamente.</DialogDescription>
            </DialogHeader>

            {selectedContact && (
              <div className="space-y-4">
                {/* Cabecera con avatar y nombre */}
                <div className="flex items-center gap-3">
                  <UserAvatar firstName={selectedContact.firstName} lastName={selectedContact.lastName} size="sm" />
                  <div>
                    <p className="font-semibold text-lg">
                      {selectedContact.firstName} {selectedContact.lastName}
                    </p>
                    {selectedContact.address && (
                      <p className="text-xs text-gray-500">{selectedContact.address}</p>
                    )}
                  </div>
                </div>

                {/* Datos */}
                <div className="grid gap-3 text-sm">
                  {/* Email */}
                  {selectedContact.email && (
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <a
                          href={`mailto:${selectedContact.email}`}
                          className="font-medium hover:underline"
                        >
                          {selectedContact.email}
                        </a>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => copyToClipboard(selectedContact.email)} title="Copiar email">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {/* Teléfono */}
                  {selectedContact.phone && (
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <a
                          href={`tel:${selectedContact.phone}`}
                          className="font-medium hover:underline"
                        >
                          {selectedContact.phone}
                        </a>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => copyToClipboard(selectedContact.phone)} title="Copiar teléfono">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Acciones rápidas */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {selectedContact.email && (
                    <Button asChild>
                      <a href={`mailto:${selectedContact.email}`}>
                        Enviar Email
                      </a>
                    </Button>
                  )}
                  {selectedContact.phone && (
                    <Button variant="secondary" asChild>
                      <a href={`tel:${selectedContact.phone}`}>
                        Llamar
                      </a>
                    </Button>
                  )}
                  {selectedContact.phone && (
                    <Button variant="outline" asChild>
                      <a
                        href={`https://wa.me/${normalizePhoneForWhatsApp(selectedContact.phone)}?text=${encodeURIComponent(
                          `Hola ${selectedContact.firstName}, ¿cómo estás?`
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
      </div>
    </div>

  );
}
