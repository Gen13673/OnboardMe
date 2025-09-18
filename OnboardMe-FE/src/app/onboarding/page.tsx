"use client"

export default function RecursosRRHHPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Centro de Recursos de RRHH</h1>
          <p className="text-lg text-gray-600">Todo lo que necesitás saber para tu onboarding</p>
        </div>

        <div className="space-y-8">
          <section
            id="recibo"
            className="bg-white/80 backdrop-blur rounded-xl shadow-lg border-0 p-8 scroll-mt-24 target-highlight"
          >
            <div className="flex items-start space-x-4 mb-4">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📄</span>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Cómo firmar y enviar tu recibo digital</h2>
                <div className="space-y-3 text-gray-700">
                  <p>
                    Ingresá al portal interno de la empresa en{" "}
                    <a
                      href="https://intranet.empresa.com/recibos"
                      target="_blank"
                      className="text-blue-600 hover:text-blue-800 underline font-medium"
                      rel="noreferrer"
                    >
                      https://intranet.empresa.com/recibos
                    </a>
                    . Utilizá tu usuario y contraseña de red.
                  </p>
                  <p>Una vez dentro, accedé a la sección "Recibos" y hacé clic en "Firmar digitalmente".</p>
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                    <p className="text-blue-800">
                      <strong>¿Problemas?</strong> Contactá a{" "}
                      <a href="mailto:rrhh@empresa.com" className="underline font-medium">
                        rrhh@empresa.com
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section
            id="obra-social"
            className="bg-white/80 backdrop-blur rounded-xl shadow-lg border-0 p-8 scroll-mt-24 target-highlight"
          >
            <div className="flex items-start space-x-4 mb-4">
              <div className="h-12 w-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🩺</span>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Documentación para alta en obra social</h2>
                <div className="space-y-4 text-gray-700">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Documentos requeridos:</h3>
                    <ul className="space-y-2">
                      <li className="flex items-center space-x-2">
                        <span className="h-2 w-2 bg-green-500 rounded-full"></span>
                        <span>Formulario de alta completo (se descarga desde la intranet)</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <span className="h-2 w-2 bg-green-500 rounded-full"></span>
                        <span>Fotocopia de DNI (anverso y reverso)</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <span className="h-2 w-2 bg-green-500 rounded-full"></span>
                        <span>Comprobante de CUIL</span>
                      </li>
                    </ul>
                  </div>
                  <p>
                    Enviá todo por mail a{" "}
                    <a
                      href="mailto:obra.social@empresa.com"
                      className="text-blue-600 hover:text-blue-800 underline font-medium"
                    >
                      obra.social@empresa.com
                    </a>{" "}
                    o acercate al sector de RRHH.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section
            id="correo"
            className="bg-white/80 backdrop-blur rounded-xl shadow-lg border-0 p-8 scroll-mt-24 target-highlight"
          >
            <div className="flex items-start space-x-4 mb-4">
              <div className="h-12 w-12 bg-gradient-to-br from-purple-100 to-violet-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📧</span>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cómo ingresar al correo corporativo</h2>
                <div className="space-y-3 text-gray-700">
                  <p>
                    Accedé a través de{" "}
                    <a
                      href="https://mail.google.com"
                      target="_blank"
                      className="text-blue-600 hover:text-blue-800 underline font-medium"
                      rel="noreferrer"
                    >
                      https://mail.google.com
                    </a>{" "}
                    usando tu cuenta <code className="bg-gray-100 px-2 py-1 rounded text-sm">usuario@empresa.com</code>.
                  </p>
                  <p>La contraseña inicial se te envió por SMS o correo alternativo.</p>
                  <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
                    <p className="text-amber-800">
                      <strong>¿No podés ingresar?</strong> Solicitá reseteo a{" "}
                      <a href="mailto:soporte@empresa.com" className="underline font-medium">
                        soporte@empresa.com
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section
            id="vpn"
            className="bg-white/80 backdrop-blur rounded-xl shadow-lg border-0 p-8 scroll-mt-24 target-highlight"
          >
            <div className="flex items-start space-x-4 mb-4">
              <div className="h-12 w-12 bg-gradient-to-br from-red-100 to-pink-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🔐</span>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Acceso a la VPN de la empresa</h2>
                <div className="space-y-4 text-gray-700">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">Paso 1: Descarga</h3>
                      <p>
                        Descargá el cliente VPN desde{" "}
                        <a
                          href="https://vpn.empresa.com"
                          target="_blank"
                          className="text-blue-600 hover:text-blue-800 underline font-medium"
                          rel="noreferrer"
                        >
                          vpn.empresa.com
                        </a>
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">Paso 2: Configuración</h3>
                      <p>Usá tus credenciales corporativas para acceder.</p>
                    </div>
                  </div>
                  <div className="bg-indigo-50 border-l-4 border-indigo-400 p-4 rounded-r-lg">
                    <p className="text-indigo-800">
                      <strong>¿Necesitás ayuda?</strong> Seguí esta{" "}
                      <a href="/docs/manual-vpn.pdf" className="underline font-medium" target="_blank" rel="noreferrer">
                        guía paso a paso
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section
            id="buddy"
            className="bg-white/80 backdrop-blur rounded-xl shadow-lg border-0 p-8 scroll-mt-24 target-highlight"
          >
            <div className="flex items-start space-x-4 mb-4">
              <div className="h-12 w-12 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🧑‍🤝‍🧑</span>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Conocé a tu Buddy asignado</h2>
                <div className="space-y-4 text-gray-700">
                  <p>Tu buddy es la persona encargada de acompañarte en tu primer mes.</p>
                  <p>Podés contactarlo/a vía Slack o correo. Tu buddy asignado es:</p>
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                    <div className="flex items-center space-x-4">
                      <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xl font-bold">JP</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900">Juan Pérez</h3>
                        <div className="space-y-1 mt-2">
                          <p className="flex items-center space-x-2">
                            <span className="text-gray-500">📧</span>
                            <a
                              href="mailto:juan.perez@empresa.com"
                              className="text-blue-600 hover:text-blue-800 underline"
                            >
                              juan.perez@empresa.com
                            </a>
                          </p>
                          <p className="flex items-center space-x-2">
                            <span className="text-gray-500">💬</span>
                            <span className="text-gray-700">@juan.perez</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section
            id="beneficios"
            className="bg-white/80 backdrop-blur rounded-xl shadow-lg border-0 p-8 scroll-mt-24 target-highlight"
          >
            <div className="flex items-start space-x-4 mb-4">
              <div className="h-12 w-12 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🎁</span>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Beneficios para empleados</h2>
                <div className="space-y-4 text-gray-700">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                        <span>🏥</span>
                        <span>Licencias</span>
                      </h3>
                      <p className="text-sm">Enfermedad, estudio, maternidad/paternidad, mudanza, etc.</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                        <span>📚</span>
                        <span>Días de estudio</span>
                      </h3>
                      <p className="text-sm">5 días hábiles por cuatrimestre</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                        <span>🏖️</span>
                        <span>Vacaciones</span>
                      </h3>
                      <p className="text-sm">14 días hábiles iniciales</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                        <span>💰</span>
                        <span>Descuentos</span>
                      </h3>
                      <p className="text-sm">En gimnasios, cursos y apps de bienestar</p>
                    </div>
                  </div>
                  <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
                    <p className="text-green-800">
                      <strong>Más información:</strong> Consultá el reglamento completo en la{" "}
                      <a
                        href="/docs/manual-beneficios.pdf"
                        className="underline font-medium"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Guía de Beneficios
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <style jsx>{`
        /* Efecto de resaltado para secciones target */
        .target-highlight:target {
          animation: highlight 3s ease-in-out;
          transform-origin: center;
        }

        @keyframes highlight {
          0% {
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(147, 51, 234, 0.15));
            box-shadow: 0 0 30px rgba(59, 130, 246, 0.4), 0 0 60px rgba(147, 51, 234, 0.2);
            transform: scale(1.02);
            border: 2px solid rgba(59, 130, 246, 0.3);
          }
          50% {
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(147, 51, 234, 0.08));
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.3), 0 0 40px rgba(147, 51, 234, 0.15);
            transform: scale(1.01);
            border: 1px solid rgba(59, 130, 246, 0.2);
          }
          100% {
            background: rgba(255, 255, 255, 0.8);
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            transform: scale(1);
            border: 0px solid transparent;
          }
        }

        /* Efecto adicional para los títulos */
        .target-highlight:target h2 {
          animation: titleGlow 2s ease-in-out;
        }

        @keyframes titleGlow {
          0%, 100% {
            text-shadow: none;
          }
          50% {
            text-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
          }
        }
      `}</style>
    </main>
  )
}