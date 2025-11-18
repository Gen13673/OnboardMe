"use client";

import { useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import OnboardLogo from "/public/OnboardMe.png";
import { useRouter } from "next/navigation";
import { resetPassword } from "../services/usuario.service";

export default function ResetPasswordPage() {
    const [email, setEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !newPassword || !confirmPassword) {
            toast.error("Debe completar todos los campos");
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error("Las contraseñas no coinciden");
            return;
        }

        try {
            setLoading(true);
            await resetPassword(email, { newPassword, confirmPassword });
            toast.success("Contraseña restablecida correctamente");
            setTimeout(() => router.push("/"), 2000);
        } catch (error: any) {
            setLoading(false);
            const message = error.response?.data?.message;
            if (error.response?.status === 400) {
                toast.error(message);
            } else {
                toast.error("Error al restablecer la contraseña");
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100">
            <div className="relative w-full max-w-md bg-white/70 backdrop-blur-md p-10 rounded-2xl shadow-2xl border border-white/30">
                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <Image
                        src={OnboardLogo}
                        alt="OnboardMe"
                        className="rounded-xl object-contain"
                        width={140}
                        height={140}
                        priority
                    />
                </div>

                <h1 className="text-3xl font-bold text-center text-blue-900 mb-4">
                    Restablecer Contraseña
                </h1>
                <p className="text-center text-gray-700 mb-6">
                    Ingresá tu correo y una nueva contraseña para continuar.
                </p>

                <form onSubmit={handleReset} className="flex flex-col gap-5">
                    {/* Email */}
                    <input
                        type="email"
                        placeholder="Correo electrónico"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white/80 placeholder-gray-400"
                    />

                    {/* Nueva contraseña */}
                    <div className="relative">
                        <input
                            type={showNewPassword ? "text" : "password"}
                            placeholder="Nueva contraseña"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white/80 placeholder-gray-400 pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowNewPassword((prev) => !prev)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 hover:bg-transparent focus:outline-none"
                            tabIndex={-1}
                        >
                            {showNewPassword ? (
                                <EyeOff className="h-5 w-5" />
                            ) : (
                                <Eye className="h-5 w-5" />
                            )}
                        </button>
                    </div>

                    {/* Confirmar contraseña */}
                    <div className="relative">
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirmar contraseña"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white/80 placeholder-gray-400 pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword((prev) => !prev)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 hover:bg-transparent focus:outline-none"
                            tabIndex={-1}
                        >
                            {showConfirmPassword ? (
                                <EyeOff className="h-5 w-5" />
                            ) : (
                                <Eye className="h-5 w-5" />
                            )}
                        </button>
                    </div>

                    {/* Botón */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-md disabled:opacity-50"
                    >
                        {loading ? "Guardando..." : "Restablecer Contraseña"}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-600">
                    ¿Recordaste tu contraseña?{" "}
                    <span
                        className="text-blue-600 hover:underline cursor-pointer"
                        onClick={() => router.push("/")}
                    >
                        Volver al login
                    </span>
                </div>
            </div>

            <ToastContainer position="top-right" autoClose={5000} />
        </div>
    );
}
