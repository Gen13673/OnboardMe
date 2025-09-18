"use client"

import type React from "react"

import HeaderTabs from "./components/headerTabs"
import { AuthProvider } from "@/auth/authContext"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <HeaderTabs />
      <main>{children}</main>
      <ToastContainer position="top-right" autoClose={3000} toastClassName="text-lg font-semibold" />
    </AuthProvider>
  )
}
