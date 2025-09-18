"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/app/components/ui/dialog"
import { useRouter } from "next/navigation"

const rrhhSteps = [
  {
    title: "Firmar Recibo Digital",
    description:
      "Te pedimos que firmes tu recibo de sueldo digitalmente cada mes. Podés hacerlo desde la sección de Onboarding o accediendo directamente a tu perfil en el portal de empleados.",
    link: "/onboarding#recibo",
    icon: "📄",
    color: "from-blue-500 to-indigo-600",
    bgColor: "bg-blue-50",
    hasLink: true,
  },
  {
    title: "Alta de Obra Social",
    description:
      "Completá la documentación para dar de alta tu obra social. Asegurate de cargar tus datos personales correctamente y adjuntar las constancias requeridas.",
    link: "/onboarding#obra-social",
    icon: "🩺",
    color: "from-green-500 to-emerald-600",
    bgColor: "bg-green-50",
    hasLink: true,
  },
  {
    title: "Correo Corporativo",
    description:
      "Vas a recibir un correo con tus credenciales para ingresar al mail corporativo. Ingresá con tu usuario y contraseña desde Outlook Web o configurá tu cliente de correo preferido.",
    link: "/onboarding#correo",
    icon: "📧",
    color: "from-purple-500 to-violet-600",
    bgColor: "bg-purple-50",
    hasLink: true,
  },
  {
    title: "Acceso a VPN",
    description:
      "Para acceder a los sistemas internos de la empresa desde fuera de la oficina, necesitás configurar la VPN. Seguí los pasos en la sección de VPN en Onboarding.",
    link: "/onboarding#vpn",
    icon: "🔐",
    color: "from-red-500 to-pink-600",
    bgColor: "bg-red-50",
    hasLink: true,
  },
  {
    title: "Conocé a tu Buddy",
    description:
      "Tu Buddy te acompañará durante tus primeras semanas. Visitá la sección correspondiente para ver quién es y cómo contactarlo.",
    link: "/onboarding#buddy",
    icon: "🧑‍🤝‍🧑",
    color: "from-orange-500 to-yellow-600",
    bgColor: "bg-orange-50",
    hasLink: true,
  },
  {
    title: "Beneficios para Empleados",
    description:
      "Enterate de todos los beneficios que tenés como empleado: licencias, días de estudio, vacaciones, y más. Toda la info está en Onboarding.",
    link: "/onboarding#beneficios",
    icon: "🎁",
    color: "from-emerald-500 to-teal-600",
    bgColor: "bg-emerald-50",
    hasLink: true,
  },
  {
    title: "¡Ya estás listo!",
    description:
      "Recordá que siempre podés volver a acceder a todos estos recursos desde la sección 'Recursos de RRHH' en la parte inferior de tu página de inicio. ¡Bienvenido al equipo!",
    link: "",
    icon: "🎯",
    color: "from-indigo-500 to-purple-600",
    bgColor: "bg-indigo-50",
    hasLink: false,
  },
]

