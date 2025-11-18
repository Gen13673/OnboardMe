"use client";

import { useState, useEffect } from "react";
import { MessageCircle, X, Mail } from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "@/auth/authContext"; // 🔹 Ajusta si tu contexto está en otro path

export default function ChatWidget() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([
        { from: "bot", text: "¡Hola! 👋 Soy tu asistente virtual. Elegí una opción para comenzar:" },
    ]);
    const [faqs, setFaqs] = useState([]);

    const { user } = useAuth(); // 🔹 Obtenemos el usuario autenticado
    const role = user?.role?.name.toLowerCase() || "empleado"; // valor por defecto

    useEffect(() => {
        // 🔹 FAQs según el rol
        switch (role) {
            case "empleado":
                setFaqs([
                    {
                        question: "¿Cómo cambio mi contraseña?",
                        answer: "Podés hacerlo desde la sección 'Acciones Rápidas' dentro de tu perfil.",
                    },
                    {
                        question: "¿Dónde veo mis cursos?",
                        answer: "Desde el panel principal hacé clic en 'Cursos'. Ahí verás todos los que tenés asignados.",
                    },
                    {
                        question: "¿Cómo marco un curso como favorito?",
                        answer: "Hacé clic en la estrella al lado del nombre del curso para marcarlo como favorito.",
                    },
                    {
                        question: "¿Cómo descargo los materiales del curso?",
                        answer: "Dentro de cada lección, si hay archivos disponibles, verás un botón de descarga.",
                    },
                    {
                        question: "¿Puedo retomar un curso desde donde lo dejé?",
                        answer:
                            "Sí, la plataforma guarda tu progreso automáticamente, así que podés continuar desde la última lección completada.",
                    },
                    {
                        question: "¿Cómo contacto a mi mentor?",
                        answer: "En la sección de tu perfil, vas a ver quién es tu mentor asignado y podés enviarle un mensaje directo.",
                    },
                    {
                        question: "¿Cómo visualizo mi calendario?",
                        answer: "En la página de inicio, tenés el calendario con tus próximas actividades y cursos.",
                    },
                    {
                        question: "¿Qué hago si olvidé mi contraseña?",
                        answer:
                            "En la página de login, hacé clic en 'Olvidé mi contraseña' y seguí las instrucciones para restablecerla.",
                    },
                ]);
                break;

            case "buddy":
                setFaqs([
                    {
                        question: "¿Cómo cambio mi contraseña?",
                        answer: "Podés hacerlo desde la sección 'Acciones Rápidas' dentro de tu perfil.",
                    },
                    {
                        question: "¿Dónde veo mis cursos?",
                        answer: "Desde el panel principal hacé clic en 'Cursos'. Ahí verás todos los que tenés asignados.",
                    },
                    {
                        question: "¿Cómo marco un curso como favorito?",
                        answer: "Hacé clic en la estrella al lado del nombre del curso para marcarlo como favorito.",
                    },
                    {
                        question: "¿Cómo descargo los materiales del curso?",
                        answer: "Dentro de cada lección, si hay archivos disponibles, verás un botón de descarga.",
                    },
                    {
                        question: "¿Puedo retomar un curso desde donde lo dejé?",
                        answer:
                            "Sí, la plataforma guarda tu progreso automáticamente, así que podés continuar desde la última lección completada.",
                    },
                    {
                        question: "¿Cómo contacto a mi mentor?",
                        answer: "En la sección de tu perfil, vas a ver quién es tu mentor asignado y podés enviarle un mensaje directo.",
                    },
                    {
                        question: "¿Cómo visualizo mi calendario?",
                        answer: "En la página de inicio, tenés el calendario con tus próximas actividades y cursos.",
                    },
                    {
                        question: "¿Cómo visualizo las métricas?",
                        answer: "Desde el panel principal accedé a la sección 'Métricas' para ver tus indicadores de desempeño.",
                    },
                    {
                        question: "¿Cómo asigno cursos a mis empleados?",
                        answer: "Entrá en la sección 'Asignación de Cursos' y selecciona un empleado y un curso para poder asignarlo.",
                    },
                    {
                        question: "¿Cómo veo a mis empleados a cargo?",
                        answer: "Desde el menú principal, accedé a 'Empleados'. Ahí verás el listado completo con su progreso.",
                    },
                    {
                        question: "¿Qué hago si olvidé mi contraseña?",
                        answer:
                            "En la página de login, hacé clic en 'Olvidé mi contraseña' y seguí las instrucciones para restablecerla.",
                    },
                ]);
                break;

            case "rrhh":
                setFaqs([
                    {
                        question: "¿Cómo cambio mi contraseña?",
                        answer: "Podés hacerlo desde la sección 'Acciones Rápidas' dentro de tu perfil.",
                    },
                    {
                        question: "¿Dónde veo mis cursos?",
                        answer: "Desde el panel principal hacé clic en 'Cursos'. Ahí verás todos los que tenés asignados.",
                    },
                    {
                        question: "¿Cómo marco un curso como favorito?",
                        answer: "Hacé clic en la estrella al lado del nombre del curso para marcarlo como favorito.",
                    },
                    {
                        question: "¿Cómo descargo los materiales del curso?",
                        answer: "Dentro de cada lección, si hay archivos disponibles, verás un botón de descarga.",
                    },
                    {
                        question: "¿Puedo retomar un curso desde donde lo dejé?",
                        answer:
                            "Sí, la plataforma guarda tu progreso automáticamente, así que podés continuar desde la última lección completada.",
                    },
                    {
                        question: "¿Cómo contacto a mi mentor?",
                        answer: "En la sección de tu perfil, vas a ver quién es tu mentor asignado y podés enviarle un mensaje directo.",
                    },
                    {
                        question: "¿Cómo visualizo mi calendario?",
                        answer: "En la página de inicio, tenés el calendario con tus próximas actividades y cursos.",
                    },
                    {
                        question: "¿Cómo doy de alta a un empleado?",
                        answer: "Desde el panel principal, hacé clic en 'Empleados' y luego click en 'Alta Usuarios', dentro podras elegir la opcion de Alta Manual o Alta Masiva",
                    },
                    {
                        question: "¿Cómo visualizo a los empleados?",
                        answer: "Podés ver todos los empleados desde la sección 'Empleados' del panel principal.",
                    },
                    {
                        question: "¿Cómo veo las métricas generales?",
                        answer: "En la sección 'Métricas' tenés acceso a reportes de desempeño globales y por área.",
                    },
                    {
                        question: "¿Cómo asigno un Buddy a un empleado?",
                        answer: "Desde la seccion 'Empleados', selecciona un usuario y hacé clic en 'Asignar Buddy' para seleccionar el mentor correspondiente.",
                    },
                    {
                        question: "¿Qué hago si olvidé mi contraseña?",
                        answer:
                            "En la página de login, hacé clic en 'Olvidé mi contraseña' y seguí las instrucciones para restablecerla.",
                    },
                ]);
                break;

                default:
                setFaqs([
                    {
                        question: "¿Cómo cambio mi contraseña?",
                        answer: "Podés hacerlo desde la sección 'Acciones Rápidas' dentro de tu perfil.",
                    },
                    {
                        question: "¿Qué hago si olvidé mi contraseña?",
                        answer:
                            "En la página de login, hacé clic en 'Olvidé mi contraseña' y seguí las instrucciones para restablecerla.",
                    },
                ]);
        }
    }, [role]);

    const handleOptionClick = (faq) => {
        setMessages((prev) => [
            ...prev,
            { from: "user", text: faq.question },
            { from: "bot", text: faq.answer },
        ]);
    };

    const handleEmailClick = () => {
        window.location.href = "mailto:onboardmesoporte@gmail.com?subject=Consulta%20desde%20el%20chat%20virtual";
    };

    return (
        <>
            {/* Botón flotante */}
            <div className="fixed bottom-6 right-6 z-50">
                <Button
                    size="icon"
                    className="rounded-full w-16 h-16 shadow-lg bg-blue-600 hover:bg-blue-700"
                    onClick={() => setOpen(!open)}
                >
                    {open ? (
                        <X className="h-7 w-7 text-white" />
                    ) : (
                        <MessageCircle className="h-7 w-7 text-white" />
                    )}
                </Button>
            </div>

            {/* Ventana de chat */}
            {open && (
                <div className="fixed bottom-28 right-10 w-[400px] h-[550px] bg-white border border-gray-200 shadow-2xl rounded-2xl z-50 overflow-hidden flex flex-col">
                    <div className="bg-blue-600 text-white px-5 py-4 font-semibold text-lg">
                        Asistente Virtual 💬
                    </div>

                    {/* Cuerpo del chat */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[460px]">
                        {messages.map((msg, i) => (
                            <div key={i} className="flex flex-col">
                                <div
                                    className={`p-3 rounded-xl text-base max-w-[85%] ${msg.from === "user"
                                        ? "bg-blue-100 self-end ml-auto"
                                        : "bg-gray-100"
                                        }`}
                                >
                                    {msg.text}
                                </div>

                                {/* Si es el primer mensaje, muestra opciones */}
                                {i === 0 && (
                                    <div className="flex flex-col space-y-3 mt-4">
                                        {faqs.map((faq, idx) => (
                                            <Button
                                                key={idx}
                                                variant="outline"
                                                className="text-sm justify-start border-gray-300 hover:bg-blue-50 whitespace-normal text-left"
                                                onClick={() => handleOptionClick(faq)}
                                            >
                                                {faq.question}
                                            </Button>
                                        ))}

                                        <Button
                                            variant="outline"
                                            className="text-sm justify-start border-gray-300 hover:bg-blue-50 whitespace-normal text-left flex items-center gap-2 mt-2 text-blue-600"
                                            onClick={handleEmailClick}
                                        >
                                            <Mail className="h-4 w-4" />
                                            Contactar por email a soporte
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}
