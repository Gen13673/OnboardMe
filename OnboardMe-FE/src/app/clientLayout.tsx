"use client";

import type React from "react";
import HeaderTabs from "./components/headerTabs";
import { AuthProvider, useAuth } from "@/auth/authContext";
import { ToastContainer } from "react-toastify";
import Footer from "./components/footer";

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  return (
    <>
      <HeaderTabs />
      <main>{children}</main>
      {user && <Footer />}

      <ToastContainer
        containerId="app"
        position="top-right"
        autoClose={3000}
        pauseOnFocusLoss={false}
        toastClassName="text-lg font-semibold"
      />
    </>
  );
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <LayoutContent>{children}</LayoutContent>
    </AuthProvider>
  );
}
