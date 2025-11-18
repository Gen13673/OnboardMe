"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/auth/authContext";
import { toast, ToastContainer } from "react-toastify";
import { loginUser } from "@/app/services/login.service";
import { LoginRequest } from "@/app/models/LoginRequest";
import { LoginResponse } from "@/app/models/LoginResponse";
import "react-toastify/dist/ReactToastify.css";
import Image from "next/image";
import OnboardLogo from "/public/OnboardMe.png";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const loginRequest: LoginRequest = { email, password };
      const response: LoginResponse = await loginUser(loginRequest);

      await login(response);

      toast.success("¡Login exitoso!");
      router.push("/landing");
    } catch (error: any) {
      setLoading(false);
      const status = error.response?.status;
      const message = error.response?.data?.message;

      if (status === 401) {
        toast.error(message || "Email o contraseña incorrectos");
      } else {
        toast.error("Error inesperado. Intenta de nuevo.");
        console.log(error);
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

        <h1 className="text-3xl font-bold text-center text-blue-900 mb-6">
          Bienvenido a OnboardMe
        </h1>
        <p className="text-center text-gray-700 mb-6">
          Ingresa tus credenciales para continuar
        </p>

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white/80 backdrop-blur-sm placeholder-gray-400"
          />

          {/* Campo de contraseña con ojito */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white/80 backdrop-blur-sm placeholder-gray-400 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 hover:bg-transparent focus:outline-none"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-md disabled:opacity-50"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          ¿Olvidaste tu contraseña?{" "}
          <span className="text-blue-600 hover:underline cursor-pointer"
          onClick={() => router.push("/resetPassword")}>
            Restablecer
          </span>
        </div>
      </div>

      <ToastContainer position="top-right" autoClose={5000} />
    </div>
  );
}