export function RRHHModal() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(-1)
  const router = useRouter()

  useEffect(() => {
    const alreadySeen = localStorage.getItem("hasSeenRRHH")
    if (!alreadySeen) {
      setOpen(true)
    }
  }, [])

  const handleClose = () => {
    setOpen(false)
    localStorage.setItem("hasSeenRRHH", "true")
  }

  const handleNext = () => {
    if (step === rrhhSteps.length - 1) {
      handleClose()
    } else {
      setStep((prev) => prev + 1)
    }
  }

  const handleStart = () => setStep(0)

  const currentStep = rrhhSteps[step]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 backdrop-blur-xl border-0 shadow-2xl">
        {step === -1 ? (
          <div className="relative">
            {/* Background decoration - simplified */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50"></div>

            <div className="relative p-8">
              {/* Header similar to steps */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-xl">🎉</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Bienvenida</div>
                    <DialogTitle className="text-2xl font-bold text-gray-900">¡Bienvenido a OnboardMe!</DialogTitle>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <p className="text-gray-600 text-lg leading-relaxed">
                  Antes de comenzar, te recomendamos completar la información clave de Recursos Humanos para tener una
                  mejor experiencia.
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-gray-500">
                  <span className="text-sm">🏢</span>
                  <span className="text-sm font-medium">{rrhhSteps.length - 1} recursos disponibles</span>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleClose}
                    className="group px-6 py-3 bg-white/40 backdrop-blur border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-white/60 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500/20 transition-all duration-300 h-12 flex items-center"
                  >
                    <span className="flex items-center">Más tarde</span>
                  </button>
                  <button
                    onClick={handleStart}
                    className="group px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg hover:shadow-blue-500/25 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 transform hover:-translate-y-0.5 h-12 flex items-center"
                  >
                    <span className="flex items-center">
                      Comenzar ahora
                      <span className="ml-2 group-hover:translate-x-1 transition-transform duration-300">→</span>
                    </span>
                  </button>
                </div>
              </div>

              {/* Progress dots preview */}
              <div className="flex justify-center mt-8 space-x-2">
                {rrhhSteps.map((_, index) => (
                  <div key={index} className="w-2 h-2 rounded-full bg-gray-300" />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="relative">
            {/* Progress bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500 ease-out"
                style={{ width: `${((step + 1) / rrhhSteps.length) * 100}%` }}
              ></div>
            </div>

            {/* Background decoration */}
            <div className={`absolute inset-0 ${currentStep.bgColor} opacity-30`}></div>
            <div className="absolute top-4 right-4 w-24 h-24 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-2xl"></div>

            <div className="relative p-8 pt-12">
              {/* Step indicator */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-12 h-12 bg-gradient-to-br ${currentStep.color} rounded-xl flex items-center justify-center shadow-lg`}
                  >
                    <span className="text-xl">{currentStep.icon}</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">
                      {step === rrhhSteps.length - 1 ? "¡Listo!" : `Paso ${step + 1} de ${rrhhSteps.length - 1}`}
                    </div>
                    <DialogTitle className="text-2xl font-bold text-gray-900">{currentStep.title}</DialogTitle>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <p className="text-gray-600 text-lg leading-relaxed">{currentStep.description}</p>
              </div>

              <div className="flex items-center justify-between">
                {currentStep.hasLink ? (
                  <button
                    onClick={() => window.open(currentStep.link, "_blank")}
                    className="group flex items-center space-x-2 px-6 py-3 bg-white/80 backdrop-blur border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-white hover:border-gray-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 h-12"
                  >
                    <span>🔗</span>
                    <span>Ir a la sección</span>
                    <span className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">
                      ↗
                    </span>
                  </button>
                ) : (
                  <div></div>
                )}

                <div className="flex items-center space-x-3">
                  {step === 0 && (
                    <button
                      onClick={() => setStep(-1)}
                      className="group px-6 py-3 bg-white/40 backdrop-blur border border-gray-200 rounded-lg text-gray-700 font-medium hover:text-gray-800 hover:bg-white/60 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500/20 transition-all duration-300 h-12 flex items-center"
                    >
                      <span className="flex items-center">
                        <span className="mr-2 group-hover:-translate-x-1 transition-transform duration-300">←</span>
                        Volver al inicio
                      </span>
                    </button>
                  )}
                  {step > 0 && (
                    <button
                      onClick={() => setStep((prev) => prev - 1)}
                      className="group px-6 py-3 bg-white/40 backdrop-blur border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-white/60 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500/20 transition-all duration-300 h-12 flex items-center"
                    >
                      <span className="flex items-center">
                        <span className="mr-2 group-hover:-translate-x-1 transition-transform duration-300">←</span>
                        Anterior
                      </span>
                    </button>
                  )}
                  <button
                    onClick={handleNext}
                    className="group px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg hover:shadow-blue-500/25 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 transform hover:-translate-y-0.5 h-12 flex items-center"
                  >
                    <span className="flex items-center">
                      {step === rrhhSteps.length - 1 ? (
                        <>
                          Finalizar
                          <span className="ml-2">✓</span>
                        </>
                      ) : (
                        <>
                          Siguiente
                          <span className="ml-2 group-hover:translate-x-1 transition-transform duration-300">→</span>
                        </>
                      )}
                    </span>
                  </button>
                </div>
              </div>

              {/* Step dots indicator */}
              <div className="flex justify-center mt-8 space-x-2">
                {rrhhSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === step
                        ? "bg-gradient-to-r from-blue-500 to-indigo-500 w-8"
                        : index < step
                          ? "bg-blue-300"
                          : "bg-gray-300"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}